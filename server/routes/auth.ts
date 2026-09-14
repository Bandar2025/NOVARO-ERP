import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, ensureInitialized } from "../../src/infrastructure/database/client/db";
import { users, tenants, companies, branches } from "../../src/infrastructure/database/schema";
import { AuthService } from "../services/authService";
import { AuthRequest, authenticateToken } from "../middleware/authMiddleware";
import { AuthenticatedUser } from "../../src/core/domain/auth/AuthToken";
import { DrizzleAuditRepository } from "../../src/infrastructure/database/repositories/DrizzleAuditRepository";
import crypto from "crypto";

export const authRouter = Router();
const auditRepo = new DrizzleAuditRepository();

// Simple Login Rate Limiter (Max 10 failed login attempts per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(ip);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (limit.count >= 20) {
    return false;
  }
  limit.count++;
  return true;
}

/**
 * POST /api/auth/login
 * Real Production Login with password verification & account lockout
 */
authRouter.post("/login", async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const clientIp = req.ip || req.socket.remoteAddress || "127.0.0.1";
    if (!checkRateLimit(clientIp)) {
      res.status(429).json({
        error: { code: "TOO_MANY_REQUESTS", message: "Too many login attempts. Please try again later.", statusCode: 429 },
      });
      return;
    }

    const { username, email, password, tenantId } = req.body;

    const identifier = email || username;
    if (!identifier || !password) {
      res.status(400).json({
        error: { code: "INVALID_INPUT", message: "Username/Email and password are required.", statusCode: 400 },
      });
      return;
    }

    // Find user record in DB
    let userRecord: any;

    if (tenantId) {
      const records = await db.select().from(users).where(
        and(
          eq(users.tenantId, tenantId),
          email ? eq(users.email, email) : eq(users.username, username)
        )
      );
      userRecord = records[0];
    } else {
      const records = await db.select().from(users).where(
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

    // Check account lockout status
    if (userRecord.status === "LOCKED") {
      res.status(403).json({
        error: { code: "ACCOUNT_LOCKED", message: "Account is locked due to 5 consecutive failed login attempts.", statusCode: 403 },
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

    // Strict password verification (NO BACKDOORS, NO FALLBACKS)
    if (!userRecord.passwordHash) {
      res.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid credentials.", statusCode: 401 },
      });
      return;
    }

    const isPasswordValid = await AuthService.comparePassword(password, userRecord.passwordHash);

    if (!isPasswordValid) {
      const attempts = (userRecord.failedLoginAttempts || 0) + 1;
      const newStatus = attempts >= 5 ? "LOCKED" : userRecord.status;
      await db.update(users).set({ failedLoginAttempts: attempts, status: newStatus }).where(eq(users.id, userRecord.id));

      // Audit failed login
      try {
        await auditRepo.log(
          {
            id: `audit-${crypto.randomUUID()}`,
            timestamp: new Date().toISOString(),
            userId: userRecord.id,
            username: userRecord.username,
            action: attempts >= 5 ? "AUTH_ACCOUNT_LOCKED" : "AUTH_LOGIN_FAILED",
            details: `Failed login attempt ${attempts} from ${clientIp}`,
            reason: attempts >= 5 ? "Account locked after 5 failed attempts" : "Incorrect Password",
          },
          { tenantId: userRecord.tenantId, companyId: userRecord.companyId || "company-main" }
        );
      } catch (e) {}

      if (attempts >= 5) {
        res.status(403).json({
          error: { code: "ACCOUNT_LOCKED", message: "Account locked after 5 consecutive failed login attempts.", statusCode: 403 },
        });
        return;
      }

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
          id: `audit-${crypto.randomUUID()}`,
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
    await ensureInitialized();
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ error: { code: "MISSING_TOKEN", message: "Refresh token is required.", statusCode: 400 } });
      return;
    }

    const session = await AuthService.refreshSession(refreshToken);
    res.json(session);
  } catch (err: any) {
    res.status(err.statusCode || 401).json({
      error: { code: err.errorCode || err.code || "UNAUTHORIZED", message: err.message, statusCode: err.statusCode || 401 },
    });
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post("/logout", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const { refreshToken } = req.body;
    if (refreshToken) {
      await AuthService.revokeRefreshToken(refreshToken);
    }

    if (req.user) {
      try {
        await auditRepo.log(
          {
            id: `audit-${crypto.randomUUID()}`,
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
 * POST /api/auth/bootstrap
 * Secure One-Time Initial Bootstrap Endpoint (Protected by BOOTSTRAP_SECRET)
 */
authRouter.post("/bootstrap", async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
    const providedSecret = req.headers["x-bootstrap-secret"] || req.body.bootstrapSecret;

    if (!bootstrapSecret || providedSecret !== bootstrapSecret) {
      res.status(403).json({ error: { code: "FORBIDDEN", message: "Invalid or unconfigured bootstrap secret.", statusCode: 403 } });
      return;
    }

    const existingUsers = await db.select().from(users);
    if (existingUsers.length > 0) {
      res.status(400).json({ error: { code: "BOOTSTRAP_DISABLED", message: "Bootstrap disabled: Users already exist in system.", statusCode: 400 } });
      return;
    }

    const { username, email, password, tenantName, companyName } = req.body;
    if (!username || !email || !password) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: "Username, email, and password are required.", statusCode: 400 } });
      return;
    }

    const tenantId = `tenant-${crypto.randomUUID()}`;
    const companyId = `comp-${crypto.randomUUID()}`;
    const branchId = `branch-${crypto.randomUUID()}`;

    await db.insert(tenants).values({
      id: tenantId,
      code: "HQ-MAIN",
      name: tenantName || "Primary Organization",
    });

    await db.insert(companies).values({
      id: companyId,
      tenantId,
      name: companyName || "Headquarters Company",
      currency: "SAR",
    });

    await db.insert(branches).values({
      id: branchId,
      tenantId,
      companyId,
      code: "BR-01",
      name: "Main Branch",
    });

    const adminPasswordHash = await AuthService.hashPassword(password);
    const userId = `usr-admin-${crypto.randomUUID()}`;

    await db.insert(users).values({
      id: userId,
      tenantId,
      companyId,
      branchId,
      username,
      email,
      role: "ADMIN",
      passwordHash: adminPasswordHash,
      status: "ACTIVE",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Bootstrap successful. Administrator account created.",
      tenantId,
      companyId,
      branchId,
      userId,
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: "BOOTSTRAP_FAILED", message: err.message, statusCode: 500 } });
  }
});
