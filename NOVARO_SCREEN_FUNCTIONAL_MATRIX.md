# NOVARO ERP — Screen & Functional Matrix
**Document Ref:** `NOVARO_SCREEN_FUNCTIONAL_MATRIX.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  
**Standard Architecture:** Unified ERP Layout (`PageHeader`, `ERPTable`, `FormSection`, `FormField`, `ConfirmDialog`, `StatusBadge`, `EmptyState`)  

---

## 1. Functional Screen Matrix

| Screen Key | Screen Title | Archetype | Standard Layout Components | Primary State Hook / Source | Ledger & Inventory Impact |
| :--- | :--- | :---: | :--- | :--- | :--- |
| `overview` | لوحة التشغيل والمؤشرات | **Report** | `PageHeader`, KPI Cards, Quick Actions Bar | `useAppState()` aggregate selectors | Read-only aggregate metrics |
| `accounting.coa` | شجرة الحسابات | **Master Data** | `PageHeader`, Hierarchy Tree, Add Account Modal | `accounts`, `addAccount`, `updateAccount` | Defines chart structure |
| `accounting.je` | منشئ القيود اليومية | **Transaction** | `PageHeader`, Double-entry Form, Balance Checker | `postJournalEntry`, `accounts` | Debits/Credits General Ledger |
| `accounting.workflow` | رقابة وتدقيق القيود | **Transaction** | `PageHeader`, `ERPTable`, Batch Action Bar | `journalEntries`, `updateDocumentWorkflowStatus` | Validates & posts journal entries |
| `accounting.recurring` | القيود الدورية | **Master Data** | `PageHeader`, Schedule Form, `ERPTable` | `recurringEntries`, `postRecurringEntry` | Auto-posts scheduled vouchers |
| `accounting.exchange` | أسعار الصرف | **System & Control**| `PageHeader`, Currency Matrix Grid | `exchangeRates`, `setExchangeRates` | Foreign currency revaluation base |
| `accounting.closing` | إقفال السنة المالية | **System & Control**| `PageHeader`, Fiscal Period Form, Warning Card | `fiscalYearClosing`, `fiscalPeriods` | Closes P&L to Retained Earnings |
| `customers` | دليل العملاء | **Master Data** | `PageHeader`, `ERPTable`, Drawer Modal | `customers`, `addCustomer`, `updateCustomer` | Sub-ledger entity registry |
| `customerLedger` | كشف حساب العميل | **Report** | `PageHeader`, Date Filter, Ledger Table | `customerMovements`, `getTrialBalance` | AR Sub-ledger audit trail |
| `suppliers` | دليل الموردين | **Master Data** | `PageHeader`, `ERPTable`, Drawer Modal | `suppliers`, `addSupplier`, `updateSupplier` | Sub-ledger entity registry |
| `purchases.new` | فاتورة مشتريات جديدة | **Transaction** | `PageHeader`, Order Form, Item Picker Grid | `addPurchaseOrder`, `receivePurchaseOrder` | Debits Inventory, Credits AP |
| `purchases.list` | سجل المشتريات | **Report** | `PageHeader`, `ERPTable`, Status Badges | `purchaseOrders` | AP Purchase history audit |
| `sales.billing` | فواتير المبيعات العامة | **Transaction** | `PageHeader`, Invoice Form, Tax/VAT Calc | `addSalesInvoice`, `items`, `customers` | Debits AR/Cash, Credits Sales & COGS |
| `wholesale.billing` | فاتورة جملة جديدة | **Transaction** | `PageHeader`, Bulk Order Form, Dispatch Notes | `addSalesInvoice` (type: Wholesale) | Bulk inventory reduction & AR credit |
| `wholesale.margins` | هوامش الأرباح | **Report** | `PageHeader`, Margin Table, Progress Meters | Calculated from `items` and `costLayers` | Gross margin inspection |
| `pos.terminal` | كاشير نقاط البيع | **Transaction** | `PageHeader`, Touch Item Grid, Quick Tender Bar | `addSalesInvoice` (type: POS), `posSessions` | Instant cash sale & stock reduction |
| `pos.session` | فتح/إغلاق الوردية | **Transaction** | `PageHeader`, Cash Drawer Input Form | `openPOSSession`, `closePOSSession` | Cash drawer tally & variance check |
| `cashbox.terminal` | دفتر حركة الصندوق | **Report** | `PageHeader`, `ERPTable`, Action Triggers | `cashboxTransactions` | Treasury cash inflow/outflow log |
| `cashbox.vouchers` | سندات القبض والصرف | **Transaction** | `PageHeader`, Voucher Form, Account Selector | `addCashboxTransaction` | Debits/Credits Safe account |
| `inventory.catalog` | كتالوج الأصناف | **Master Data** | `PageHeader`, `ERPTable`, SKU Drawer | `items`, `addItem`, `updateItem`, `deleteItem` | Valuation base for stock items |
| `inventory.lots` | وجبات FIFO التتبعية | **Report** | `PageHeader`, `ERPTable`, Expiry Badges | `costLayers`, `batches` | FIFO cost layer valuation inspection |
| `inventory.adjustments`| تسويات الجرد | **Transaction** | `PageHeader`, Variance Form, Audit Note | `addInventoryAdjustment` | Debits/Credits Shrinkage expense |
| `inventory.transfers` | تحويلات المستودعات | **Transaction** | `PageHeader`, Warehouse Picker, Items Grid | `addStockTransfer` | Relocates stock between warehouses |
| `production.recipes` | معايير الوصفات (BOM) | **Master Data** | `PageHeader`, Recipe Composition Form | `recipes`, `addRecipe` | Manufacturing cost rollup basis |
| `production.roasting` | تشغيل المحمصة | **Transaction** | `PageHeader`, Kiln Profile Form, Loss % Calc | `addRoastingJob` | Converts Green Coffee to Roasted |
| `production.grinding` | تشغيل المطاحن | **Transaction** | `PageHeader`, Micron Calibrator, Run Form | `addGrindingJob` | Converts Roasted to Ground Coffee |
| `roastery.expenses` | مصروفات المحمصة | **Transaction** | `PageHeader`, Direct Expense Form, `ERPTable` | `roasteryExpenses`, `addRoasteryExpense` | Roastery direct overhead allocation |
| `grinding.expenses` | مصروفات المطحنة | **Transaction** | `PageHeader`, Direct Expense Form, `ERPTable` | `grindingExpenses`, `addGrindingExpense` | Grinding direct overhead allocation |
| `reports.income` | قائمة الدخل | **Report** | `PageHeader`, Period Selector, Statement Table| `getIncomeStatement` | Financial performance audit |
| `reports.balance_sheet`| الميزانية العمومية | **Report** | `PageHeader`, Date Picker, Asset/Liab Tree | `getBalanceSheet` | Financial position audit |
| `reports.trial_balance`| ميزان المراجعة | **Report** | `PageHeader`, Search Bar, Balance Checker | `getTrialBalance` | Ledger debit = credit equality audit |
| `reports.certification`| شهادة الاعتماد | **Report** | `PageHeader`, Invariant Checklist Cards | `runMasterCertification` | SOCPA/IFRS mathematical audit pass |
| `settings.general` | إعدادات المنشأة والضريبة | **System & Control**| `PageHeader`, `FormSection`, ZATCA VAT Input | `companySettings`, `setCompanySettings` | Global tenant tax & entity config |
| `settings.backup` | النسخ الاحتياطي | **System & Control**| `PageHeader`, Backup Table, Reset Button | `createBackup`, `resetToDefault` | Storage JSON backup & restoration |

---

## 2. Standardized CRUD Pattern Compliance Checklist

Every screen in the inventory adheres to the standardized page layout pattern:

1. **Header Layer**: `<PageHeader />` providing contextual title, bilingual description, lead icon, breadcrumbs, and primary action buttons.
2. **Tabbed Navigation Layer**: Sub-tab pills (`p-1 bg-slate-100/90 rounded-xl`) for multi-view screens.
3. **Data Grid Layer**: `<ERPTable />` with full sorting, filtering, empty state handling, and status badges.
4. **Form Input Layer**: `<FormSection />` and `<FormField />` enforcing clear labels, helpers, and validation messages.
5. **Confirmation Layer**: `<ConfirmDialog />` wrapping all destructive (delete, reset, cancel) operations.
