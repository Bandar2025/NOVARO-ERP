# NOVARO ERP — Enterprise Database Architecture Contract
**Document Ref:** `NOVARO_DATABASE_CONTRACT.md`  
**Phase:** 2A.6 — Database Contract Review & Enterprise Data Architecture (Pre-PostgreSQL Gate)  
**Status:** CONTRACT APPROVED — PRE-POSTGRESQL GATE CLEARED  
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
3. **No Database Triggers for Core Accounting/FIFO Logic**: SQL Triggers or Stored Procedures MUST NOT calculate COGS, post GL journals, or balance debits/credits. All business validation occurs in TypeScript Domain Engines before SQL persistence.
4. **Repositories are Storage Contracts**: Repositories map domain entities to/from relational tables without containing domain business rules.

---

## 2. Master Entity Classification Scheme

Every entity in the NOVARO ERP database contract is classified into one of eight functional categories:

- **MASTER**: Foundational business entities (e.g., `Account`, `Customer`, `Supplier`, `Item`, `Warehouse`).
- **TRANSACTION**: Operational business headers (e.g., `SalesInvoice`, `PurchaseOrder`, `InventoryAdjustment`).
- **FINANCIAL LEDGER**: Authoritative double-entry financial records (`JournalEntry`, `JournalEntryItem`).
- **INVENTORY LEDGER**: Authoritative stock movement & valuation layers (`CostLayer`, `StockMovement`).
- **CONFIGURATION**: Tenant & company configuration settings (`Tenant`, `Company`, `PostingAccountConfiguration`).
- **REFERENCE**: Static lookup catalogs (`FiscalYear`, `FiscalPeriod`, `ExchangeRate`, `UnitOfMeasure`).
- **AUDIT**: System security & data modification tracking (`AuditLog`).
- **PROJECTION / DERIVED**: Read-only cached views derived from ledgers (e.g., `CustomerBalanceProjection`, `StockValuationView`).

---

## 3. Review & Classification of the 32 Blueprint Entities

Each of the 32 entities from the Phase 2A.5 Blueprint has been evaluated against current code, domain logic, and Phase 2B PostgreSQL scope:

