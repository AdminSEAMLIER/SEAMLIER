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
