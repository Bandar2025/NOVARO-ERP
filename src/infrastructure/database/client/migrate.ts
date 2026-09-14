import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, dbConfig, pool } from "./db";

export async function runMigrations() {
  if (dbConfig.provider !== "postgres") {
    console.log("ℹ️ Database provider is not 'postgres'. Skipping Drizzle SQL file migrations.");
    return;
  }

  console.log("==================================================");
  console.log("   NOVARO ERP — DRIZZLE POSTGRES MIGRATION RUNNER");
  console.log("==================================================");
  console.log("Applying migrations from './src/infrastructure/database/migrations'...");

  try {
    await migrate(db, {
      migrationsFolder: "./src/infrastructure/database/migrations",
    });
    console.log("✅ All Drizzle migrations applied successfully to PostgreSQL database.");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("migrate.ts")) {
  runMigrations()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
