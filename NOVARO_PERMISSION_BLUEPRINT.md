# NOVARO ERP — Permission & RBAC Architecture Blueprint
**Document Ref:** `NOVARO_PERMISSION_BLUEPRINT.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Role-Based Access Control (RBAC) Hierarchy

The target RBAC permission architecture maps users to defined enterprise roles with granular page and action privileges:

```
User (Identity)
 │
 └── Role (e.g. Accountant, Cashier, Warehouse Manager)
      │
      ├── Module Permission (Finance, Inventory, Sales, Purchasing, POS)
      │    │
      │    └── Screen Access (e.g. Journal Entries, Chart of Accounts)
      │         │
      │         └── Action Privilege (View, Create, Edit, Delete, Post, Approve, Export)
```

---

## 2. Defined System Roles & Descriptions

| Role Key | Role Title (Ar / En) | Functional Description | Scope of Authority |
| :--- | :--- | :--- | :--- |
| `Admin` | مدير النظام (System Administrator) | Full system configuration, security rules, backup, resets. | Unrestricted Global Access |
| `Owner` | المالك / الإدارة العليا (Executive Owner) | Operational dashboard, certified reports, high-level approvals. | Full Read + Executive Write |
| `Accountant` | المحاسب المالي (Senior Accountant) | Journal entries, GL accounts, period closing, financial statements. | Finance & Treasury Full |
| `Warehouse Manager`| مدير المستودع (Warehouse Manager) | Item catalog, stock adjustments, transfers, FIFO layers, BOM. | Inventory & Manufacturing Full |
| `Production Manager`| مدير الإنتاج (Production Manager) | Recipe BOM formulas, roasting runs, grinding jobs, packaging line. | Production & Operations Full |
| `Sales` | مسؤول المبيعات (Sales Executive) | B2B sales invoices, wholesale orders, customer directory. | Sales & Customers Write |
| `Purchasing` | مسؤول المشتريات (Purchasing Officer) | Purchase orders, vendor directory, receiving logs. | Purchasing & Suppliers Write |
| `Cashier` | كاشير نقاط البيع (POS Cashier) | POS terminal sales, shift opening/closing, fast tender. | POS Terminal Only |
| `Auditor` | مدقق الحسابات (Financial Auditor) | General ledger inspector, audit logs, financial statements. | Read-Only Audit Access |
| `Viewer` | مستعرض النظام (Read-Only Viewer) | Operational telemetry, reports viewer. | Read-Only Basic Access |

---

## 3. Granular Action Matrix by Role

| Module / Action | Admin / Owner | Accountant | Warehouse Mgr | Sales / POS | Auditor |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Financial Reports** | ✅ | ✅ | ❌ | ❌ | ✅ |
| **Create & Post Journal Entries** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Reverse Journal Entries** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Fiscal Year Closing** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create / Edit Item Catalog** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Post Stock Adjustments** | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Issue Sales Invoices** | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Operate POS Terminal** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Configure System & Tax** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Export System Backups** | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 4. Required Permission Checks (Phase 3 Engine)

In Phase 3, server API routes and UI action buttons will enforce `checkUserPermission`:

```typescript
// Core Permission Check Contract
export interface PermissionRule {
  role: UserRole;
  module: "accounting" | "inventory" | "sales" | "purchases" | "pos" | "reports" | "settings";
  screen: string;
  action: "view" | "create" | "edit" | "delete" | "post" | "approve" | "reverse" | "export";
}
```