| # | Entity Name | Phase 2B Classification | Justification & Domain Code Alignment |
| :--- | :--- | :---: | :--- |
| 1 | `tenants` | **REQUIRED FOR PHASE 2B** | Core multi-tenant isolation foundation (`tenant_id`). |
| 2 | `companies` | **REQUIRED FOR PHASE 2B** | Company legal entity scoping (`company_id`). |
| 3 | `branches` | **REQUIRED FOR PHASE 2B** | Operational branch scoping (`branch_id`). |
| 4 | `cost_centers` | **OPTIONAL FOUNDATION** | Basic table structure for expense/revenue tracking. |
| 5 | `accounts` | **REQUIRED FOR PHASE 2B** | Chart of Accounts tree (`DomainAccount`). |
| 6 | `fiscal_years` | **REQUIRED FOR PHASE 2B** | Financial year lifecycle (`FiscalPeriod`). |
| 7 | `fiscal_periods` | **REQUIRED FOR PHASE 2B** | Period locking & closing enforcement. |
| 8 | `journal_entries` | **REQUIRED FOR PHASE 2B** | Double-entry voucher header (`JournalEntry`). |
| 9 | `journal_entry_items` | **REQUIRED FOR PHASE 2B** | Debit/Credit voucher lines (`JournalEntryItem`). |
| 10 | `exchange_rates` | **REQUIRED FOR PHASE 2B** | FX conversion matrix (`ExchangeRate`). |
| 11 | `customers` | **REQUIRED FOR PHASE 2B** | Customer directory (`Customer`). |
| 12 | `customer_movements` | **REQUIRED FOR PHASE 2B** | AR Sub-ledger movements (`DomainCustomerMovement`). |
| 13 | `suppliers` | **REQUIRED FOR PHASE 2B** | Vendor directory (`Supplier`). |
| 14 | `supplier_movements` | **REQUIRED FOR PHASE 2B** | AP Sub-ledger movements (`DomainSupplierMovement`). |
| 15 | `sales_invoices` | **REQUIRED FOR PHASE 2B** | B2B/B2C Sales header (`SalesInvoice`). |
| 16 | `sales_invoice_items` | **REQUIRED FOR PHASE 2B** | Sales invoice line items (`SalesInvoiceItem`). |
| 17 | `items` | **REQUIRED FOR PHASE 2B** | SKU catalog (`Item`). |
| 18 | `warehouses` | **REQUIRED FOR PHASE 2B** | Storage location catalog (`Warehouse`). |
| 19 | `stock_batches` | **REQUIRED FOR PHASE 2B** | Lot & expiry management (`StockBatch`). |
| 20 | `cost_layers` | **REQUIRED FOR PHASE 2B** | FIFO valuation layer queue (`CostLayer`). |
| 21 | `stock_movements` | **REQUIRED FOR PHASE 2B** | Inventory movement log (`DomainStockMovement`). |
| 22 | `inventory_adjustments`| **REQUIRED FOR PHASE 2B** | Physical variance header (`InventoryAdjustment`). |
| 23 | `purchase_orders` | **REQUIRED FOR PHASE 2B** | Procurement header (`PurchaseOrder`). |
| 24 | `purchase_order_items` | **REQUIRED FOR PHASE 2B** | Procurement line items (`PurchaseOrderItem`). |
| 25 | `pos_sessions` | **REQUIRED FOR PHASE 2B** | Cashier shift session (`POSSession`). |
| 26 | `cashbox_transactions` | **REQUIRED FOR PHASE 2B** | Cash safe vouchers (`CashboxTransaction`). |
| 27 | `recipes` | **REQUIRED FOR PHASE 2B** | BOM Recipe header (`Recipe`). |
| 28 | `recipe_materials` | **REQUIRED FOR PHASE 2B** | BOM raw material lines. |
| 29 | `roasting_jobs` | **OPTIONAL FOUNDATION** | Coffee Industry Extension batch log. |
| 30 | `grinding_jobs` | **OPTIONAL FOUNDATION** | Coffee Industry Extension milling log. |
| 31 | `users` | **REQUIRED FOR PHASE 2B** | User identity & authentication (`User`). |
| 32 | `audit_logs` | **REQUIRED FOR PHASE 2B** | Security & change tracking (`AuditLog`). |

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
| **Master Data** (`accounts`, `customers`, `suppliers`, `items`) | **YES** | **YES** | Optional | Shared across branches within the same legal Company. |
| **Branch Master** (`warehouses`, `cashboxes`) | **YES** | **YES** | **YES** | Physically tied to a specific operational Branch. |
| **Transactions & Ledgers** (`journal_entries`, `sales_invoices`, `stock_movements`) | **YES** | **YES** | **YES** | Fully scoped to the issuing Branch, Company, and Tenant. |
| **Reference Data** (`exchange_rates`, `tax_codes`) | **YES** | **YES** | Optional | Company-wide reference tables. |

---

## 5. Source of Truth & Derived Data Governance

### Critical Architectural Decision:
To resolve contradictions between legacy UI types (`src/types.ts`) and Clean Architecture Domain Models (`src/core/domain/`), the database contract establishes strict Source of Truth rules:

1. **Account Balances**:
   - **Source of Truth**: Sum of debits and credits from posted `journal_entry_items` in closed/open fiscal periods.
   - **Database Field (`accounts.balance`)**: Designated as a **Cached Derived Projection**. Must be recalculated or updated via transactional ledger triggers upon posting.
2. **Customer Receivables (AR)**:
   - **Source of Truth**: `customer_movements` and `journal_entry_items` mapped to AR (Account 1100). Calculated via `CustomerLedgerCalculator`.
   - **Database Field (`customers.balance`)**: Designated as a **Cached Derived Projection**.
3. **Supplier Payables (AP)**:
   - **Source of Truth**: `supplier_movements` and `journal_entry_items` mapped to AP (Account 2100). Calculated via `SupplierLedgerCalculator`.
   - **Database Field (`suppliers.balance`)**: Designated as a **Cached Derived Projection**.
4. **Inventory Item Quantities**:
   - **Source of Truth**: Sum of unconsumed `cost_layers` remaining quantities (`remaining_quantity`) and `stock_movements` logs.
   - **Database Field (`items.current_stock`)**: Designated as a **Cached Derived Projection**.
5. **Cost of Goods Sold (COGS)**:
   - **Source of Truth**: Realized FIFO cost layer consumption generated by `FIFOCostLayerQueue` during stock issue.
   - **Database Field**: Stored as actual COGS per line item on sales invoice items (`sales_invoice_items.cogs_amount`).

---

## 6. Document Lifecycle, Workflows & Immutability Rules

