# NOVARO Intelligent Business Platform
## المعمارية المستهدفة (Target Architecture Specification)
**الإصدار المستهدف:** 2.0 (Intelligent Enterprise Edition)  
**تاريخ الاعتماد:** 2026-09-13  
**الحالة:** معتمدة للتحول التدريجي (Phased Evolution)  
**المبادئ:** Clean Architecture + Domain-Driven Design (DDD) + Single Source of Truth + API-First + Zero Disruption

---

### 1. الرؤية الهندسية الاستراتيجية (Strategic Architectural Vision)
تحويل نظام NOVARO ERP من تطبيق محلي يعمل بالكامل داخل المتصفح معتمد على `StateContext` و `localStorage` إلى **منصة أعمال ذكية متعددة الفروع والأنشطة (Multi-Tenant, Multi-Branch Intelligent Business Platform)** تتميز بالتالي:
1. **مصدر حقيقة موحد وغير قابل للكسر (Single Source of Truth):** القيود المحاسبية هي المصدر الوحيد لأرصدة الحسابات، وسجل الحركات المخزنية (Stock Ledger) هو المصدر الوحيد لكميات وتكاليف المخزون.
2. **فصل المعمارية إلى طبقات نظيفة (Clean Layered Architecture):** عزل قواعد الأعمال (Business Domain) تماماً عن مكتبات واجهة المستخدم وعن طرق التخزين.
3. **مرونة الأنشطة المتعددة (Generic Core + Specialized Domain Plugins):** بناء محرك إنتاج ومخزون عام قابل لخدمة أي مصنع أو نشاط تجاري، مع الحفاظ على التخصص الدقيق لصناعة تحميص وطحن البن كموديول قطاعي متخصص.
4. **الجاهزية لقواعد البيانات السحابية (Cloud & PostgreSQL Ready):** استبدال التخزين المحلي بنظام مستودعات بيانات (Repository Pattern) يدعم التخزين المحلي المؤقت (Local-First Offline) مع المزامنة الآمنة مع PostgreSQL.
5. **الذكاء الاصطناعي كطبقة تدقيق وتشغيل (AI Copilot Layer):** دمج نماذج الذكاء الاصطناعي للتدقيق المحاسبي التلقائي، كشف الشذوذ المالي، التنبؤ بالطلب، وتوليد التقارير الذكية.

---

