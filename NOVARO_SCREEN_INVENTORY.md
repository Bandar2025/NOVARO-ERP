# NOVARO ERP — Screen & Module Architectural Inventory
**Document Ref:** `NOVARO_SCREEN_INVENTORY.md`  
**Standardized Architecture:** Unified ERP Layout (`PageHeader`, `ERPTable`, `FormSection`, `FormField`, `ConfirmDialog`, `StatusBadge`, `EmptyState`)  
**Compliance Target:** SOCPA / IFRS / ZATCA Double-Entry Ledger System

---

## 1. Executive Overview & Classification Matrix

This inventory categorizes all screens, sub-views, and functional modules within **NOVARO ERP** into four primary functional archetypes to ensure architectural consistency across development and UX engineering:

| Archetype | Description | Standard Pattern Applied |
| :--- | :--- | :--- |
| **Master Data (MD)** | Core dimensional entities (Accounts, Customers, Suppliers, Items/SKUs, Recipes). | `PageHeader` + `ERPTable` (search/filter/sort) + Modal/Drawer `FormSection` + `ConfirmDialog` + `StatusBadge`. |
| **Transaction (TX)** | Operational processing, journals, receipts, purchases, sales, and manufacturing runs. | Split layout or Stepper + Auto-calculation engine + Double-entry ledger hooks + Real-time validation + Post/Hold triggers. |
| **Report / Inquiry (RP)** | Certified audit reports, trial balances, cost analyses, and chronological statements. | `PageHeader` (with audit actions & print triggers) + Parameter selection + Tabular ledger view (`ERPTable`) + Summary KPIs. |
| **System & Control (SC)** | Governance, periodic closures, exchange rates, VAT configurations, and database backups. | Form & control sections + Warning modals (`ConfirmDialog` with destructive variants) + System health audit hooks. |

---

## 2. Complete Functional Screen Inventory

### A. General Ledger & Accounting (`AccountingModule.tsx`)
*Route Key:* `accounting` | *Lead Icon:* `BookOpen`

| Sub-Screen / View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `coa` | شجرة الحسابات (Chart of Accounts) | **Master Data** | Hierarchical Tree Table, Account Creation Drawer, Account Type Badges | Fundamental ledger chart structure |
| `je` | منشئ القيود (Journal Voucher Creator) | **Transaction** | Double-entry voucher lines, Debit/Credit balancing validator, Currency selector | Creates `JournalEntry` (Draft or Posted) |
| `workflow` | رقابة القيود والترحيل (Workflow & Posting Control) | **Transaction** | Status filter tabs (Pending/Posted/Rejected), Batch posting action, Detail review | Posts vouchers to General Ledger |
| `recurring` | القيود الدورية (Recurring Templates) | **Master Data** | Template schedule config, Interval picker (Monthly/Quarterly), Execution log | Auto-generates journal drafts |
| `exchange` | أسعار الصرف (Foreign Currency Exchange Rates) | **System & Control** | Multi-currency table, Base rate updater, Daily rate history | FX revaluation & conversion base |
| `closing` | إقفال السنة المالية (Year-End Financial Closing) | **System & Control** | Fiscal period selector, Retained earnings closing summary, Lock trigger | Closes P&L to Retained Earnings |
| `cash_banks` | الخزينة والتحويلات (Cash & Bank Accounts) | **Master Data** | Bank/Cashbox list, Reconciliation triggers, Account balance chips | Cash flow ledger nodes |
| `settings` | إعدادات الشركة المالية (Financial Settings) | **System & Control** | Fiscal year dates, Auto-numbering rules, Default tax accounts | System configuration |

---

### B. Customers & Receivables (`CustomersModule.tsx` & `CustomerLedgerModule.tsx`)
*Route Keys:* `customers`, `customerLedger` | *Lead Icons:* `Users`, `BookMarked`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `CustomersModule` | دليل العملاء (Customer Directory) | **Master Data** | `ERPTable`, Add/Edit Customer modal, Credit limit & Tax ID fields, `StatusBadge` | Sub-ledger entity registry |
| `CustomerLedgerModule` | كشف حساب العميل التراكمي (Customer Account Ledger) | **Report / Inquiry** | Date range picker, Running balance calculation, Invoices & receipts drill-down, Export/Print | Customer sub-ledger audit trail |

