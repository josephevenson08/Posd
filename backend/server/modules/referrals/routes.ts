import type { Express } from "express";
import { storage } from "../../storage";
import { insertReferralSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { requireAuth } from "../../lib/auth";

export function registerReferralRoutes(app: Express): void {
  app.get("/api/referrals", requireAuth, async (_req, res) => {
    const allReferrals = await storage.getReferrals(); // List referrals.
    return res.json(allReferrals);
  });

  app.get("/api/referrals/:id", requireAuth, async (req, res) => {
    const referral = await storage.getReferral(Number(req.params.id));
    if (!referral) return res.status(404).json({ message: "Referral not found" });
    return res.json(referral);
  });

  app.post("/api/referrals", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.dateTime && typeof body.dateTime === "string") {
        body.dateTime = new Date(body.dateTime); // Preserve datetime parsing behavior.
      }
      const data = insertReferralSchema.parse(body);
      const referral = await storage.createReferral(data);
      return res.status(201).json(referral);
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.patch("/api/referrals/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateReferral(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Referral not found" });
    return res.json(updated);
  });

  app.delete("/api/referrals/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteReferral(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Referral not found" });
    return res.status(204).send();
  });
}
