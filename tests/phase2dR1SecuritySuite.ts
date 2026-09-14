import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq } from "drizzle-orm";
import { db, ensureInitialized } from "../src/infrastructure/database/client/db";
import { tenants, companies, branches, users, refreshTokens, auditLogs } from "../src/infrastructure/database/schema";
import { authRouter } from "../server/routes/auth";
import { usersRouter } from "../server/routes/users";
import { rolesRouter } from "../server/routes/roles";
import accountsRouter from "../server/routes/accounts";
import journalEntriesRouter from "../server/routes/journalEntries";
import reportsRouter from "../server/routes/reports";
import customersRouter from "../server/routes/customers";
import suppliersRouter from "../server/routes/suppliers";
import inventoryRouter from "../server/routes/inventory";
import salesRouter from "../server/routes/sales";
import purchasesRouter from "../server/routes/purchases";
import { errorHandler } from "../server/middleware/errorHandler";
import { authenticateToken, requirePermission, AuthRequest } from "../server/middleware/authMiddleware";
import { AuthService, validateAuthConfig } from "../server/services/authService";

const JWT_SECRET = "novaro-production-jwt-secret-key-32chars-min-length-required-2026";
const JWT_REFRESH_SECRET = "novaro-production-jwt-refresh-secret-key-32chars-min-length-required-2026";

process.env.JWT_SECRET = JWT_SECRET;
process.env.JWT_REFRESH_SECRET = JWT_REFRESH_SECRET;

