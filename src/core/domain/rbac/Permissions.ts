// NOVARO ERP Domain Model: RBAC Architecture Preparation
// User -> Role -> Permission -> Resource:Action

export type ERPResource =
  | "journal"
  | "inventory"
  | "sales"
  | "purchase"
  | "purchases"
  | "manufacturing"
  | "customers"
  | "suppliers"
  | "reports"
  | "settings"
  | "audit"
  | "users"
  | "roles"
  | "accounts"
  | "system";

export type ERPAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "post"
  | "reverse"
  | "approve"
  | "adjust"
  | "close_period"
  | "export"
  | "assign"
  | "admin";

export type ERPPermission = `${ERPResource}:${ERPAction}`;

export interface ERPRole {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  permissions: ERPPermission[];
}

export const StandardRoles: Record<string, ERPRole> = {
  ADMIN: {
    id: "role-admin",
    name: "System Administrator",
    nameAr: "مدير النظام العام",
    description: "Full unconstrained administrative privileges across all modules",
    permissions: [
      "journal:create", "journal:read", "journal:update", "journal:delete", "journal:post", "journal:reverse", "journal:close_period",
      "accounts:create", "accounts:read", "accounts:update", "accounts:delete",
      "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "inventory:adjust",
      "sales:create", "sales:read", "sales:update", "sales:delete", "sales:approve", "sales:post",
      "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "purchase:post",
      "manufacturing:create", "manufacturing:read", "manufacturing:update", "manufacturing:delete", "manufacturing:post",
      "customers:create", "customers:read", "customers:update", "customers:delete",
      "suppliers:create", "suppliers:read", "suppliers:update", "suppliers:delete",
      "reports:read", "reports:export",
      "settings:read", "settings:update",
      "audit:read",
      "users:create", "users:read", "users:update", "users:delete", "users:assign",
      "roles:create", "roles:read", "roles:update", "roles:delete", "roles:assign",
      "system:admin"
    ]
  },
  CHIEF_ACCOUNTANT: {
    id: "role-accountant",
    name: "Chief Accountant",
    nameAr: "رئيس الحسابات",
    description: "Full accounting control, posting, and period locking",
    permissions: [
      "journal:create", "journal:read", "journal:post", "journal:reverse", "journal:close_period",
      "accounts:create", "accounts:read", "accounts:update",
      "inventory:read", "inventory:adjust",
      "sales:read", "sales:post",
      "purchase:read", "purchase:post",
      "manufacturing:read",
      "customers:read", "customers:update",
      "suppliers:read", "suppliers:update",
      "reports:read", "reports:export",
      "audit:read"
    ]
  },
  INVENTORY_MANAGER: {
    id: "role-warehouse",
    name: "Warehouse & Inventory Controller",
    nameAr: "مسؤول المستودعات والمخزون",
    description: "Stock management, adjustments, and receipts",
    permissions: [
      "inventory:create", "inventory:read", "inventory:update", "inventory:adjust",
      "purchase:read", "purchase:post",
      "manufacturing:read",
      "reports:read"
    ]
  },
  CASHIER: {
    id: "role-cashier",
    name: "Point of Sale Cashier",
    nameAr: "كاشير نقطة بيع",
    description: "Issue retail POS sales tickets and collection receipts",
    permissions: [
      "sales:create", "sales:read", "sales:post",
      "customers:read", "customers:create"
    ]
  },
  AUDITOR: {
    id: "role-auditor",
    name: "Internal Auditor",
    nameAr: "مدقق داخلي",
    description: "Read-only access across all operational and financial records and audit logs",
    permissions: [
      "journal:read", "accounts:read", "inventory:read", "sales:read", "purchase:read", "manufacturing:read",
      "customers:read", "suppliers:read", "reports:read", "reports:export", "audit:read",
      "users:read", "roles:read"
    ]
  }
};

export class RBACGuard {
  static hasPermission(userRole: string, requiredPermission: ERPPermission, customPermissions?: string[]): boolean {
    if (userRole === "ADMIN" || userRole === "System Administrator" || userRole.toLowerCase().includes("admin")) {
      return true;
    }
    if (customPermissions && customPermissions.includes(requiredPermission)) {
      return true;
    }
    const roleKey = Object.keys(StandardRoles).find(
      k => k === userRole || StandardRoles[k].id === userRole || StandardRoles[k].name === userRole
    );
    if (!roleKey) return false;
    return StandardRoles[roleKey].permissions.includes(requiredPermission);
  }
}
