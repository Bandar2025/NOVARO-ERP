import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../src/infrastructure/database/client/db";

import { users, tenants, companies, branches } from "../../src/infrastructure/database/schema";
import { AuthService } from "../services/authService";
import { AuthRequest, authenticateToken } from "../middleware/authMiddleware";
import { AuthenticatedUser } from "../../src/core/domain/auth/AuthToken";
import { DrizzleAuditRepository } from "../../src/infrastructure/database/repositories/DrizzleAuditRepository";

export const authRouter = Router();
const auditRepo = new DrizzleAuditRepository();


/**
 * POST /api/auth/login
 * Production Login with password verification & security auditing
 */
authRouter.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, tenantId } = req.body;

    const identifier = email || username;
    if (!identifier || !password) {
      res.status(400).json({
        error: { code: "INVALID_INPUT", message: "Username/Email and password are required.", statusCode: 400 },
      });
      return;
    }

    // Find user record in DB
    let query = db.select().from(users);
    let userRecord: any;

    if (tenantId) {
      const records = await query.where(
        and(
          eq(users.tenantId, tenantId),
          email ? eq(users.email, email) : eq(users.username, username)
        )
      );
      userRecord = records[0];
    } else {
      const records = await query.where(
        email ? eq(users.email, email) : eq(users.username, username)
      );
      userRecord = records[0];
    }

    if (!userRecord) {
      res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials or account does not exist.", statusCode: 401 },
      });
      return;
    }

    // Check account active status
    if (!userRecord.isActive || userRecord.status !== "ACTIVE") {
      res.status(403).json({
        error: { code: "ACCOUNT_LOCKED", message: `Account is inactive or status is ${userRecord.status}.`, statusCode: 403 },
      });
      return;
    }

    // Password verification
    let isPasswordValid = false;
    if (userRecord.passwordHash) {
      isPasswordValid = await AuthService.comparePassword(password, userRecord.passwordHash);
    } else if (password === "Admin@123456" || password === "admin" || password === "password") {
      // Temporary initial setup fallback for unhashed seed user: automatically upgrade password to hash
      isPasswordValid = true;
      const newHash = await AuthService.hashPassword(password);
      await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userRecord.id));
    }

    if (!isPasswordValid) {
      // Increment failed attempts
      const attempts = (userRecord.failedLoginAttempts || 0) + 1;
      const newStatus = attempts >= 5 ? "LOCKED" : userRecord.status;
      await db.update(users).set({ failedLoginAttempts: attempts, status: newStatus }).where(eq(users.id, userRecord.id));

      // Audit failed login
      try {
        await auditRepo.log(
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: userRecord.id,
            username: userRecord.username,
            action: "AUTH_LOGIN_FAILED",
            details: `Failed login attempt ${attempts} from ${req.ip}`,
            reason: "Incorrect Password",
          },
          { tenantId: userRecord.tenantId, companyId: userRecord.companyId || "company-main" }
        );
      } catch (e) {}


      res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials.", statusCode: 401 },
      });
      return;
    }

    // Reset failed attempts & update last login time
    await db.update(users).set({ failedLoginAttempts: 0, lastLoginAt: new Date() }).where(eq(users.id, userRecord.id));

    // Fetch user permissions and allowed companies
    const perms = await AuthService.getUserPermissions(userRecord.id, userRecord.role, userRecord.tenantId);
    const allowedCompanies = await AuthService.getUserAllowedCompanies(userRecord.id, userRecord.tenantId, userRecord.companyId || "");

    const authUser: AuthenticatedUser = {
      id: userRecord.id,
      tenantId: userRecord.tenantId,
      companyId: userRecord.companyId || "",
      branchId: userRecord.branchId,
      username: userRecord.username,
      email: userRecord.email,
      role: userRecord.role,
      status: "ACTIVE",
      permissions: perms,
      allowedCompanies,
    };

    const tokens = await AuthService.generateTokens(authUser);

    // Audit login success
    try {
      await auditRepo.log(
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: authUser.id,
          username: authUser.username,
          action: "AUTH_LOGIN_SUCCESS",
          details: `Successful login for user ${authUser.username} (${authUser.role})`,
        },
        { tenantId: authUser.tenantId, companyId: authUser.companyId || "company-main" }
      );
    } catch (e) {}


    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
      user: authUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/auth/refresh
 */
authRouter.post("/refresh", async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: { code: "MISSING_TOKEN", message: "Refresh token is required.", statusCode: 400 } });
      return;
    }

    const session = await AuthService.refreshSession(refreshToken);
    res.json(session);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({
      error: { code: err.errorCode || "UNAUTHORIZED", message: err.message, statusCode: err.statusCode || 401 },
    });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post("/logout", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthService.revokeRefreshToken(refreshToken);
    }

    if (req.user) {
      try {
        await auditRepo.log(
          {
            id: `audit-${Date.now()}`,
            timestamp: new Date().toISOString(),
            userId: req.user.id,
            username: req.user.username,
            action: "AUTH_LOGOUT",
            details: `User ${req.user.username} logged out`,
          },
          { tenantId: req.user.tenantId, companyId: req.user.companyId || "company-main" }
        );
      } catch (e) {}
    }


    res.json({ success: true, message: "Logged out successfully" });
  } catch (err: any) {
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: err.message, statusCode: 500 } });
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get("/me", authenticateToken, async (req: AuthRequest, res: Response) => {
  res.json({ user: req.user });
});

/**
 * POST /api/auth/seed-admin
 * Seed initial tenant, company, branch, and admin user for first boot
 */
authRouter.post("/seed-admin", async (req: AuthRequest, res: Response) => {
  try {
    const defaultTenantId = "tenant-main";
    const defaultCompanyId = "company-main";
    const defaultBranchId = "branch-main";

    await db.insert(tenants).values({
      id: defaultTenantId,
      code: "NOVARO-HQ",
      name: "Novaro Global Tenant",
    }).onConflictDoNothing();

    await db.insert(companies).values({
      id: defaultCompanyId,
      tenantId: defaultTenantId,
      name: "Novaro Enterprise Ltd",
      currency: "SAR",
    }).onConflictDoNothing();

    await db.insert(branches).values({
      id: defaultBranchId,
      tenantId: defaultTenantId,
      companyId: defaultCompanyId,
      code: "BR-HQ",
      name: "Riyadh HQ Branch",
    }).onConflictDoNothing();

    const adminPasswordHash = await AuthService.hashPassword("Admin@123456");

    await db.insert(users).values({
      id: "usr-admin-001",
      tenantId: defaultTenantId,
      companyId: defaultCompanyId,
      branchId: defaultBranchId,
      username: "admin",
      email: "admin@novaro.erp",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
      isActive: true,
    }).onConflictDoNothing();

    res.json({ success: true, message: "Initial Admin user seeded successfully. Username: admin, Password: Admin@123456" });
  } catch (err: any) {
    res.status(500).json({ error: { code: "SEED_FAILED", message: err.message, statusCode: 500 } });
  }
});
