import { db } from "../db";
import { auditLogs } from "@shared/schema";

export async function logAction(
  username: string,
  action: string,
  details: string,
  ip: string,
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      username,
      action,
      details,
      ipAddress: ip, // Map request IP to audit log column.
      timestamp: new Date(),
    });
  } catch (e) {
    console.error("Failed to write audit log:", e); // Keep main flow alive if logging fails.
  }
}
