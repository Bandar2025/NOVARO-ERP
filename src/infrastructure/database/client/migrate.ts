import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, dbConfig, pool } from "./db";
import { getSanitizedConnectionMeta, sanitizeErrorMessage } from "./urlSanitizer";

export async function runMigrations() {
  if (dbConfig.provider !== "postgres") {
    const errorMsg = `FAIL FAST MIGRATION ERROR: Migration runner strictly rejects provider '${dbConfig.provider}'. Drizzle schema migrations are strictly for real PostgreSQL (requires DATABASE_PROVIDER=postgres and a valid external DATABASE_URL).`;
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!dbConfig.url) {
    const errorMsg = "FAIL FAST MIGRATION ERROR: DATABASE_URL environment variable is missing.";
    console.error(`❌ ${errorMsg}`);
    throw new Error(errorMsg);
  }

  const meta = getSanitizedConnectionMeta(dbConfig.url);

  console.log("==================================================");
  console.log("   NOVARO ERP — DRIZZLE POSTGRES MIGRATION RUNNER");
  console.log("==================================================");
  console.log(`[Target Instance] Host: ${meta.host} | Port: ${meta.port} | Database: ${meta.database} | SSL: ${meta.ssl}`);
  console.log("Applying production migrations from './src/infrastructure/database/migrations'...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/infrastructure/database/migrations",
    });
    console.log("✅ All Drizzle migrations applied successfully to external PostgreSQL database.");
  } catch (error: any) {
    const safeError = sanitizeErrorMessage(error.message || String(error));
    console.error("❌ Migration failed on real PostgreSQL instance:", safeError);
    throw new Error(`Real PostgreSQL Migration Failed: ${safeError}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error(sanitizeErrorMessage(err.message || String(err)));
      process.exit(1);
    });
}
