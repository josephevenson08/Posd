import {
  type User, type InsertUser, users,
  type Patient, type InsertPatient, patients,
  type MedicalRecord, type InsertMedicalRecord, medicalRecords,
  type Referral, type InsertReferral, referrals,
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users / Doctors
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDoctors(): Promise<User[]>;
  updateUserProfile(
    id: number,
    user: Partial<Pick<InsertUser, "email" | "phone">>,
  ): Promise<User | undefined>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;

  // Patients
  getPatients(): Promise<Patient[]>;
  getPatient(id: number): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined>;
  deletePatient(id: number): Promise<boolean>;

  // Medical Records
  getMedicalRecords(): Promise<MedicalRecord[]>;
  getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]>;
  getMedicalRecord(id: number): Promise<MedicalRecord | undefined>;
  createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord>;
  updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined>;
  deleteMedicalRecord(id: number): Promise<boolean>;

  // Referrals
  getReferrals(): Promise<Referral[]>;
  getReferral(id: number): Promise<Referral | undefined>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: number, referral: Partial<InsertReferral>): Promise<Referral | undefined>;
  deleteReferral(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {

  // ── Users / Doctors ────────────────────────────────────
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user);
    const created = await this.getUser((result as any).insertId);
    return created!;
  }

  async getDoctors(): Promise<User[]> {
    return db.select().from(users);
  }

  async updateUserProfile(
    id: number,
    user: Partial<Pick<InsertUser, "email" | "phone">>,
  ): Promise<User | undefined> {
    await db.update(users).set(user).where(eq(users.id, id));
    return this.getUser(id);
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    await db.update(users).set({ password }).where(eq(users.id, id));
    return this.getUser(id);
  }

  // ── Patients ───────────────────────────────────────────
  async getPatients(): Promise<Patient[]> {
    return db.select().from(patients);
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.id, id));
    return patient;
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [result] = await db.insert(patients).values(patient);
    const created = await this.getPatient((result as any).insertId);
    return created!;
  }

  async updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient | undefined> {
    await db.update(patients).set(patient).where(eq(patients.id, id));
    return this.getPatient(id);
  }

  async deletePatient(id: number): Promise<boolean> {
    const [result] = await db.delete(patients).where(eq(patients.id, id));
    return (result as any).affectedRows > 0;
  }

  // ── Medical Records ────────────────────────────────────
  async getMedicalRecords(): Promise<MedicalRecord[]> {
    return db.select().from(medicalRecords);
  }

  async getMedicalRecordsByPatient(patientId: number): Promise<MedicalRecord[]> {
    return db.select().from(medicalRecords).where(eq(medicalRecords.patientId, patientId));
  }

  async getMedicalRecord(id: number): Promise<MedicalRecord | undefined> {
    const [record] = await db.select().from(medicalRecords).where(eq(medicalRecords.id, id));
    return record;
  }

  async createMedicalRecord(record: InsertMedicalRecord): Promise<MedicalRecord> {
    const [result] = await db.insert(medicalRecords).values(record);
    const created = await this.getMedicalRecord((result as any).insertId);
    return created!;
  }

  async updateMedicalRecord(id: number, record: Partial<InsertMedicalRecord>): Promise<MedicalRecord | undefined> {
    await db.update(medicalRecords).set(record).where(eq(medicalRecords.id, id));
    return this.getMedicalRecord(id);
  }

  async deleteMedicalRecord(id: number): Promise<boolean> {
    const [result] = await db.delete(medicalRecords).where(eq(medicalRecords.id, id));
    return (result as any).affectedRows > 0;
  }

  // ── Referrals ──────────────────────────────────────────
  async getReferrals(): Promise<Referral[]> {
    return db.select().from(referrals);
  }

  async getReferral(id: number): Promise<Referral | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [result] = await db.insert(referrals).values(referral);
    const created = await this.getReferral((result as any).insertId);
    return created!;
  }

  async updateReferral(id: number, referral: Partial<InsertReferral>): Promise<Referral | undefined> {
    await db.update(referrals).set(referral).where(eq(referrals.id, id));
    return this.getReferral(id);
  }

  async deleteReferral(id: number): Promise<boolean> {
    const [result] = await db.delete(referrals).where(eq(referrals.id, id));
    return (result as any).affectedRows > 0;
  }
}

export const storage = new DatabaseStorage();
