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

  // tailors: rating + review_count (may be missing in older installations)
  await addColumnIfMissing("tailors", "rating", "FLOAT NOT NULL DEFAULT 0");
  await addColumnIfMissing("tailors", "review_count", "INT NOT NULL DEFAULT 0");

  // tailors: dossier fields (added after initial deployment)
  await addColumnIfMissing("tailors", "kbis_url", "TEXT NULL");
  await addColumnIfMissing("tailors", "kbis_expiry_date", "DATE NULL");
  await addColumnIfMissing("tailors", "id_card_url", "TEXT NULL");
  await addColumnIfMissing("tailors", "rc_pro_url", "TEXT NULL");
  await addColumnIfMissing("tailors", "iban_rib", "TEXT NULL");
  await addColumnIfMissing("tailors", "dossier_status", "VARCHAR(20) NOT NULL DEFAULT 'pending'");
  await addColumnIfMissing("tailors", "dossier_rejection_reason", "TEXT NULL");

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
        status VARCHAR(30) NOT NULL DEFAULT 'pending_tailor_approval',
        max_participants INT NULL,
        price_per_person DECIMAL(10,2) NULL,
        price_group DECIMAL(10,2) NULL,
        delivery_date DATE NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("[DB] events table ensured ✅");
  } catch (err) {
    console.warn("[DB] events table:", (err as any)?.message);
  }

  // projects: delivery date for event-linked projects
  await addColumnIfMissing("projects", "delivery_date", "DATE NULL");
  await addColumnIfMissing("projects", "event_id", "VARCHAR(36) NULL");
  await addColumnIfMissing("projects", "contract_url", "TEXT NULL");
  await addColumnIfMissing("projects", "client_confirmed", "TINYINT(1) NOT NULL DEFAULT 0");
  await addColumnIfMissing("projects", "requested_price", "DECIMAL(10,2) NULL");
  await addColumnIfMissing("projects", "clothing_type", "VARCHAR(100) NULL");

  // projects: widen model_photo_url from TEXT (64KB) to MEDIUMTEXT (16MB) for base64 photos
  try {
    await pool.execute(`ALTER TABLE projects MODIFY COLUMN model_photo_url MEDIUMTEXT NULL`);
    console.log("[DB] projects.model_photo_url widened to MEDIUMTEXT ✅");
  } catch (err: any) {
    // Idempotent: ignore if already MEDIUMTEXT or column doesn't exist
    if (!err?.message?.includes("MEDIUMTEXT")) {
      console.warn("[DB] model_photo_url ALTER:", err?.message);
    }
  }

  // events: add new columns if table already existed
  await addColumnIfMissing("events", "registration_deadline", "DATE NULL");
  await addColumnIfMissing("events", "status", "VARCHAR(30) NOT NULL DEFAULT 'pending_tailor_approval'");
  await addColumnIfMissing("events", "max_participants", "INT NULL");
  await addColumnIfMissing("events", "price_per_person", "DECIMAL(10,2) NULL");
  await addColumnIfMissing("events", "price_group", "DECIMAL(10,2) NULL");
  await addColumnIfMissing("events", "delivery_date", "DATE NULL");
  await addColumnIfMissing("events", "validation_code", "VARCHAR(6) NULL");
  await addColumnIfMissing("events", "inspiration_photos", "MEDIUMTEXT NULL");

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

  // tailor_working_hours table
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tailor_working_hours (
        id VARCHAR(36) PRIMARY KEY,
        tailor_id VARCHAR(36) NOT NULL,
        day_of_week INT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
        start_time VARCHAR(5) NULL COMMENT 'HH:MM format',
        end_time VARCHAR(5) NULL COMMENT 'HH:MM format',
        is_closed TINYINT(1) NOT NULL DEFAULT 0,
        UNIQUE KEY uq_tailor_day (tailor_id, day_of_week)
      )
    `);
    console.log("[DB] tailor_working_hours table ensured ✅");
  } catch (err) {
    console.warn("[DB] tailor_working_hours table:", (err as any)?.message);
  }

  // tailor_schedule table (used by schedule editor / new booking system)
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tailor_schedule (
        id VARCHAR(36) PRIMARY KEY,
        tailor_id VARCHAR(36) NOT NULL,
        day_of_week INT NOT NULL COMMENT '0=Sunday, 1=Monday, ..., 6=Saturday',
        start_time VARCHAR(5) NULL COMMENT 'HH:MM format',
        end_time VARCHAR(5) NULL COMMENT 'HH:MM format',
        is_closed TINYINT(1) NOT NULL DEFAULT 0,
        UNIQUE KEY uq_schedule_tailor_day (tailor_id, day_of_week)
      )
    `);
    console.log("[DB] tailor_schedule table ensured ✅");
  } catch (err) {
    console.warn("[DB] tailor_schedule table:", (err as any)?.message);
  }

  // tailor_exceptions table (exceptional closures)
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS tailor_exceptions (
        id VARCHAR(36) PRIMARY KEY,
        tailor_id VARCHAR(36) NOT NULL,
        date DATE NOT NULL,
        reason VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_exception_tailor_date (tailor_id, date)
      )
    `);
    console.log("[DB] tailor_exceptions table ensured ✅");
  } catch (err) {
    console.warn("[DB] tailor_exceptions table:", (err as any)?.message);
  }

  // disputes table
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS disputes (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        client_id VARCHAR(36) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'open',
        admin_note TEXT,
        stripe_refund_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL
      )
    `);
    console.log("[DB] disputes table ensured ✅");
  } catch (err) {
    console.warn("[DB] disputes table:", (err as any)?.message);
  }

  // push_subscriptions table
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_push_user (user_id)
      )
    `);
    console.log("[DB] push_subscriptions table ensured ✅");
  } catch (err) {
    console.warn("[DB] push_subscriptions table:", (err as any)?.message);
  }

  // referrals table
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS referrals (
        id VARCHAR(36) PRIMARY KEY,
        referrer_tailor_id VARCHAR(36) NOT NULL,
        referred_email VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        token VARCHAR(64) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_referral_tailor (referrer_tailor_id)
      )
    `);
    console.log("[DB] referrals table ensured ✅");
  } catch (err) {
    console.warn("[DB] referrals table:", (err as any)?.message);
  }

  // tailors: extra profile fields
  await addColumnIfMissing("tailors", "languages", "JSON NULL");
  await addColumnIfMissing("tailors", "price_min", "FLOAT NULL");
  await addColumnIfMissing("tailors", "price_max", "FLOAT NULL");
  await addColumnIfMissing("tailors", "referral_code", "VARCHAR(16) NULL");
}
