# NOVARO ERP — UX/UI ARCHITECTURE & INTERFACE STANDARD
## Document Reference: STD-UX-2026-V1.0
**Product**: NOVARO ERP (Enterprise Industrial Roastery & Financial Core)  
**Status**: Formal Architectural Standard  
**Scope**: All UI Components, Layouts, Navigation, Forms, Tables, Dialogs, States, and User Experience Patterns.

---

## 1. Core Principles (فلسفة التجربة الموحدة)

1. **Absolute Predictability (التوقع المتطابق)**:
   The user should never have to re-learn how to create, edit, save, delete, search, print, or navigate when moving between different modules. A button in Accounting must behave, look, and sit in the exact same relative position as in Sales, Inventory, or Production.

2. **Always Situated (الموقع والوجهة دائمًا واضحة)**:
   At any microsecond of operation, the interface answers eight questions:
   - **أين أنا؟** (Current Domain & Screen via Breadcrumbs & PageHeader)
   - **ماذا أفعل؟** (Action Context: List view, Create draft, Edit record, View details)
   - **ما السجل الذي أعمل عليه؟** (Record Identifier: `#INV-1024`, `#JE-1002`, `#SKU-770`)
   - **ما الإجراء التالي؟** (Clear Primary Action: Save draft, Post to ledger, Receive PO)
   - **أين أبحث؟** (Dedicated, unified SearchBar with instant filtering)
   - **كيف أحفظ؟** (Primary `حفظ` button visible only in edit/input modes)
   - **كيف أعدل؟** (`تعديل` button converting view into edit mode)
   - **كيف أطبع وأعود؟** (Standardized `طباعة` and `إلغاء / عودة` actions)

3. **Domain Integrity & Zero Business Logic Leakage**:
   The UI/UX presentation layer is strictly a presentation and interaction orchestrator. It consumes contracts from `StateContext` and Domain Engines without altering double-entry invariants, FIFO valuation, or stock accounting rules.

---

## 2. Information Architecture (الهيكل العام للوحدات)

NOVARO ERP is structured into **8 High-Level Business Domains**, cleanly partitioned into Submodules, Screens, and Document Views:

```
NOVARO ERP
│
├── 1. لوحة التحكم والعمليات (Dashboard & Operations)
│    └── لوحة التشغيل والمؤشرات الفورية (Live Factory Telemetry & KPIs)
│
├── 2. المحاسبة والمالية (Accounting & Finance)
│    ├── شجرة الحسابات (Chart of Accounts - Master Data)
│    ├── قيود اليومية وسند القيد المزدوج (Journal Entries & Voucher Builder)
│    ├── دورة اعتماد المستندات (Document Approval Workflow)
│    ├── القيود الدورية المتكررة (Recurring Journal Entries)
│    ├── أسعار صرف العملات الأجنبية (Exchange Rates & FX)
│    ├── الإقفال المالي السنوي (Fiscal Period & Year-End Closing)
│    ├── التحويلات البنكية والنقدية (Bank & Cash Transfers)
│    └── القوائم والتقارير المالية (Financial Reports: TB, Balance Sheet, P&L, Audit)
│
├── 3. المبيعات وإدارة العملاء (Sales & CRM)
│    ├── فواتير مبيعات التجزئة (Retail & Direct Sales Invoices)
│    ├── مبيعات وتوزيع الجملة (Wholesale B2B Invoicing & Dispatch)
│    ├── كاشير نقاط البيع (Retail POS Terminal & Quick Register)
│    ├── دليل العملاء (Customer Directory & Profiles)
│    └── كشوفات الحسابات والتحصيلات (Customer Subledger, Statements & Collections)
│
├── 4. المشتريات وإدارة الموردين (Purchases & SRM)
│    ├── طلبات وفواتير الشراء (Purchase Orders & Invoices)
│    ├── استلام وتخزين الشحنات (Cargo Receiving & FIFO Intake)
│    └── دليل الموردين ومتابعة الالتزامات (Supplier Directory & Accounts Payable)
│
├── 5. المستودعات والمخزون (Inventory & Warehousing)
│    ├── كتالوج الأصناف والمواد الخام (Item Catalog & SKU Directory)
│    ├── دُفعات التكلفة ومطابقة FIFO (Lot Batches & FIFO Cost Layers)
│    ├── تسويات فروقات الجرد (Inventory Stock Adjustments)
│    ├── مناقلات المستودعات (Inter-Warehouse Stock Transfers)
│    └── استوديو الباركود وملصقات التتبع (Barcode Studio & Printing)
│
├── 6. الإنتاج والتصنيع (Manufacturing & Production)
│    ├── وصفات وخلطات التصنيع (BOM Recipes Master Data)
│    ├── أوامر وتشغيل التحميص (Roasting Kiln Operations & Yield Tracking)
│    ├── أوامر وتشغيل الطحن (Grinding Operations & Fineness Settings)
│    ├── أوامر التعبئة والتغليف (Packaging & Finished Goods Casing)
│    └── تكاليف التشغيل المباشرة (Direct Production Expenses: Gas, Power, Labor)
│
├── 7. الخزينة والنقدية (Treasury & Cashbox)
│    ├── محطة ورصيد الخزينة الفوري (Safe Cashbox Live Terminal)
│    └── سندات القبض والصرف والمصروفات (Receipt, Payment & Expense Vouchers)
│
└── 8. الإعدادات وسجل التدقيق (Settings & Security)
     ├── بيانات المنشأة والتهيئة الضريبية (Enterprise Profile & ZATCA/VAT Config)
     ├── سجل التدقيق الأمني (Audit Log Trail & Timestamps)
     └── النسخ الاحتياطي واستعادة البيانات (Snapshot Backups & Restore)
```

