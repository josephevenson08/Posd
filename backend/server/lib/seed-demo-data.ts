import { and, eq, like } from "drizzle-orm";
import { db } from "../db";
import { medicalRecords, patients, referrals, users } from "@shared/schema";

type SeedPatient = {
  firstName: string;
  lastName: string;
  dob: string;
  gender: "male" | "female";
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  emergencyName: string;
  emergencyPhone: string;
};

const seedPatients: SeedPatient[] = [
  {
    firstName: "Ariana",
    lastName: "Mills",
    dob: "1990-03-14",
    gender: "female",
    email: "seed.patient.01@mediportal.local",
    phone: "555-201-0001",
    street: "112 Cedar St",
    city: "Austin",
    state: "TX",
    zip: "78701",
    emergencyName: "Jordan Mills",
    emergencyPhone: "555-301-0101",
  },
  {
    firstName: "Caleb",
    lastName: "Turner",
    dob: "1984-07-09",
    gender: "male",
    email: "seed.patient.02@mediportal.local",
    phone: "555-201-0002",
    street: "420 Pine Ave",
    city: "Dallas",
    state: "TX",
    zip: "75201",
    emergencyName: "Maya Turner",
    emergencyPhone: "555-301-0102",
  },
  {
    firstName: "Elena",
    lastName: "Brooks",
    dob: "1978-11-21",
    gender: "female",
    email: "seed.patient.03@mediportal.local",
    phone: "555-201-0003",
    street: "90 Willow Dr",
    city: "Houston",
    state: "TX",
    zip: "77002",
    emergencyName: "Liam Brooks",
    emergencyPhone: "555-301-0103",
  },
  {
    firstName: "Marcus",
    lastName: "Reed",
    dob: "1995-01-30",
    gender: "male",
    email: "seed.patient.04@mediportal.local",
    phone: "555-201-0004",
    street: "8 Oak View Rd",
    city: "San Antonio",
    state: "TX",
    zip: "78205",
    emergencyName: "Nina Reed",
    emergencyPhone: "555-301-0104",
  },
  {
    firstName: "Sofia",
    lastName: "Hayes",
    dob: "1988-05-17",
    gender: "female",
    email: "seed.patient.05@mediportal.local",
    phone: "555-201-0005",
    street: "760 Lake Blvd",
    city: "Fort Worth",
    state: "TX",
    zip: "76102",
    emergencyName: "Ethan Hayes",
    emergencyPhone: "555-301-0105",
  },
  {
    firstName: "Noah",
    lastName: "Bennett",
    dob: "1972-09-12",
    gender: "male",
    email: "seed.patient.06@mediportal.local",
    phone: "555-201-0006",
    street: "35 River Park",
    city: "Plano",
    state: "TX",
    zip: "75023",
    emergencyName: "Claire Bennett",
    emergencyPhone: "555-301-0106",
  },
  {
    firstName: "Priya",
    lastName: "Shah",
    dob: "1992-12-03",
    gender: "female",
    email: "seed.patient.07@mediportal.local",
    phone: "555-201-0007",
    street: "149 Arbor Ct",
    city: "Irving",
    state: "TX",
    zip: "75038",
    emergencyName: "Arjun Shah",
    emergencyPhone: "555-301-0107",
  },
  {
    firstName: "Lucas",
    lastName: "Nguyen",
    dob: "1981-06-25",
    gender: "male",
    email: "seed.patient.08@mediportal.local",
    phone: "555-201-0008",
    street: "501 Meadow Ln",
    city: "Arlington",
    state: "TX",
    zip: "76010",
    emergencyName: "Ava Nguyen",
    emergencyPhone: "555-301-0108",
  },
  {
    firstName: "Hannah",
    lastName: "Cole",
    dob: "1997-04-07",
    gender: "female",
    email: "seed.patient.09@mediportal.local",
    phone: "555-201-0009",
    street: "18 Summit Way",
    city: "Frisco",
    state: "TX",
    zip: "75034",
    emergencyName: "Drew Cole",
    emergencyPhone: "555-301-0109",
  },
  {
    firstName: "Victor",
    lastName: "Ramirez",
    dob: "1976-08-19",
    gender: "male",
    email: "seed.patient.10@mediportal.local",
    phone: "555-201-0010",
    street: "377 Elm Crossing",
    city: "Lubbock",
    state: "TX",
    zip: "79401",
    emergencyName: "Isabella Ramirez",
    emergencyPhone: "555-301-0110",
  },
  {
    firstName: "Mila",
    lastName: "Watson",
    dob: "1989-02-16",
    gender: "female",
    email: "seed.patient.11@mediportal.local",
    phone: "555-201-0011",
    street: "842 Harbor St",
    city: "Amarillo",
    state: "TX",
    zip: "79101",
    emergencyName: "Connor Watson",
    emergencyPhone: "555-301-0111",
  },
  {
    firstName: "Derrick",
    lastName: "Owens",
    dob: "1993-10-22",
    gender: "male",
    email: "seed.patient.12@mediportal.local",
    phone: "555-201-0012",
    street: "69 Birch Trail",
    city: "Waco",
    state: "TX",
    zip: "76701",
    emergencyName: "Renee Owens",
    emergencyPhone: "555-301-0112",
  },
  {
    firstName: "Leah",
    lastName: "Patel",
    dob: "1983-01-11",
    gender: "female",
    email: "seed.patient.13@mediportal.local",
    phone: "555-201-0013",
    street: "255 Ridge Blvd",
    city: "McKinney",
    state: "TX",
    zip: "75069",
    emergencyName: "Rohan Patel",
    emergencyPhone: "555-301-0113",
  },
  {
    firstName: "Owen",
    lastName: "Price",
    dob: "1999-07-27",
    gender: "male",
    email: "seed.patient.14@mediportal.local",
    phone: "555-201-0014",
    street: "13 Stonegate",
    city: "Denton",
    state: "TX",
    zip: "76201",
    emergencyName: "Megan Price",
    emergencyPhone: "555-301-0114",
  },
  {
    firstName: "Grace",
    lastName: "Kim",
    dob: "1974-11-05",
    gender: "female",
    email: "seed.patient.15@mediportal.local",
    phone: "555-201-0015",
    street: "905 Orchard Rd",
    city: "Round Rock",
    state: "TX",
    zip: "78664",
    emergencyName: "Daniel Kim",
    emergencyPhone: "555-301-0115",
  },
];