### 2. الطبقات المعمارية (Clean Architecture Layers)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       PRESENTATION LAYER (UI)                           │
│  React 19 Components • ERPTable • RTL/LTR Views • Toast & Event Bridge  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Invokes Use Cases / React Hooks)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER (USE CASES)                      │
│   AccountingService • InventoryService • ProductionService • AuthService│
│       Command / Query Separation (CQRS) • Workflow State Machines       │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Coordinates Domain Logic)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN LAYER (CORE LOGIC)                        │
│    Entities: Account, JournalEntry, Batch, StockMovement, WorkOrder     │
│   Rules: Double-Entry Balancing • FIFO Valuation • Period Lock Invariants│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ (Dep. Inversion / Repository Interfaces)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE LAYER (ADAPTERS)                     │
│ Drizzle ORM • PostgreSQL • LocalStorage Fallback • Gemini AI • ZATCA API│
└─────────────────────────────────────────────────────────────────────────┘
```

#### أ. طبقة النطاق (Domain Layer - `src/core/domain/`)
- تحوي الكيانات الأساسية (Entities)، كائنات القيمة (Value Objects)، والقواعد الحتمية (Invariants).
- **لا تعتمد على أي إطار عمل خارجي** (لا React، لا Express، لا Vite).
- أمثلة على القواعد الصارمة المحمية هنا:
  - لا يمكن ترحيل قيد إلا إذا كان $\sum \text{Debit} = \sum \text{Credit}$.
  - لا يمكن سحب كمية من دفعة مخزنية إذا كانت الكمية المتاحة أقل من المطلوب.
  - لا يمكن تعديل أو حذف قيد محاسبي مرحل؛ التعديل يتم فقط عبر **قيد عكسي (Reversal Entry)**.

#### ب. طبقة التطبيق (Application Layer - `src/core/application/`)
- تحتوي على الخدمات التطبيقية (Application Services) وحالات الاستخدام (Use Cases).
- مسؤولة عن إدارة المعاملات (Transaction Boundaries)، وتوجيه الأوامر، والتحقق من الصلاحيات.
- الخدمات الرئيسية المستهدفة:
  - `AccountingEngine`: تدقيق وترحيل القيود، إقفال الفترات، ومطابقة الأرصدة.
  - `InventoryEngine`: تنفيذ تسويات المخزون، التحويل بين المستودعات، وتطبيق FIFO.
  - `ManufacturingEngine`: معالجة أوامر العمل (Work Orders) وسجلات الإنتاج وحساب الهدر.
  - `SalesWorkflowService`: إدارة دورة المبيعات من الفاتورة إلى الأثر المالي والمخزني المباشر.

#### ج. طبقة البنية التحتية (Infrastructure Layer - `src/core/infrastructure/`)
- تنفيذ واجهات المستودعات (Repository Implementations).
- محول قاعدة البيانات (Drizzle ORM Adapter متصل بـ PostgreSQL).
- محول التخزين المحلي (LocalStorage Hybrid Adapter) لضمان استمرار العمل في حالة عدم الاتصال.
- تكامل Gemini AI لتدقيق وتلخيص العمليات.

#### د. طبقة العرض (Presentation Layer - `src/components/`)
- تقتصر على عرض البيانات وتلقي مدخلات المستخدم.
- استهلاك الخدمات عبر React Hooks نظيفة ومخصصة (مثل `useAccounting`, `useInventory`).
- الحفاظ التام على مكونات العرض عالية الجودة الحالية وخاصة `ERPTable.tsx`.

---

### 3. السياقات المحددة (Bounded Contexts - DDD)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                             NOVARO PLATFORM                              │
├─────────────────────┬──────────────────────┬─────────────────────────────┤
│ 1. GENERAL LEDGER   │ 2. INVENTORY & LOTS  │ 3. PRODUCTION & FACTORY     │
│  - Chart of Accounts│  - Multi-Warehouse   │  - Generic Bill of Materials│
│  - Double-Entry Eng.│  - FIFO Lot Tracking │  - Work Orders & Yield/Loss │
│  - Audit Reversals  │  - Stock Movements   │  - Roastery Plugin (Kilns)  │
│  - Tax & ZATCA Engine│ - Landed Cost Engine│  - Grinding Plugin (Mills)  │
├─────────────────────┼──────────────────────┼─────────────────────────────┤
│ 4. COMMERCE & SALES │ 5. PROCUREMENT (SCM) │ 6. CASH & TREASURY          │
│  - Wholesale Billing│  - Purchase Orders   │  - Cashbox Day Sessions     │
│  - Retail POS Engine│  - Goods Receipt GRN │  - Bank Accounts & Transfers│
│  - Customer Ledgers │  - Supplier Invoices │  - Expense Vouchers         │
└─────────────────────┴──────────────────────┴─────────────────────────────┘
```

#### السياق 1: المحاسبة المركزية ودفتر الأستاذ (Central General Ledger)
- **المبدأ:** أي عملية ذات أثر مالي (بيع، شراء، صرف، قبض، تصنيع، إهلاك، تسوية) **يجب** أن تنشئ `JournalEntry` متوازناً يمر عبر `AccountingEngine`.
- **أرصدة الحسابات:** لا يتم تعديل رصيد الحساب بشكل مستقل، بل يُشتق دائماً من مجموع الحركات في دفتر الأستاذ، مع وجود جدول إسقاط سريع (Read Projection) يتم تحديثه تلقائياً لضمان سرعة الاستعلام.

#### السياق 2: إدارة المخزون والدفعات (Inventory & Batch Management)
- **المبدأ:** المخزون يدار بموجب سجل حركات كمي ومالي موحد (`StockMovement`).
- كل حركة مخزنية ترتبط بـ:
  - الصنف (`itemId`)، المستودع (`warehouseId`)، رقم الدفعة (`batchNumber`).
  - التكلفة الفعلية للوحدة (`costPerUnit`).
  - الوثيقة المصدرية (`referenceType` و `referenceId`).
- تتبع أقدمية الدفعات وتواريخ انتهاء الصلاحية بنظام FIFO الصارم.

#### السياق 3: التصنيع والتحميص العام والمتخصص (Manufacturing Engine & Plugins)
- فصل معمارية التصنيع إلى مستويين:
  1. **Core Manufacturing Engine:** يدير أوامر التشغيل، المواد الداخلة والمخرجة، حسابات تكلفة التحويل (Labor + Overhead)، ونسبة الهدر المئوية.
  2. **Roastery & Grinding Domain Plugins:** طبقة إضافية فوق المحرك العام تختص بمتغيرات درجات حرارة المحامص، درجة التحميص، زمن الدوران، درجات نعومة الطحن، مع ضمان الامتثال للأنواع الصارمة في TypeScript.

