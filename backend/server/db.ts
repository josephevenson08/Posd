import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required, ensure the database is configured");
}

const pool = mysql.createPool(process.env.DATABASE_URL);

export const db = drizzle(pool);