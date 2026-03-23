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

  // projects: deadlines + urgency + fabric deposit
  await addColumnIfMissing("projects", "client_deadline", "DATE NULL");
  await addColumnIfMissing("projects", "artisan_deadline", "DATE NULL");
  await addColumnIfMissing("projects", "is_urgent", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfMissing("projects", "fabric_deposit_date", "DATE NULL");
  await addColumnIfMissing("projects", "fabric_deposit_reminder_sent", "TINYINT(1) NOT NULL DEFAULT 0");

  // events table
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        event_date DATE NOT NULL,
        tailor_id VARCHAR(36) NOT NULL,
        organizer_id VARCHAR(36) NOT NULL,
        invite_code VARCHAR(10) NOT NULL UNIQUE,
        description TEXT,
        registration_deadline DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[DB] events table ensured ✅");
  } catch (err) {
    console.warn("[DB] events table:", (err as any)?.message);
  }

  // Add registration_deadline column if missing (migration)
  try {
    await pool.execute(`ALTER TABLE events ADD COLUMN IF NOT EXISTS registration_deadline DATE NULL`);
  } catch (err) {
    // MySQL doesn't support IF NOT EXISTS for ALTER TABLE columns in older versions
    // Ignore duplicate column errors
    const msg = (err as any)?.message || "";
    if (!msg.includes("Duplicate column")) {
      console.warn("[DB] events.registration_deadline migration:", msg);
    }
  }

  // event_participants table
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS event_participants (
        id VARCHAR(36) PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        project_id VARCHAR(36) NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_event_user (event_id, user_id)
      )
    `);
    console.log("[DB] event_participants table ensured ✅");
  } catch (err) {
    console.warn("[DB] event_participants table:", (err as any)?.message);
  }
}
