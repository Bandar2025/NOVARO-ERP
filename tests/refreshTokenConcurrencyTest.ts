import express from "express";
import http from "http";
import crypto from "crypto";
import { pool, ensureInitialized } from "../src/infrastructure/database/client/db";
import { authRouter } from "../server/routes/auth";
import { AuthService } from "../server/services/authService";

async function runRefreshTokenConcurrencyTest() {
  process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || "pglite";
  process.env.JWT_SECRET = "novaro-production-jwt-secret-key-32chars-min-length-required-2026";
  process.env.JWT_REFRESH_SECRET = "novaro-production-jwt-refresh-secret-key-32chars-min-length-required-2026";

  console.log("==========================================================================");
  console.log("   NOVARO ERP — REFRESH TOKEN ROTATION CONCURRENCY TEST");
  console.log("==========================================================================");

  await ensureInitialized();

  // 1. Create user and generate valid tokens
  const testTenantId = "ten-refresh";
  const testCompanyId = "comp-refresh";
  const testUserId = `usr-${crypto.randomUUID()}`;
  const username = `refresh_user_${Date.now()}`;

  await pool.query(
    `INSERT INTO tenants (id, name, code, is_active) VALUES ($1, $2, $3, true) ON CONFLICT DO NOTHING`,
    [testTenantId, "Refresh Tenant", testTenantId]
  );
  await pool.query(
    `INSERT INTO companies (id, tenant_id, name, currency, is_active) VALUES ($1, $2, $3, 'SAR', true) ON CONFLICT DO NOTHING`,
    [testCompanyId, testTenantId, "Refresh Company"]
  );
  await pool.query(
    `INSERT INTO users (id, tenant_id, company_id, username, email, role, status, is_active)
     VALUES ($1, $2, $3, $4, $5, 'USER', 'ACTIVE', true)`,
    [testUserId, testTenantId, testCompanyId, username, `${username}@test.com`]
  );

  const authUser = {
    id: testUserId,
    tenantId: testTenantId,
    companyId: testCompanyId,
    branchId: null,
    username,
    email: `${username}@test.com`,
    role: "USER",
    status: "ACTIVE" as const,
    permissions: [],
  };

  const initialTokens = await AuthService.generateTokens(authUser);
  console.log("ℹ️ Generated initial refresh token pair.");

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

  // Execute Request A and Request B concurrently with the EXACT SAME refresh token
  console.log("⚡ Sending 2 simultaneous refresh requests using the exact same refresh token...");
  const [resA, resB] = await Promise.all([
    fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: initialTokens.refreshToken }),
    }),
    fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: initialTokens.refreshToken }),
    }),
  ]);

  const statusA = resA.status;
  const statusB = resB.status;
  console.log(`ℹ️ Request A HTTP status: ${statusA}, Request B HTTP status: ${statusB}`);

  // Exactly one should succeed (200) and the other should be rejected (401)
  const oneSucceeded = (statusA === 200 && statusB === 401) || (statusA === 401 && statusB === 200);
  assert("Atomic refresh token rotation: Exactly 1 request succeeds (200) and concurrent request is rejected (401)", oneSucceeded);

  // Subsequent reuse of the same refresh token MUST be rejected with 401 REVOKED_REFRESH_TOKEN
  const resReplay = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: initialTokens.refreshToken }),
  });

  const replayData: any = await resReplay.json();
  assert("Replay attack with original revoked refresh token is strictly rejected (401)", resReplay.status === 401 && replayData.error?.code === "REVOKED_REFRESH_TOKEN");

  server.close();

  console.log("==========================================================================");
  console.log(`   REFRESH TOKEN CONCURRENCY TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runRefreshTokenConcurrencyTest().catch((err) => {
  console.error("Refresh token concurrency test error:", err);
  process.exit(1);
});
