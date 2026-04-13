import type { Express } from "express";
import { storage } from "../../storage";
import { insertUserSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { logAction } from "../../lib/audit";
import { getSessionUser, requireAuth, toSafeUser } from "../../lib/auth";
import { clearFailedLogins, getLoginBlockRemainingMs, recordFailedLogin } from "../../lib/login-security";
import { hashPassword, validatePasswordStrength, verifyPassword } from "../../lib/password";
import { sendOtpEmail } from "../../lib/email";
import { deleteOtp, generateOtpCode, storeOtp, verifyOtp } from "../../lib/otp";

const updateProfileSchema = insertUserSchema.pick({
  email: true,
  phone: true,
});

const changePasswordSchema = insertUserSchema.pick({ password: true }).extend({
  currentPassword: insertUserSchema.shape.password,
});

export function registerAuthRoutes(app: Express): void {
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
    req.session.mfaVerified = false;

    const otpCode = generateOtpCode();
    await storeOtp(user.id, otpCode);

    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (error) {
      await deleteOtp(user.id);
      console.error("Failed to send OTP email:", error);
      return res.status(503).json({
        message: "Unable to send the verification code right now. Please try again shortly.",
      });
    }

    const safeUser = toSafeUser(user);

    await logAction(
      username,
      "LOGIN_OTP_SENT",
      `${user.firstName} ${user.lastName} submitted correct password, OTP sent`,
      req.ip || "unknown",
    );

    return res.json({ ...safeUser, mfaRequired: true });
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

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otpCode = generateOtpCode();
    await storeOtp(user.id, otpCode);

    try {
      await sendOtpEmail(user.email, otpCode);
    } catch (error) {
      await deleteOtp(user.id);
      console.error("Failed to resend OTP email:", error);
      return res.status(503).json({
        message: "Unable to resend the verification code right now. Please try again shortly.",
      });
    }

    return res.json({ success: true });
  });
}
