import type { Express, Request } from "express";
import { storage } from "../../storage";
import { insertUserSchema } from "@shared/schema";
import { ZodError, z } from "zod";
import { fromZodError } from "zod-validation-error";
import { logAction } from "../../lib/audit";
import { getSessionUser, requireAuth, toSafeUser } from "../../lib/auth";
import { clearFailedLogins, getLoginBlockRemainingMs, recordFailedLogin } from "../../lib/login-security";
import { hashPassword, validatePasswordStrength, verifyPassword } from "../../lib/password";
import { sendOtpEmail, sendPasswordResetEmail } from "../../lib/email";
import { generateOtpCode, storeOtp, verifyOtp } from "../../lib/otp";
import { createHash, randomBytes } from "crypto";

const updateProfileSchema = insertUserSchema.pick({
  email: true,
  phone: true,
});

const changePasswordSchema = insertUserSchema.pick({ password: true }).extend({
  currentPassword: insertUserSchema.shape.password,
});

const forgotPasswordSchema = z.object({
  email: insertUserSchema.shape.email,
});

const OTP_RESEND_COOLDOWN_MS = 30 * 1000;

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: insertUserSchema.shape.password,
  confirmPassword: insertUserSchema.shape.password.optional(),
});

function getAppBaseUrl(req: Request): string {
  const configuredBaseUrl = process.env.APP_BASE_URL || process.env.FRONTEND_URL;
  if (configuredBaseUrl) {
    return configuredBaseUrl.replace(/\/$/, "");
  }

  return `${req.protocol}://${req.get("host")}`;
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function registerAuthRoutes(app: Express): void {
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);

      // Keep response generic to avoid exposing whether an email exists.
      const genericResponse = {
        success: true,
        message: "If the email exists, a reset link has been sent.",
      };

      if (!user) {
        return res.json(genericResponse);
      }

      const rawToken = randomBytes(32).toString("hex");
      const tokenHash = hashResetToken(rawToken);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await storage.upsertPasswordResetToken(user.id, tokenHash, expiresAt);

      const resetLink = `${getAppBaseUrl(req)}/reset-password?token=${encodeURIComponent(rawToken)}`;

      let deliveryStatus: "sent" | "delayed" = "sent";
      try {
        await sendPasswordResetEmail(user.email, resetLink);
      } catch (error) {
        deliveryStatus = "delayed";
        console.error("Failed to send password reset email:", error);
      }

      await logAction(
        user.username,
        "PASSWORD_RESET_REQUESTED",
        `${user.firstName} ${user.lastName} requested a password reset link`,
        req.ip || "unknown",
      );

      return res.json({ ...genericResponse, deliveryStatus });
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.get("/api/auth/reset-password/validate", async (req, res) => {
    const token = typeof req.query.token === "string" ? req.query.token : "";
    if (!token) {
      return res.json({ valid: false });
    }

    const tokenHash = hashResetToken(token);
    const resetToken = await storage.getActivePasswordResetTokenByHash(tokenHash);
    return res.json({ valid: Boolean(resetToken) });
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const data = resetPasswordSchema.parse(req.body);

      if (data.confirmPassword && data.confirmPassword !== data.password) {
        return res.status(400).json({ message: "Passwords do not match" });
      }

      const passwordError = validatePasswordStrength(data.password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      const tokenHash = hashResetToken(data.token);
      const resetToken = await storage.getActivePasswordResetTokenByHash(tokenHash);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        await storage.deletePasswordResetTokenByHash(tokenHash);
        return res.status(400).json({ message: "Invalid or expired reset link" });
      }

      const sameAsCurrent = await verifyPassword(data.password, user.password);
      if (sameAsCurrent) {
        return res.status(400).json({ message: "New password must be different from current password" });
      }

      const hashedPassword = await hashPassword(data.password);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.deletePasswordResetTokensByUserId(user.id);

      await logAction(
        user.username,
        "PASSWORD_RESET_COMPLETED",
        `${user.firstName} ${user.lastName} reset their password via email link`,
        req.ip || "unknown",
      );

      return res.json({ success: true });
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body); // Validate incoming payload.
      const passwordError = validatePasswordStrength(data.password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      const existing = await storage.getUserByUsername(data.username); // Prevent duplicate usernames.
      if (existing) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({ ...data, password: hashedPassword });
      const safeUser = toSafeUser(user);

      await logAction(
        data.username,
        "REGISTER",
        `New account created for ${data.firstName} ${data.lastName}`,
        req.ip || "unknown",
      );

      return res.status(201).json(safeUser);
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const loginKey = `${req.ip || "unknown"}:${String(username).toLowerCase()}`;
    const blockedForMs = getLoginBlockRemainingMs(loginKey);
    if (blockedForMs > 0) {
      return res.status(429).json({
        message: `Too many failed login attempts. Try again in ${Math.ceil(blockedForMs / 60000)} minute(s).`,
      });
    }

    const user = await storage.getUserByUsername(username);
    const isValidPassword = user ? await verifyPassword(password, user.password) : false;

    if (!user || !isValidPassword) {
      recordFailedLogin(loginKey);
      await logAction(
        username,
        "LOGIN_FAILED",
        `Failed login attempt for username: ${username}`,
        req.ip || "unknown",
      );
      return res.status(401).json({ message: "Invalid credentials" });
    }

    clearFailedLogins(loginKey);

    if (user && user.password === password) {
      const upgradedPassword = await hashPassword(password);
      await storage.updateUserPassword(user.id, upgradedPassword);
      user.password = upgradedPassword;
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;
    req.session.mfaVerified = user.role === "admin";

    const safeUser = toSafeUser(user);

    if (user.role === "admin") {
      await logAction(
        username,
        "LOGIN",
        `${user.firstName} ${user.lastName} logged in successfully (admin OTP bypass)` ,
        req.ip || "unknown",
      );

      return res.json({ ...safeUser, mfaRequired: false });
    }

    req.session.otpResendAvailableAt = Date.now() + OTP_RESEND_COOLDOWN_MS;

    const otpCode = generateOtpCode();
    await storeOtp(user.id, otpCode);

    let otpDeliveryStatus: "sent" | "delayed" = "sent";
    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (error) {
      otpDeliveryStatus = "delayed";
      req.session.otpResendAvailableAt = Date.now();
      console.error("Failed to send OTP email:", error);
    }

    await logAction(
      username,
      "LOGIN_OTP_SENT",
      `${user.firstName} ${user.lastName} submitted correct password, OTP sent`,
      req.ip || "unknown",
    );

    return res.json({
      ...safeUser,
      mfaRequired: true,
      otpDeliveryStatus,
      ...(otpDeliveryStatus === "delayed"
        ? { otpNotice: "Verification email may be delayed. You can request a resend on the next screen." }
        : {}),
    });
  });

  app.post("/api/auth/verify-otp", async (req, res) => {
    const { otp } = req.body;
    if (!req.session.userId) {
      return res.status(401).json({ message: "No active login session to verify" });
    }
    
    if (!otp) {
      return res.status(400).json({ message: "OTP is required" });
    }

    const verificationResult = await verifyOtp(req.session.userId, otp);
    if (verificationResult === "missing") {
      return res.status(400).json({ message: "No OTP was requested or OTP has expired" });
    }
    if (verificationResult === "expired") {
      return res.status(400).json({ message: "OTP has expired" });
    }
    if (verificationResult === "invalid") {
      return res.status(401).json({ message: "Invalid OTP code" });
    }

    req.session.mfaVerified = true;

    const user = await storage.getUser(req.session.userId);
    if (user) {
      await logAction(
        user.username,
        "LOGIN",
        `${user.firstName} ${user.lastName} logged in successfully`,
        req.ip || "unknown",
      );
      return res.json(toSafeUser(user));
    }
    
    return res.status(500).json({ message: "Server error retrieving user" });
  });

  app.post("/api/auth/logout", async (req, res) => {
    const username = req.session.username || req.body.username;
    if (username) {
      await logAction(username, "LOGOUT", `${username} logged out`, req.ip || "unknown");
    }

    req.session.destroy(() => undefined);
    res.clearCookie("connect.sid");
    return res.json({ success: true });
  });

  app.get("/api/auth/session", async (req, res) => {
    const user = await getSessionUser(req);
    if (!user) {
      return res.status(401).json({ message: "No active session" });
    }

    return res.json(toSafeUser(user));
  });

  app.get("/api/doctors", requireAuth, async (_req, res) => {
    const allDoctors = await storage.getDoctors(); // Doctors come from users table.
    return res.json(allDoctors.map((doctor) => toSafeUser(doctor)));
  });

  app.patch("/api/doctors/:id/profile", requireAuth, async (req, res) => {
    try {
      const doctorId = Number(req.params.id);
      if (Number.isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor id" });
      }

      if (res.locals.user.id !== doctorId && res.locals.user.role !== "admin") {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const data = updateProfileSchema.parse(req.body);
      const currentUser = await storage.getUser(doctorId);
      if (!currentUser) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      if (data.email !== currentUser.email) {
        const existingEmail = await storage.getUserByEmail(data.email);
        if (existingEmail && existingEmail.id !== doctorId) {
          return res.status(409).json({ message: "Email already exists" });
        }
      }

      const updated = await storage.updateUserProfile(doctorId, data);
      if (!updated) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const safeDoctor = toSafeUser(updated);

      await logAction(
        updated.username,
        "PROFILE_UPDATED",
        `${updated.firstName} ${updated.lastName} updated account settings`,
        req.ip || "unknown",
      );

      return res.json(safeDoctor);
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.post("/api/doctors/:id/password", requireAuth, async (req, res) => {
    try {
      const doctorId = Number(req.params.id);
      if (Number.isNaN(doctorId)) {
        return res.status(400).json({ message: "Invalid doctor id" });
      }

      if (res.locals.user.id !== doctorId && res.locals.user.role !== "admin") {
        return res.status(403).json({ message: "You can only update your own password" });
      }

      const data = changePasswordSchema.parse(req.body);
      const passwordError = validatePasswordStrength(data.password);
      if (passwordError) {
        return res.status(400).json({ message: passwordError });
      }

      if (data.currentPassword === data.password) {
        return res.status(400).json({ message: "New password must be different from current password" });
      }

      const user = await storage.getUser(doctorId);
      if (!user) {
        return res.status(404).json({ message: "Doctor not found" });
      }

      const matchesCurrentPassword = await verifyPassword(data.currentPassword, user.password);
      if (!matchesCurrentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(data.password);
      await storage.updateUserPassword(doctorId, hashedPassword);

      await logAction(
        user.username,
        "PASSWORD_UPDATED",
        `${user.firstName} ${user.lastName} updated their password`,
        req.ip || "unknown",
      );

      return res.json({ success: true });
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.post("/api/auth/resend-otp", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "No active login session to verify" });
    }

    const availableAt = req.session.otpResendAvailableAt || 0;
    const remainingMs = availableAt - Date.now();
    if (remainingMs > 0) {
      return res.status(429).json({
        message: `Please wait ${Math.ceil(remainingMs / 1000)} second(s) before requesting another code.`,
        retryAfterMs: remainingMs,
      });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpCode = generateOtpCode();
    await storeOtp(user.id, otpCode);

    try {
      await sendOtpEmail(user.email, otpCode);
      req.session.otpResendAvailableAt = Date.now() + OTP_RESEND_COOLDOWN_MS;
    } catch (error) {
      console.error("Failed to resend OTP email:", error);
      return res.status(503).json({
        message: "Unable to resend the verification code right now. Please try again shortly.",
      });
    }

    return res.json({ success: true, retryAfterMs: OTP_RESEND_COOLDOWN_MS });
  });
}
