import { Router, Response } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "../../src/infrastructure/database/client/db";

import { users } from "../../src/infrastructure/database/schema";
import { AuthRequest, authenticateToken, requirePermission, getAuthTenantContext } from "../middleware/authMiddleware";
import { AuthService } from "../services/authService";
import { DrizzleAuditRepository } from "../../src/infrastructure/database/repositories/DrizzleAuditRepository";

export const usersRouter = Router();
const auditRepo = new DrizzleAuditRepository();


usersRouter.use(authenticateToken);

/**
 * GET /api/users
 */
usersRouter.get("/", requirePermission("users:read"), async (req: AuthRequest, res: Response) => {
  try {
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
 * POST /api/users
 */
usersRouter.post("/", requirePermission("users:create"), async (req: AuthRequest, res: Response) => {
  try {
    const tenantCtx = getAuthTenantContext(req);
    const { username, email, password, role, companyId, branchId } = req.body;

    if (!username || !email || !password || !role) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: "Username, email, password, and role are required.", statusCode: 400 } });
      return;
    }

    const passwordHash = await AuthService.hashPassword(password);
    const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(users).values({
      id: newUserId,
      tenantId: tenantCtx.tenantId,
      companyId: companyId || tenantCtx.companyId,
      branchId: branchId || tenantCtx.branchId || null,
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
          id: `audit-${Date.now()}`,
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
      companyId: companyId || tenantCtx.companyId,
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
 * PUT /api/users/:id
 */
usersRouter.put("/:id", requirePermission("users:update"), async (req: AuthRequest, res: Response) => {
  try {
    const tenantCtx = getAuthTenantContext(req);
    const { id } = req.params;
    const { role, status, companyId, branchId, password } = req.body;

    const [existing] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.tenantId, tenantCtx.tenantId)));

    if (!existing) {
      res.status(404).json({ error: { code: "NOT_FOUND", message: "User not found in tenant", statusCode: 404 } });
      return;
    }

    const updateFields: any = {};
    if (role) updateFields.role = role;
    if (status) {
      updateFields.status = status;
      updateFields.isActive = status === "ACTIVE";
    }
    if (companyId) updateFields.companyId = companyId;
    if (branchId) updateFields.branchId = branchId;
    if (password) {
      updateFields.passwordHash = await AuthService.hashPassword(password);
    }
    updateFields.updatedAt = new Date();

    await db.update(users).set(updateFields).where(and(eq(users.id, id), eq(users.tenantId, tenantCtx.tenantId)));

    try {
      await auditRepo.log(
        {
          id: `audit-${Date.now()}`,
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