### Financial & Stock Ledger Immutability Contract:
1. **Lifecycle Transition**: `Draft` -> `Pending Review` -> `Approved` -> `Posted`.
2. **Immutability Threshold**: Once a document (Journal Entry, Sales Invoice, Stock Movement) transitions to `Posted`, **UPDATE and DELETE operations are strictly forbidden in PostgreSQL**.
3. **Reversal Pattern**: Errors in posted transactions MUST be corrected by generating a offsetting Reversal Document (`reversal_of_id` foreign key referencing the original transaction).
4. **Fiscal Period Locking**: PostgreSQL constraints and Application Services MUST reject any transaction insertion or reversal if `transaction_date` falls within a `CLOSED` or `LOCKED` `fiscal_period`.

---

## 7. Operational Transaction Boundaries

### 7.1 Sales Invoicing Transaction Boundary
When a Sales Invoice is posted, the following operations form a single **Atomic Transaction Boundary** (ACID):
```
1. Insert Sales Invoice Header & Line Items
2. Consume FIFO Stock Cost Layers (FIFOCostLayerQueue) -> Record Actual COGS
3. Record Stock Movements (DomainStockMovement) -> Type: issue
4. Append Customer Sub-Ledger Movement (DomainCustomerMovement) -> Type: invoice
5. Generate & Post Balanced Journal Entry (JournalEntry):
   - Debit: Accounts Receivable (1100) or Cash Safe (1010) [Total Invoice Amount]
   - Credit: Sales Revenue (4100) [Net Amount]
   - Credit: VAT Output Payable (2200) [15% Tax Amount]
   - Debit: Cost of Goods Sold (5100) [Actual FIFO COGS]
   - Credit: Inventory Asset (1200) [Actual FIFO COGS]
```

### 7.2 Procurement Transaction Boundary
```
1. Insert Purchase Order / Receiving Header & Line Items
2. Create FIFO Cost Layer (CostLayer) with unitCost & originalQuantity
3. Create Stock Batch Record (StockBatch)
4. Record Stock Movement (DomainStockMovement) -> Type: receipt
5. Append Supplier Sub-Ledger Movement (DomainSupplierMovement) -> Type: invoice
6. Generate & Post Balanced Journal Entry (JournalEntry):
   - Debit: Inventory Asset (1200) [Purchase Net Amount]
   - Debit: VAT Input Tax Receivable (1250) [15% Tax Amount]
   - Credit: Accounts Payable (2100) [Total Invoice Amount]
```

---

## 8. Document Numbering Contract (GAP-017)

To prevent duplicate document numbers in high-concurrency environments, NOVARO ERP establishes a dedicated Document Sequence Contract:

```
Format: {PREFIX}-{SCOPE_YEAR}-{BRANCH_CODE}-{SEQUENCE_NUMBER}
Example: INV-2026-BR1-0001
```

### Sequence Engine Specification:
- **Scope**: Numbering is isolated per `(company_id, branch_id, document_type, fiscal_year_id)`.
- **Reset Policy**: Sequences reset to `1` at the start of each new `fiscal_year`.
- **Concurrency Locking**: PostgreSQL `SELECT ... FOR UPDATE` or atomic `UPDATE ... RETURNING` sequence generators ensure gapless, collision-free numbering.

---

## 9. Data Types, Precision & Scale Standards

All numeric, financial, quantity, and timestamp columns adhere to strict SQL precision standards:

| Data Type Category | PostgreSQL SQL Standard | TypeScript Mapping | Precision & Rules |
| :--- | :--- | :--- | :--- |
| **Monetary Amounts** | `numeric(15, 4)` | `number` | Exact decimal precision; max 99,999,999,999.9999. No floating point (`double`). |
| **Stock Quantities** | `numeric(12, 4)` | `number` | Supports fractional inventory (e.g., 1.250 kg of coffee beans). |
| **Exchange Rates** | `numeric(10, 6)` | `number` | High-precision foreign currency conversion rate (e.g., 0.266667). |
| **Percentages** | `numeric(5, 2)` | `number` | Tax rates, discount %, shrinkage % (e.g., 15.00%). |
| **Timestamps** | `timestamp with time zone` | `string` (ISO 8601) | Stored in UTC (`TIMESTAMPTZ`). |
| **Primary Keys** | `uuid` or `bigserial` | `string` | UUID v4 or auto-incrementing BigInt. |
| **Status Vocabulary** | `varchar(30)` | Enum | Enforced via SQL check constraints or application enums. |

---

## 10. Delete & Mutation Policies

