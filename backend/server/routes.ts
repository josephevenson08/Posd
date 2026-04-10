import type { Express } from "express";
import type { Server } from "http";
import { registerAuthRoutes } from "./modules/auth/routes";
import { registerAuditRoutes } from "./modules/audit/routes";
import { registerPatientRoutes } from "./modules/patients/routes";
import { registerMedicalRecordRoutes } from "./modules/records/routes";
import { registerReferralRoutes } from "./modules/referrals/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
  registerAuthRoutes(app); // Auth + doctors routes.
  registerAuditRoutes(app); // Audit log route.
  registerPatientRoutes(app); // Patient CRUD routes.
  registerMedicalRecordRoutes(app); // Medical record CRUD routes.
  registerReferralRoutes(app); // Referral CRUD routes.

  return httpServer; // Preserve existing startup contract.
}
