import { execSync } from "child_process";

async function runProviderContractTests() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — EXPLICIT DATABASE PROVIDER CONTRACT AUDIT TEST");
  console.log("==========================================================================");

  let passed = 0;
  let failed = 0;

  function runIsolatedCheck(
    caseName: string,
    envVars: Record<string, string | undefined>,
    expectedOutputSubstring: string,
    expectError: boolean
  ) {
    const env: Record<string, string> = {};
    for (const k of Object.keys(process.env)) {
      if (k !== "DATABASE_PROVIDER" && k !== "DATABASE_URL") {
        if (process.env[k] !== undefined) env[k] = process.env[k]!;
      }
    }
    for (const [k, v] of Object.entries(envVars)) {
      if (v !== undefined) {
        env[k] = v;
      } else {
        delete env[k];
      }
    }

    const code = `import { dbConfig } from "./src/infrastructure/database/client/db"; console.log("RESOLVED_PROVIDER:" + dbConfig.provider);`;

    try {
      const output = execSync(`npx tsx -e '${code}'`, {
        env,
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      if (expectError) {
        console.error(`❌ [FAIL] ${caseName}: Expected process failure, but it succeeded with output:\n${output}`);
        failed++;
      } else {
        if (output.includes(expectedOutputSubstring)) {
          console.log(`✅ [PASS] ${caseName}`);
          passed++;
        } else {
          console.error(`❌ [FAIL] ${caseName}: Output did not contain '${expectedOutputSubstring}'. Output:\n${output}`);
          failed++;
        }
      }
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString() : err.message;
      const stdout = err.stdout ? err.stdout.toString() : "";
      const combined = stderr + "\n" + stdout;

      if (expectError) {
        if (combined.includes(expectedOutputSubstring)) {
          console.log(`✅ [PASS] ${caseName}`);
          passed++;
        } else {
          console.error(`❌ [FAIL] ${caseName}: Process failed, but error message did not contain '${expectedOutputSubstring}'. Actual error:\n${combined}`);
          failed++;
        }
      } else {
        console.error(`❌ [FAIL] ${caseName}: Expected success, but process failed with error:\n${combined}`);
        failed++;
      }
    }
  }

  // CASE 1: DATABASE_PROVIDER=pglite -> provider = pglite
  runIsolatedCheck(
    "CASE 1: DATABASE_PROVIDER=pglite -> provider = pglite",
    { DATABASE_PROVIDER: "pglite", DATABASE_URL: undefined },
    "RESOLVED_PROVIDER:pglite",
    false
  );

  // CASE 2: DATABASE_PROVIDER=postgres + DATABASE_URL present -> provider = postgres
  runIsolatedCheck(
    "CASE 2: DATABASE_PROVIDER=postgres + DATABASE_URL present -> provider = postgres",
    { DATABASE_PROVIDER: "postgres", DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb" },
    "RESOLVED_PROVIDER:postgres",
    false
  );

  // CASE 3: DATABASE_PROVIDER missing without DATABASE_URL -> default to pglite
  runIsolatedCheck(
    "CASE 3: DATABASE_PROVIDER missing without DATABASE_URL -> default to pglite",
    { DATABASE_PROVIDER: undefined, DATABASE_URL: undefined },
    "RESOLVED_PROVIDER:pglite",
    false
  );

  // CASE 3B: DATABASE_PROVIDER missing with DATABASE_URL -> default to postgres
  runIsolatedCheck(
    "CASE 3B: DATABASE_PROVIDER missing with DATABASE_URL -> default to postgres",
    { DATABASE_PROVIDER: undefined, DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb" },
    "RESOLVED_PROVIDER:postgres",
    false
  );

  // CASE 4: DATABASE_PROVIDER=invalid -> FAIL FAST
  runIsolatedCheck(
    "CASE 4: DATABASE_PROVIDER=invalid -> FAIL FAST",
    { DATABASE_PROVIDER: "invalid", DATABASE_URL: undefined },
    "FAIL FAST CONFIG ERROR: Invalid DATABASE_PROVIDER 'invalid'",
    true
  );

  // CASE 5: DATABASE_PROVIDER=postgres + DATABASE_URL missing -> FAIL FAST
  runIsolatedCheck(
    "CASE 5: DATABASE_PROVIDER=postgres + DATABASE_URL missing -> FAIL FAST",
    { DATABASE_PROVIDER: "postgres", DATABASE_URL: undefined },
    "FAIL FAST CONFIG ERROR: DATABASE_PROVIDER is set to 'postgres', but DATABASE_URL environment variable is missing",
    true
  );

  // CASE 6: DATABASE_PROVIDER=pglite + DATABASE_URL present -> provider remains pglite
  runIsolatedCheck(
    "CASE 6: DATABASE_PROVIDER=pglite + DATABASE_URL present -> provider remains pglite",
    { DATABASE_PROVIDER: "pglite", DATABASE_URL: "postgresql://user:pass@localhost:5432/testdb" },
    "RESOLVED_PROVIDER:pglite",
    false
  );

  console.log("==========================================================================");
  console.log(`   PROVIDER CONTRACT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runProviderContractTests();
