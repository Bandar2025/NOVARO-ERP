import { Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db, ensureInitialized } from "../../src/infrastructure/database/client/db";
import { users } from "../../src/infrastructure/database/schema";
import { AuthService } from "../services/authService";
import { AuthenticatedUser } from "../../src/core/domain/auth/AuthToken";
import { ERPPermission, RBACGuard } from "../../src/core/domain/rbac/Permissions";
import { TenantContext } from "../../src/core/domain/tenancy/TenantContext";
import { AppError } from "../../src/core/application/errors/ApiError";

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  tenantContext?: TenantContext;
}

/**
 * Global Authentication Middleware with DB User Verification
 * Validates JWT access token from Authorization header (Bearer format) and checks DB record
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers["authorization"] || req.headers["x-access-token"];
    let token: string | undefined;

    if (authHeader && typeof authHeader === "string") {
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7).trim();
      } else {
        res.status(401).json({
          error: { code: "UNAUTHORIZED", message: "Authorization header must use Bearer scheme.", statusCode: 401 },
        });
        return;
      }
    } else if ((req as any).cookies && (req as any).cookies.access_token) {
      token = (req as any).cookies.access_token;
    }

    if (!token) {
      res.status(401).json({
        error: { code: "MISSING_TOKEN", message: "Authentication token is required. Access denied.", statusCode: 401 },
      });
      return;
    }

    const decodedUser = AuthService.verifyAccessToken(token);

    // Fail-closed DB verification: Ensure user exists and is ACTIVE
    await ensureInitialized();
    const [userRecord] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, decodedUser.id), eq(users.tenantId, decodedUser.tenantId)));

    if (!userRecord || !userRecord.isActive || userRecord.status !== "ACTIVE") {
      res.status(401).json({
        error: { code: "UNAUTHORIZED", message: "User account not found or inactive. Fail closed.", statusCode: 401 },
      });
      return;
    }

    req.user = {
      ...decodedUser,
      role: userRecord.role,
      status: userRecord.status as any,
    };

    req.tenantContext = {
      tenantId: userRecord.tenantId,
      companyId: userRecord.companyId || decodedUser.companyId,
      branchId: userRecord.branchId || undefined,
    };

    next();
  } catch (err: any) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code || "UNAUTHORIZED",
          message: err.message,
          statusCode: err.statusCode,
        },
      });
      return;
    }

    res.status(401).json({
      error: {
        code: "UNAUTHORIZED",
        message: err.message || "Invalid or expired token",
        statusCode: 401,
      },
    });
  }
}

/**
 * Derive strictly server-verified TenantContext from AuthRequest.
 * IGNORES any client-provided tenantId, companyId, or branchId in query/body/headers.
 */
export function getAuthTenantContext(req: AuthRequest): TenantContext {
  if (!req.user || !req.tenantContext) {
    throw new AppError("UNAUTHORIZED", "Unauthenticated tenant context request", 401);
  }

  return {
    tenantId: req.user.tenantId,
    companyId: req.user.companyId,
    branchId: req.user.branchId || undefined,
  };
}

/**
 * RBAC Permission Guard Middleware
 */
export function requirePermission(permission: ERPPermission) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required to access this resource.",
          statusCode: 401,
        },
      });
      return;
    }

    const hasAccess = RBACGuard.hasPermission(req.user.role, permission, req.user.permissions);

    if (!hasAccess) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Required permission '${permission}' is missing for role '${req.user.role}'.`,
          statusCode: 403,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Role Guard Middleware
 */
export function requireRole(allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
          statusCode: 401,
        },
      });
      return;
    }

    const isMatch = allowedRoles.some(
      r => r === req.user?.role || r.toLowerCase() === req.user?.role.toLowerCase() || (req.user?.role.toLowerCase().includes("admin") && r === "ADMIN")
    );

    if (!isMatch) {
      res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `Access denied. Role '${req.user.role}' is not in allowed roles: [${allowedRoles.join(", ")}].`,
          statusCode: 403,
        },
      });
      return;
    }

    next();
  };
}
