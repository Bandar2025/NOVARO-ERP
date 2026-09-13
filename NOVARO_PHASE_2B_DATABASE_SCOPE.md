# NOVARO ERP — Phase 2B Database Migration Scope & Boundaries
**Document Ref:** `NOVARO_PHASE_2B_DATABASE_SCOPE.md`  
**Phase:** 2A.6 — Database Contract Review & Enterprise Data Architecture  

---

## 1. IN SCOPE FOR PHASE 2B (Core Relational Database)

The primary goal of Phase 2B is to migrate NOVARO ERP from local storage/in-memory mocks to a production-grade PostgreSQL database with Drizzle ORM.

### Core Entities Included in Phase 2B (27 Entities):
1. `tenants`: Tenant account structure.
2. `companies`: Company legal entities.
3. `branches`: Branch locations.
4. `cost_centers`: Basic cost center structure.
5. `accounts`: Chart of accounts tree structure.
6. `fiscal_years`: Fiscal years.
7. `fiscal_periods`: Fiscal accounting periods & lock status.
8. `journal_entries`: General ledger double-entry header.
9. `journal_entry_items`: GL debit and credit lines.
10. `exchange_rates`: Foreign currency exchange matrix.
11. `customers`: Customer directory.
12. `customer_movements`: Customer AR sub-ledger.
13. `suppliers`: Vendor directory.
14. `supplier_movements`: Supplier AP sub-ledger.
15. `sales_invoices`: Sales invoice header.
16. `sales_invoice_items`: Sales line items and actual COGS.
17. `items`: Master SKU item catalog.
18. `warehouses`: Storage locations.
19. `stock_batches`: Item batches & expiry dates.
20. `cost_layers`: FIFO cost layer queue.
21. `stock_movements`: Stock transaction audit log.
22. `inventory_adjustments`: Physical inventory variance headers.
23. `purchase_orders`: Procurement order headers.
24. `purchase_order_items`: Procurement line items.
25. `pos_sessions`: POS shift sessions.
26. `cashbox_transactions`: Cash safe vouchers.
27. `users`: System user credentials.
28. `audit_logs`: Security and mutation audit log.

---

## 2. OUT OF SCOPE & DEFERRED ENTITIES

The following entities and modules are deferred to future phases to keep Phase 2B lean, stable, and focused on core ERP persistence:

| Deferred Entity / Capability | Targeted Phase | Rationale for Deferral |
| :--- | :---: | :--- |
| `roasting_jobs` & `grinding_jobs` | Phase 3 | Specialized coffee industry extension logs. |
| Fixed Assets (`fixed_assets`, `depreciation`) | Phase 5 | Requires full asset accounting engine development. |
| Bank Reconciliation (`bank_reconciliations`) | Phase 5 | Requires MT940 statement parser integration. |
| Sales Quotations & Purchase Requests | Phase 6 | Advanced commercial workflow expansion. |
| CRM Pipelines & Lead Management | Phase 8 | Separate CRM domain module. |
| HR & Employee Payroll | Phase 8 | Separate HR & Payroll domain module. |
| ZATCA Phase 2 Clearance Credentials | Phase 5 | External API clearance integration. |

---

## 3. BLOCKERS, DEPENDENCIES & PRE-REQUISITES

### Blockers:
- **NONE**. The completion of Phase 2A.6 clears all pre-PostgreSQL blockers.

### Dependencies & Pre-Requisites for Phase 2B:
1. **Drizzle ORM Package Installation**: Add `drizzle-orm`, `drizzle-kit`, and `pg` to `package.json`.
2. **PostgreSQL Container Setup**: Provision PostgreSQL 16 instance via Docker or Cloud SQL.
3. **Database Connection Configuration**: Configure `DATABASE_URL` environment variable in `.env.example`.
4. **Repository Implementations**: Implement `DrizzleAccountRepository`, `DrizzleJournalEntryRepository`, `DrizzleInventoryRepository`, etc. adhering strictly to existing contracts in `src/core/application/repositories/RepositoryContracts.ts`.

---

## 4. POST-MIGRATION REQUIREMENTS (Phase 2C & Phase 3)

1. **Phase 2C (ACID & Concurrency)**: Implement Unit of Work pattern, SQL transactions (`BEGIN ... COMMIT`), and row locking (`SELECT FOR UPDATE`) for document sequence generation.
2. **Phase 3 (Security & RBAC)**: Implement JWT authentication middleware on Express API routes and enforce user permissions on database queries.
