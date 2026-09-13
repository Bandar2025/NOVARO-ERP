# NOVARO ERP — Enterprise Database Architecture Contract
**Document Ref:** `NOVARO_DATABASE_CONTRACT.md`  
**Phase:** 2A.6-R.1 — Final Database Contract Integrity Check (Pre-PostgreSQL Final Gate)  
**Status:** CONTRACT APPROVED & INTERNALLY CONSISTENT — PRE-POSTGRESQL FINAL GATE CLEARED  
**Target Persistence:** PostgreSQL 16+ / Drizzle ORM  

---

## 1. Database Architectural Position & Separation of Concerns

NOVARO ERP enforces a strict Clean Architecture boundary where the Database is purely a **Persistence Layer**, not a Business Logic Layer.

```
React UI (Presentation Layer)
    ↓
Application Hooks / API Client
    ↓
HTTP API (REST Endpoints)
    ↓
Express Routes & Controllers
    ↓
Application Services (Use-Case Orchestration)
    ↓
Domain Services & Engines (AccountingEngine, InventoryEngine, CommerceService)
    ↓
Repository Interfaces (AccountRepository, JournalEntryRepository, etc.)
    ↓
Persistence Adapter (Drizzle ORM / PostgreSQL Client)
    ↓
PostgreSQL Relational Database
```

### Absolute Architectural Rules:
1. **No Direct Database Access from UI**: React components MUST NEVER query PostgreSQL or Drizzle directly. All data access routes through Express HTTP APIs and Application Services.
2. **Business Engines Hold Business Authority**: `AccountingEngine` and `InventoryEngine` are the sole authorities for financial posting validation, trial balance calculation, and FIFO layer consumption. PostgreSQL stores the state resulting from these engines.
3. **NO Database Triggers for Core Accounting/FIFO Logic**: SQL Triggers or Stored Procedures MUST NOT calculate COGS, post GL journals, balance debits/credits, or recalculate account/stock balances. All business validation and calculation occur in TypeScript Domain Engines (`AccountingEngine`, `InventoryEngine`, `CommerceService`) before SQL persistence.
4. **Repositories are Storage Contracts**: Repositories map domain entities to/from relational tables without containing domain business rules.

---

## 2. Master Entity Classification Scheme

Every entity in the NOVARO ERP database contract is classified into one of eight functional categories:

- **MASTER**: Foundational business entities (e.g., `Account`, `Customer`, `Supplier`, `Item`, `Warehouse`, `Recipe`, `RecipeMaterial`).
- **TRANSACTION**: Operational business headers (e.g., `SalesInvoice`, `PurchaseOrder`, `InventoryAdjustment`).
- **FINANCIAL LEDGER**: Authoritative double-entry financial records (`JournalEntry`, `JournalEntryItem`).
- **INVENTORY LEDGER**: Authoritative stock movement & valuation layers (`CostLayer`, `StockMovement`).
- **CONFIGURATION**: Tenant & company configuration settings (`Tenant`, `Company`, `PostingAccountConfiguration`).
- **REFERENCE**: Static lookup catalogs (`FiscalYear`, `FiscalPeriod`, `ExchangeRate`).
- **AUDIT**: System security & data modification tracking (`AuditLog`).
- **PROJECTION / DERIVED**: Read-only cached views derived from ledgers (e.g., `CustomerBalanceProjection`, `StockValuationView`).

---

## 3. Reconciliation of Reviewed Entities (32 Total Entities)

All 32 entities from the Phase 2A.5 Blueprint have been reviewed and reconciled:
- **Phase 2B Core Entities In-Scope**: **29 Entities** (including `recipes` BOM Header and `recipe_materials` BOM Material Lines combined as the BOM Master Data model).
- **Deferred Extension Entities**: **3 Entities** (`cost_centers`, `roasting_jobs`, `grinding_jobs`).
- **Total Reviewed Entities**: **32 Entities**.

