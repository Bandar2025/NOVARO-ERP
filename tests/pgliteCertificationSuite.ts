process.env.DATABASE_PROVIDER = "pglite";
process.env.JWT_SECRET = "novaro-production-jwt-secret-key-32chars-min-length-required-2026";
process.env.JWT_REFRESH_SECRET = "novaro-production-jwt-refresh-secret-key-32chars-min-length-required-2026";

import { execSync } from "child_process";

async function runPgliteCertification() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — PGLITE DEVELOPMENT CERTIFICATION SUITE");
  console.log("==========================================================================");
  console.log("Starting PGlite Development Suite execution...\n");

  const tsxBin = "./node_modules/.bin/tsx";
  try {
    execSync(`${tsxBin} tests/providerContractTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/configSecurityGuardTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/phase2dR1SecuritySuite.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/certificationSuite.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/phase2cUnitOfWorkSuite.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/schemaParityTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/syncQueueNegativeTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/rateLimiterTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/loginConcurrencyTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/refreshTokenConcurrencyTest.ts`, { stdio: "inherit", env: process.env });
    execSync(`${tsxBin} tests/phase2gEndToEndSuite.ts`, { stdio: "inherit", env: process.env });

    console.log("\n==========================================================================");
    console.log("   🎉 PGLITE DEVELOPMENT CERTIFICATION: ALL SUITES PASSED (100%)");
    console.log("==========================================================================");
  } catch (err: any) {
    console.error("\n❌ PGLITE DEVELOPMENT CERTIFICATION FAILED:", err.message);
    process.exit(1);
  }
}

runPgliteCertification();
