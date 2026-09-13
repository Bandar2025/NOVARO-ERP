import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../schema";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required in production mode.");
}

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/novaro_erp";

export const pool = new pg.Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

