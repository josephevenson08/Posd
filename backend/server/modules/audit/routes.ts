import type { Express } from "express";
import { db } from "../../db";
import { auditLogs } from "@shared/schema";
import { requireAdmin } from "../../lib/auth";

export function registerAuditRoutes(app: Express): void {
  app.get("/api/audit-logs", requireAdmin, async (_req, res) => {
    const logs = await db.select().from(auditLogs).orderBy(auditLogs.timestamp); // Sort by log timestamp.
    return res.json(logs);
  });
}
