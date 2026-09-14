import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { eq, and } from "drizzle-orm";
import { db, pool, ensureInitialized } from "../../src/infrastructure/database/client/db";

import { users, refreshTokens, userRoles, rolePermissions, permissions, userCompanyAccess } from "../../src/infrastructure/database/schema";
import { AuthenticatedUser, AccessTokenPayload, RefreshTokenPayload, AuthSession } from "../../src/core/domain/auth/AuthToken";
import { ERPPermission, StandardRoles } from "../../src/core/domain/rbac/Permissions";
import { AppError } from "../../src/core/application/errors/ApiError";

export function validateAuthConfig(): { jwtSecret: string; jwtRefreshSecret: string } {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    throw new Error("SECURITY CONFIG ERROR: JWT_SECRET must be defined in environment and be at least 32 characters long.");
  }
  if (!jwtRefreshSecret || jwtRefreshSecret.length < 32) {
    throw new Error("SECURITY CONFIG ERROR: JWT_REFRESH_SECRET must be defined in environment and be at least 32 characters long.");
  }

  return { jwtSecret, jwtRefreshSecret };
}

export class AuthService {
  /**
   * Hash plain text password securely with bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 8) {
      throw new AppError("VALIDATION_ERROR", "Password must be at least 8 characters long", 400);
    }
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify plain text password against hashed password
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }

  /**
   * Resolve complete permissions for a user based on standard roles and custom DB roles
   */
  static async getUserPermissions(userId: string, roleName: string, tenantId: string): Promise<ERPPermission[]> {
    const permSet = new Set<ERPPermission>();

    // 1. Standard Role Permissions from domain
    const roleKey = Object.keys(StandardRoles).find(
      k => k === roleName || StandardRoles[k].id === roleName || StandardRoles[k].name === roleName
    );
    if (roleKey && StandardRoles[roleKey]) {
      StandardRoles[roleKey].permissions.forEach(p => permSet.add(p));
    } else if (roleName === "ADMIN" || roleName === "System Administrator" || roleName.toLowerCase().includes("admin")) {
      StandardRoles.ADMIN.permissions.forEach(p => permSet.add(p));
    }

    // 2. Custom Role Permissions from DB
    try {
      await ensureInitialized();
      const customUserRoles = await db
        .select({ roleId: userRoles.roleId })
        .from(userRoles)
        .where(and(eq(userRoles.userId, userId), eq(userRoles.tenantId, tenantId)));

      for (const ur of customUserRoles) {
        const rpList = await db
          .select({ code: permissions.code })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, ur.roleId));

        for (const rp of rpList) {
          permSet.add(rp.code as ERPPermission);
        }
      }
    } catch (e) {
      // Permission lookup fails -> Fail closed
    }

    return Array.from(permSet);
  }

  /**
   * Get allowed company IDs for a user
   */
  static async getUserAllowedCompanies(userId: string, tenantId: string, defaultCompanyId: string): Promise<string[]> {
    const allowed = new Set<string>();
    if (defaultCompanyId) allowed.add(defaultCompanyId);

    try {
      await ensureInitialized();
      const userComps = await db
        .select({ companyId: userCompanyAccess.companyId })
        .from(userCompanyAccess)
        .where(and(eq(userCompanyAccess.userId, userId), eq(userCompanyAccess.tenantId, tenantId)));

      userComps.forEach(uc => allowed.add(uc.companyId));
    } catch (e) {
      // Fail closed
    }

    return Array.from(allowed);
  }

  /**
   * Generate Access and Refresh JWT Tokens with cryptographically secure random identifiers
   */
  static async generateTokens(user: AuthenticatedUser): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const { jwtSecret, jwtRefreshSecret } = validateAuthConfig();
    const accessTokenId = `at_${crypto.randomUUID()}`;
    const refreshTokenId = `rf_${crypto.randomUUID()}`;

    const accessPayload: AccessTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      branchId: user.branchId,
      username: user.username,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      jti: accessTokenId,
    };

    const accessToken = jwt.sign(accessPayload, jwtSecret, { expiresIn: "15m" });

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      tenantId: user.tenantId,
      tokenId: refreshTokenId,
    };

    const refreshToken = jwt.sign(refreshPayload, jwtRefreshSecret, { expiresIn: "7d" });

    // Hash refresh token for secure database storage
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await ensureInitialized();
    await db.insert(refreshTokens).values({
      id: refreshTokenId,
      userId: user.id,
      tenantId: user.tenantId,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60, // 15 minutes in seconds
    };
  }

  /**
   * Verify Access Token and returning AuthenticatedUser
   */
  static verifyAccessToken(token: string): AuthenticatedUser {
    const { jwtSecret } = validateAuthConfig();
    try {
      const decoded = jwt.verify(token, jwtSecret) as AccessTokenPayload;
      return {
        id: decoded.sub,
        tenantId: decoded.tenantId,
        companyId: decoded.companyId,
        branchId: decoded.branchId || null,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        status: "ACTIVE",
        permissions: decoded.permissions || [],
      };
    } catch (err: any) {
      if (err.name === "TokenExpiredError") {
        throw new AppError("TOKEN_EXPIRED", "Access token has expired", 401);
      }
      throw new AppError("INVALID_TOKEN", "Invalid access token", 401);
    }
  }

  /**
   * Verify Refresh Token and Issue New Tokens with Atomic PostgreSQL Rotation
   */
  static async refreshSession(refreshToken: string): Promise<AuthSession> {
    const { jwtRefreshSecret } = validateAuthConfig();
    let decoded: RefreshTokenPayload;
    try {
      decoded = jwt.verify(refreshToken, jwtRefreshSecret) as RefreshTokenPayload;
    } catch (err: any) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Invalid or expired refresh token", 401);
    }

    await ensureInitialized();

    // 1. Check refresh token record in PostgreSQL DB
    const [storedToken] = await db
      .select()
      .from(refreshTokens)
      .where(
        and(
          eq(refreshTokens.id, decoded.tokenId),
          eq(refreshTokens.userId, decoded.sub),
          eq(refreshTokens.tenantId, decoded.tenantId)
        )
      );

    if (!storedToken) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token record not found", 401);
    }

    if (storedToken.isRevoked) {
      throw new AppError("REVOKED_REFRESH_TOKEN", "Refresh token has been revoked or replayed", 401);
    }

    if (new Date() > new Date(storedToken.expiresAt)) {
      throw new AppError("INVALID_REFRESH_TOKEN", "Refresh token has expired", 401);
    }

    // 2. ATOMIC ROTATION IN POSTGRESQL: Atomically revoke old refresh token
    const updateRes = await pool.query(
      `UPDATE refresh_tokens SET is_revoked = true WHERE id = $1 AND is_revoked = false RETURNING id`,
      [decoded.tokenId]
    );

    if (!updateRes.rows || updateRes.rows.length === 0) {
      // Replay detected
      throw new AppError("REVOKED_REFRESH_TOKEN", "Refresh token has been revoked or replayed", 401);
    }

    // 3. FAIL CLOSED: Look up user in PostgreSQL
    const [userRecord] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, decoded.sub), eq(users.tenantId, decoded.tenantId)));

    if (!userRecord) {
      throw new AppError("UNAUTHORIZED", "User record not found in database. Fail closed.", 401);
    }

    if (!userRecord.isActive || userRecord.status !== "ACTIVE") {
      throw new AppError("ACCOUNT_LOCKED", `User account is inactive or locked (${userRecord.status})`, 403);
    }

    const perms = await this.getUserPermissions(userRecord.id, userRecord.role, userRecord.tenantId);
    const allowedCompanies = await this.getUserAllowedCompanies(userRecord.id, userRecord.tenantId, userRecord.companyId || "");

    const authUser: AuthenticatedUser = {
      id: userRecord.id,
      tenantId: userRecord.tenantId,
      companyId: userRecord.companyId || "",
      branchId: userRecord.branchId,
      username: userRecord.username,
      email: userRecord.email,
      role: userRecord.role,
      status: userRecord.status as any,
      permissions: perms,
      allowedCompanies,
    };

    const tokens = await this.generateTokens(authUser);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: authUser,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Revoke refresh token in PostgreSQL
   */
  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    const { jwtRefreshSecret } = validateAuthConfig();
    try {
      const decoded = jwt.verify(refreshToken, jwtRefreshSecret) as RefreshTokenPayload;
      await ensureInitialized();
      await db
        .update(refreshTokens)
        .set({ isRevoked: true })
        .where(eq(refreshTokens.id, decoded.tokenId));
    } catch (e) {
      // Ignore token decoding error on logout
    }
  }
}
