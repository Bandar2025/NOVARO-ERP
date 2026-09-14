import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, ensureInitialized } from "../../src/infrastructure/database/client/db";
import { users, companies, branches } from "../../src/infrastructure/database/schema";
import { AuthRequest, authenticateToken, requirePermission, getAuthTenantContext } from "../middleware/authMiddleware";
import { AuthService } from "../services/authService";
import { DrizzleAuditRepository } from "../../src/infrastructure/database/repositories/DrizzleAuditRepository";
import crypto from "crypto";

export const usersRouter = Router();
const auditRepo = new DrizzleAuditRepository();

usersRouter.use(authenticateToken);

/**
 * GET /api/v1/users
 */
usersRouter.get("/", requirePermission("users:read"), async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const tenantCtx = getAuthTenantContext(req);
    const userList = await db
      .select({
        id: users.id,
        tenantId: users.tenantId,
        companyId: users.companyId,
        branchId: users.branchId,
        username: users.username,
        email: users.email,
        role: users.role,
        status: users.status,
        failedLoginAttempts: users.failedLoginAttempts,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.tenantId, tenantCtx.tenantId));

    res.json(userList);
  } catch (err: any) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/users
 * User Creation with Company/Branch validation & Privilege Escalation Prevention
 */
usersRouter.post("/", requirePermission("users:create"), async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const tenantCtx = getAuthTenantContext(req);
    const { username, email, password, role, companyId, branchId } = req.body;

    if (!username || !email || !password || !role) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: "Username, email, password, and role are required.", statusCode: 400 } });
      return;
    }

    // Role Escalation Prevention: Non-ADMIN cannot assign ADMIN role
    if (role === "ADMIN" && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: { code: "ROLE_ESCALATION_DENIED", message: "Forbidden: Only Administrators can create ADMIN users.", statusCode: 403 } });
      return;
    }

    const targetCompanyId = companyId || tenantCtx.companyId;
    const targetBranchId = branchId || tenantCtx.branchId || null;

    // Company Validation (Requirement 8)
    if (targetCompanyId) {
      const [comp] = await db.select().from(companies).where(and(eq(companies.id, targetCompanyId), eq(companies.tenantId, tenantCtx.tenantId)));
      if (!comp) {
        res.status(400).json({ error: { code: "COMPANY_MISMATCH", message: "Specified company does not belong to user tenant.", statusCode: 400 } });
        return;
      }
    }

    // Branch Validation (Requirement 8)
    if (targetBranchId && targetCompanyId) {
      const [br] = await db.select().from(branches).where(and(eq(branches.id, targetBranchId), eq(branches.companyId, targetCompanyId), eq(branches.tenantId, tenantCtx.tenantId)));
      if (!br) {
        res.status(400).json({ error: { code: "BRANCH_MISMATCH", message: "Specified branch does not belong to specified company.", statusCode: 400 } });
        return;
      }
    }

    const passwordHash = await AuthService.hashPassword(password);
    const newUserId = `usr_${crypto.randomUUID()}`;

    await db.insert(users).values({
      id: newUserId,
      tenantId: tenantCtx.tenantId,
      companyId: targetCompanyId,
      branchId: targetBranchId,
      username,
      email,
      role,
      passwordHash,
      status: "ACTIVE",
      isActive: true,
    });

    try {
      await auditRepo.log(
        {
          id: `audit-${crypto.randomUUID()}`,
          timestamp: new Date().toISOString(),
          userId: req.user!.id,
          username: req.user!.username,
          action: "USER_CREATED",
          details: `Created new user ${username} (${email}) with role ${role}`,
        },
        tenantCtx
      );
    } catch (e) {}

    res.status(201).json({
      id: newUserId,
      tenantId: tenantCtx.tenantId,
      companyId: targetCompanyId,
      branchId: targetBranchId,
      username,
      email,
      role,
      status: "ACTIVE",
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message, statusCode: 500 } });
  }
});

/**
 * PUT /api/v1/users/:id
 */
