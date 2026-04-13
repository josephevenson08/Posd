import session from "express-session";
import { pool } from "../db";

type SessionCallback = (err?: unknown, session?: session.SessionData | null) => void;

function getExpiryDate(sessionData: session.SessionData): Date {
  const cookieExpiry = sessionData.cookie?.expires;
  if (cookieExpiry) {
    return new Date(cookieExpiry);
  }

  const maxAge = sessionData.cookie?.maxAge ?? 24 * 60 * 60 * 1000;
  return new Date(Date.now() + maxAge);
}

export class MySqlSessionStore extends session.Store {
  async get(sid: string, callback: SessionCallback): Promise<void> {
    try {
      const [rows] = await pool.execute(
        "SELECT data, expires_at FROM sessions WHERE sid = ? LIMIT 1",
        [sid],
      );
      const row = Array.isArray(rows) ? (rows[0] as { data: string; expires_at: Date | string } | undefined) : undefined;

      if (!row) {
        callback(undefined, null);
        return;
      }

      const expiresAt = new Date(row.expires_at);
      if (expiresAt.getTime() <= Date.now()) {
        await this.destroy(sid, () => undefined);
        callback(undefined, null);
        return;
      }

      callback(undefined, JSON.parse(row.data));
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, sessionData: session.SessionData, callback?: (err?: unknown) => void): Promise<void> {
    try {
      const expiresAt = getExpiryDate(sessionData);
      await pool.execute(
        `INSERT INTO sessions (sid, data, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE data = VALUES(data), expires_at = VALUES(expires_at), updated_at = NOW()`,
        [sid, JSON.stringify(sessionData), expiresAt],
      );
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: unknown) => void): Promise<void> {
    try {
      await pool.execute("DELETE FROM sessions WHERE sid = ?", [sid]);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(sid: string, sessionData: session.SessionData, callback?: (err?: unknown) => void): Promise<void> {
    await this.set(sid, sessionData, callback);
  }
}
