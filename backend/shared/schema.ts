import { mysqlTable, text, varchar, int, date, datetime } from "drizzle-orm/mysql-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table (doctors who log in)
export const users = mysqlTable("users", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  password: text("password").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("doctor"),
  firstName: varchar("first_name", { length: 64 }).notNull(),
  lastName: varchar("last_name", { length: 64 }).notNull(),
  email: varchar("email", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  specialty: varchar("specialty", { length: 50 }),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(255),
  firstName: z.string().min(1).max(64),
  lastName: z.string().min(1).max(64),
  email: z.string().email().max(120),
  phone: z.string().max(15).optional().nullable(),
  specialty: z.string().max(50).optional().nullable(),
}).omit({ id: true, role: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Patients table
export const patients = mysqlTable("patients", {
  id: int("patient_ID").primaryKey().autoincrement(),
  firstName: varchar("first_name", { length: 64 }).notNull(),
  lastName: varchar("last_name", { length: 64 }).notNull(),
  dob: date("dob").notNull(),
  gender: varchar("gender", { length: 10 }),
  email: varchar("email", { length: 120 }),
  phone: varchar("phone", { length: 15 }),
  street: varchar("street", { length: 100 }),
  city: varchar("city", { length: 64 }),
  state: varchar("state", { length: 50 }),
  zip: varchar("zip", { length: 10 }),
  emergencyName: varchar("emergency_name", { length: 64 }),
  emergencyPhone: varchar("emergency_phone", { length: 15 }),
});

export const insertPatientSchema = createInsertSchema(patients).omit({ id: true });
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Patient = typeof patients.$inferSelect;

// Medical Records table
export const medicalRecords = mysqlTable("medical_records", {
  id: int("record_ID").primaryKey().autoincrement(),
  patientId: int("patient_ID").notNull(),
  doctorId: int("doctor_ID").notNull(),
  creationDate: datetime("creation_date").default(new Date()),
  visitType: text("visit_type"),
  diagnosis: text("diagnosis"),
  treatmentPlan: text("treatment_plan"),
  allergies: text("allergies"),
  vitals: text("vitals"),
  labResults: text("lab_results"),
  notes: text("notes"),
  updatedAt: datetime("updated_at").default(new Date()),
});

export const insertMedicalRecordSchema = createInsertSchema(medicalRecords).omit({ id: true, creationDate: true, updatedAt: true });
export type InsertMedicalRecord = z.infer<typeof insertMedicalRecordSchema>;
export type MedicalRecord = typeof medicalRecords.$inferSelect;

// Referrals table
export const referrals = mysqlTable("referrals", {
  id: int("referral_ID").primaryKey().autoincrement(),
  patientId: int("patient_ID").notNull(),
  referringDoctorId: int("referring_doctor_ID").notNull(),
  referredDoctorId: int("referred_doctor_ID").notNull(),
  dateTime: datetime("date_time").notNull(),
  status: varchar("status", { length: 20 }).default("pending"),
  notes: text("notes"),
});

export const insertReferralSchema = createInsertSchema(referrals).omit({ id: true });
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type Referral = typeof referrals.$inferSelect;

// Audit Logs table
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").primaryKey().autoincrement(),
  username: varchar("username", { length: 64 }),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  timestamp: datetime("timestamp").default(new Date()),
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, timestamp: true });
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

export const authOtps = mysqlTable("auth_otps", {
  userId: int("user_id").primaryKey(),
  otpHash: varchar("otp_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").default(new Date()),
});

export type AuthOtp = typeof authOtps.$inferSelect;

export const sessions = mysqlTable("sessions", {
  sid: varchar("sid", { length: 255 }).primaryKey(),
  data: text("data").notNull(),
  expiresAt: datetime("expires_at").notNull(),
  createdAt: datetime("created_at").default(new Date()),
  updatedAt: datetime("updated_at").default(new Date()),
});

export type SessionRecord = typeof sessions.$inferSelect;
