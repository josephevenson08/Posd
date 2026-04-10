import type { Express } from "express";
import { storage } from "../../storage";
import { insertMedicalRecordSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { requireAuth } from "../../lib/auth";

export function registerMedicalRecordRoutes(app: Express): void {
  app.get("/api/records", requireAuth, async (_req, res) => {
    const allRecords = await storage.getMedicalRecords(); // List all records.
    return res.json(allRecords);
  });

  app.get("/api/records/patient/:patientId", requireAuth, async (req, res) => {
    const records = await storage.getMedicalRecordsByPatient(Number(req.params.patientId));
    return res.json(records); // List records for a specific patient.
  });

  app.get("/api/records/:id", requireAuth, async (req, res) => {
    const record = await storage.getMedicalRecord(Number(req.params.id));
    if (!record) return res.status(404).json({ message: "Record not found" });
    return res.json(record);
  });

  app.post("/api/records", requireAuth, async (req, res) => {
    try {
      const data = insertMedicalRecordSchema.parse(req.body); // Validate before DB insert.
      const record = await storage.createMedicalRecord(data);
      return res.status(201).json(record);
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ message: fromZodError(e).message });
      }
      throw e;
    }
  });

  app.patch("/api/records/:id", requireAuth, async (req, res) => {
    const updated = await storage.updateMedicalRecord(Number(req.params.id), req.body);
    if (!updated) return res.status(404).json({ message: "Record not found" });
    return res.json(updated);
  });

  app.delete("/api/records/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteMedicalRecord(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Record not found" });
    return res.status(204).send();
  });
}
