# NOVARO ERP — COMPREHENSIVE SCREEN INVENTORY
## Document Reference: INV-SCR-2026-V1.0
**Product**: NOVARO ERP  
**Coverage**: 100% of Active System Screens & Views

---

| Domain (المجال) | Submodule (الوحدة الفرعية) | Screen Name (اسم الشاشة) | Type | Supported Actions | Standardization Status |
|:---|:---|:---|:---|:---|:---|
| **لوحة التحكم (Dashboard)** | Operations | لوحة التحكم والتشغيل الفورية (Live Factory Telemetry) | Overview / Dashboard | Refresh, Date Filter, KPI Drilldown | Standardized |
| **المحاسبة والمالية (Accounting)** | Accounts | شجرة الحسابات العامة (Chart of Accounts) | Master Data / Tree | Search, Expand/Collapse, View Balances, Export | Standardized |
| **المحاسبة والمالية (Accounting)** | Journal | دفتر قيود اليومية ومحرر السندات (Journal Entries) | Transaction / Ledger | New Voucher, Post, Reverse, Print, Filter, Export | Standardized |
| **المحاسبة والمالية (Accounting)** | Workflow | دورة اعتماد المستندات (Document Approval Workflow) | Operations / Workflow | Approve, Reject, Filter by Status, View Detail | Standardized |
| **المحاسبة والمالية (Accounting)** | Recurring | القيود الدورية المتكررة (Recurring Entries) | Automation / Schedule | New Recurring, Trigger Manual Run, Pause | Standardized |
| **المحاسبة والمالية (Accounting)** | Exchange | أسعار صرف العملات الأجنبية (Exchange Rates & FX) | Configuration | Edit Rates, Add Currency Pair, Toggle Base | Standardized |
| **المحاسبة والمالية (Accounting)** | Fiscal | الإقفال المالي السنوي (Fiscal Year Closing) | Critical Transaction | Review Balances, Run Closing Procedure, Lock | Standardized |
| **المحاسبة والمالية (Accounting)** | Banking | التحويلات النقدية والبنكية (Cash & Bank Transfers) | Transaction | New Transfer, Balance Validation, Print Voucher | Standardized |
| **المحاسبة والمالية (Accounting)** | Reports | ميزان المراجعة (Trial Balance) | Financial Report | Date Filter, Check Equilibrium ($\Delta=0$), Print, Export | Standardized |
| **المحاسبة والمالية (Accounting)** | Reports | قائمة الدخل والأرباح (Income Statement / P&L) | Financial Report | Date Range, Gross Margin, Net Profit, Print | Standardized |
| **المحاسبة والمالية (Accounting)** | Reports | الميزانية العمومية (Balance Sheet) | Financial Report | Period Selector, Assets vs Liabilities+Equity, Print | Standardized |
| **المحاسبة والمالية (Accounting)** | Reports | تدقيق شهادة النظام النزاهة (Integrity Audit) | Diagnostic Report | Run Full Audit, View Invariants Checklist, Print | Standardized |
| **المبيعات وإدارة العملاء (Sales)** | Invoices | فواتير المبيعات العامة (Sales Invoices) | Transaction / CRUD | + New Invoice, Print Tax Invoice, Search, Filter | Standardized |
| **المبيعات وإدارة العملاء (Sales)** | Wholesale | مبيعات وتوزيع الجملة (Wholesale B2B Dispatching) | Transaction / B2B | Add Wholesale Items, Bulk Discount, Dispatch, Print | Standardized |
| **المبيعات وإدارة العملاء (Sales)** | POS | نقطة بيع التجزئة والكاشير (Retail POS Terminal) | High-Speed Terminal | Quick Cart Add, Stock Limit Check, Cash/Card Checkout, Print Slip | Standardized |
| **المبيعات وإدارة العملاء (Sales)** | Customers | دليل العملاء (Customer Master Directory) | Master Data / CRUD | + New Customer, Edit, Delete (with Confirm), Search, View Balance | Standardized |
| **المبيعات وإدارة العملاء (Sales)** | Ledger | كشف حساب ومطالبات العملاء (Customer Subledger) | Financial Subledger | View Statement, New Collection Voucher, Export, Print | Standardized |
| **المشتريات وإدارة الموردين (Purchases)** | Orders | طلبات وفواتير الشراء (Purchase Orders) | Transaction / CRUD | + New PO, Receive Cargo (FIFO Intake), Print, Filter | Standardized |
| **المشتريات وإدارة الموردين (Purchases)** | Suppliers | دليل الموردين ومتابعة الالتزامات (Supplier Directory) | Master Data / CRUD | + New Supplier, Edit, Delete (with Confirm), Search, View Payables | Standardized |
| **المستودعات والمخزون (Inventory)** | Catalog | كتالوج الأصناف والمواد الخام (Item SKU Catalog) | Master Data / CRUD | + New Item, Inline Edit, Delete (with Confirm), Filter by Category | Standardized |
| **المستودعات والمخزون (Inventory)** | Batches | دُفعات التكلفة ومطابقة FIFO (Cost Batches & Layers) | Inventory Subledger | View FIFO Layers, Filter by Warehouse, Track Depletion | Standardized |
| **المستودعات والمخزون (Inventory)** | Adjustments | تسويات الجرد المخزني (Stock Adjustments) | Transaction | + New Adjustment, Reason, Warehouse Selection, Post | Standardized |
| **المستودعات والمخزون (Inventory)** | Transfers | مناقلات المستودعات (Inter-Warehouse Transfers) | Transaction | + New Transfer, Source/Dest Wh, Quantity Check | Standardized |
| **المستودعات والمخزون (Inventory)** | Barcodes | استوديو الباركود والملصقات (Barcode Studio) | Utility / Tool | Select SKU, Generate Barcode, Print Label | Standardized |
| **الإنتاج والتصنيع (Manufacturing)** | Recipes | وصفات وخلطات التصنيع (BOM Recipes) | Master Data / CRUD | + New Recipe, Multi-Input BOM Ratios, Output Yield | Standardized |
| **الإنتاج والتصنيع (Manufacturing)** | Roasting | أوامر وتشغيل التحميص (Roasting Kiln Operations) | Manufacturing Floor | Start Roasting Simulator, Moisture Loss Tracking, Log Scrap | Standardized |
| **الإنتاج والتصنيع (Manufacturing)** | Grinding | أوامر وتشغيل الطحن (Grinding Operations) | Manufacturing Floor | Run Grinder Job, Micron Fineness Setting, Weight Verification | Standardized |
| **الإنتاج والتصنيع (Manufacturing)** | Packaging | أوامر التعبئة والتغليف (Packaging & Casing) | Manufacturing Floor | Run Packaging Job, Finished Goods Serial Allocation | Standardized |
| **الإنتاج والتصنيع (Manufacturing)** | Expenses | تكاليف تشغيل المحامص والمطاحن (Plant Direct Expenses) | Expense Ledger | + Add Operational Expense (Gas, Power, Blades, Labor), Delete | Standardized |
| **الخزينة والنقدية (Treasury)** | Terminal | محطة ورصيد الخزينة الفوري (Cashbox Live Terminal) | Real-Time Dashboard | Live Safe Box Balance, Receipts Sum, Payments Sum | Standardized |
| **الخزينة والنقدية (Treasury)** | Vouchers | سندات القبض والصرف والمصروفات (Cashbox Vouchers) | Financial Transaction | + New Voucher, Type (Receipt/Disbursement/Expense), Print | Standardized |
| **الإعدادات وسجل التدقيق (Settings)** | Enterprise | بيانات المنشأة والتهيئة الضريبية (Enterprise Profile) | Configuration | Edit Company Info, VAT Rate %, Save Settings | Standardized |
| **الإعدادات وسجل التدقيق (Settings)** | Audit | سجل التدقيق والرقابة (Audit Log Trail) | Compliance Log | Search Audit Records, Timestamps, User Actions | Standardized |
| **الإعدادات وسجل التدقيق (Settings)** | Backups | النسخ الاحتياطي واستعادة البيانات (Data Backups) | System Management | Create Full State Snapshot, View Historic Backups | Standardized |

**Total Registered System Screens**: 34 Standardized Screens across 8 Business Domains.
