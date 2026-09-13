# NOVARO ERP — Database Contract Master Matrix
**Document Ref:** `NOVARO_DATABASE_CONTRACT_MATRIX.md`  
**Phase:** 2A.6-R.1 — Final Database Contract Integrity Check (Pre-PostgreSQL Final Gate)  

---

## Complete Entity Contract Matrix (32 Entities Reviewed)

- **Phase 2B Core Entities In-Scope**: 29 Entities (including `recipes` BOM Header and `recipe_materials` BOM Material Lines)
- **Deferred / Extension Entities**: 3 Entities (`cost_centers`, `roasting_jobs`, `grinding_jobs`)
- **Total Reviewed Entities**: 32 Entities

| # | Entity Name | Classification | Owner Domain | tenant_id | company_id | branch_id | Official Source of Truth | Mutable | Delete Policy | Audit Log | Target Phase |
|---| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :---: | :---: |
| 1 | `tenants` | CONFIGURATION | Admin / Core | **YES** | N/A | N/A | Primary Tenant Registry | YES | Soft Delete | YES | Phase 2B |
| 2 | `companies` | CONFIGURATION | Admin / Core | **YES** | **YES** | N/A | Legal Company Registry | YES | Soft Delete | YES | Phase 2B |
| 3 | `branches` | CONFIGURATION | Admin / Core | **YES** | **YES** | **YES** | Branch Registry | YES | Soft Delete | YES | Phase 2B |
| 4 | `accounts` | MASTER | Accounting | **YES** | **YES** | N/A | Chart of Accounts Tree Structure | YES | Soft Delete | YES | Phase 2B |
| 5 | `fiscal_years` | REFERENCE | Accounting | **YES** | **YES** | N/A | Fiscal Year Registry | YES | Soft Delete | YES | Phase 2B |
| 6 | `fiscal_periods` | REFERENCE | Accounting | **YES** | **YES** | N/A | Period State (`OPEN`/`CLOSED`) | YES | Block Delete | YES | Phase 2B |
| 7 | `journal_entries` | FINANCIAL LEDGER| Accounting | **YES** | **YES** | **YES** | Double-Entry General Ledger Header | NO (if Posted) | Immutable | YES | Phase 2B |
| 8 | `journal_entry_items` | FINANCIAL LEDGER| Accounting | **YES** | **YES** | **YES** | GL Debit / Credit Lines | NO (if Posted) | Immutable | YES | Phase 2B |
| 9 | `exchange_rates` | REFERENCE | Accounting | **YES** | **YES** | N/A | Daily FX Exchange Matrix | YES | Soft Delete | YES | Phase 2B |
| 10 | `customers` | MASTER | Commercial | **YES** | **YES** | Optional | Customer Master Directory | YES | Soft Delete | YES | Phase 2B |
| 11 | `customer_movements`| FINANCIAL LEDGER| Commercial | **YES** | **YES** | **YES** | Customer AR Sub-Ledger | NO | Immutable | YES | Phase 2B |
| 12 | `suppliers` | MASTER | Procurement | **YES** | **YES** | Optional | Vendor Master Directory | YES | Soft Delete | YES | Phase 2B |
| 13 | `supplier_movements`| FINANCIAL LEDGER| Procurement | **YES** | **YES** | **YES** | Supplier AP Sub-Ledger | NO | Immutable | YES | Phase 2B |
| 14 | `sales_invoices` | TRANSACTION | Commercial | **YES** | **YES** | **YES** | Sales Invoicing Header | NO (if Posted) | Immutable | YES | Phase 2B |
| 15 | `sales_invoice_items`| TRANSACTION | Commercial | **YES** | **YES** | **YES** | Sales Line Items & Actual COGS | NO (if Posted) | Cascade (Draft) | YES | Phase 2B |
| 16 | `items` | MASTER | Inventory | **YES** | **YES** | Optional | Master SKU & Item Catalog | YES | Soft Delete | YES | Phase 2B |
| 17 | `warehouses` | MASTER | Inventory | **YES** | **YES** | **YES** | Physical Storage Locations | YES | Soft Delete | YES | Phase 2B |
| 18 | `stock_batches` | MASTER | Inventory | **YES** | **YES** | **YES** | Batch & Expiry Date Registry | YES | Soft Delete | YES | Phase 2B |
| 19 | `cost_layers` | INVENTORY LEDGER | Inventory | **YES** | **YES** | **YES** | FIFO Unit Cost & Remaining Qty | NO | Immutable | YES | Phase 2B |
| 20 | `stock_movements` | INVENTORY LEDGER | Inventory | **YES** | **YES** | **YES** | Stock In/Out Transaction Audit | NO | Immutable | YES | Phase 2B |
| 21 | `inventory_adjustments`| TRANSACTION | Inventory | **YES** | **YES** | **YES** | Physical Count Variance Header | NO (if Posted) | Immutable | YES | Phase 2B |
| 22 | `purchase_orders` | TRANSACTION | Procurement | **YES** | **YES** | **YES** | Purchase Order Header | YES (if Draft) | Soft Delete | YES | Phase 2B |
| 23 | `purchase_order_items`| TRANSACTION | Procurement | **YES** | **YES** | **YES** | Purchase Order Line Items | YES (if Draft) | Cascade (Draft) | YES | Phase 2B |
| 24 | `pos_sessions` | TRANSACTION | Point of Sale | **YES** | **YES** | **YES** | Cashier Shift Open/Close Log | NO (if Closed) | Immutable | YES | Phase 2B |
| 25 | `cashbox_transactions`| TRANSACTION | Treasury | **YES** | **YES** | **YES** | Safe Inflow/Outflow Vouchers | NO (if Posted) | Immutable | YES | Phase 2B |
| 26 | `recipes` | MASTER | Manufacturing | **YES** | **YES** | Optional | Production BOM Formula Header | YES | Soft Delete | YES | Phase 2B |
| 27 | `recipe_materials` | MASTER | Manufacturing | **YES** | **YES** | Optional | BOM Raw Material Composition | YES | Cascade | YES | Phase 2B |
| 28 | `users` | CONFIGURATION | Admin / Core | **YES** | Optional | Optional | User Security Credentials | YES | Soft Delete | YES | Phase 2B |
| 29 | `audit_logs` | AUDIT | Admin / Core | **YES** | **YES** | **YES** | Enterprise Security & Audit Log | NO | Immutable | Append-Only| Phase 2B |
| 30 | `cost_centers` | CONFIGURATION | Accounting | **YES** | **YES** | **YES** | Cost Center Hierarchy Tree | YES | Soft Delete | YES | Deferred |
| 31 | `roasting_jobs` | TRANSACTION | Industry Ext. | **YES** | **YES** | **YES** | Coffee Kiln Batch Execution Log | NO (if Posted) | Immutable | YES | Deferred |
| 32 | `grinding_jobs` | TRANSACTION | Industry Ext. | **YES** | **YES** | **YES** | Milling Execution Log | NO (if Posted) | Immutable | YES | Deferred |

---

## Derived Field & Projection Map

All cached projection fields are updated by Application Services upon transaction posting. Database triggers are prohibited from performing business logic calculations.

| Entity | Derived Column | Authoritative Source of Truth | Recalculation Engine |
| :--- | :--- | :--- | :--- |
| `accounts` | `balance` | Sum of posted `journal_entry_items` lines | `AccountingEngine` |
| `customers` | `balance` | `customer_movements` ledger | `CustomerLedgerCalculator` |
| `suppliers` | `balance` | `supplier_movements` ledger | `SupplierLedgerCalculator` |
| `items` | `current_stock` | Unconsumed `cost_layers` remaining quantity | `InventoryEngine` |
