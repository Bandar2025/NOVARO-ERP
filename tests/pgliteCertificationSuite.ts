process.env.DATABASE_PROVIDER = "pglite";
process.env.JWT_SECRET = "novaro-production-jwt-secret-key-32chars-min-length-required-2026";
process.env.JWT_REFRESH_SECRET = "novaro-production-jwt-refresh-secret-key-32chars-min-length-required-2026";

import { execSync } from "child_process";

async function runPgliteCertification() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — PGLITE DEVELOPMENT CERTIFICATION SUITE");
  console.log("==========================================================================");
  console.log("Starting PGlite Development Suite execution...\n");

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
    console.log("   🎉 PGLITE DEVELOPMENT CERTIFICATION: ALL SUITES PASSED (100%)");
    console.log("==========================================================================");
  } catch (err: any) {
    console.error("\n❌ PGLITE DEVELOPMENT CERTIFICATION FAILED:", err.message);
    process.exit(1);
  }
}

runPgliteCertification();
