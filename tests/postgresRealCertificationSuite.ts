import { execSync } from "child_process";
import { runPostgresProbe } from "../src/infrastructure/database/client/probe";
import { getSanitizedConnectionMeta, sanitizeErrorMessage } from "../src/infrastructure/database/client/urlSanitizer";

async function runPostgresRealCertification() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — POSTGRESQL REAL CERTIFICATION SUITE");
  console.log("==========================================================================");

  const provider = (process.env.DATABASE_PROVIDER || "").toLowerCase().trim();
  const dbUrl = process.env.DATABASE_URL;

  if (provider !== "postgres" || !dbUrl) {
    console.log("⚠️ STATUS: BLOCKED / NOT EXECUTED");
    console.log("Reason: DATABASE_PROVIDER is not 'postgres' or DATABASE_URL environment variable is missing.");
    console.log("No real PostgreSQL server available in current environment.");
    console.log("Real PostgreSQL certification deferred until external container/Cloud SQL is attached.");
    console.log("==========================================================================\n");
    process.exit(0);
  }

  const meta = getSanitizedConnectionMeta(dbUrl);
  console.log(`[Target PostgreSQL] Host: ${meta.host} | Port: ${meta.port} | Database: ${meta.database} | SSL: ${meta.ssl}`);

  // 1. Execute Real PostgreSQL 9-step Connection & Protocol Probe
  console.log("\n--- Phase 1: Real Connection & Transaction Handshake Probe ---");
  const probeResult = await runPostgresProbe(dbUrl);
  if (!probeResult.success) {
    console.error(`❌ Real PostgreSQL Connection Probe Failed: ${probeResult.error}`);
    process.exit(1);
  }

  const tsxBin = "./node_modules/.bin/tsx";

  // 2. Execute Production DDL Migrations
  console.log("\n--- Phase 2: Drizzle Production Schema Migrations ---");
  try {
    execSync(`${tsxBin} src/infrastructure/database/client/migrate.ts`, {
      stdio: "inherit",
      env: process.env,
    });
  } catch (migErr: any) {
    console.error("❌ Real PostgreSQL Migration Phase Failed:", sanitizeErrorMessage(migErr.message));
    process.exit(1);
  }

  // 3. Execute Complete Real Domain, Security & E2E Suites against PostgreSQL
  console.log("\n--- Phase 3: Comprehensive Real PostgreSQL Certification Gates ---");

  const suites = [
    { name: "Explicit Provider Contract Audit", path: "tests/providerContractTest.ts" },
    { name: "Config & Security Guard (No Hardcoded Secrets)", path: "tests/configSecurityGuardTest.ts" },
    { name: "Phase 2D-R1 Security Suite (30 Controls, RBAC, Tokens, Policies)", path: "tests/phase2dR1SecuritySuite.ts" },
    { name: "Master Domain Certification (Accounting, FIFO, Yield Physics)", path: "tests/certificationSuite.ts" },
    { name: "Phase 2C UnitOfWork & Rollback Invariants", path: "tests/phase2cUnitOfWorkSuite.ts" },
    { name: "Schema & Table Parity Audit (31 Checks)", path: "tests/schemaParityTest.ts" },
    { name: "Sync Queue Negative & Composite Constraints", path: "tests/syncQueueNegativeTest.ts" },
    { name: "Auth Rate Limiter Contract", path: "tests/rateLimiterTest.ts" },
    { name: "Concurrent Login Lockout Invariant", path: "tests/loginConcurrencyTest.ts" },
    { name: "Concurrent Refresh Token Rotation & Replay Defense", path: "tests/refreshTokenConcurrencyTest.ts" },
    { name: "Phase 2G Real ERP End-to-End Scenarios (12 Scenarios A->L)", path: "tests/phase2gEndToEndSuite.ts" },
  ];

  try {
    for (let i = 0; i < suites.length; i++) {
      const suite = suites[i];
      console.log(`\n[Gate ${i + 1}/${suites.length}] Executing: ${suite.name}...`);
      execSync(`${tsxBin} ${suite.path}`, {
        stdio: "inherit",
        env: process.env,
      });
      console.log(`✅ [Gate ${i + 1} PASSED] ${suite.name}`);
    }

    console.log("\n==========================================================================");
    console.log("   🎉 POSTGRESQL REAL CERTIFICATION: ALL GATES PASSED (100%)");
    console.log("   Engine: Real External PostgreSQL");
    console.log(`   Database: ${meta.database} on ${meta.host}:${meta.port}`);
    console.log("==========================================================================\n");
  } catch (err: any) {
    console.error("\n❌ POSTGRESQL REAL CERTIFICATION FAILED:", sanitizeErrorMessage(err.message));
    process.exit(1);
  }
}

runPostgresRealCertification();