---

## 3. Global Page Layout Specification (المعيار الموحد لهيكل الشاشة)

Every screen in the system follows an invariable 5-zone vertical blueprint:

```
┌─────────────────────────────────────────────────────────────────────────┐
│ ZONE 1: TOP APPLICATION BAR (Global)                                    │
│ [Brand NV] | [Breadcrumb: Domain > Submodule] | [Lang AR/EN] | [User]   │
├─────────────────────────────────────────────────────────────────────────┤
│ ZONE 2: PAGE HEADER                                                     │
│ Page Title (Space Grotesk)                  Action Region               │
│ Brief Description / Subtitle                [Primary: + جديد] [Secondary]│
├─────────────────────────────────────────────────────────────────────────┤
│ ZONE 3: SECONDARY NAVIGATION (When Submodules exist)                    │
│ [Tab 1: Active]   [Tab 2]   [Tab 3]   [Tab 4]                           │
├─────────────────────────────────────────────────────────────────────────┤
│ ZONE 4: TOOLBAR & ACTION BAR                                            │
│ [🔎 بحث موحد...]  [فلاتر / تصفية]  [تصدير Excel/CSV]  [تحديث] [إجمالي]  │
├─────────────────────────────────────────────────────────────────────────┤
│ ZONE 5: MAIN CONTENT VIEWPORT                                           │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ Unified DataTable / Master-Detail Form / Document View / KPI Cards  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│ ZONE 6: FOOTER / STATUS & PAGINATION                                    │
│ [السجلات: 1 - 10 من 45]             [الصفحة 1 من 5] [< السابق] [التالي >]│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Standardized Button Matrix & Action Hierarchy

Buttons are strictly stratified by semantic visual weight. Two primary buttons of identical weight are **strictly forbidden** within the same context.

| Action Name | Arabic Label | English Label | Visual Style | Placement | Icon | Permitted State |
|:---|:---|:---|:---|:---|:---|:---|
| **Primary Add** | `+ جديد` أو `+ إضافة` | `+ New` / `+ Add` | Solid Brand Teal (`bg-teal-700 text-white hover:bg-teal-800`) | Top-Left (RTL) / Top-Right (LTR) of PageHeader | `Plus` | List / Index Mode |
| **Save** | `حفظ السجل` | `Save Record` | Solid Brand Teal (`bg-teal-700 text-white hover:bg-teal-800`) | Bottom of Form / Action Bar | `Check` / `Save` | Create / Edit Mode Only |
| **Edit** | `تعديل` | `Edit` | Outline Slate (`border border-slate-300 text-slate-700 hover:bg-slate-50`) | Row Action Menu or Document Header | `Edit` | Unposted / Unlocked Records |
| **Delete** | `حذف` | `Delete` | Soft Destructive (`text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200`) | Modal or Row Action Menu | `Trash2` | Drafts / Master records without relations |
| **Post** | `ترحيل للميزان` | `Post to Ledger` | Solid Emerald (`bg-emerald-600 text-white hover:bg-emerald-700`) | Document Header | `ArrowUpRight` / `CheckCircle` | Balanced Drafts in Open Fiscal Periods |
| **Reverse** | `عكس القيد` | `Reverse Entry` | Outline Amber (`border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100`) | Document Header | `RotateCcw` | Posted Journal Entries Only |
| **Search** | `بحث...` | `Search...` | Unified Search Input (`border border-slate-250 bg-white text-slate-800`) | Toolbar (Leading) | `Search` | Always Accessible |
| **Print** | `طباعة` | `Print` | Ghost Slate (`text-slate-600 hover:text-slate-900 hover:bg-slate-100`) | Toolbar / Document Header | `Printer` | List / Document View |
| **Export** | `تصدير` | `Export` | Ghost Slate with Dropdown (`Excel`, `CSV`) | Toolbar | `Download` | Data Tables |
| **Refresh** | `تحديث` | `Refresh` | Ghost Slate icon-button | Toolbar | `RefreshCw` | Data Tables / Dashboards |
| **Cancel** | `إلغاء` | `Cancel` | Neutral Outline (`text-slate-600 hover:bg-slate-100`) | Modal Footer / Form Actions | `X` | Active Modal / Edit Mode |
| **Close** | `إغلاق` | `Close` | Neutral Outline | Modal Header / Drawer | `X` | Modal / Drawer |

---

## 5. Form Standardization Standard (معيار النماذج وحقول الإدخال)

All forms adhere to the following strict layout and validation rules:
1. **Clear Grouping**: Split complex forms into semantic `<FormSection>` cards with a clear title and subtitle.
2. **Standard Grid Spacing**:
   - Desktop: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
   - Spacing between fields: 16px (`gap-4`).
3. **Labels & Required Indicators**:
   - Every input has a dedicated `<label>` element with `font-semibold text-xs text-slate-700 mb-1`.
   - Mandatory fields feature a high-contrast crimson asterisk: `<span className="text-rose-500 font-bold">*</span>`.
4. **Input Box Aesthetics**:
   - Height: 38px (`h-9.5` or `py-2 px-3`).
   - Text size: 13px (`text-xs` or `text-sm`).
   - Border: `border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all`.
   - Numbers & Amounts: Always set to tabular monospaced numbers (`font-mono text-left` in RTL for correct mathematical readability, or `dir="ltr"`).
5. **Validation & Inline Errors**:
   - Field-level errors appear directly below the offending input with an `AlertCircle` icon and `text-rose-600 text-[11px] font-medium`.

---

## 6. Table & Data Grid Standard (معيار الجداول والقوائم)

All tables must provide:
1. **Header Contrast**: Subtle slate background (`bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider`).
2. **Row Interaction**: Smooth hover feedback (`hover:bg-slate-50/80 transition-colors`).
3. **Monospaced Figures**: Currency (SAR), weights (kg), SKU codes, and dates are always formatted in tabular monospaced typography (`font-mono`).
4. **Row Actions**: No cluttered horizontal button rows. Use a unified `ActionMenu` or clear, consistent mini-buttons (`عرض`, `تعديل`, `حذف`).
5. **Integrated States**:
   - Loading: Skeleton table rows matching the column structure.
   - Empty: Centered `<EmptyState>` with context-specific advice and action button.
   - Error: Prominent alert with reload retry button.

---

## 7. Status Badge Mapping Matrix (توحيد شارات وحالات المستندات)

Status badges must use identical color tokens across all modules:

| Semantic Status | Arabic Label | English Label | Colors (Badge Token) | Used In |
|:---|:---|:---|:---|:---|
| **Draft** | `مسودة` | `Draft` | `bg-slate-100 text-slate-700 border-slate-300` | Journal Entries, POs, Invoices |
| **Posted** | `مرحل` | `Posted` | `bg-emerald-50 text-emerald-800 border-emerald-200` | Journal Entries, Sales Invoices |
| **Reversed** | `معكوس` | `Reversed` | `bg-amber-50 text-amber-800 border-amber-200` | Journal Entries |
| **Paid** | `مسدد بالكامل` | `Paid` | `bg-teal-50 text-teal-800 border-teal-200` | Invoices, Collections |
| **Unpaid / Overdue** | `مستحق السداد` | `Unpaid` | `bg-rose-50 text-rose-800 border-rose-200` | Invoices, Customer Debts |
| **Received** | `مستلم ومفروز` | `Received` | `bg-emerald-50 text-emerald-800 border-emerald-200` | Purchase Orders |
| **In Transit** | `تحت التوريد` | `In Transit` | `bg-sky-50 text-sky-800 border-sky-200` | Cargo Shipments |
| **Completed** | `مكتمل` | `Completed` | `bg-emerald-50 text-emerald-800 border-emerald-200` | Roasting & Grinding Jobs |
| **In Progress** | `قيد التشغيل` | `In Progress` | `bg-indigo-50 text-indigo-800 border-indigo-200` | Active Roasting Kiln |
| **Cancelled / Void**| `ملغي` | `Void / Cancelled` | `bg-rose-100 text-rose-900 border-rose-300` | Cancelled Documents |

---

## 8. Dialog & Confirmation Standards (معيار الحوارات والتأكيدات)

1. **Destructive Actions Guard**:
   - No deletion or reversal takes place without an explicit `<ConfirmDialog>`.
   - The dialog specifies:
     - Clear title: `حذف السجل؟`
     - Descriptive text containing the exact entity identifier: `هل أنت متأكد من حذف العميل [مؤسسة حبوب الشرق]؟ هذا الإجراء لا يمكن التراجع عنه.`
     - Two buttons: `إلغاء` (Neutral) and `تأكيد الحذف` (Destructive Red).
2. **Keyboard Accessibility**:
   - `Escape` key immediately closes open dialogs without submitting.
   - `Enter` submits safe forms, but does NOT trigger destructive actions by accident.
   - Focus is trapped within modal dialogs while active.

---

## 9. Notification & Toast Standard (معيار الإشعارات التنبيهية)

Toasts must render at the top-center / top-right of the viewport with high visual elevation:
- **Success (`success`)**: Emerald icon (`CheckCircle`), clear confirmation text (e.g. `تم حفظ الفاتورة بنجاح وترحيل القيود`).
- **Error (`error`)**: Rose icon (`AlertCircle`), actionable message explaining root cause.
- **Warning (`warning`)**: Amber icon (`AlertTriangle`), e.g., `رصيد الصندوق غير كافٍ لإجراء هذا الصرف`.
- **Info (`info`)**: Sky icon (`Info`), system operational alerts.
- Auto-dismiss duration: 4500ms, with pause on hover and dismiss `X` button.

---

## 10. RTL & Bilingual (Arabic / English) Integrity

1. **RTL First-Class Delivery**:
   - Global direction: `dir="rtl"` by default, fully switchable to `dir="ltr"`.
   - Alignment: Icons sit on the leading edge (right in RTL, left in LTR).
   - Breadcrumbs: Point from broad domain to specific leaf (`المحاسبة / قيود اليومية / قيد جديد`).
2. **Numeric Fields**:
   - Financial figures, quantities, barcodes, and IBANs are strictly formatted with Latin numerals (`0-9`) in tabular mono fonts to ensure mathematical auditability.
   - Currency symbol follows standard Saudi Arabian financial formatting: `SAR 125,000.00` or `125,000.00 ر.س`.
