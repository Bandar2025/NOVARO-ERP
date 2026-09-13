# NOVARO ERP — Database & Architecture Contradiction Audit Report
**Document Ref:** `NOVARO_DATABASE_CONTRADICTION_REPORT.md`  
**Phase:** 2A.6 — Database Contract Review & Enterprise Data Architecture  

---

## 1. Executive Summary of Architectural Contradictions

During Phase 2A.6 inspection, code in `src/types.ts`, `StateContext.tsx`, and `server.ts` was audited against Clean Architecture Domain Models (`src/core/domain/`) and Phase 2A.5 Blueprint Documents. Seven key contradictions were identified and analyzed.

---

## 2. Detailed Contradiction Audit Matrix

| Contradiction ID | Location | Current Code Behavior | Document Claim | Architectural Risk | Recommended Decision | Remediation Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CTR-001** | `src/types.ts` vs `DomainAccount.ts` | `Account` interface defines `balance: number` as a stored property. | Blueprint treats `accounts.balance` as a persistent column. | Modifying `Account.balance` directly bypasses double-entry General Ledger audit trails. | **Ledger as Source of Truth**: Account balance MUST be derived from posted journal entries. `accounts.balance` is a cached projection. | Phase 2B |
| **CTR-002** | `src/types.ts` vs `CustomerLedger.ts` | `Customer` interface defines `balance: number` as a stored property. | Blueprint treats `customers.balance` as a persistent column. | Direct mutation of customer balance creates discrepancies between AR sub-ledger and GL Account 1100. | **Sub-Ledger as Source of Truth**: Customer balance MUST be derived from `customer_movements`. `customers.balance` is a cached projection. | Phase 2B |
| **CTR-003** | `src/types.ts` vs `SupplierLedger.ts` | `Supplier` interface defines `balance: number` as a stored property. | Blueprint treats `suppliers.balance` as a persistent column. | Direct mutation of supplier balance creates discrepancies between AP sub-ledger and GL Account 2100. | **Sub-Ledger as Source of Truth**: Supplier balance MUST be derived from `supplier_movements`. `suppliers.balance` is a cached projection. | Phase 2B |
| **CTR-004** | `src/types.ts` vs `CostLayer.ts` | `Item` interface defines `currentStock: number` as a stored property. | Blueprint treats `items.current_stock` as a persistent column. | Decrementing `currentStock` without consuming FIFO layers destroys FIFO valuation history. | **FIFO Queue as Source of Truth**: Item quantity MUST be derived from unconsumed `cost_layers`. `items.current_stock` is a cached projection. | Phase 2B |
| **CTR-005** | `RoasteryModule` vs General Ledger | Roastery & Grinding direct expenses are logged locally in state. | Blueprint claims full manufacturing cost allocation. | Manufacturing overhead is isolated from General Ledger P&L statement. | **Auto-GL Posting**: Direct roastery/grinding expenses MUST generate journal entries posting to Overhead Account 5200. | Phase 3 |
| **CTR-006** | `StateContext.tsx` vs Document Engine | Document numbers are generated via string concats in UI (`INV-${Date.now()}`). | Blueprint claims atomic document sequence generator. | Duplicate document numbers can be created under high-concurrency multi-user usage. | **PostgreSQL Sequence Engine**: Implement atomic DB sequence generator per branch/year (GAP-017). | Phase 2B |
| **CTR-007** | `server.ts` vs POS Terminal API | POS Terminal sales route through generic sales invoice API (`/api/v1/sales/invoices`). | Blueprint claims dedicated POS session management. | Inability to track cashier shift cash drawer opening/closing variances on server. | **POS Session API**: Create dedicated `/api/v1/pos/sessions` endpoints in Express. | Phase 2B |

---

## 3. Decision Log & Guidance for Phase 2B

1. **No Code Business Logic Changes in Phase 2A.6**: All contradictions identified above are documented and resolved at the contract level. No business logic in `AccountingEngine.ts` or `InventoryEngine.ts` was mutated.
2. **Phase 2B Implementation Rule**: When implementing Drizzle ORM schemas in Phase 2B, `accounts.balance`, `customers.balance`, `suppliers.balance`, and `items.current_stock` will be mapped as **Cached Derived Fields / Views**, ensuring that the financial ledgers (`journal_entries`, `customer_movements`, `supplier_movements`, `cost_layers`) remain the single, uncompromised Source of Truth.
