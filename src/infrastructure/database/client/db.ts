import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import * as schema from "../schema";
import { INIT_SCHEMA_SQL } from "./initSchema";

export type DatabaseProvider = "pglite" | "postgres";

export interface DatabaseConfig {
  provider: DatabaseProvider;
  url?: string;
  name?: string;
  ssl?: boolean;
  poolMax: number;
}

function resolveDatabaseConfig(): DatabaseConfig {
  const rawProvider = (process.env.DATABASE_PROVIDER || "").toLowerCase().trim();
  const url = process.env.DATABASE_URL;
  const poolMax = parseInt(process.env.DATABASE_POOL_MAX || "10", 10);
  const ssl = process.env.DATABASE_SSL === "true";
  const name = process.env.DATABASE_NAME;

  if (rawProvider === "postgres") {
    if (!url) {
      throw new Error("FAIL FAST CONFIG ERROR: DATABASE_PROVIDER is set to 'postgres', but DATABASE_URL environment variable is missing.");
    }
    return { provider: "postgres", url, name, ssl, poolMax };
  }

  if (rawProvider === "pglite") {
    return { provider: "pglite", url, name, ssl, poolMax };
  }

  // If DATABASE_PROVIDER is unset: infer from DATABASE_URL
  if (url) {
    return { provider: "postgres", url, name, ssl, poolMax };
  }

  return { provider: "pglite", poolMax };
}

export const dbConfig = resolveDatabaseConfig();

console.log("==================================================");
if (dbConfig.provider === "postgres") {
  console.log("DATABASE PROVIDER: POSTGRESQL (Node-Postgres)");
  console.log(`ENVIRONMENT: ${process.env.NODE_ENV || "development"}`);
} else {
  console.log("DATABASE PROVIDER: PGLITE (Development/Test Mode)");
  console.log(`ENVIRONMENT: ${process.env.NODE_ENV || "development"}`);
}
console.log("==================================================");

let poolInstance: any;
let dbInstance: any;
let pgliteInstance: PGlite | null = null;
let isInitialized = false;
let initPromise: Promise<void> | null = null;

if (dbConfig.provider === "postgres") {
  poolInstance = new pg.Pool({
    connectionString: dbConfig.url,
    max: dbConfig.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    ssl: dbConfig.ssl ? { rejectUnauthorized: false } : undefined,
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