const referralStatuses = [
  "pending",
  "approved",
  "pending",
  "completed",
  "pending",
  "rejected",
  "pending",
  "approved",
  "pending",
  "completed",
  "pending",
  "approved",
  "pending",
  "completed",
  "pending",
] as const;

function addDays(base: Date, days: number): Date {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

export async function seedDemoClinicalData(): Promise<void> {
  const shouldSeed = (process.env.SEED_DEMO_DATA ?? "true").toLowerCase() !== "false";
  if (!shouldSeed) {
    return;
  }

  const doctors = await db.select({ id: users.id }).from(users);
  if (doctors.length === 0) {
    console.warn("[seed] Skipping demo seed because no doctors were found in users table.");
    return;
  }

  for (const patient of seedPatients) {
    const [existing] = await db
      .select({ id: patients.id })
      .from(patients)
      .where(eq(patients.email, patient.email));

    if (existing) {
      continue;
    }

    await db.insert(patients).values({
      firstName: patient.firstName,
      lastName: patient.lastName,
      dob: new Date(patient.dob),
      gender: patient.gender,
      email: patient.email,
      phone: patient.phone,
      street: patient.street,
      city: patient.city,
      state: patient.state,
      zip: patient.zip,
      emergencyName: patient.emergencyName,
      emergencyPhone: patient.emergencyPhone,
    });
  }

  const seededPatients = await db
    .select({ id: patients.id, email: patients.email })
    .from(patients)
    .where(like(patients.email, "seed.patient.%@mediportal.local"));

  if (seededPatients.length === 0) {
    return;
  }

  const now = new Date();

  for (let i = 0; i < seededPatients.length; i += 1) {
    const seededPatient = seededPatients[i];
    const marker = `[SEED-REF-${String(i + 1).padStart(2, "0")}]`;

    const [existingReferral] = await db
      .select({ id: referrals.id })
      .from(referrals)
      .where(and(eq(referrals.patientId, seededPatient.id), like(referrals.notes, `%${marker}%`)));

    if (!existingReferral) {
      const referringDoctor = doctors[i % doctors.length].id;
      const referredDoctor = doctors[(i + 1) % doctors.length].id;

      await db.insert(referrals).values({
        patientId: seededPatient.id,
        referringDoctorId: referringDoctor,
        referredDoctorId: referredDoctor,
        dateTime: addDays(now, -(i + 1)),
        status: referralStatuses[i % referralStatuses.length],
        notes: `${marker} Referral created for dashboard/workflow testing`,
      });
    }

    const recordMarker = `[SEED-REC-${String(i + 1).padStart(2, "0")}]`;
    const [existingRecord] = await db
      .select({ id: medicalRecords.id })
      .from(medicalRecords)
      .where(and(eq(medicalRecords.patientId, seededPatient.id), like(medicalRecords.notes, `%${recordMarker}%`)));

    if (!existingRecord) {
      const doctorId = doctors[i % doctors.length].id;
      await db.insert(medicalRecords).values({
        patientId: seededPatient.id,
        doctorId,
        visitType: i % 3 === 0 ? "Follow-up" : i % 3 === 1 ? "Initial Consult" : "Routine Check",
        diagnosis: i % 2 === 0 ? "Hypertension" : "Type 2 Diabetes",
        treatmentPlan: i % 2 === 0 ? "Lifestyle changes and medication review in 4 weeks" : "Diet control and metformin adjustment",
        allergies: i % 4 === 0 ? "Penicillin" : "None reported",
        vitals: `BP ${120 + (i % 10)}/${75 + (i % 8)}, HR ${68 + (i % 12)}, Temp 98.${i % 6}F`,
        labResults: i % 2 === 0 ? "CBC normal, LDL mildly elevated" : "A1C improved compared to prior visit",
        notes: `${recordMarker} Demo medical record for workflow testing`,
      });
    }
  }

  console.log(`[seed] Ensured demo dataset: ${seedPatients.length} patients with referrals and records.`);
}