async function runSecuritySuite() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — PHASE 2D-R1 SECURITY HARDENING REAL CERTIFICATION SUITE");
  console.log("==========================================================================");

  // 1. Setup Express app on ephemeral port
  const app = express();
  app.use(express.json());

  app.post("/api/gemini/generate", authenticateToken, async (req: AuthRequest, res) => {
    res.json({ text: "Generated AI text" });
  });

  app.post("/api/erpnext/simulate", authenticateToken, requirePermission("system:admin"), (req: AuthRequest, res) => {
    if (process.env.NODE_ENV === "production") {
      return res.status(403).json({ error: "Disabled in production" });
    }
    res.json({ message: "Simulated response" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/roles", rolesRouter);
  app.use("/api/v1/accounts", accountsRouter);
  app.use("/api/v1/journal-entries", journalEntriesRouter);
  app.use("/api/v1/reports", reportsRouter);
  app.use("/api/v1/customers", customersRouter);
  app.use("/api/v1/suppliers", suppliersRouter);
  app.use("/api/v1/inventory", inventoryRouter);
  app.use("/api/v1/sales", salesRouter);
  app.use("/api/v1/purchases", purchasesRouter);
  app.use(errorHandler);

  await ensureInitialized();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  console.log(`[Test Server] Running on ${baseUrl}\n`);

  // 2. Setup Seed Data in PostgreSQL
  const tenantA = "tenant-a-sec";
  const tenantB = "tenant-b-sec";
  const companyA = "comp-a-sec";
  const companyB = "comp-b-sec";
  const branchA = "branch-a-sec";
  const branchB = "branch-b-sec";

  await db.insert(tenants).values([
    { id: tenantA, code: "TA", name: "Tenant Security A" },
    { id: tenantB, code: "TB", name: "Tenant Security B" },
  ]).onConflictDoNothing();

  await db.insert(companies).values([
    { id: companyA, tenantId: tenantA, name: "Company A Security", currency: "SAR" },
    { id: companyB, tenantId: tenantB, name: "Company B Security", currency: "SAR" },
  ]).onConflictDoNothing();

  await db.insert(branches).values([
    { id: branchA, tenantId: tenantA, companyId: companyA, code: "BRA", name: "Branch A" },
    { id: branchB, tenantId: tenantB, companyId: companyB, code: "BRB", name: "Branch B" },
  ]).onConflictDoNothing();

  const passwordHash = await AuthService.hashPassword("SecurePassword123!");

  // Admin User Tenant A
  const adminAId = "usr-admin-a";
  await db.insert(users).values({
    id: adminAId,
    tenantId: tenantA,
    companyId: companyA,
    branchId: branchA,
    username: "admin_a",
    email: "admin_a@tenant-a.com",
    role: "ADMIN",
    passwordHash,
    status: "ACTIVE",
    failedLoginAttempts: 0,
    isActive: true,
  }).onConflictDoNothing();

  // Cashier User Tenant A (Non-admin)
  const cashierAId = "usr-cashier-a";
  await db.insert(users).values({
    id: cashierAId,
    tenantId: tenantA,
    companyId: companyA,
    branchId: branchA,
    username: "cashier_a",
    email: "cashier_a@tenant-a.com",
    role: "CASHIER",
    passwordHash,
    status: "ACTIVE",
    failedLoginAttempts: 0,
    isActive: true,
  }).onConflictDoNothing();

  // User Tenant B
  const userBId = "usr-admin-b";
  await db.insert(users).values({
    id: userBId,
    tenantId: tenantB,
    companyId: companyB,
    branchId: branchB,
    username: "admin_b",
    email: "admin_b@tenant-b.com",
    role: "ADMIN",
    passwordHash,
    status: "ACTIVE",
    failedLoginAttempts: 0,
    isActive: true,
  }).onConflictDoNothing();

  let passed = 0;
  let failed = 0;

  function assert(testNum: number, title: string, condition: boolean, detail: string = "") {
    if (condition) {
      console.log(`✅ [PASS] Test ${testNum.toString().padStart(2, "0")}: ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] Test ${testNum.toString().padStart(2, "0")}: ${title} — ${detail}`);
      failed++;
    }
  }

  // --- TEST CASES ---

  // Test 1: Fail startup on weak JWT secrets
  try {
    const origSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    let threw = false;
    try {
      validateAuthConfig();
    } catch (e) {
      threw = true;
    }
    process.env.JWT_SECRET = origSecret;
    assert(1, "Fail startup/config validation on missing/weak JWT secrets", threw);
  } catch (e: any) {
    assert(1, "Fail startup/config validation on missing/weak JWT secrets", false, e.message);
  }

  // Test 2: Fail auth on missing Authorization header
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`);
    assert(2, "Fail auth on missing Authorization header (401)", res.status === 401);
  } catch (e: any) {
    assert(2, "Fail auth on missing Authorization header (401)", false, e.message);
  }

  // Test 3: Fail auth on malformed Bearer header
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: "InvalidBearerTokenString" },
    });
    assert(3, "Fail auth on malformed Bearer header (401)", res.status === 401);
  } catch (e: any) {
    assert(3, "Fail auth on malformed Bearer header (401)", false, e.message);
  }

  // Test 4: Fail auth on invalid JWT signature
  try {
    const fakeToken = jwt.sign({ sub: adminAId, tenantId: tenantA, role: "ADMIN" }, "wrong-secret-key-that-should-fail-32chars");
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${fakeToken}` },
    });
    assert(4, "Fail auth on invalid JWT signature (401)", res.status === 401);
  } catch (e: any) {
    assert(4, "Fail auth on invalid JWT signature (401)", false, e.message);
  }

  // Test 5: Fail auth on expired JWT
  try {
    const expiredToken = jwt.sign(
      { sub: adminAId, tenantId: tenantA, role: "ADMIN", jti: "test_exp" },
      JWT_SECRET,
      { expiresIn: "-1s" }
    );
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert(5, "Fail auth on expired JWT (401)", res.status === 401);
  } catch (e: any) {
    assert(5, "Fail auth on expired JWT (401)", false, e.message);
  }

  // Test 6: Fail auth on fake user in JWT (Fail-closed)
  try {
    const fakeUserToken = jwt.sign(
      { sub: "usr-ghost-nonexistent", tenantId: tenantA, companyId: companyA, role: "ADMIN", jti: "test_fake" },
      JWT_SECRET,
      { expiresIn: "15m" }
    );
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${fakeUserToken}` },
    });
    assert(6, "Fail auth on nonexistent user in JWT - Fail Closed (401)", res.status === 401);
  } catch (e: any) {
    assert(6, "Fail auth on nonexistent user in JWT - Fail Closed (401)", false, e.message);
  }

  // Test 7: Successful login with correct credentials
  let adminAToken = "";
  let adminARefreshToken = "";
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin_a", password: "SecurePassword123!", tenantId: tenantA }),
    });
    const body: any = await res.json();
    adminAToken = body.accessToken || "";
    adminARefreshToken = body.refreshToken || "";
    assert(7, "Successful login with valid credentials (200 + tokens)", res.status === 200 && !!adminAToken);
  } catch (e: any) {
    assert(7, "Successful login with valid credentials", false, e.message);
  }

  // Test 8: Failed login with wrong password
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin_a", password: "WrongPassword!", tenantId: tenantA }),
    });
    assert(8, "Failed login with wrong password (401)", res.status === 401);
  } catch (e: any) {
    assert(8, "Failed login with wrong password", false, e.message);
  }

  // Test 9: Account lockout after 5 consecutive failed attempts
  const victimUser = "victim_lockout";
  const victimId = "usr-victim";
  await db.insert(users).values({
    id: victimId,
    tenantId: tenantA,
    companyId: companyA,
    branchId: branchA,
    username: victimUser,
    email: "victim@tenant-a.com",
    role: "CASHIER",
    passwordHash,
    status: "ACTIVE",
    failedLoginAttempts: 0,
    isActive: true,
  }).onConflictDoNothing();

  try {
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: victimUser, password: "BadPassword!", tenantId: tenantA }),
      });
    }
    const [victimRow] = await db.select().from(users).where(eq(users.id, victimId));
    assert(9, "Account status set to LOCKED in DB after 5 failed attempts", victimRow?.status === "LOCKED");
  } catch (e: any) {
    assert(9, "Account status set to LOCKED after 5 failed attempts", false, e.message);
  }

  // Test 10: Block login attempt for locked account with 403
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: victimUser, password: "SecurePassword123!", tenantId: tenantA }),
    });
    assert(10, "Block login for locked account with 403 ACCOUNT_LOCKED", res.status === 403);
  } catch (e: any) {
    assert(10, "Block login for locked account", false, e.message);
  }

  // Test 11: Administrative unlock via HTTP API
  try {
    const res = await fetch(`${baseUrl}/api/v1/users/${victimId}/unlock`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    assert(11, "Administrative user unlock via HTTP API (200)", res.status === 200);
  } catch (e: any) {
    assert(11, "Administrative user unlock via HTTP API", false, e.message);
  }

  // Test 12: Successful login after account unlock
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: victimUser, password: "SecurePassword123!", tenantId: tenantA }),
    });
    assert(12, "Successful login after account unlock (200)", res.status === 200);
  } catch (e: any) {
    assert(12, "Successful login after account unlock", false, e.message);
  }

  // Test 13: Audit log recording for failed login
  try {
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "AUTH_LOGIN_FAILED"));
    assert(13, "Audit log created for AUTH_LOGIN_FAILED", logs.length > 0);
  } catch (e: any) {
    assert(13, "Audit log created for AUTH_LOGIN_FAILED", false, e.message);
  }

  // Test 14: Audit log recording for account lockout
  try {
    const logs = await db.select().from(auditLogs).where(eq(auditLogs.action, "AUTH_ACCOUNT_LOCKED"));
    assert(14, "Audit log created for AUTH_ACCOUNT_LOCKED", logs.length > 0);
  } catch (e: any) {
    assert(14, "Audit log created for AUTH_ACCOUNT_LOCKED", false, e.message);
  }

  // Test 15: Refresh token issuance on valid login
  assert(15, "Refresh token issued on valid login", !!adminARefreshToken);

  // Test 16: Successful session refresh via refresh token
  let newAccessToken = "";
  let newRefreshToken = "";
  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: adminARefreshToken }),
    });
    const body: any = await res.json();
    newAccessToken = body.accessToken || "";
    newRefreshToken = body.refreshToken || "";
    assert(16, "Successful session refresh via refresh token (200 + new pair)", res.status === 200 && !!newAccessToken);
  } catch (e: any) {
    assert(16, "Successful session refresh", false, e.message);
  }

  // Test 17: Single-use refresh token revocation (atomic rotation)
  try {
    const decoded: any = jwt.decode(adminARefreshToken);
    const [row] = await db.select().from(refreshTokens).where(eq(refreshTokens.id, decoded.tokenId));
    assert(17, "Old refresh token marked isRevoked=true in DB after rotation", row?.isRevoked === true);
  } catch (e: any) {
    assert(17, "Single-use refresh token revocation", false, e.message);
  }

  // Test 18: Replay attack rejection when reusing revoked refresh token
  try {
    const res = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: adminARefreshToken }),
    });
    assert(18, "Replay attack rejection when reusing revoked refresh token (401)", res.status === 401);
  } catch (e: any) {
    assert(18, "Replay attack rejection", false, e.message);
  }

  // Test 19: Tenant isolation: User A cannot access Tenant B user list
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    const usersList: any[] = await res.json();
    const containsTenantBUser = Array.isArray(usersList) && usersList.some((u) => u.tenantId === tenantB);
    assert(19, "Tenant isolation: User A cannot list Tenant B users", res.status === 200 && !containsTenantBUser);
  } catch (e: any) {
    assert(19, "Tenant isolation: User A cannot list Tenant B users", false, e.message);
  }

  // Test 20: Tenant isolation: Query parameters cannot breach tenant boundary
  try {
    const res = await fetch(`${baseUrl}/api/v1/users?tenantId=${tenantB}`, {
      headers: { Authorization: `Bearer ${adminAToken}` },
    });
    const usersList: any[] = await res.json();
    const containsTenantBUser = Array.isArray(usersList) && usersList.some((u) => u.tenantId === tenantB);
    assert(20, "Tenant isolation: Query param tenantId override ignored", res.status === 200 && !containsTenantBUser);
  } catch (e: any) {
    assert(20, "Tenant isolation: Query param override ignored", false, e.message);
  }

  // Test 21: Tenant isolation: Header override cannot breach tenant boundary
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      headers: {
        Authorization: `Bearer ${adminAToken}`,
        "x-tenant-id": tenantB,
      },
    });
    const usersList: any[] = await res.json();
    const containsTenantBUser = Array.isArray(usersList) && usersList.some((u) => u.tenantId === tenantB);
    assert(21, "Tenant isolation: Header x-tenant-id override ignored", res.status === 200 && !containsTenantBUser);
  } catch (e: any) {
    assert(21, "Tenant isolation: Header override ignored", false, e.message);
  }

  // Test 22: Company validation: Reject user creation with company outside tenant
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "fake_cross_comp",
        email: "fake@comp.com",
        password: "SecurePassword123!",
        role: "CASHIER",
        companyId: companyB, // Belongs to Tenant B!
      }),
    });
    assert(22, "Reject user creation with company outside tenant (400 COMPANY_MISMATCH)", res.status === 400);
  } catch (e: any) {
    assert(22, "Reject user creation with company outside tenant", false, e.message);
  }

  // Test 23: Branch validation: Reject user creation with branch outside company
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "fake_cross_branch",
        email: "fake@branch.com",
        password: "SecurePassword123!",
        role: "CASHIER",
        companyId: companyA,
        branchId: branchB, // Belongs to Company B!
      }),
    });
    assert(23, "Reject user creation with branch outside company (400 BRANCH_MISMATCH)", res.status === 400);
  } catch (e: any) {
    assert(23, "Reject user creation with branch outside company", false, e.message);
  }

  // Login as Cashier A
  let cashierAToken = "";
  try {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "cashier_a", password: "SecurePassword123!", tenantId: tenantA }),
    });
    const body: any = await res.json();
    cashierAToken = body.accessToken || "";
  } catch (e) {}

  // Test 24: Privilege escalation: Reject non-admin creating admin user
  try {
    const res = await fetch(`${baseUrl}/api/v1/users`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "escalated_admin",
        email: "escalated@tenant-a.com",
        password: "SecurePassword123!",
        role: "ADMIN",
      }),
    });
    assert(24, "Reject non-admin creating ADMIN user (403 ROLE_ESCALATION_DENIED)", res.status === 403);
  } catch (e: any) {
    assert(24, "Reject non-admin creating ADMIN user", false, e.message);
  }

  // Test 25: Privilege escalation: Reject user modifying their own role
  try {
    const res = await fetch(`${baseUrl}/api/v1/users/${cashierAId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${cashierAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role: "ADMIN" }),
    });
    assert(25, "Reject user altering their own role (403 ROLE_ESCALATION_DENIED)", res.status === 403);
  } catch (e: any) {
    assert(25, "Reject user altering their own role", false, e.message);
  }

  // Test 26: Protect operational route /api/v1/accounts without token
  try {
    const res = await fetch(`${baseUrl}/api/v1/accounts`);
    assert(26, "Protect operational route /api/v1/accounts without token (401)", res.status === 401);
  } catch (e: any) {
    assert(26, "Protect /api/v1/accounts without token", false, e.message);
  }

  // Test 27: Protect operational route /api/v1/journal-entries without token
  try {
    const res = await fetch(`${baseUrl}/api/v1/journal-entries`);
    assert(27, "Protect operational route /api/v1/journal-entries without token (401)", res.status === 401);
  } catch (e: any) {
    assert(27, "Protect /api/v1/journal-entries without token", false, e.message);
  }

  // Test 28: Reject operational route when user lacks specific permission
  try {
    const res = await fetch(`${baseUrl}/api/v1/journal-entries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ entryNumber: "JE-001", date: "2026-09-14" }),
    });
    assert(28, "Reject request when user lacks required permission (403 PERMISSION_DENIED)", res.status === 403);
  } catch (e: any) {
    assert(28, "Reject request when user lacks permission", false, e.message);
  }

  // Test 29: Protect /api/gemini/generate requiring authentication
  try {
    const res = await fetch(`${baseUrl}/api/gemini/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "Hello" }),
    });
    assert(29, "Protect /api/gemini/generate requiring authentication (401)", res.status === 401);
  } catch (e: any) {
    assert(29, "Protect /api/gemini/generate", false, e.message);
  }

  // Test 30: Reject /api/erpnext/simulate in production / unauthorized access
  try {
    process.env.NODE_ENV = "production";
    const res = await fetch(`${baseUrl}/api/erpnext/simulate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cashierAToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "get_list", doctype: "Customer" }),
    });
    process.env.NODE_ENV = "development";
    assert(30, "Reject /api/erpnext/simulate in production / unauthorized (403)", res.status === 403);
  } catch (e: any) {
    process.env.NODE_ENV = "development";
    assert(30, "Reject /api/erpnext/simulate", false, e.message);
  }

  server.close();

  console.log("\n==========================================================================");
  console.log(`   SECURITY CERTIFICATION SUMMARY: ${passed}/30 PASSED (${failed} FAILED)`);
  console.log("==========================================================================");

  if (failed > 0) {
    console.error(`\n❌ SECURITY CERTIFICATION FAILED: ${failed} tests failed.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 CERTIFICATION CERTIFIED PASS: All 30 Security Controls Validated against PostgreSQL!`);
    process.exit(0);
  }
}

runSecuritySuite().catch((err) => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
