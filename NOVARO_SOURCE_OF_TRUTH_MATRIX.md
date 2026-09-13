# NOVARO ERP — Source of Truth & Financial Integrity Matrix
**Document Ref:** `NOVARO_SOURCE_OF_TRUTH_MATRIX.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Domain Source of Truth Governance

To guarantee double-entry audit integrity (SOCPA / IFRS compliance), every financial and inventory figure within NOVARO ERP must derive from a single, authoritative source of truth:

| Functional Domain | Official Source of Truth Entity | Engine / Service | Secondary / Derived Views (Read-Only) |
| :--- | :--- | :--- | :--- |
| **Account Balances** | `JournalEntry` (Posted vouchers) | `AccountingEngine` | Chart of Accounts view, Account Balance Cards |
| **Trial Balance** | `JournalEntry` (Posted vouchers) | `TrialBalanceService` | Reports Module Trial Balance View |
| **Income Statement** | `JournalEntry` (Income & Expense types)| `TrialBalanceService` | Unified Income Statement View |
| **Balance Sheet** | `JournalEntry` (Asset, Liab, Equity) | `TrialBalanceService` | Balance Sheet View |
| **Stock Quantities** | `CostLayer` & `DomainStockMovement` | `InventoryEngine` | Items Catalog `currentStock` field |
| **Inventory Valuation** | `CostLayer` (FIFO layers) | `InventoryEngine` | Stock Valuation Report, FIFO Layer Inspector |
| **Cost of Goods Sold (COGS)**| `CostLayer` (FIFO layer consumption)| `InventoryEngine` | Sales Invoice COGS line posting |
| **Customer Receivables (AR)**| `JournalEntry` (Account 1100 lines) | `CommerceService` | Customer Directory `balance` field, Sub-ledger |
| **Supplier Payables (AP)** | `JournalEntry` (Account 2100 lines) | `CommerceService` | Supplier Directory `balance` field, Sub-ledger |
| **Production BOM Costs** | `CostLayer` (Raw item costs) | `ManufacturingEngine` | Production Cost Calculator |

---

## 2. Source of Truth Audit & Gap Discovery

During code inspection of NOVARO ERP, the following potential source-of-truth discrepancies were audited:

### Audit Finding 1: Customer & Supplier Balance Invariant
- **Status**: 🟢 **RESOLVED & VERIFIED**.
- **Discovery**: In early prototypes, `Customer.balance` and `Supplier.balance` were mutated independently in UI components.
- **Current Architecture**: `CommerceService` and `StateContext` dynamically calculate balances or post corresponding double-entry journal vouchers to AR (Account 1100) and AP (Account 2100). The sub-ledger is synchronized with the General Ledger.

### Audit Finding 2: Inventory Valuation & Stock Movement Invariant
- **Status**: 🟢 **RESOLVED & VERIFIED**.
- **Discovery**: In early prototypes, item current stock was decremented directly without recording FIFO layers or stock movement logs.
- **Current Architecture**: `InventoryEngine` appends `CostLayer` records on purchases and consumes FIFO layers on sales/transfers/adjustments. `DomainStockMovement` logs every transaction.

### Audit Finding 3: Roastery & Grinding Expense Allocation
- **Status**: 🟡 **PARTIAL INVARIANT**.
- **Discovery**: `RoasteryExpense` and `GrindingExpense` log operational costs locally within roastery/grinding modules.
- **Current Architecture**: While functional in UI, direct expenses should post formal journal entries to Manufacturing Overhead Accounts (Account 5200) in the General Ledger. This is marked for auto-GL integration in Phase 3.
