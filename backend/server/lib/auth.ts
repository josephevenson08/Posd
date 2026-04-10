import type { NextFunction, Request, Response } from "express";
import { storage } from "../storage";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    username?: string;
    role?: string;
    mfaVerified?: boolean;
  }
}

export function toSafeUser<T extends { password: string }>(user: T): Omit<T, "password"> {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function getSessionUser(req: Request) {
  if (!req.session.userId) {
    return undefined;
  }

  return storage.getUser(req.session.userId);
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = await getSessionUser(req);
  if (!user || req.session.mfaVerified !== true) {
    return res.status(401).json({ message: "Authentication and MFA required" });
  }

  res.locals.user = user;
  return next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = await getSessionUser(req);
  if (!user || req.session.mfaVerified !== true) {
    return res.status(401).json({ message: "Authentication and MFA required" });
  }

  if (user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  res.locals.user = user;
  return next();
}
