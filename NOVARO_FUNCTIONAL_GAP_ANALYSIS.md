# NOVARO ERP — Functional Gap Analysis Catalog
**Document Ref:** `NOVARO_FUNCTIONAL_GAP_ANALYSIS.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Gap Classification & Priority Scheme

- **P0 (Critical Core)**: Essential gaps required for NOVARO to operate as a production-grade relational ERP.
- **P1 (Important Operations)**: Key capabilities required for robust SME trading & manufacturing operations.
- **P2 (Expansion)**: Feature enhancements for advanced business operations.
- **P3 (Future Enterprise)**: Long-term enterprise modules (HR, CRM, AI Orchestration).

---

## 2. Comprehensive Gap Analysis Matrix

| Gap ID | Module | Feature / Capability | Current State | Target State | Impact | Priority | Dependencies | Recommended Phase |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: |
| **GAP-001** | Architecture | Relational DB Persistence | Local Storage / In-Memory | PostgreSQL + Drizzle ORM Schema | Critical | **P0** | Database setup | Phase 2B |
| **GAP-002** | Security | Server Authentication & RBAC | Hardcoded state permissions | JWT Auth + Middleware Enforcement | Critical | **P0** | PostgreSQL Users | Phase 3 |
| **GAP-003** | Architecture | Multi-Company & Multi-Tenant | Single-tenant local storage | Multi-tenant `tenant_id` isolation | High | **P0** | Database Schema | Phase 3 |
| **GAP-004** | Finance | Bank Reconciliation Workflow | Static transaction list | MT940 import & automated matching | High | **P1** | Bank Accounts | Phase 5 |
| **GAP-005** | Sales | Sales Quotations & Orders | Direct invoice creation | Quote -> Sales Order -> Invoice flow | High | **P1** | Sales Invoices | Phase 6 |
| **GAP-006** | Purchasing | Purchase Requests & Quotations | Direct PO creation | Purchase Request -> RFQ -> PO flow | Medium | **P1** | Purchase Orders | Phase 6 |
| **GAP-007** | Inventory | Warehouse Stock Count (Physical) | Adjustments only | Formal Stock Count Tagging & Audit | High | **P1** | Warehouses | Phase 6 |
| **GAP-008** | Manufacturing| Formal Work Order Management | Direct job execution | Work Order Scheduling & Stage tracking | Medium | **P1** | BOM Recipes | Phase 7 |
| **GAP-009** | System Admin | Multi-Stage Approval Rules | Single-step workflow | Multi-level approval escalation engine | Medium | **P1** | Document Workflow | Phase 4 |
| **GAP-010** | Finance | Fixed Assets & Depreciation | Missing (`🔴 MISSING`) | Asset Register, Straight-line Depr. | Medium | **P1** | General Ledger | Phase 5 |
| **GAP-011** | Commercial | Price Lists & Customer Grouping | Single price per item | Wholesale/Retail Price Matrix | Medium | **P1** | Items / Customers | Phase 6 |
| **GAP-012** | Commercial | Customer & Vendor Aging Reports| Summary balance only | 30/60/90 Day Aging Analysis | High | **P1** | Sub-ledgers | Phase 5 |
| **GAP-013** | CRM | Lead & Opportunity Management | Missing (`🔴 MISSING`) | Sales Pipeline, Customer Contact Logs | Low | **P2** | Customers | Phase 8 |
| **GAP-014** | Projects | Project & Cost Center Tracking | Missing (`🔴 MISSING`) | Project Revenue/Cost Accounting | Low | **P2** | General Ledger | Phase 8 |
| **GAP-015** | HR & Payroll | Employee Management & Payroll | Missing (`🔴 MISSING`) | Employee Register, Monthly Payroll | Low | **P3** | Accounting | Phase 8 |
| **GAP-016** | Compliance | ZATCA Phase 2 E-Invoicing | ZATCA Phase 1 QR Code | ZATCA XML Sign & Clearance API | High | **P1** | Sales Invoices | Phase 5 |
| **GAP-017** | System | Document Sequence Engine | Hardcoded prefix formats | DB Sequence generator per Branch/Year| Medium | **P0** | Database Schema | Phase 2B |
