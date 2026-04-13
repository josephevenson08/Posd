import { createHash, randomInt } from "crypto";
import { pool } from "../db";

const OTP_EXPIRY_MS = 5 * 60 * 1000;

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

export function generateOtpCode(): string {
  return randomInt(100000, 1000000).toString();
}

export async function storeOtp(userId: number, otp: string): Promise<void> {
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
  await pool.execute(
    `INSERT INTO auth_otps (user_id, otp_hash, expires_at, created_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE otp_hash = VALUES(otp_hash), expires_at = VALUES(expires_at), created_at = NOW()`,
    [userId, hashOtp(otp), expiresAt],
  );
}

export async function verifyOtp(userId: number, otp: string): Promise<"valid" | "expired" | "missing" | "invalid"> {
  const [rows] = await pool.execute(
    "SELECT otp_hash, expires_at FROM auth_otps WHERE user_id = ? LIMIT 1",
    [userId],
  );
  const row = Array.isArray(rows)
    ? (rows[0] as { otp_hash: string; expires_at: Date | string } | undefined)
    : undefined;

  if (!row) {
    return "missing";
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    await deleteOtp(userId);
    return "expired";
  }

  if (row.otp_hash !== hashOtp(otp)) {
    return "invalid";
  }

  await deleteOtp(userId);
  return "valid";
}

export async function deleteOtp(userId: number): Promise<void> {
  await pool.execute("DELETE FROM auth_otps WHERE user_id = ?", [userId]);
}