---

### C. Suppliers & Payables (`SuppliersModule.tsx`)
*Route Key:* `suppliers` | *Lead Icon:* `Truck`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `SuppliersModule` | إدارة الموردين والمستحقات (Vendor Management) | **Master Data** | `ERPTable`, Add/Edit Supplier modal, Tax ID (VAT), Balance summary cards | Vendor sub-ledger entity registry |

---

### D. Purchases & Procurement (`PurchasesModule.tsx`)
*Route Key:* `purchases` | *Lead Icon:* `Building2`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `new_invoice` | فاتورة مشتريات جديدة (New Purchase Invoice) | **Transaction** | Multi-item procurement grid, Tax/VAT auto-calc, FIFO batch creation hooks, Payment terms | Debits Inventory/Expense, Credits AP/Cash |
| `invoices_list` | سجل فواتير المشتريات (Purchase Invoices Log) | **Report / Inquiry** | `ERPTable`, Status badges (Paid/Pending), PDF/Print receipt viewer, Total sum footer | Purchase history & payment tracking |

---

### E. Sales & Commercial Trading (`SalesModule.tsx` & `WholesaleModule.tsx`)
*Route Keys:* `sales`, `wholesale` | *Lead Icons:* `ShoppingCart`, `Truck`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `SalesModule` (Retail/Corporate) | فواتير المبيعات العامة (Sales Invoices & Billing) | **Transaction** | Customer selector, Line-item picker, VAT calculation, Receipt printing trigger | Credits Sales/VAT Output, Debits AR/Cash |
| `wholesale.billing` | فاتورة جملة جديدة (B2B Bulk Invoicing) | **Transaction** | Bulk item selector, Dispatch driver notes, Credit term selector, Auto lot deduction | Wholesale revenue & COGS posting |
| `wholesale.margins` | تحليل هوامش الأرباح (Wholesale Profitability) | **Report / Inquiry** | Cost vs. Selling price differential table, Margin % progress meters, Contribution analysis | Gross profit inspection |
| `wholesale.log` | سجل فواتير الجملة (Wholesale Invoices Log) | **Report / Inquiry** | Searchable `ERPTable`, Delivery dispatch status, Re-print invoices | Commercial AR tracking |

---

