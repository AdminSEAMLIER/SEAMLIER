import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "@shared/schema";

const rawUrl = process.env.MYSQL_DATABASE_URL || process.env.DATABASE_URL || "";
const cleanUrl = rawUrl.replace(/[?&]sslmode=[^&]*/g, "");

const pool = mysql.createPool({
  uri: cleanUrl,
  waitForConnections: true,
  connectionLimit: 10,
  ssl: rawUrl.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

export const db = drizzle(pool, { schema, mode: "default" });