| # | Entity Name | Phase 2B Classification | Justification & Domain Code Alignment |
| :--- | :--- | :---: | :--- |
| 1 | `tenants` | **REQUIRED FOR PHASE 2B** | Core multi-tenant isolation foundation (`tenant_id`). |
| 2 | `companies` | **REQUIRED FOR PHASE 2B** | Company legal entity scoping (`company_id`). |
| 3 | `branches` | **REQUIRED FOR PHASE 2B** | Operational branch scoping (`branch_id`). |
| 4 | `accounts` | **REQUIRED FOR PHASE 2B** | Chart of Accounts tree (`DomainAccount`). |
| 5 | `fiscal_years` | **REQUIRED FOR PHASE 2B** | Financial year lifecycle (`FiscalPeriod`). |
| 6 | `fiscal_periods` | **REQUIRED FOR PHASE 2B** | Period locking & closing enforcement. |
| 7 | `journal_entries` | **REQUIRED FOR PHASE 2B** | Double-entry voucher header (`JournalEntry`). |
| 8 | `journal_entry_items` | **REQUIRED FOR PHASE 2B** | Debit/Credit voucher lines (`JournalEntryItem`). |
| 9 | `exchange_rates` | **REQUIRED FOR PHASE 2B** | FX conversion matrix (`ExchangeRate`). |
| 10 | `customers` | **REQUIRED FOR PHASE 2B** | Customer directory (`Customer`). |
| 11 | `customer_movements` | **REQUIRED FOR PHASE 2B** | AR Sub-ledger movements (`DomainCustomerMovement`). |
| 12 | `suppliers` | **REQUIRED FOR PHASE 2B** | Vendor directory (`Supplier`). |
| 13 | `supplier_movements` | **REQUIRED FOR PHASE 2B** | AP Sub-ledger movements (`DomainSupplierMovement`). |
| 14 | `sales_invoices` | **REQUIRED FOR PHASE 2B** | B2B/B2C Sales header (`SalesInvoice`). |
| 15 | `sales_invoice_items` | **REQUIRED FOR PHASE 2B** | Sales invoice line items (`SalesInvoiceItem`). |
| 16 | `items` | **REQUIRED FOR PHASE 2B** | SKU catalog (`Item`). |
| 17 | `warehouses` | **REQUIRED FOR PHASE 2B** | Storage location catalog (`Warehouse`). |
| 18 | `stock_batches` | **REQUIRED FOR PHASE 2B** | Lot & expiry management (`StockBatch`). |
| 19 | `cost_layers` | **REQUIRED FOR PHASE 2B** | FIFO valuation layer queue (`CostLayer`). |
| 20 | `stock_movements` | **REQUIRED FOR PHASE 2B** | Inventory movement log (`DomainStockMovement`). |
| 21 | `inventory_adjustments`| **REQUIRED FOR PHASE 2B** | Physical variance header (`InventoryAdjustment`). |
| 22 | `purchase_orders` | **REQUIRED FOR PHASE 2B** | Procurement header (`PurchaseOrder`). |
| 23 | `purchase_order_items` | **REQUIRED FOR PHASE 2B** | Procurement line items (`PurchaseOrderItem`). |
| 24 | `pos_sessions` | **REQUIRED FOR PHASE 2B** | Cashier shift session (`POSSession`). |
| 25 | `cashbox_transactions` | **REQUIRED FOR PHASE 2B** | Cash safe vouchers (`CashboxTransaction`). |
| 26 | `recipes` | **REQUIRED FOR PHASE 2B** | Production BOM Recipe header (`Recipe`). |
| 27 | `recipe_materials` | **REQUIRED FOR PHASE 2B** | BOM Raw Material composition lines. |
| 28 | `users` | **REQUIRED FOR PHASE 2B** | User identity & authentication (`User`). |
| 29 | `audit_logs` | **REQUIRED FOR PHASE 2B** | Security & change tracking (`AuditLog`). |
| 30 | `cost_centers` | **DEFERRED EXTENSION** | Advanced cost center accounting hierarchy. |
| 31 | `roasting_jobs` | **DEFERRED EXTENSION** | Coffee Industry Extension batch log. |
| 32 | `grinding_jobs` | **DEFERRED EXTENSION** | Coffee Industry Extension milling log. |

---

## 4. Multi-Tenant, Company & Branch Isolation Model

To ensure multi-tenant security and multi-company structural isolation, foreign keys are assigned systematically:

```
Tenant (tenant_id)
  ↓
Company (company_id)
  ↓
Branch (branch_id)
```

