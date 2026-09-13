# NOVARO ERP — API Coverage & Service Mapping Matrix
**Document Ref:** `NOVARO_API_COVERAGE_MATRIX.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. End-to-End API Architectural Traceability

This matrix maps every Target UI Screen to its corresponding REST API Endpoint, Repository, Application Service, and Domain Logic:

| Target Screen | Required API Endpoint | Current API Endpoint | Application Service | Domain Engine | API Coverage Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `accounting.coa` | `GET/POST /api/v1/accounts` | `/api/v1/accounts` | `AccountApplicationService` | `Account` | 🟢 COMPLETE |
| `accounting.je` | `POST /api/v1/journal-entries` | `/api/v1/journal-entries` | `JournalEntryApplicationService` | `JournalEntry` | 🟢 COMPLETE |
| `accounting.workflow`| `POST /api/v1/journal-entries/:id/post` | `/api/v1/journal-entries/:id/post` | `JournalEntryApplicationService` | `JournalEntry` | 🟢 COMPLETE |
| `customers` | `GET/POST /api/v1/customers` | `/api/v1/customers` | `CustomerApplicationService` | `CustomerLedger` | 🟢 COMPLETE |
| `suppliers` | `GET/POST /api/v1/suppliers` | `/api/v1/suppliers` | `SupplierApplicationService` | `SupplierLedger` | 🟢 COMPLETE |
| `inventory.catalog` | `GET/POST /api/v1/inventory/items` | `/api/v1/inventory/items` | `InventoryApplicationService` | `Item` | 🟢 COMPLETE |
| `inventory.lots` | `GET /api/v1/inventory/batches` | `/api/v1/inventory/batches` | `InventoryApplicationService` | `CostLayer` | 🟢 COMPLETE |
| `inventory.adjustments`| `POST /api/v1/inventory/adjustments` | `/api/v1/inventory/adjustments` | `InventoryApplicationService` | `InventoryEngine` | 🟢 COMPLETE |
| `inventory.transfers` | `POST /api/v1/inventory/transfers` | `/api/v1/inventory/transfers` | `InventoryApplicationService` | `InventoryEngine` | 🟢 COMPLETE |
| `purchases.new` | `POST /api/v1/purchases/orders` | `/api/v1/purchases/orders` | `PurchaseApplicationService` | `PurchaseOrder` | 🟢 COMPLETE |
| `sales.billing` | `POST /api/v1/sales/invoices` | `/api/v1/sales/invoices` | `SalesApplicationService` | `SalesInvoice` | 🟢 COMPLETE |
| `reports.income` | `GET /api/v1/reports/income-statement` | `/api/v1/reports/income-statement` | `AccountingEngine` | `TrialBalanceService` | 🟢 COMPLETE |
| `reports.balance_sheet`| `GET /api/v1/reports/balance-sheet` | `/api/v1/reports/balance-sheet` | `AccountingEngine` | `TrialBalanceService` | 🟢 COMPLETE |
| `reports.trial_balance`| `GET /api/v1/reports/trial-balance` | `/api/v1/reports/trial-balance` | `AccountingEngine` | `TrialBalanceService` | 🟢 COMPLETE |
| `pos.terminal` | `POST /api/v1/pos/transactions` | Express fallback `/api/v1/sales/invoices` | `SalesApplicationService` | `SalesInvoice` | 🟡 PARTIAL |
| `cashbox.vouchers` | `POST /api/v1/cashbox/vouchers` | Express fallback `/api/v1/journal-entries` | `JournalEntryApplicationService` | `JournalEntry` | 🟡 PARTIAL |
| `production.execution`| `POST /api/v1/manufacturing/work-orders`| Local State Engine | `ManufacturingEngine` | `WorkOrder` | 🔵 FOUNDATION |
| `roastery.jobs` | `POST /api/v1/roastery/jobs` | Local State Engine | `ManufacturingEngine` | `RoastingJob` | 🟡 PARTIAL |
| `grinding.jobs` | `POST /api/v1/grinding/jobs` | Local State Engine | `ManufacturingEngine` | `GrindingJob` | 🟡 PARTIAL |
| `settings.general` | `GET/PUT /api/v1/settings` | Local Storage | State Provider | `CompanySettings` | 🟡 PARTIAL |

---

## 2. Identified API Coverage Gaps

1. **POS Terminal Endpoint (`/api/v1/pos/sessions`)**: Currently routes through generic sales invoice API (`/api/v1/sales/invoices`). Dedicated POS session endpoints are needed in Phase 2B.
2. **Manufacturing & Industrial Extensions API (`/api/v1/manufacturing/*`)**: Work orders and roastery/grinding batch jobs execute in client domain engines (`ManufacturingEngine.ts`). Server-side API endpoints should be created in Phase 2B.
3. **Settings & Backup API (`/api/v1/settings`)**: System settings update in client state. Server API endpoint needed for multi-tenant database persistence.