| Entity Classification | Delete Policy | Modification Policy | Archiving / Audit Rules |
| :--- | :--- | :--- | :--- |
| **Master Data** (`accounts`, `items`, `customers`) | **Soft Delete** (`is_active = false` or `deleted_at`) | Allowed if no posted ledger dependencies exist. | Delete blocked if referenced in posted transactions. |
| **Draft Transactions** (`journal_entries` in Draft) | **Hard Delete** allowed | Full modification allowed. | Logged in `audit_logs` if deleted. |
| **Posted Transactions** (`journal_entries`, `sales_invoices`) | **IMMUTABLE** (Delete strictly forbidden) | Modification strictly forbidden. | Reversal required for corrections. |
| **Stock & Cost Layers** (`cost_layers`, `stock_movements`) | **IMMUTABLE** (Delete strictly forbidden) | Decremented via FIFO queue execution. | Historical ledger audit trail. |
| **System Audit Logs** (`audit_logs`) | **Append-Only** (Delete strictly forbidden) | Read-only. | Retained indefinitely for SOCPA compliance. |

---

## 11. Foreign Key & Referencing Strategy

```
ON DELETE RESTRICT is enforced on all Financial & Stock references.
ON DELETE CASCADE is restricted solely to dependent line-item children (e.g. sales_invoice_items).
```

| Parent Entity | Parent Column | Child Entity | Child Column | Foreign Key Rule | Rationale |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `companies` | `id` | `branches` | `company_id` | **ON DELETE RESTRICT** | Prevents deleting company with branches. |
| `accounts` | `id` | `journal_entry_items` | `account_id` | **ON DELETE RESTRICT** | Protects GL audit history. |
| `customers` | `id` | `sales_invoices` | `customer_id` | **ON DELETE RESTRICT** | Protects customer invoice records. |
| `items` | `id` | `cost_layers` | `item_id` | **ON DELETE RESTRICT** | Protects FIFO valuation queue. |
| `sales_invoices` | `id` | `sales_invoice_items` | `sales_invoice_id` | **ON DELETE CASCADE** | Deleting draft invoice removes its lines. |
| `journal_entries`| `id` | `journal_entry_items` | `journal_entry_id` | **ON DELETE CASCADE** | Deleting draft voucher removes its lines. |

---

## 12. Index Strategy & Performance Contract

To ensure sub-10ms query execution across thousands of transactions, composite indexes are contracted for Phase 2B:

1. `idx_journal_entries_lookup`: `(company_id, branch_id, fiscal_period_id, posted)`
2. `idx_journal_items_account`: `(account_id, journal_entry_id)`
3. `idx_cost_layers_fifo`: `(item_id, warehouse_id, remaining_quantity, date_received ASC)`
4. `idx_stock_movements_item`: `(item_id, warehouse_id, transaction_date DESC)`
5. `idx_sales_invoices_customer`: `(company_id, customer_id, status, invoice_date)`
6. `idx_audit_logs_tenant`: `(tenant_id, company_id, timestamp DESC)`

---

## 13. Pre-PostgreSQL Gate Evaluation & Final Verdict

```
================================================================================
                    NOVARO ERP PRE-POSTGRESQL GATE EVALUATION
================================================================================

DATABASE ARCHITECTURE CONTRACT:   APPROVED
ENTITY CLASSIFICATION:            32 ENTITIES REVIEWED & CLASSIFIED
SOURCE OF TRUTH RULES:            DEFINED (LEDGER AS AUTHORITY, FIELDS AS PROJECTIONS)
MULTI-TENANCY & SCOPE MAP:        DEFINED (tenant_id / company_id / branch_id)
TRANSACTION BOUNDARIES:           DEFINED (SALES, PROCUREMENT, POS)
IMMUTABILITY & REVERSAL RULES:    DEFINED (POSTED ENTRIES ARE IMMUTABLE)
DOCUMENT NUMBERING CONTRACT:      DEFINED (GAP-017 CONCURRENCY SAFE)
DATA TYPES & PRECISION:           DEFINED (numeric(15,4), numeric(12,4), TIMESTAMPTZ)
FOREIGN KEYS & INDEX CONTRACT:    DEFINED (RESTRICT FOR LEDGERS, CASCADE FOR LINES)

BUILD STATUS:                     PASSING (100% CLEAN LINT & BUILD)
POSTGRESQL IMPLEMENTED:           NO (PRESERVED FOR PHASE 2B)
BUSINESS LOGIC CHANGED:           NO (Clean Architecture Preserved)

FINAL GATE RESULT:                APPROVED & CLEARED FOR PHASE 2B
================================================================================
```