### F. Retail Point of Sale & Daily Operations (`DailySalesModule.tsx` & `PosModule.tsx`)
*Route Keys:* `pos`, `sales` (Daily) | *Lead Icons:* `ShoppingCart`, `ShoppingBag`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `PosModule` | كاشير ونقاط البيع السريعة (Retail POS Terminal) | **Transaction** | Touch product catalog, Real-time cart drawer, Quick cash/card tender buttons, ZATCA receipt | Instant cash sales & automated inventory decrements |
| `daily_sales.pos` | نقاط بيع فورية (Instant Counter Sale) | **Transaction** | Quick item picker, Tender method selector, Direct cashbox tie-in | Daily retail revenue entry |
| `daily_sales.return` | مرتجع مبيعات (Sales Return Processing) | **Transaction** | Invoice lookup, Reason selection, Refund cash/credit voucher generator | Reverses revenue & restocks FIFO lot |
| `daily_sales.transfer` | تحويل لحساب العميل (Credit Settlement) | **Transaction** | Customer search, Outstanding balance inspector, Payment allocation | Debits Cash, Credits Customer AR |
| `daily_sales.log` | سجل فواتير اليوم (Today's Register Log) | **Report / Inquiry** | Real-time shift timeline, Cash drawer summary, Receipt re-print | Shift closing audit |

---

### G. Cashbox & Treasury Management (`CashboxModule.tsx`)
*Route Key:* `cashbox` | *Lead Icon:* `Landmark`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `terminal` | دفتر حركة الصندوق الفوري (Cash Ledger Log) | **Report / Inquiry** | Daily inflows/outflows table, Balance status cards, `ConfirmDialog` for delete actions | Real-time cash safe audit trail |
| `vouchers` | إصدار سند قبض / صرف (Issue Receipt / Payment Voucher) | **Transaction** | Voucher type toggle (Receipt/Payment/Expense), Account picker, Amount, Note | Debits/Credits Safe account with counter-account |

---

### H. Warehouse, Materials & Supply Chain (`InventoryModule.tsx`)
*Route Key:* `inventory` | *Lead Icon:* `Package`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `catalog` | كتالوج المواد والأصناف (Material & SKU Index) | **Master Data** | `ERPTable`, Add/Edit SKU drawer, Unit & Reorder point fields, Stock badge | Inventory valuation base |
| `lots` | وجبات FIFO التتبعية (FIFO Valuation Layers & Lots) | **Report / Inquiry** | Lot creation date, Remaining quantity, Unit cost layer, Expiry tracker | Direct basis for COGS calculation |
| `adjustments` | تسويات الجرد (Physical Inventory Adjustments) | **Transaction** | Book count vs. Actual count, Variance reason, Post adjustment button | Debits/Credits Inventory Shrinkage/Gain |
| `transfers` | تحويلات المستودعات (Inter-Warehouse Transfers) | **Transaction** | Origin & Destination warehouse pickers, Item transfer list, Transit notes | Shifts assets between warehouse accounts |
| `barcodes` | استوديو الباركود (Barcode Studio) | **System & Control** | SKU code generator, Print preview layout, Multi-label paper formatting | Non-financial (Logistics support) |

---

### I. Manufacturing & Production Lines (`ProductionModule.tsx`)
*Route Key:* `production` | *Lead Icon:* `Cpu`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `recipes` | معايير الخلطات والوصفات (BOM Recipe Formulas) | **Master Data** | Bill of Materials editor, Raw material % ratios, Expected shrinkage rate | Standard manufacturing cost basis |
| `roasting` | محمصة البن التوربينية (Roasting Kiln Simulation) | **Transaction** | Green bean lot input, Temperature/profile presets, Roast loss calc | Converts Raw Materials to Work-In-Progress |
| `grinding` | طاحونة الحبوب الصناعية (Industrial Grinding Mill) | **Transaction** | Particle size calibration, Batch input, Output bin assigner | Converts Roasted Beans to Ground Goods |
| `packaging` | خط التعبئة والتغليف (Conveyor Packaging Line) | **Transaction** | Packaging unit selector (250g, 1kg), Pouch lot consumption, Finished goods barcode | Capitalizes packaging into Finished Goods inventory |

---

### J. Dedicated Industrial Roastery Department (`RoasteryModule.tsx`)
*Route Key:* `roastery` | *Lead Icon:* `Flame`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `production` | عمليات تشغيل المحمصة (Roasting Jobs Register) | **Transaction** | Batch job recorder, Green beans weight, Roasted output, Loss % monitor | WIP conversion & shrinkage recognition |
| `expenses` | مصروفات المحمصة المستقلة (Roastery Operational Expenses) | **Transaction** | Fuel, Gas, Maintenance, and Labor entry, `ConfirmDialog` delete | Direct manufacturing overhead allocation |
| `costing` | حساب التكاليف والإنتاج (Roastery Cost Sheet) | **Report / Inquiry** | Total green cost + Overhead allocation = Net Cost / KG, Historical cost curves | Finished goods unit cost basis |

---

### K. Dedicated Industrial Grinding Department (`GrindingModule.tsx`)
*Route Key:* `grinding` | *Lead Icon:* `Layers2`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `production` | عمليات تشغيل المطاحن (Grinding Production Runs) | **Transaction** | Roasted lot input, Target micron fineness, Ground output kg | WIP processing |
| `expenses` | مصروفات الطاحونة المستقلة (Grinding Operational Expenses) | **Transaction** | Power/Electricity, Blade wear, Maintenance expense logging | Grinding overhead allocation |
| `costing` | حساب التكاليف والإنتاج (Grinding Cost Sheet) | **Report / Inquiry** | Unit milling cost per kg breakdown, Net production summary | Value-added production cost basis |

---

### L. Certified Financial Reports & Invariants (`ReportsModule.tsx`)
*Route Key:* `reports` | *Lead Icon:* `FileText`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `unified` | قائمة الدخل الموحدة (Unified Income Statement) | **Report / Inquiry** | Revenue breakdown, COGS, Operating expenses, Net operating profit | Read-only ledger analytical roll-up |
| `trial_balance` | ميزان المراجعة بالمجاميع والأرصدة (Trial Balance) | **Report / Inquiry** | Opening, Period Debits/Credits, Ending balances, Balance checker | Verification of ledger debit/credit equality |
| `balance_sheet` | الميزانية العمومية والمركز المالي (Balance Sheet) | **Report / Inquiry** | Assets (Current & Non-Current), Liabilities, Equity, Real-time reconciliation | Statement of financial position |
| `roastery` | أرباح وتكاليف قسم المحمصة (Roastery P&L Statement) | **Report / Inquiry** | Roasting batch yield, Raw cost, Direct overheads, Net cost per kg | Departmental managerial accounting |
| `grinding` | أرباح وتكاليف قسم الطاحونة (Grinding P&L Statement) | **Report / Inquiry** | Milling volume, Energy/Maintenance overheads, Net added value | Departmental managerial accounting |
| `certification` | شهادة الاعتماد والرقابة المحاسبية (Audit Invariant Certification) | **Report / Inquiry** | Real-time mathematical invariant check, SOCPA/IFRS rules check, Print seal | System-wide audit pass/fail badge |

---

### M. Executive Dashboard (`DashboardOverview.tsx`)
*Route Key:* `overview` | *Lead Icon:* `LayoutDashboard`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `DashboardOverview` | لوحة القيادة التشغيلية والمؤشرات المالية (Executive Cockpit) | **Report / Inquiry** | Real-time liquidity cards, Daily revenue gauges, Roasting & warehouse alerts, Quick action bar | Aggregated operational KPI monitor |

---

### N. System Setup & Disaster Recovery (`SettingsModule.tsx`)
*Route Key:* `settings` | *Lead Icon:* `Sliders`

| Screen / Sub-View | Title (Ar / En) | Archetype | Primary Components & State | Ledger Impact |
| :--- | :--- | :---: | :--- | :--- |
| `SettingsModule` | الإعدادات العامة وتهيئة المنشأة (System Preferences & Tax Setup) | **System & Control** | Commercial Name, ZATCA 15-digit Tax ID, VAT rate %, JSON Database Backup, Factory Reset `ConfirmDialog` | Global tax & tenant configuration |

---

## 3. UI Component Standardization Checklist for New Views

Every newly engineered screen or sub-view in NOVARO ERP must implement the following design tokens and components:

1. **Header Zone:**
   - Mount `<PageHeader />` with `title`, `titleEn`, `description`, `descriptionEn`, `icon`, and dynamic `breadcrumbs`.
   - Place primary actions (e.g. `New Invoice`, `Add SKU`, `Run Audit`) in the `primaryAction` or `actions` slot.

2. **Secondary Navigation (when sub-tabs exist):**
   - Use the unified rounded bar: `p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold`.
   - Active tab: `bg-white text-slate-900 shadow-xs border border-slate-200/60`.
   - Inactive tab: `text-slate-500 hover:text-slate-800`.

3. **Data Display & Tables:**
   - All lists must be rendered via `<ERPTable />` with defined `ColumnDef[]`, supporting sorting, pagination, and `EmptyState`.

4. **Forms & Modals:**
   - Wrap inputs using `<FormSection />` and `<FormField />` with explicit `label`, `labelEn`, `hint`, and `required` indicators.

5. **Destructive & Critical Triggers:**
   - Direct `window.confirm` or `window.alert` calls are strictly banned. All deletions, cancellations, and state resets must execute through `<ConfirmDialog />`.

6. **Status & Badges:**
   - Render lifecycle indicators (Pending, Posted, Draft, Paid) using `<StatusBadge variant="..." />`.
