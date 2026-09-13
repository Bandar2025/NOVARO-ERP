# NOVARO ERP — Database Contract Master Matrix
**Document Ref:** `NOVARO_DATABASE_CONTRACT_MATRIX.md`  
**Phase:** 2A.6 — Database Contract Review & Enterprise Data Architecture  

---

## Complete Entity Contract Matrix (32 Entities Reviewed)

| Entity Name | Classification | Owner Domain | tenant_id | company_id | branch_id | Official Source of Truth | Mutable | Delete Policy | Audit Log | Target Phase |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :---: | :--- | :---: | :---: |
| `tenants` | CONFIGURATION | Admin / Core | **YES** | N/A | N/A | Primary Tenant Registry | YES | Soft Delete | YES | Phase 2B |
| `companies` | CONFIGURATION | Admin / Core | **YES** | **YES** | N/A | Legal Company Registry | YES | Soft Delete | YES | Phase 2B |
| `branches` | CONFIGURATION | Admin / Core | **YES** | **YES** | **YES** | Branch Registry | YES | Soft Delete | YES | Phase 2B |
| `cost_centers` | CONFIGURATION | Accounting | **YES** | **YES** | **YES** | Cost Center Hierarchy Tree | YES | Soft Delete | YES | Phase 2B |
| `accounts` | MASTER | Accounting | **YES** | **YES** | N/A | Chart of Accounts Tree Structure | YES | Soft Delete | YES | Phase 2B |
| `fiscal_years` | REFERENCE | Accounting | **YES** | **YES** | N/A | Fiscal Year Registry | YES | Soft Delete | YES | Phase 2B |
| `fiscal_periods` | REFERENCE | Accounting | **YES** | **YES** | N/A | Period State (`OPEN`/`CLOSED`) | YES | Block Delete | YES | Phase 2B |
| `journal_entries` | FINANCIAL LEDGER| Accounting | **YES** | **YES** | **YES** | Double-Entry General Ledger Header | NO (if Posted) | Immutable | YES | Phase 2B |
| `journal_entry_items` | FINANCIAL LEDGER| Accounting | **YES** | **YES** | **YES** | GL Debit / Credit Lines | NO (if Posted) | Immutable | YES | Phase 2B |
| `exchange_rates` | REFERENCE | Accounting | **YES** | **YES** | N/A | Daily FX Exchange Matrix | YES | Soft Delete | YES | Phase 2B |
| `customers` | MASTER | Commercial | **YES** | **YES** | Optional | Customer Master Directory | YES | Soft Delete | YES | Phase 2B |
| `customer_movements`| FINANCIAL LEDGER| Commercial | **YES** | **YES** | **YES** | Customer AR Sub-Ledger | NO | Immutable | YES | Phase 2B |
| `suppliers` | MASTER | Procurement | **YES** | **YES** | Optional | Vendor Master Directory | YES | Soft Delete | YES | Phase 2B |
| `supplier_movements`| FINANCIAL LEDGER| Procurement | **YES** | **YES** | **YES** | Supplier AP Sub-Ledger | NO | Immutable | YES | Phase 2B |
| `sales_invoices` | TRANSACTION | Commercial | **YES** | **YES** | **YES** | Sales Invoicing Header | NO (if Posted) | Immutable | YES | Phase 2B |
| `sales_invoice_items`| TRANSACTION | Commercial | **YES** | **YES** | **YES** | Sales Line Items & Actual COGS | NO (if Posted) | Cascade (Draft) | YES | Phase 2B |
| `items` | MASTER | Inventory | **YES** | **YES** | Optional | Master SKU & Item Catalog | YES | Soft Delete | YES | Phase 2B |
| `warehouses` | MASTER | Inventory | **YES** | **YES** | **YES** | Physical Storage Locations | YES | Soft Delete | YES | Phase 2B |
| `stock_batches` | MASTER | Inventory | **YES** | **YES** | **YES** | Batch & Expiry Date Registry | YES | Soft Delete | YES | Phase 2B |
| `cost_layers` | INVENTORY LEDGER | Inventory | **YES** | **YES** | **YES** | FIFO Unit Cost & Remaining Qty | NO | Immutable | YES | Phase 2B |
| `stock_movements` | INVENTORY LEDGER | Inventory | **YES** | **YES** | **YES** | Stock In/Out Transaction Audit | NO | Immutable | YES | Phase 2B |
| `inventory_adjustments`| TRANSACTION | Inventory | **YES** | **YES** | **YES** | Physical Count Variance Header | NO (if Posted) | Immutable | YES | Phase 2B |
| `purchase_orders` | TRANSACTION | Procurement | **YES** | **YES** | **YES** | Purchase Order Header | YES (if Draft) | Soft Delete | YES | Phase 2B |
| `purchase_order_items`| TRANSACTION | Procurement | **YES** | **YES** | **YES** | Purchase Order Line Items | YES (if Draft) | Cascade (Draft) | YES | Phase 2B |
| `pos_sessions` | TRANSACTION | Point of Sale | **YES** | **YES** | **YES** | Cashier Shift Open/Close Log | NO (if Closed) | Immutable | YES | Phase 2B |
| `cashbox_transactions`| TRANSACTION | Treasury | **YES** | **YES** | **YES** | Safe Inflow/Outflow Vouchers | NO (if Posted) | Immutable | YES | Phase 2B |
| `recipes` | MASTER | Manufacturing | **YES** | **YES** | Optional | Production BOM Formula Header | YES | Soft Delete | YES | Phase 2B |
| `recipe_materials` | MASTER | Manufacturing | **YES** | **YES** | Optional | BOM Raw Material Composition | YES | Cascade | YES | Phase 2B |
| `roasting_jobs` | TRANSACTION | Industry Ext. | **YES** | **YES** | **YES** | Coffee Kiln Batch Execution Log | NO (if Posted) | Immutable | YES | Deferred |
| `grinding_jobs` | TRANSACTION | Industry Ext. | **YES** | **YES** | **YES** | Milling Execution Log | NO (if Posted) | Immutable | YES | Deferred |
| `users` | CONFIGURATION | Admin / Core | **YES** | Optional | Optional | User Security Credentials | YES | Soft Delete | YES | Phase 2B |
| `audit_logs` | AUDIT | Admin / Core | **YES** | **YES** | **YES** | Enterprise Security & Audit Log | NO | Immutable | Append-Only| Phase 2B |
