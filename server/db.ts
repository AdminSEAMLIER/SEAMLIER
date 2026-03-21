import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

const dbUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error(
    "MYSQL_DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = mysql.createPool(dbUrl);
export const db = drizzle(pool, { schema, mode: "default" });

async function addColumnIfMissing(table: string, column: string, definition: string) {
  try {
    await pool.execute(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
    console.log(`[DB] Added column ${table}.${column} ✅`);
  } catch (err: any) {
    if (err?.errno === 1060 || err?.message?.includes("Duplicate column")) {
      // Column already exists — ok
    } else {
      console.warn(`[DB] Could not add ${table}.${column}:`, err?.message);
    }
  }
}

export async function ensureTables() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tailor_client_data (
        id VARCHAR(36) PRIMARY KEY,
        tailor_id VARCHAR(36) NOT NULL,
        client_id VARCHAR(36) NOT NULL,
        note TEXT,
        client_status VARCHAR(20) DEFAULT 'nouveau',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_tailor_client (tailor_id, client_id)
      )
    `);
    console.log("[DB] tailor_client_data table ensured ✅");
  } catch (err) {
    console.error("[DB] ensureTables error:", err);
  }

  // reviews: admin approval + project link
  await addColumnIfMissing("reviews", "is_approved", "TINYINT(1) NOT NULL DEFAULT 1");
  await addColumnIfMissing("reviews", "project_id", "VARCHAR(36) NULL");

  // users: CGV acceptance + last activity
  await addColumnIfMissing("users", "cgv_accepted", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfMissing("users", "cgv_accepted_at", "TIMESTAMP NULL");
  await addColumnIfMissing("users", "last_active_at", "TIMESTAMP NULL");

  // user_preferences: onboarding step
  await addColumnIfMissing("user_preferences", "onboarding_step", "INT NOT NULL DEFAULT 0");

  // appointments: reminder sent flag
  await addColumnIfMissing("appointments", "reminder_sent", "TINYINT(1) NOT NULL DEFAULT 0");
}
