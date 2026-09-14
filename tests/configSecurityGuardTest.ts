import fs from "fs";
import path from "path";

async function runConfigSecurityGuardTest() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — CONFIG & SECURITY GUARD AUDIT TEST");
  console.log("==========================================================================");

  let passed = 0;
  let failed = 0;

  function assertCheck(name: string, condition: boolean, failReason: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}: ${failReason}`);
      failed++;
    }
  }

  // 1. Check docker-compose.yml
  const dockerComposePath = path.join(process.cwd(), "docker-compose.yml");
  const dockerComposeContent = fs.readFileSync(dockerComposePath, "utf8");

  assertCheck(
    "Docker Compose: No hardcoded default password",
    !dockerComposeContent.includes("novaro_dev_password_2026"),
    "docker-compose.yml contains hardcoded default password 'novaro_dev_password_2026'."
  );

  assertCheck(
    "Docker Compose: Required password env enforcement",
    dockerComposeContent.includes("POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?"),
    "docker-compose.yml does not enforce required POSTGRES_PASSWORD variable syntax."
  );

  // 2. Check .env.example
  const envExamplePath = path.join(process.cwd(), ".env.example");
  const envExampleContent = fs.readFileSync(envExamplePath, "utf8");

  assertCheck(
    ".env.example: No hardcoded JWT secrets",
    !envExampleContent.includes("novaro-production-jwt-secret-key"),
    ".env.example contains a usable/hardcoded JWT secret string."
  );

  assertCheck(
    ".env.example: Placeholder JWT secrets used",
    envExampleContent.includes("REPLACE_WITH_RANDOM_32_PLUS_CHARACTER_SECRET"),
    ".env.example does not use explicit placeholders for JWT secrets."
  );

  // 3. Check db.ts for zero provider inference
  const dbTsPath = path.join(process.cwd(), "src/infrastructure/database/client/db.ts");
  const dbTsContent = fs.readFileSync(dbTsPath, "utf8");

  assertCheck(
    "db.ts: Zero provider inference (No url ? 'postgres' : 'pglite')",
    !dbTsContent.includes('url ? "postgres" : "pglite"'),
    "db.ts contains provider inference logic based on DATABASE_URL existence."
  );

  assertCheck(
    "db.ts: Explicit fail fast when DATABASE_PROVIDER is missing",
    dbTsContent.includes("FAIL FAST CONFIG ERROR: DATABASE_PROVIDER environment variable is missing"),
    "db.ts does not throw explicit fail fast error when DATABASE_PROVIDER is missing."
  );

  console.log("==========================================================================");
  console.log(`   CONFIG & SECURITY GUARD SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runConfigSecurityGuardTest();
