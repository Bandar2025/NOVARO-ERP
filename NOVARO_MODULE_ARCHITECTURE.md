# NOVARO ERP — Detailed Module Architecture & Discovery Catalog
**Document Ref:** `NOVARO_MODULE_ARCHITECTURE.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  
**Scope:** Complete inventory of current modules, submodules, components, APIs, repositories, entities, workflows, and statuses.

---

## 1. Module Inventory Classification Guide

Modules are evaluated using the standard maturity classification:
- 🟢 **COMPLETE**: Full UI + Application Service + Domain Logic + Repository + API + Validation + Error Handling + Reports + Audit readiness.
- 🟡 **PARTIAL**: Operational UI & Domain engine present, but missing full backend API coverage or DB persistence.
- 🔵 **FOUNDATION ONLY**: Domain types & basic mock logic present without complete workflow handlers.
- 🟠 **UI ONLY**: Pure interface without underlying business logic engine.
- 🔴 **MISSING**: Feature not yet implemented in NOVARO ERP.

---

## 2. Detailed Module Catalog

### 2.1 General Ledger & Accounting (`AccountingModule.tsx`)
- **Classification**: 🟢 COMPLETE (Maturity: 8.5/10)
- **Submodules & Screens**:
  1. `coa`: Chart of Accounts (Tree view, node creation modal, account type tagging).
  2. `je`: Journal Entry Creator (Double-entry voucher grid, debit/credit auto-balance validator, currency selector).
  3. `workflow`: Posting & Approval Workflow (Pending review queue, batch posting action, voucher inspector).
  4. `recurring`: Recurring Journal Templates (Monthly/weekly schedules, execution trigger).
  5. `exchange`: Foreign Currency Matrix (Base YER/SAR/USD rates, daily revaluation).
  6. `closing`: Year-End Financial Closing (Fiscal period selector, Retained Earnings rollover engine).
  7. `cash_banks`: Safe & Bank Account Management (Liquid account balances, transaction logging).
- **Core Entities**: `Account`, `JournalEntry`, `JournalEntryItem`, `ExchangeRate`, `FiscalPeriod`, `PostingAccountConfiguration`.
- **Actions**: `postJournalEntry`, `reverseJournalEntry`, `addRecurringEntry`, `fiscalYearClosing`, `addAccount`, `updateAccount`.
- **Reports**: Trial Balance, Income Statement, Balance Sheet, General Ledger Detail Statement.
- **API Endpoints**: `GET/POST /api/v1/accounts`, `GET/POST /api/v1/journal-entries`, `POST /api/v1/journal-entries/:id/post`, `GET /api/v1/reports/*`.
- **Repository**: `LocalAccountRepository`, `LocalJournalEntryRepository`, `LocalFiscalPeriodRepository`.
- **Statuses**: `Draft`, `Pending Review`, `Approved`, `Posted`, `Cancelled`, `Rejected`.

---

### 2.2 Warehouse, Materials & Inventory (`InventoryModule.tsx`)
- **Classification**: 🟢 COMPLETE (Maturity: 8.0/10)
- **Submodules & Screens**:
  1. `catalog`: Master Item Index (SKU, barcode, category, UOM, pricing, stock levels).
  2. `lots`: FIFO Costing Layers (Batch expiry date, remaining stock layer, unit cost layer).
  3. `adjustments`: Physical Inventory Adjustment (Book vs. actual count variance adjustment).
  4. `transfers`: Inter-Warehouse Stock Transfer (Warehouse origin/destination transfer).
  5. `barcodes`: Barcode Studio (Label printing, barcode sequence configuration).
- **Core Entities**: `Item`, `Batch`, `CostLayer`, `DomainStockMovement`, `InventoryAdjustment`, `StockTransfer`.
- **Actions**: `addItem`, `updateItem`, `deleteItem`, `addInventoryAdjustment`, `addStockTransfer`.
- **Reports**: Stock Valuation Report, FIFO Layer Detail, Low Stock Reorder Alert List, Movement Audit Log.
- **API Endpoints**: `GET/POST /api/v1/inventory/items`, `GET/POST /api/v1/inventory/batches`, `POST /api/v1/inventory/adjustments`, `POST /api/v1/inventory/transfers`.
- **Repository**: `LocalInventoryRepository`.
- **Statuses**: `Draft`, `Pending`, `Posted`, `Cancelled`.

---

### 2.3 Purchases & Procurement (`PurchasesModule.tsx`)
- **Classification**: 🟡 PARTIAL (Maturity: 7.0/10)
- **Submodules & Screens**:
  1. `new_invoice`: Purchase Order & Receiving (Vendor selector, line item grid, tax/shipping calc).
  2. `invoices_list`: Purchase Invoice History (Search, payment status filter, receipt printer).
- **Core Entities**: `PurchaseOrder`, `PurchaseOrderItem`, `Supplier`, `Batch`.
- **Actions**: `addPurchaseOrder`, `receivePurchaseOrder`, `addSupplier`.
- **Reports**: Purchase Register, AP Balance Summary, Received Goods Log.
- **API Endpoints**: `GET/POST /api/v1/purchases/orders`.
- **Repository**: `LocalPurchaseRepository`, `LocalSupplierRepository`.
- **Statuses**: `Draft`, `Approved`, `Received`, `Cancelled`.

---

### 2.4 Commercial Sales & B2B Trade (`SalesModule.tsx` & `WholesaleModule.tsx`)
- **Classification**: 🟡 PARTIAL (Maturity: 7.0/10)
- **Submodules & Screens**:
  1. `sales.invoices`: General Sales Invoices (Customer invoice creator, VAT calc, ZATCA QR helper).
  2. `wholesale.billing`: Wholesale Bulk Billing (Bulk price list selector, delivery notes).
  3. `wholesale.margins`: Profit Margin Analyzer (Cost vs. selling price differential).
  4. `wholesale.log`: B2B Invoices History (Invoice filter, re-print, credit status).
- **Core Entities**: `SalesInvoice`, `SalesInvoiceItem`, `Customer`.
- **Actions**: `addSalesInvoice`, `addCustomer`, `updateCustomer`.
- **Reports**: Sales Register, Profitability Report, Customer Balance Summary.
- **API Endpoints**: `GET/POST /api/v1/sales/invoices`, `GET/POST /api/v1/customers`.
- **Repository**: `LocalSalesRepository`, `LocalCustomerRepository`.
- **Statuses**: `Unpaid`, `Paid`, `Cancelled`.

---

### 2.5 Retail Point of Sale (`PosModule.tsx` & `DailySalesModule.tsx`)
- **Classification**: 🟡 PARTIAL (Maturity: 6.5/10)
- **Submodules & Screens**:
  1. `pos.terminal`: Cashier Touch Screen (Fast tender buttons, item grid, receipt printer).
  2. `pos.session`: Shift Open/Close (Starting cash drawer input, cash variance tally).
  3. `daily_sales.returns`: Over-the-counter Returns (Invoice lookup, cash refund voucher).
- **Core Entities**: `POSSession`, `SalesInvoice`, `CashboxTransaction`.
- **Actions**: `openPOSSession`, `closePOSSession`, `addSalesInvoice` (type: POS).
- **Reports**: Daily Shift Summary, Cashier Variance Report, POS Sales Register.
- **API Endpoints**: Shared via `/api/v1/sales/invoices`.
- **Repository**: `LocalSalesRepository`.
- **Statuses**: `Open`, `Closed`.

---

### 2.6 Cashbox & Treasury (`CashboxModule.tsx`)
- **Classification**: 🟡 PARTIAL (Maturity: 6.5/10)
- **Submodules & Screens**:
  1. `terminal`: Cash Safe Journal (Inflow/outflow transaction history).
  2. `vouchers`: Receipt & Payment Vouchers (Petty cash voucher creator).
- **Core Entities**: `CashboxTransaction`, `BankTransaction`.
- **Actions**: `addCashboxTransaction`, `deleteCashboxTransaction`.
- **Reports**: Cashbook Daily Summary, Voucher Register.
- **API Endpoints**: Integrated into `/api/v1/accounts`.
- **Repository**: `LocalAccountRepository`.
- **Statuses**: `Posted`.

---

### 2.7 Manufacturing & BOM Engine (`ProductionModule.tsx`)
- **Classification**: 🔵 FOUNDATION ONLY (Maturity: 5.5/10)
- **Submodules & Screens**:
  1. `recipes`: BOM Recipe Index (Raw material composition ratios per output unit).
  2. `cost_calculator`: Production Cost Estimator (Direct labor, power, machine wear allocation).
  3. `execution`: Work Order Execution (Raw material deduction & finished goods creation).
- **Core Entities**: `Recipe`, `WorkOrder`, `Batch`.
- **Actions**: `calculateProductionCost`, `addRoastingJob`, `addGrindingJob`, `addPackagingJob`.
- **Reports**: BOM Cost Rollup Report, Production Batch Log.
- **API Endpoints**: Local engine orchestration (`ManufacturingEngine.ts`).
- **Repository**: Handled through `LocalInventoryRepository`.
- **Statuses**: `Pending`, `Completed`.

---

### 2.8 Industry Extensions — Roastery & Grinding (`RoasteryModule.tsx` & `GrindingModule.tsx`)
- **Classification**: 🟢 COMPLETE (Maturity: 8.0/10)
- **Submodules & Screens**:
  1. `roastery.jobs`: Roasting Kiln Log (Green coffee input, roasted output, weight loss % tracker).
  2. `roastery.expenses`: Roastery Direct Expenses (Fuel, gas, maintenance expense ledger).
  3. `roastery.costing`: Kiln Cost Sheet (Net unit roasting cost per kg).
  4. `grinding.jobs`: Industrial Grinder Log (Fineness microns, batch throughput).
  5. `grinding.expenses`: Grinding Direct Expenses (Power, blade replacement).
- **Core Entities**: `RoastingJob`, `GrindingJob`, `RoasteryExpense`, `GrindingExpense`.
- **Actions**: `addRoastingJob`, `addGrindingJob`, `addRoasteryExpense`, `addGrindingExpense`.
- **Reports**: Roastery P&L Statement, Grinding P&L Statement, Shrinkage Analysis.
- **API Endpoints**: Direct state & domain service wrapper.
- **Repository**: Local Storage domain structures.
- **Statuses**: `Pending`, `Completed`.

---

### 2.9 Financial Reporting & Analytics (`ReportsModule.tsx`)
- **Classification**: 🟢 COMPLETE (Maturity: 8.5/10)
- **Submodules & Screens**:
  1. `unified`: Unified Income Statement.
  2. `trial_balance`: Trial Balance (Balances & Activity).
  3. `balance_sheet`: Balance Sheet (Assets, Liabilities, Equity).
  4. `roastery`: Roastery Departmental P&L.
  5. `grinding`: Grinding Departmental P&L.
  6. `certification`: Master System Audit Certification (Real-time financial invariants check).
- **Core Entities**: Read-only views derived from `JournalEntry`, `Account`, `CostLayer`.
- **Actions**: `getTrialBalance`, `getIncomeStatement`, `getBalanceSheet`, `runMasterCertification`.
- **Reports**: Certified SOCPA / IFRS Financial Statements.
- **API Endpoints**: `GET /api/v1/reports/trial-balance`, `GET /api/v1/reports/income-statement`, `GET /api/v1/reports/balance-sheet`.
- **Repository**: Aggregate queries over `LocalJournalEntryRepository` & `LocalAccountRepository`.
- **Statuses**: N/A (Analytical Read-only).

---

### 2.10 System Administration & Security (`SettingsModule.tsx`)
- **Classification**: 🔵 FOUNDATION ONLY (Maturity: 4.0/10)
- **Submodules & Screens**:
  1. `settings`: Company Info & Tax Configuration (ZATCA VAT 15%, logo, commercial ID).
  2. `backup`: Data Export & System Reset (JSON backup download, factory seed reset).
  3. `audit`: Audit Trail Inspector (`AuditLog` list).
- **Core Entities**: `CompanySettings`, `AuditLog`, `User`, `UserRole`.
- **Actions**: `setCompanySettings`, `createBackup`, `resetToDefault`, `addAuditLog`.
- **Reports**: System Audit Log Export.
- **API Endpoints**: Local state management.
- **Repository**: `LocalAuditRepository`.
- **Statuses**: Active, Archived.
