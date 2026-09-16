import dotenv from "dotenv";
import { getSanitizedConnectionMeta, sanitizeErrorMessage } from "./urlSanitizer";

export interface ProbeResult {
  success: boolean;
  version?: string;
  database?: string;
  schema?: string;
  serverTime?: string;
  error?: string;
  sanitizedMeta: ReturnType<typeof getSanitizedConnectionMeta>;
}

export async function runPostgresProbe(customUrl?: string): Promise<ProbeResult> {
  dotenv.config({ path: [".env", ".env.example"] });

  const provider = (process.env.DATABASE_PROVIDER || "").toLowerCase().trim();
  const dbUrl = customUrl || process.env.DATABASE_URL;

  const sanitizedMeta = getSanitizedConnectionMeta(dbUrl);

  if (provider !== "postgres" || !dbUrl) {
    const reason =
      provider !== "postgres"
        ? `DATABASE_PROVIDER is '${provider || "MISSING"}' (must be 'postgres')`
        : "DATABASE_URL environment variable is missing";

    return {
      success: false,
      error: `BLOCKED: ${reason}`,
      sanitizedMeta,
    };
  }

  console.log("==========================================================================");
  console.log("   NOVARO ERP — REAL POSTGRESQL CONNECTION & PROTOCOL PROBE");
  console.log("==========================================================================");
  console.log(`[Probe Target] Host: ${sanitizedMeta.host} | Port: ${sanitizedMeta.port} | DB: ${sanitizedMeta.database} | SSL: ${sanitizedMeta.ssl}`);
  console.log("Executing 9-step real protocol handshake probe...\n");

  const pg = await import("pg");
  const client = new pg.default.Client({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
    ssl: sanitizedMeta.ssl ? { rejectUnauthorized: false } : undefined,
  });

  try {
    // Step 1: TCP Socket Connection & Step 2: Authentication
    console.log("[Step 1 & 2] Establishing TCP socket & PostgreSQL auth handshake...");
    await client.connect();
    console.log("             ✅ TCP connection & authentication established successfully.");

    // Step 3: SELECT version()
    console.log("[Step 3] Querying engine version (SELECT version())...");
    const verRes = await client.query("SELECT version() AS version;");
    const version = verRes.rows[0]?.version || "Unknown";
    console.log(`             ✅ Engine: ${version.split("\n")[0]}`);

    // Step 4: SELECT current_database()
    console.log("[Step 4] Querying active database (SELECT current_database())...");
    const dbRes = await client.query("SELECT current_database() AS db_name;");
    const currentDb = dbRes.rows[0]?.db_name;
    console.log(`             ✅ Active Database: ${currentDb}`);

    // Step 5: SELECT current_schema()
    console.log("[Step 5] Querying search path schema (SELECT current_schema())...");
    const schemaRes = await client.query("SELECT current_schema() AS schema_name;");
    const currentSchema = schemaRes.rows[0]?.schema_name;
    console.log(`             ✅ Current Schema: ${currentSchema}`);

    // Step 6: Transaction BEGIN
    console.log("[Step 6] Testing transaction initiation (BEGIN)...");
    await client.query("BEGIN;");
    console.log("             ✅ Transaction started.");

    // Step 7: Test Query in Transaction
    console.log("[Step 7] Executing probe query in transaction (SELECT 1, NOW())...");
    const testRes = await client.query("SELECT 1 AS probe_val, NOW() AS server_time;");
    const serverTime = testRes.rows[0]?.server_time?.toString();
    console.log(`             ✅ Query executed successfully. Server time: ${serverTime}`);

    // Step 8: Transaction ROLLBACK
    console.log("[Step 8] Testing clean transaction rollback (ROLLBACK)...");
    await client.query("ROLLBACK;");
    console.log("             ✅ Transaction cleanly rolled back.");

    // Step 9: Connection Close
    console.log("[Step 9] Closing client socket cleanly...");
    await client.end();
    console.log("             ✅ Connection closed successfully.");

    console.log("\n==========================================================================");
    console.log("   🎉 POSTGRESQL REAL CONNECTION PROBE: ALL 9 STEPS PASSED");
    console.log("==========================================================================\n");

    return {
      success: true,
      version,
      database: currentDb,
      schema: currentSchema,
      serverTime,
      sanitizedMeta,
    };
  } catch (err: any) {
    const safeError = sanitizeErrorMessage(err.message || String(err));
    console.error(`\n❌ [FAIL] PostgreSQL Connection Probe Error: ${safeError}`);

    try {
      await client.end();
    } catch {
      // Ignore cleanup error
    }

    return {
      success: false,
      error: safeError,
      sanitizedMeta,
    };
  }
}

// CLI runner
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("probe.ts")) {
  runPostgresProbe()
    .then((res) => {
      if (!res.success) {
        if (res.error?.startsWith("BLOCKED:")) {
          console.log(`⚠️ ${res.error}`);
          console.log("Status: BLOCKED / NOT EXECUTED (No real external PostgreSQL configured).");
          process.exit(0);
        }
        process.exit(1);
      }
      process.exit(0);
    })
    .catch((err) => {
      console.error("Probe runner error:", sanitizeErrorMessage(err.message));
      process.exit(1);
    });
}
