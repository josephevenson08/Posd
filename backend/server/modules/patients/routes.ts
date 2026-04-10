import type { Express } from "express";
import { storage } from "../../storage";
import { insertPatientSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { requireAuth } from "../../lib/auth";

export function registerPatientRoutes(app: Express): void {
  app.get("/api/patients", requireAuth, async (_req, res) => {
    const allPatients = await storage.getPatients(); // List patients.
    return res.json(allPatients);
  });

  app.get("/api/patients/:id", requireAuth, async (req, res) => {
    const patient = await storage.getPatient(Number(req.params.id)); // Route param to number.
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    return res.json(patient);
  });

  app.post("/api/patients", requireAuth, async (req, res) => {
    try {
      const body = { ...req.body };
      if (body.dob && typeof body.dob === "string") {
        body.dob = new Date(body.dob); // Preserve date-string input behavior.
      }
      const data = insertPatientSchema.parse(body);
      const patient = await storage.createPatient(data);
      return res.status(201).json(patient);
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.patch("/api/patients/:id", requireAuth, async (req, res) => {
    const body = { ...req.body };
    if (body.dob && typeof body.dob === "string") {
      body.dob = new Date(body.dob); // Support date string updates.
    }
    const updated = await storage.updatePatient(Number(req.params.id), body);
    if (!updated) return res.status(404).json({ message: "Patient not found" });
    return res.json(updated);
  });

  app.delete("/api/patients/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deletePatient(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Patient not found" });
    return res.status(204).send(); // Successful delete returns no content.
  });
}