usersRouter.put("/:id", requirePermission("users:update"), async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const tenantCtx = getAuthTenantContext(req);
    const { id } = req.params;
    const { role, status, companyId, branchId, password } = req.body;

    // Self Role Escalation Prevention: User cannot elevate own role
    if (id === req.user!.id && role && role !== req.user!.role) {
      res.status(403).json({ error: { code: "ROLE_ESCALATION_DENIED", message: "Forbidden: Users cannot alter their own assigned role.", statusCode: 403 } });
      return;
    }

    // Role Escalation Prevention: Non-ADMIN cannot grant ADMIN role
    if (role === "ADMIN" && req.user!.role !== "ADMIN") {
      res.status(403).json({ error: { code: "ROLE_ESCALATION_DENIED", message: "Forbidden: Only Administrators can grant ADMIN role.", statusCode: 403 } });
      return;
    }

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantCtx.tenantId)));

    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found in tenant", statusCode: 404 } });
      return;
    }

    const targetCompanyId = companyId || existing.companyId;
    const targetBranchId = branchId !== undefined ? branchId : existing.branchId;

    // Company Validation
    if (companyId) {
      const [comp] = await db.select().from(companies).where(and(eq(companies.id, companyId), eq(companies.tenantId, tenantCtx.tenantId)));
      if (!comp) {
        res.status(400).json({ error: { code: "COMPANY_MISMATCH", message: "Specified company does not belong to user tenant.", statusCode: 400 } });
        return;
      }
    }

    // Branch Validation
    if (branchId && targetCompanyId) {
      const [br] = await db.select().from(branches).where(and(eq(branches.id, branchId), eq(branches.companyId, targetCompanyId), eq(branches.tenantId, tenantCtx.tenantId)));
      if (!br) {
        res.status(400).json({ error: { code: "BRANCH_MISMATCH", message: "Specified branch does not belong to specified company.", statusCode: 400 } });
        return;
      }
    }

    const updateFields: any = {};
    if (role) updateFields.role = role;
    if (status) {
      updateFields.status = status;
      updateFields.isActive = status === "ACTIVE";
    }
    if (companyId) updateFields.companyId = companyId;
    if (branchId !== undefined) updateFields.branchId = branchId;
    if (password) {
      updateFields.passwordHash = await AuthService.hashPassword(password);
    }
    updateFields.updatedAt = new Date();

    await db.update(users).set(updateFields).where(and(eq(users.id, id), eq(users.tenantId, tenantCtx.tenantId)));

    try {
      await auditRepo.log(
        {
          id: `audit-${crypto.randomUUID()}`,
          timestamp: new Date().toISOString(),
          userId: req.user!.id,
          username: req.user!.username,
          action: "USER_UPDATED",
          details: `Updated user ${existing.username} (${id})`,
        },
        tenantCtx
      );
    } catch (e) {}

    res.json({ success: true, message: "User updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/v1/users/:id/unlock
 * Administrative Account Unlock
 */
usersRouter.post("/:id/unlock", requirePermission("users:update"), async (req: AuthRequest, res: Response) => {
  try {
    await ensureInitialized();
    const tenantCtx = getAuthTenantContext(req);
    const { id } = req.params;

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantCtx.tenantId)));

    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found in tenant", statusCode: 404 } });
      return;
    }

    await db
      .update(users)
      .set({
        failedLoginAttempts: 0,
        status: "ACTIVE",
        isActive: true,
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, id), eq(users.tenantId, tenantCtx.tenantId)));

    try {
      await auditRepo.log(
        {
          id: `audit-${crypto.randomUUID()}`,
          timestamp: new Date().toISOString(),
          userId: req.user!.id,
          username: req.user!.username,
          action: "USER_UNLOCKED",
          details: `Unlocked user account ${existing.username} (${id})`,
        },
        tenantCtx
      );
    } catch (e) {}

    res.json({ success: true, message: `User ${existing.username} unlocked successfully.` });
  } catch (err: any) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message, statusCode: 500 } });
  }
});
