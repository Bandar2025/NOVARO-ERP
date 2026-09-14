import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "../schema";
import { INIT_SCHEMA_SQL } from "./initSchema";

const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required in production mode.");
}

let poolInstance: any;
let dbInstance: any;
let pgliteInstance: PGlite | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

if (process.env.DATABASE_URL) {
  poolInstance = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
  dbInstance = drizzleNodePg(poolInstance, { schema });
} else {
  pgliteInstance = new PGlite();
  dbInstance = drizzlePglite(pgliteInstance, { schema });

  poolInstance = {
    async query(text: string, params?: any[]) {
      await ensureInitialized();
      const res = await pgliteInstance!.query(text, params);
      return {
        rows: res.rows,
        rowCount: res.affectedRows ?? res.rows.length,
        fields: res.fields,
      };
    },
    async connect() {
      await ensureInitialized();
      return {
        async query(text: string, params?: any[]) {
          const res = await pgliteInstance!.query(text, params);
          return {
            rows: res.rows,
            rowCount: res.affectedRows ?? res.rows.length,
            fields: res.fields,
          };
        },
        release() {},
      };
    },
    async end() {},
  };
}

export async function ensureInitialized() {
  if (isInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      if (pgliteInstance) {
        await pgliteInstance.exec(INIT_SCHEMA_SQL);
      }
      isInitialized = true;
    })();
  }
  await initPromise;
}

// Trigger initialization
ensureInitialized().catch((err) => console.error("Database schema init failed:", err));

export const pool = poolInstance;
export const db = dbInstance;

export type DbClient = typeof db;
export type DbOrTx = any;