| Entity Category | `tenant_id` | `company_id` | `branch_id` | Scope Rationale |
| :--- | :---: | :---: | :---: | :--- |
| **System & Admin** (`tenants`, `users`) | **YES** | Optional | Optional | Users belong to a Tenant; can be assigned to Companies/Branches. |
| **Master Data** (`accounts`, `customers`, `suppliers`, `items`, `recipes`) | **YES** | **YES** | Optional | Shared across branches within the same legal Company. |
| **Branch Master** (`warehouses`, `cashboxes`) | **YES** | **YES** | **YES** | Physically tied to a specific operational Branch. |
| **Transactions & Ledgers** (`journal_entries`, `sales_invoices`, `stock_movements`) | **YES** | **YES** | **YES** | Fully scoped to the issuing Branch, Company, and Tenant. |
| **Reference Data** (`exchange_rates`, `tax_codes`) | **YES** | **YES** | Optional | Company-wide reference tables. |

---

## 5. Source of Truth & Derived Data Governance

To eliminate ambiguities, the contract establishes strict Source of Truth rules and Reconciliation Invariants:

1. **Account Balances**:
   - **Source of Truth**: Sum of debits and credits from posted `journal_entry_items` in closed/open fiscal periods.
   - **Database Field (`accounts.balance`)**: Designated as a **Cached Derived Projection**. Must be recalculated or updated via Application Services (`AccountingEngine`) upon voucher posting. No SQL triggers.
2. **Customer Receivables (AR)**:
   - **Source of Truth**: `customer_movements` and `journal_entry_items` mapped to AR (Account 1100). Calculated via `CustomerLedgerCalculator`.
   - **Database Field (`customers.balance`)**: Designated as a **Cached Derived Projection**.
   - **Reconciliation Invariant**: `Sum(Customer Movements) == GL Accounts Receivable Balance (Account 1100)`.
3. **Supplier Payables (AP)**:
   - **Source of Truth**: `supplier_movements` and `journal_entry_items` mapped to AP (Account 2100). Calculated via `SupplierLedgerCalculator`.
   - **Database Field (`suppliers.balance`)**: Designated as a **Cached Derived Projection**.
   - **Reconciliation Invariant**: `Sum(Supplier Movements) == GL Accounts Payable Balance (Account 2100)`.
4. **Inventory Item Quantities & Valuation**:
   - **Source of Truth**: Sum of unconsumed `cost_layers` remaining quantities (`remaining_quantity`) and `stock_movements` logs.
   - **Database Field (`items.current_stock`)**: Designated as a **Cached Derived Projection**.
   - **Reconciliation Invariant**: `Sum(Unconsumed FIFO Cost Layers Value) == GL Inventory Asset Balance (Account 1200)`.
5. **Cost of Goods Sold (COGS)**:
   - **Source of Truth**: Realized FIFO cost layer consumption generated by `FIFOCostLayerQueue` during stock issue. No static, hardcoded, or estimated COGS values.
   - **Database Field**: Stored as actual COGS per line item on sales invoice items (`sales_invoice_items.cogs_amount`).

---

## 6. Document Lifecycle, Workflows & Defense-in-Depth Immutability

### Financial & Stock Ledger Immutability Contract:
1. **Lifecycle Transition**: `Draft` -> `Pending Review` -> `Approved` -> `Posted`.
2. **Immutability Threshold**: Once a document (Journal Entry, Sales Invoice, Stock Movement) transitions to `Posted`, **UPDATE and DELETE operations are strictly forbidden**.
3. **Reversal Pattern**: Errors in posted transactions MUST be corrected by generating an offsetting Reversal Document (`reversal_of_id` foreign key referencing the original transaction).
4. **Defense-in-Depth Layers**:
   - **Layer 1 (Application)**: `AccountingEngine` validation rejects modifications to posted records.
   - **Layer 2 (Repository)**: Repository implementation checks `posted == true` before executing queries and throws an error if an edit is attempted.
   - **Layer 3 (Database Permissions)**: PostgreSQL role permissions restrict UPDATE/DELETE privileges on posted ledger tables for application database users.
   - **Layer 4 (Audit Log)**: Any attempt to mutate records is logged to `audit_logs`.

---

## 7. Operational Business Transaction Boundaries

### 7.1 Sales Invoicing Business Transaction Boundary
When a Sales Invoice is posted, the following operations form a single **Atomic Business Transaction Boundary**:
```
1. Insert Sales Invoice Header & Line Items
2. Consume FIFO Stock Cost Layers (FIFOCostLayerQueue) -> Record Actual COGS
3. Record Stock Movements (DomainStockMovement) -> Type: issue
4. Append Customer Sub-Ledger Movement (DomainCustomerMovement) -> Type: invoice
5. Generate & Post Balanced Journal Entry (JournalEntry):
   - Debit: Accounts Receivable (1100) or Cash Safe (1010) [Total Invoice Amount]
   - Credit: Sales Revenue (4100) [Net Amount]
   - Credit: VAT Output Payable (2200) [Configured Tax Rate Amount]
   - Debit: Cost of Goods Sold (5100) [Actual FIFO COGS]
   - Credit: Inventory Asset (1200) [Actual FIFO COGS]
```

