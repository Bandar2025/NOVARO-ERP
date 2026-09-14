import { Router, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../src/infrastructure/database/client/db";

import { roles, permissions, rolePermissions } from "../../src/infrastructure/database/schema";
import { AuthRequest, authenticateToken, requirePermission, getAuthTenantContext } from "../middleware/authMiddleware";
import { StandardRoles } from "../../src/core/domain/rbac/Permissions";

export const rolesRouter = Router();

rolesRouter.use(authenticateToken);

/**
 * GET /api/roles
 */
rolesRouter.get("/", requirePermission("roles:read"), async (req: AuthRequest, res: Response) => {
  try {
    const tenantCtx = getAuthTenantContext(req);

    // 1. Standard Roles
    const systemRoles = Object.values(StandardRoles).map(r => ({
      id: r.id,
      name: r.name,
      code: Object.keys(StandardRoles).find(k => StandardRoles[k].id === r.id) || r.name,
      description: r.description,
      isSystemRole: true,
      permissions: r.permissions,
    }));

    // 2. Custom Roles from DB
    let customRoles: any[] = [];
    try {
      const dbRoles = await db.select().from(roles).where(eq(roles.tenantId, tenantCtx.tenantId));
      for (const dr of dbRoles) {
        const rpList = await db
          .select({ code: permissions.code })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, dr.id));

        customRoles.push({
          id: dr.id,
          name: dr.name,
          code: dr.code,
          description: dr.description,
          isSystemRole: dr.isSystemRole,
          permissions: rpList.map(rp => rp.code),
        });
      }
    } catch (e) {}

    res.json([...systemRoles, ...customRoles]);
  } catch (err: any) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message, statusCode: 500 } });
  }
});

/**
 * POST /api/roles
 */
rolesRouter.post("/", requirePermission("roles:create"), async (req: AuthRequest, res: Response) => {
  try {
    const tenantCtx = getAuthTenantContext(req);
    const { name, code, description, permissionCodes } = req.body;

    if (!name || !code) {
      res.status(400).json({ error: { code: "INVALID_INPUT", message: "Role name and code are required.", statusCode: 400 } });
      return;
    }

    const newRoleId = `role_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(roles).values({
      id: newRoleId,
      tenantId: tenantCtx.tenantId,
      name,
      code,
      description,
      isSystemRole: false,
    });

    if (Array.isArray(permissionCodes)) {
      for (const pCode of permissionCodes) {
        const [perm] = await db.select().from(permissions).where(eq(permissions.code, pCode));
        if (perm) {
          await db.insert(rolePermissions).values({ roleId: newRoleId, permissionId: perm.id }).onConflictDoNothing();
        }
      }
    }

    res.status(201).json({ id: newRoleId, name, code, description, isSystemRole: false, permissions: permissionCodes || [] });
  } catch (err: any) {
    res.status(500).json({ error: { code: "SERVER_ERROR", message: err.message, statusCode: 500 } });
  }
});
