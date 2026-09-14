import { execSync } from "child_process";

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

  console.log("PostgreSQL server URL detected. Executing real PostgreSQL tests...\n");

  try {
    execSync("npx tsx tests/providerContractTest.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/configSecurityGuardTest.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/phase2dR1SecuritySuite.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/certificationSuite.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/phase2cUnitOfWorkSuite.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/schemaParityTest.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/syncQueueNegativeTest.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/rateLimiterTest.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/loginConcurrencyTest.ts", { stdio: "inherit", env: process.env });
    execSync("npx tsx tests/refreshTokenConcurrencyTest.ts", { stdio: "inherit", env: process.env });

    console.log("\n==========================================================================");
    console.log("   🎉 POSTGRESQL REAL CERTIFICATION: ALL SUITES PASSED (100%)");
    console.log("==========================================================================");
  } catch (err: any) {
    console.error("\n❌ POSTGRESQL REAL CERTIFICATION FAILED:", err.message);
    process.exit(1);
  }
}

runPostgresRealCertification();