#### السياق 4: إدارة العملاء والمبيعات الموحدة (Unified Commerce & Receivables)
- دمج مسارات المبيعات في محرك موحد:
  - `Wholesale`: بيع آجل أو نقدي للشركات مع إدارة حدود الائتمان ومستندات الإرساليات.
  - `Retail POS`: بيع نقدي وشبكة للأفراد في المعارض مع إيصالات فورية.
- إنهاء التكرار بين `CustomersModule` و `CustomerLedgerModule` بحيث تصبح بطاقة العميل متكاملة مع كشف الحساب المباشر المشتق من دفتر الأستاذ.

---

### 4. بنية البيانات وقاعدة البيانات المستهدفة (PostgreSQL & Drizzle Schema Specification)

```sql
-- مخطط الجداول الأساسية المعتمد لترحيل PostgreSQL عبر Drizzle ORM

-- 1. الشركات والفروع (Multi-Tenant & Multi-Branch)
CREATE TABLE organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(64),
    commercial_reg VARCHAR(64),
    currency VARCHAR(8) DEFAULT 'SAR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE branches (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. الدليل المحاسبي ودفتر الأستاذ (Chart of Accounts & General Ledger)
CREATE TABLE accounts (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    code VARCHAR(32) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    type VARCHAR(32) NOT NULL, -- Asset, Liability, Equity, Income, Expense
    parent_id VARCHAR(64) REFERENCES accounts(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_entries (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    entry_number VARCHAR(64) NOT NULL UNIQUE,
    entry_date DATE NOT NULL,
    reference_type VARCHAR(64), -- INVOICE, PAYMENT, PRODUCTION, MANUAL, ADJUSTMENT
    reference_id VARCHAR(64),
    notes TEXT,
    is_posted BOOLEAN DEFAULT FALSE,
    is_reversed BOOLEAN DEFAULT FALSE,
    reversed_entry_id VARCHAR(64) REFERENCES journal_entries(id),
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE journal_entry_lines (
    id VARCHAR(64) PRIMARY KEY,
    entry_id VARCHAR(64) REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id VARCHAR(64) REFERENCES accounts(id),
    debit NUMERIC(15, 4) NOT NULL DEFAULT 0,
    credit NUMERIC(15, 4) NOT NULL DEFAULT 0,
    notes TEXT,
    cost_center_id VARCHAR(64)
);

-- 3. المستودعات والأصناف وحركات المخزون (Inventory & Stock Ledger)
CREATE TABLE warehouses (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE items (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    sku VARCHAR(64) NOT NULL UNIQUE,
    barcode VARCHAR(64),
    name VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    category VARCHAR(64) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    standard_cost NUMERIC(15, 4) DEFAULT 0,
    selling_price NUMERIC(15, 4) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE stock_batches (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    item_id VARCHAR(64) REFERENCES items(id),
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    batch_number VARCHAR(64) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    initial_quantity NUMERIC(15, 4) NOT NULL,
    remaining_quantity NUMERIC(15, 4) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE stock_movements (
    id VARCHAR(64) PRIMARY KEY,
    org_id VARCHAR(64) REFERENCES organizations(id),
    item_id VARCHAR(64) REFERENCES items(id),
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    batch_id VARCHAR(64) REFERENCES stock_batches(id),
    movement_type VARCHAR(32) NOT NULL, -- IN, OUT, TRANSFER, ADJUSTMENT
    quantity NUMERIC(15, 4) NOT NULL,
    unit_cost NUMERIC(15, 4) NOT NULL,
    reference_doc_type VARCHAR(64),
    reference_doc_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

### 5. أمان النظام والتحكم بالصلاحيات (Security & RBAC Architecture)
- استبدال مصفوفة الصلاحيات بالذاكرة بنظام تحكم قائم على الأدوار (RBAC) يعتمد على نموذج:
  `Subject (User/Role) -> Action (Read, Write, Approve, Post, Delete) -> Resource (Journal, Inventory, Invoice, Settings)`.
- **حماية ترحيل القيود:** ترحيل القيود وإقفال الفترات المالية صلاحية حصرية لمدير الحسابات والمدير التنفيذي (CFO / Financial Controller).
- **Audit Trails:** جدول تدقيق غير قابل للحذف أو التعديل يسجل عنوان الـ IP، المستخدم، الوقت، والتغييرات الحاصلة في الحقول.
