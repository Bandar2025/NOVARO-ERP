# NOVARO ERP — Functional & Architectural Technical Debt Log
**Document Ref:** `NOVARO_FUNCTIONAL_TECHNICAL_DEBT.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Executive Summary of Technical Debt

This log catalogues technical debt identified across NOVARO ERP during Phase 2A.5 deep code inspection. Every item includes the architectural root cause, operational risk, and planned remediation phase.

---

## 2. Categorized Technical Debt Catalog

### A. Persistence & Storage Debt
1. **Direct `localStorage` Coupling (`DEBT-001`)**:
   - *Description*: `StateContext.tsx` loads and saves seed data directly to browser `localStorage` using keys (`novaro_accounts`, `novaro_items`, etc.).
   - *Risk*: Data loss on browser cache clear; lack of concurrent multi-user editing; non-durable client state.
   - *Remediation*: Migrate persistence to PostgreSQL / Drizzle ORM via server API routes in Phase 2B.

2. **Temporary Client-Generated String IDs (`DEBT-002`)**:
   - *Description*: Primary keys generated via `Date.now().toString()` or random strings (`INV-1712...`).
   - *Risk*: Risk of ID collisions in high-concurrency environments; non-sequential audit records.
   - *Remediation*: Replace with database auto-incrementing integers or UUID v4 sequence generators in Phase 2B.

---

### B. Security & Authentication Debt
3. **Missing Server-Side Session Token Verification (`DEBT-003`)**:
   - *Description*: Express API endpoints currently accept requests without JWT or session token headers.
   - *Risk*: Unauthorized API access; security vulnerability in shared container deployment.
   - *Remediation*: Implement Passport.js / JWT Auth Middleware in Phase 3.

4. **Client-Side-Only RBAC Guard (`DEBT-004`)**:
   - *Description*: `permissionsByRole` toggles UI buttons in React but is not checked on server endpoints.
   - *Risk*: Users can bypass UI guards by crafting HTTP requests directly.
   - *Remediation*: Enforce permission middleware on Express API routes in Phase 3.

---

### C. Architecture & State Coupling Debt
5. **Monolithic `StateContext.tsx` Provider (`DEBT-005`)**:
   - *Description*: `StateContext.tsx` contains 1,827 lines of code managing 30+ domain states in a single context provider.
   - *Risk*: Unnecessary React re-renders across components when unrelated state updates.
   - *Remediation*: Decompose into modular React Query hooks or focused context providers (e.g. `AccountingContext`, `InventoryContext`) in Phase 3.

6. **In-Memory Local Repository Wrapper on Server (`DEBT-006`)**:
   - *Description*: `server/services.ts` initializes `LocalRepositories` which use `safeStorage` (in-memory mock for Node.js).
   - *Risk*: Server restart wipes in-memory data if not persisted to client.
   - *Remediation*: Replace `LocalRepositories` implementation with Drizzle ORM PostgreSQL repositories in Phase 2B.

---

### D. Workflow & Operations Debt
7. **Simplified Document Sequence Generator (`DEBT-007`)**:
   - *Description*: Document numbers generated via template strings without DB locks.
   - *Risk*: Concurrent invoice creation could generate duplicate invoice numbers under heavy load.
   - *Remediation*: Implement atomic PostgreSQL sequence generators per document type in Phase 2B.

8. **Missing Multi-Stage Approval Routing Engine (`DEBT-008`)**:
   - *Description*: `DocumentWorkflowStatus` tracks status strings, but lacks an automated notification queue or approval delegation hierarchy.
   - *Risk*: Manual follow-ups required for document approvals.
   - *Remediation*: Implement workflow event bus and approval routing engine in Phase 4.

---

## 3. Technical Debt Remediation Schedule

| Debt ID | Category | Impact Level | Targeted Phase |
| :--- | :--- | :---: | :---: |
| `DEBT-001` | Persistence | Critical | Phase 2B |
| `DEBT-002` | Database | High | Phase 2B |
| `DEBT-003` | Security | Critical | Phase 3 |
| `DEBT-004` | Security | High | Phase 3 |
| `DEBT-005` | Architecture | Medium | Phase 3 |
| `DEBT-006` | Backend | High | Phase 2B |
| `DEBT-007` | Operations | Medium | Phase 2B |
| `DEBT-008` | Workflow | Medium | Phase 4 |
