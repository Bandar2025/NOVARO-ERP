// NOVARO ERP Domain Model: RBAC Architecture Preparation
// User -> Role -> Permission -> Resource:Action

export type ERPResource =
  | "journal"
  | "inventory"
  | "sales"
  | "purchase"
  | "manufacturing"
  | "customers"
  | "suppliers"
  | "reports"
  | "settings"
  | "audit";

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
  | "export";

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
      "inventory:create", "inventory:read", "inventory:update", "inventory:delete", "inventory:adjust",
      "sales:create", "sales:read", "sales:update", "sales:delete", "sales:approve", "sales:post",
      "purchase:create", "purchase:read", "purchase:update", "purchase:delete", "purchase:approve", "purchase:post",
      "manufacturing:create", "manufacturing:read", "manufacturing:update", "manufacturing:delete", "manufacturing:post",
      "customers:create", "customers:read", "customers:update", "customers:delete",
      "suppliers:create", "suppliers:read", "suppliers:update", "suppliers:delete",
      "reports:read", "reports:export",
      "settings:read", "settings:update",
      "audit:read"
    ]
  },
  CHIEF_ACCOUNTANT: {
    id: "role-accountant",
    name: "Chief Accountant",
    nameAr: "رئيس الحسابات",
    description: "Full accounting control, posting, and period locking",
    permissions: [
      "journal:create", "journal:read", "journal:post", "journal:reverse", "journal:close_period",
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
  }
};

export class RBACGuard {
  static hasPermission(userRole: string, requiredPermission: ERPPermission): boolean {
    const roleKey = Object.keys(StandardRoles).find(
      k => k === userRole || StandardRoles[k].id === userRole || StandardRoles[k].name === userRole
    );
    if (!roleKey) {
      // Fallback for Admin
      if (userRole.toLowerCase().includes("admin")) return true;
      return false;
    }
    return StandardRoles[roleKey].permissions.includes(requiredPermission);
  }
}
