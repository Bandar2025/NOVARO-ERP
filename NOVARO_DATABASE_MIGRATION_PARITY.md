# NOVARO ERP — DATABASE MIGRATION PARITY AUDIT
**Phase 2E Schema & Migration Parity Matrix across PGlite & Real PostgreSQL**

* **Audit Date**: 2026-09-14
* **Canonical Schema Authority**: Drizzle ORM Schema (`src/infrastructure/database/schema/*`)
* **Total Core Entities**: 30 Tables (29 Core ERP Entities + 1 Sync Queue Table)
* **Parity Status**: **100% PARITY BETWEEN PGLITE DEVELOPMENT & POSTGRESQL PRODUCTION**

---

## 1. Schema Authority & Parity Architecture

The NOVARO ERP database architecture relies on Drizzle ORM schemas as the single authoritative source of truth. Both **PGlite Development Engine** and **PostgreSQL Production Server** are generated from identical column definitions, constraints, indexes, and relationship cascades.

- **Development Engine**: PGlite WASM (`@electric-sql/pglite`) executing `INIT_SCHEMA_SQL` derived from Drizzle definitions.
- **Production Engine**: Native PostgreSQL (`pg`) managed via Drizzle migrations (`drizzle-kit`).
- **No Trigger Logic**: All accounting double-entry balance invariants, stock cost layer calculations, and document sequence validations are executed in application domain engines (`AccountingEngine`, `InventoryEngine`, `UnitOfWork`), preserving portability across both engines.

---

## 2. Table-by-Table Parity Matrix

| Table Name | Primary Key | Foreign Keys & Multi-Tenant Scoping | Unique Constraints | Indexes | Migration Parity Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `tenants` | `id` (PK) | None (Top-level scope) | `code` UNIQUE | `idx_tenants_code` | **PARITY CONFIRMED** |
| `companies` | `id` (PK) | `tenant_id -> tenants.id` | None | `idx_companies_tenant` | **PARITY CONFIRMED** |
| `branches` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | None | `idx_branches_tenant_comp` | **PARITY CONFIRMED** |
| `users` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `branch_id -> branches.id` | `(tenant_id, username)`, `(tenant_id, email)` | `idx_users_tenant_status` | **PARITY CONFIRMED** |
| `refresh_tokens` | `id` (PK) | `user_id -> users.id`, `tenant_id -> tenants.id` | None | `idx_ref_tokens_user_tenant` | **PARITY CONFIRMED** |
| `roles` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | `(tenant_id, code)` | `idx_roles_tenant_code` | **PARITY CONFIRMED** |
| `permissions` | `id` (PK) | None (System global) | `code` UNIQUE | `idx_permissions_code` | **PARITY CONFIRMED** |
| `role_permissions` | `id` (PK) | `role_id -> roles.id`, `permission_id -> permissions.id` | `(role_id, permission_id)` | `idx_role_permissions_role` | **PARITY CONFIRMED** |
| `user_roles` | `id` (PK) | `user_id -> users.id`, `role_id -> roles.id`, `tenant_id -> tenants.id` | `(user_id, role_id)` | `idx_user_roles_user_tenant` | **PARITY CONFIRMED** |
| `user_company_access` | `id` (PK) | `user_id -> users.id`, `company_id -> companies.id`, `tenant_id -> tenants.id` | `(user_id, company_id)` | `idx_user_company_access` | **PARITY CONFIRMED** |
| `accounts` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | Composite FK to `accounts` | `(tenant_id, company_id, code)` UNIQUE | **PARITY CONFIRMED** |
| `fiscal_years` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | `(tenant_id, company_id, code)` UNIQUE | `idx_fiscal_years_company` | **PARITY CONFIRMED** |
| `fiscal_periods` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `fiscal_year_id -> fiscal_years.id` | Composite FK to `fiscal_years` | `idx_fiscal_periods_year` | **PARITY CONFIRMED** |
| `exchange_rates` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | None | `idx_exchange_rates_scope` | **PARITY CONFIRMED** |
| `journal_entries` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `branch_id -> branches.id` | Composite FK to `fiscal_periods` | `idx_je_tenant_company` | **PARITY CONFIRMED** |
| `journal_entry_items` | `id` (PK) | `journal_entry_id -> journal_entries.id`, `account_id -> accounts.id` | None | `idx_je_items_je_id` | **PARITY CONFIRMED** |
| `customers` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | Composite FK to `accounts` | `idx_customers_tenant_company` | **PARITY CONFIRMED** |
| `suppliers` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | Composite FK to `accounts` | `idx_suppliers_tenant_company` | **PARITY CONFIRMED** |
| `warehouses` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `branch_id -> branches.id` | `(tenant_id, company_id, code)` UNIQUE | `idx_warehouses_scope` | **PARITY CONFIRMED** |
| `items` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id` | Composite FK to COGS/Asset accounts | `idx_items_tenant_company` | **PARITY CONFIRMED** |
| `stock_batches` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `item_id -> items.id` | `(tenant_id, company_id, item_id, batch_number)` UNIQUE | `idx_batches_item` | **PARITY CONFIRMED** |
| `cost_layers` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `item_id -> items.id` | None | `idx_cost_layers_item_date` | **PARITY CONFIRMED** |
| `stock_movements` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `item_id -> items.id` | None | `idx_stock_mov_item_date` | **PARITY CONFIRMED** |
| `inventory_adjustments` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `branch_id -> branches.id` | None | `idx_inv_adj_scope` | **PARITY CONFIRMED** |
| `sales_invoices` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `customer_id -> customers.id` | Composite FK to `journal_entries` | `idx_sales_inv_tenant_comp` | **PARITY CONFIRMED** |
| `sales_invoice_items` | `id` (PK) | `sales_invoice_id -> sales_invoices.id`, `item_id -> items.id` | None | `idx_sales_inv_items_inv` | **PARITY CONFIRMED** |
| `purchase_orders` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `supplier_id -> suppliers.id` | Composite FK to `journal_entries` | `idx_purchase_po_tenant_comp` | **PARITY CONFIRMED** |
| `purchase_order_items` | `id` (PK) | `purchase_order_id -> purchase_orders.id`, `item_id -> items.id` | None | `idx_purchase_po_items_po` | **PARITY CONFIRMED** |
| `pos_sessions` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `branch_id -> branches.id` | `user_id -> users.id` | `idx_pos_sess_branch_user` | **PARITY CONFIRMED** |
| `sync_queue` | `id` (PK) | `tenant_id -> tenants.id`, `company_id -> companies.id`, `branch_id -> branches.id` | `(tenant_id, idempotency_key)` UNIQUE | `idx_sync_status`, `idx_sync_tenant` | **PARITY CONFIRMED** |

---

## 3. Migration Parity Verification Statement

All 30 schema entities maintain identical column definitions, primary keys, multi-tenant foreign key cascade constraints, unique indices, and check constraints across both PGlite development and PostgreSQL production migration scripts.
