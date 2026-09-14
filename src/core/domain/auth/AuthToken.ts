import { ERPPermission } from "../rbac/Permissions";

export interface AuthenticatedUser {
  id: string;
  tenantId: string;
  companyId: string;
  branchId?: string | null;
  username: string;
  email: string;
  role: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "LOCKED";
  permissions: ERPPermission[];
  allowedCompanies?: string[];
}

export interface AccessTokenPayload {
  sub: string; // userId
  tenantId: string;
  companyId: string;
  branchId?: string | null;
  username: string;
  email: string;
  role: string;
  permissions: ERPPermission[];
  jti?: string;
  iat?: number;
  exp?: number;
}


export interface RefreshTokenPayload {
  sub: string; // userId
  tenantId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
  expiresIn: number;
}
