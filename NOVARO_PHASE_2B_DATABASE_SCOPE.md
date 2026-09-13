# NOVARO ERP — Phase 2B Database Migration Scope & Boundaries
**Document Ref:** `NOVARO_PHASE_2B_DATABASE_SCOPE.md`  
**Phase:** 2A.6-R — Database Contract Corrections & Final Pre-PostgreSQL Gate  

---

## 1. IN SCOPE FOR PHASE 2B (Core Relational Database)

The primary goal of Phase 2B is to migrate NOVARO ERP from local storage/in-memory state to a production-grade PostgreSQL database with Drizzle ORM.

### Core Entities Included in Phase 2B (28 Entities In-Scope):
1. `tenants`: Tenant account structure.
2. `companies`: Company legal entities.
3. `branches`: Branch locations.
4. `accounts`: Chart of accounts tree structure.
5. `fiscal_years`: Fiscal years.
6. `fiscal_periods`: Fiscal accounting periods & lock status.
7. `journal_entries`: General ledger double-entry header.
8. `journal_entry_items`: GL debit and credit lines.
9. `exchange_rates`: Foreign currency exchange matrix.
10. `customers`: Customer directory.
11. `customer_movements`: Customer AR sub-ledger.
12. `suppliers`: Vendor directory.
13. `supplier_movements`: Supplier AP sub-ledger.
14. `sales_invoices`: Sales invoice header.
15. `sales_invoice_items`: Sales line items and actual COGS.
16. `items`: Master SKU item catalog.
17. `warehouses`: Storage locations.
18. `stock_batches`: Item batches & expiry dates.
19. `cost_layers`: FIFO cost layer queue.
20. `stock_movements`: Stock transaction audit log.
21. `inventory_adjustments`: Physical inventory variance headers.
22. `purchase_orders`: Procurement order headers.
23. `purchase_order_items`: Procurement line items.
24. `pos_sessions`: POS shift sessions.
25. `cashbox_transactions`: Cash safe vouchers.
26. `recipes`: Production BOM formula header.
27. `users`: System user credentials.
28. `audit_logs`: Security and mutation audit log.

---

## 2. OUT OF SCOPE & DEFERRED ENTITIES (4 Entities)

The following entities and modules are deferred to future phases to keep Phase 2B lean, stable, and focused on core ERP persistence:

| Deferred Entity / Capability | Targeted Phase | Rationale for Deferral |
| :--- | :---: | :--- |
| `cost_centers` | Phase 3 | Advanced cost-center allocation hierarchy. |
| `recipe_materials` | Phase 3 | Child material composition records for BOM recipes. |
| `roasting_jobs` & `grinding_jobs` | Phase 3 | Specialized coffee industry extension logs. |
| Fixed Assets (`fixed_assets`, `depreciation`) | Phase 5 | Requires full asset accounting engine development. |
| Bank Reconciliation (`bank_reconciliations`) | Phase 5 | Requires MT940 statement parser integration. |
| Sales Quotations & Purchase Requests | Phase 6 | Advanced commercial workflow expansion. |
| CRM Pipelines & Lead Management | Phase 8 | Separate CRM domain module. |
| HR & Employee Payroll | Phase 8 | Separate HR & Payroll domain module. |
| ZATCA Phase 2 Clearance Credentials | Phase 5 | External API clearance integration. |

- **Total Reviewed Entities**: 28 In-Scope + 4 Deferred = **32 Reviewed Entities**.

---

## 3. BLOCKERS, DEPENDENCIES & PRE-REQUISITES

### Blockers:
- **NONE**. The completion of Phase 2A.6-R clears all pre-PostgreSQL blockers.

### Dependencies & Pre-Requisites for Phase 2B:
1. **Drizzle ORM Package Installation**: Add `drizzle-orm`, `drizzle-kit`, and `pg` to `package.json`.
2. **PostgreSQL Container Setup**: Provision PostgreSQL 16 instance via Docker or Cloud SQL.
3. **Database Connection Configuration**: Configure `DATABASE_URL` environment variable in `.env.example`.
4. **Repository Implementations**: Implement `DrizzleAccountRepository`, `DrizzleJournalEntryRepository`, `DrizzleInventoryRepository`, etc. adhering strictly to existing contracts in `src/core/application/repositories/RepositoryContracts.ts`.

---

## 4. POST-MIGRATION REQUIREMENTS (Phase 2C & Phase 3)

1. **Phase 2C (ACID & Concurrency)**: Implement Unit of Work pattern, SQL transactions (`BEGIN ... COMMIT`), and row locking (`SELECT FOR UPDATE`) for document sequence generation.
2. **Phase 3 (Security & RBAC)**: Implement JWT authentication middleware on Express API routes and enforce user permissions on database queries.
