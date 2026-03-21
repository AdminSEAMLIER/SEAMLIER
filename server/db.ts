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
}
