import express from "express";
import http from "http";
import crypto from "crypto";
import { pool, ensureInitialized } from "../src/infrastructure/database/client/db";
import { authRouter } from "../server/routes/auth";
import { AuthService } from "../server/services/authService";

async function runLoginConcurrencyTest() {
  process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || "pglite";
  process.env.JWT_SECRET = "novaro-production-jwt-secret-key-32chars-min-length-required-2026";
  process.env.JWT_REFRESH_SECRET = "novaro-production-jwt-refresh-secret-key-32chars-min-length-required-2026";

  console.log("==========================================================================");
  console.log("   NOVARO ERP — LOGIN LOCKOUT CONCURRENCY TEST");
  console.log("==========================================================================");

  await ensureInitialized();

  // Create test user in DB directly
  const testTenantId = "ten-concurrent";
  const testCompanyId = "comp-concurrent";
  const testUserId = `usr-${crypto.randomUUID()}`;
  const username = `concurrent_user_${Date.now()}`;
  const rawPassword = "CorrectPassword123!";
  const passwordHash = await AuthService.hashPassword(rawPassword);

  await pool.query(
    `INSERT INTO tenants (id, name, code, is_active) VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
    [testTenantId, "Concurrent Tenant", testTenantId]
  );
  await pool.query(
    `INSERT INTO companies (id, tenant_id, name, currency, is_active) VALUES ($1, $2, $3, 'SAR', true) ON CONFLICT DO NOTHING`,
    [testCompanyId, testTenantId, "Concurrent Company"]
  );
  await pool.query(
    `INSERT INTO users (id, tenant_id, company_id, username, email, role, password_hash, status, failed_login_attempts, is_active)
     VALUES ($1, $2, $3, $4, $5, 'USER', $6, 'ACTIVE', 0, true)`,
    [testUserId, testTenantId, testCompanyId, username, `${username}@test.com`, passwordHash]
  );

  // Setup express server
  const app = express();
  app.use(express.json());
  app.use("/api/auth", authRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${message ? `: ${message}` : ""}`);
      failed++;
    }
  }

  // Execute 5 concurrent failed login requests simultaneously to hit lockout threshold of 5
  console.log("⚡ Executing 5 simultaneous failed login requests with wrong password...");
  const requests = Array.from({ length: 5 }).map(() =>
    fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId: testTenantId,
        username,
        password: "WRONG_PASSWORD_XYZ",
      }),
    })
  );

  const responses = await Promise.all(requests);
  const statusCodes = responses.map((r) => r.status);
  console.log(`ℹ️ HTTP status codes from concurrent requests:`, statusCodes);

  // Check final user state in database
  const userQuery = await pool.query(`SELECT failed_login_attempts, status FROM users WHERE id = $1`, [testUserId]);
  const finalUser = userQuery.rows[0];

  console.log(`ℹ️ Final Database State: failed_login_attempts = ${finalUser.failed_login_attempts}, status = ${finalUser.status}`);

  assert(
    "Atomic counter accurately tracked all failed login increments",
    finalUser.failed_login_attempts >= 5,
    `Expected >= 5, got ${finalUser.failed_login_attempts}`
  );

  assert("Account status transitioned to LOCKED upon reaching threshold", finalUser.status === "LOCKED");

  // Subsequent request must be rejected with 403 ACCOUNT_LOCKED (6th request within rate limit window of 10)
  const lockedRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      tenantId: testTenantId,
      username,
      password: rawPassword, // even with correct password!
    }),
  });

  const lockedData: any = await lockedRes.json();
  assert("Locked user rejected with 403 ACCOUNT_LOCKED even with correct password", lockedRes.status === 403 && lockedData.error?.code === "ACCOUNT_LOCKED");

  server.close();

  console.log("==========================================================================");
  console.log(`   LOGIN CONCURRENCY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runLoginConcurrencyTest().catch((err) => {
  console.error("Login concurrency test error:", err);
  process.exit(1);
});