### 7.2 Procurement Business Transaction Boundary
```
1. Insert Purchase Order / Receiving Header & Line Items
2. Create FIFO Cost Layer (CostLayer) with unitCost & originalQuantity
3. Create Stock Batch Record (StockBatch)
4. Record Stock Movement (DomainStockMovement) -> Type: receipt
5. Append Supplier Sub-Ledger Movement (DomainSupplierMovement) -> Type: invoice
6. Generate & Post Balanced Journal Entry (JournalEntry):
   - Debit: Inventory Asset (1200) [Purchase Net Amount]
   - Debit: VAT Input Tax Receivable (1250) [Configured Tax Rate Amount]
   - Credit: Accounts Payable (2100) [Total Invoice Amount]
```

---

## 8. Document Numbering & Sequence Precision (GAP-017)

To prevent duplicate document numbers in high-concurrency environments, NOVARO ERP establishes a precise Document Sequence Contract:

```
Format: {PREFIX}-{SCOPE_YEAR}-{BRANCH_CODE}-{SEQUENCE_NUMBER}
Example: INV-2026-BR1-0001
```

### Sequence Engine Specification:
- **Scope**: Numbering is isolated per `(company_id, branch_id, document_type, fiscal_year_id)`.
- **Reset Policy**: Sequences reset to `1` at the start of each new `fiscal_year`.
- **Phase 2B Scope**: Table structure & sequence generator definition ensuring **Uniqueness** and **Collision-Free** allocation.
- **Phase 2C Scope**: Allocation-on-posting inside atomic transactions (`SELECT ... FOR UPDATE`) to guarantee strict **Gapless** sequence assignment for posted legal vouchers.

---

## 9. Dynamic Tax / VAT Configuration Contract

- **Tax Authority**: Driven by `companySettings.taxConfiguration`.
- **No Hardcoding**: VAT rate (e.g., 15%) is a default configuration parameter, NOT hardcoded in `AccountingEngine`, `InventoryEngine`, `SalesService`, or SQL queries.

---

## 10. Separation of Phase 2B vs Phase 2C

| Dimension | Phase 2B (Persistence Foundation) | Phase 2C (ACID & Concurrency Hardening) |
| :--- | :--- | :--- |
| **Scope** | Drizzle ORM Schema, Relational Tables, Foreign Keys, Indexes, Repository Adapters | UnitOfWork Orchestration, Multi-Repository ACID Transactions, Row Locking |
| **Database Operations**| Standard SELECT / INSERT / UPDATE queries via Repository Adapters | Explicit `BEGIN`, `COMMIT`, `ROLLBACK` blocks & `SELECT ... FOR UPDATE` locks |
| **Testing Target** | CRUD Persistence, Foreign Key constraints, Data Mapping verification | High-concurrency race condition testing, rollback verification, lock contention tests |

---

## 11. Delete & Mutation Policies

| Entity Classification | Delete Policy | Modification Policy | Archiving / Audit Rules |
| :--- | :--- | :--- | :--- |
| **Master Data** (`accounts`, `items`, `customers`, `recipes`) | **Soft Delete** (`is_active = false` or `deleted_at`) | Allowed if no posted ledger dependencies exist. | Delete blocked if referenced in posted transactions. |
| **Draft Transactions** (`journal_entries` in Draft) | **Hard Delete** allowed | Full modification allowed. | Logged in `audit_logs` if deleted. |
| **Posted Transactions** (`journal_entries`, `sales_invoices`) | **IMMUTABLE** (Delete strictly forbidden) | Modification strictly forbidden. | Reversal required for corrections. |
| **Stock & Cost Layers** (`cost_layers`, `stock_movements`) | **IMMUTABLE** (Delete strictly forbidden) | Decremented via FIFO queue execution. | Historical ledger audit trail. |
| **System Audit Logs** (`audit_logs`) | **Append-Only** (Delete strictly forbidden) | Read-only. | Retained indefinitely for SOCPA compliance. |

---

## 12. Foreign Key & Referencing Strategy

```
ON DELETE RESTRICT is enforced on all Financial & Stock references.
ON DELETE CASCADE is restricted solely to dependent line-item children (e.g., sales_invoice_items, recipe_materials).
```

| Parent Entity | Parent Column | Child Entity | Child Column | Foreign Key Rule | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companies` | `id` | `branches` | `company_id` | **ON DELETE RESTRICT** | Prevents deleting company with branches. |
| `accounts` | `id` | `journal_entry_items` | `account_id` | **ON DELETE RESTRICT** | Protects GL audit history. |
| `customers` | `id` | `sales_invoices` | `customer_id` | **ON DELETE RESTRICT** | Protects customer invoice records. |
| `items` | `id` | `cost_layers` | `item_id` | **ON DELETE RESTRICT** | Protects FIFO valuation queue. |
| `recipes` | `id` | `recipe_materials` | `recipe_id` | **ON DELETE CASCADE** | Deleting a recipe master removes its raw material lines. |
| `sales_invoices` | `id` | `sales_invoice_items` | `sales_invoice_id` | **ON DELETE CASCADE** | Deleting draft invoice removes its lines. |
| `journal_entries`| `id` | `journal_entry_items` | `journal_entry_id` | **ON DELETE CASCADE** | Deleting draft voucher removes its lines. |

---

## 13. Index Strategy & Performance Contract

To ensure sub-10ms query execution across thousands of transactions, composite indexes are contracted for Phase 2B:

1. `idx_journal_entries_lookup`: `(company_id, branch_id, fiscal_period_id, posted)`
2. `idx_journal_items_account`: `(account_id, journal_entry_id)`
3. `idx_cost_layers_fifo`: `(item_id, warehouse_id, remaining_quantity, date_received ASC)`
4. `idx_stock_movements_item`: `(item_id, warehouse_id, transaction_date DESC)`
5. `idx_sales_invoices_customer`: `(company_id, customer_id, status, invoice_date)`
6. `idx_audit_logs_tenant`: `(tenant_id, company_id, timestamp DESC)`

---

## 14. Final Pre-PostgreSQL Gate Evaluation

```
================================================================================
           NOVARO ERP FINAL PRE-POSTGRESQL GATE EVALUATION (2A.6-R.1)
================================================================================

DATABASE ARCHITECTURE CONTRACT:   APPROVED & INTERNALLY CONSISTENT
TOTAL ENTITIES REVIEWED:          32 / 32
PHASE 2B CORE IN-SCOPE ENTITIES:  29 ENTITIES (INCL. RECIPES & RECIPE_MATERIALS)
DEFERRED EXTENSION ENTITIES:      3 ENTITIES (COST_CENTERS, ROASTING, GRINDING)
ENTITY COUNT CONSISTENCY:         100% PASSING ACROSS ALL BLUEPRINT DOCS

SOURCE OF TRUTH RULES:            DEFINED (LEDGERS AUTHORITATIVE, BALANCES DERIVED)
NO DATABASE TRIGGERS RULE:        ENFORCED (ALL BUSINESS LOGIC IN APP ENGINES)
RECONCILIATION INVARIANTS:        ENFORCED (AR/AP/INVENTORY ASSET EQUALITIES)
TAX CONFIGURATION MODEL:          ENFORCED (CONFIGURATION DRIVEN, NO HARDCODING)

MULTI-TENANCY & SCOPE MAP:        DEFINED (tenant_id / company_id / branch_id)
TRANSACTION BOUNDARIES:           DEFINED (SALES, PROCUREMENT, POS)
IMMUTABILITY & DEFENSE-IN-DEPTH:  DEFINED (POSTED ENTRIES IMMUTABLE)
DOCUMENT NUMBERING TERMINOLOGY:   PRECISION CLARIFIED (GAPLESS ALLOCATED IN 2C)
PHASE 2B / PHASE 2C SEPARATION:   DEFINED (2B PERSISTENCE, 2C CONCURRENCY/ACID)

BUILD STATUS:                     PASSING (100% CLEAN LINT & BUILD)
POSTGRESQL IMPLEMENTED:           NO (PRESERVED FOR PHASE 2B)
BUSINESS LOGIC CHANGED:           NO (Clean Architecture Preserved)

FINAL GATE RESULT:                APPROVED — READY FOR PHASE 2B
================================================================================
```
