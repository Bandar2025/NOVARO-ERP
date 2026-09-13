# NOVARO ERP — Settings Architecture & Configuration Blueprint
**Document Ref:** `NOVARO_SETTINGS_BLUEPRINT.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Executive Settings Tree Overview

The target settings architecture provides centralized, tenant-wide control over system behavior, accounting rules, document numbering, tax settings, security controls, and integration interfaces.

```
Settings Hierarchy
│
├── 1. Company & Tenant Settings (General Information, Branding, Addresses)
├── 2. Financial & Fiscal Settings (Currencies, Tax/ZATCA, Fiscal Periods)
├── 3. Accounting & Posting Rules (Default Accounts, Cost Centers, Closing)
├── 4. Commercial Sales Settings (Invoicing Formats, Price Lists, Credit Limits)
├── 5. Procurement Settings (Purchase Approvals, Vendor Terms)
├── 6. Inventory & Warehouse Settings (Valuation Method, Barcode, Stock Alerts)
├── 7. POS Terminal Settings (Payment Tender, Shift Controls, Receipt Layout)
├── 8. Manufacturing & BOM Settings (Waste Allowance %, Overhead Allocation)
├── 9. Document Sequence Generator (Auto-numbering rules)
├── 10. Security & RBAC Configuration (Roles, Permissions, Password Policies)
├── 11. System Health, Backup & Auditing (Data Export, Log Retention, Audit Rules)
└── 12. External Integrations (ZATCA Phase 2, E-Commerce, Bank Feeds)
```

---

## 2. Classification of System Settings

| Setting Group | Configuration Key | Current Implementation State | Target Database Field |
| :--- | :--- | :---: | :--- |
| **Company Info** | `companySettings.name` | 🟢 Existing | `tenants.name`, `companies.name` |
| **Commercial Reg.** | `companySettings.commercialRegistration` | 🟢 Existing | `companies.commercial_registration` |
| **Tax ID (VAT)** | `companySettings.taxNumber` | 🟢 Existing | `companies.tax_number` |
| **VAT Rate %** | `companySettings.taxConfiguration.vatRate` | 🟢 Existing (Fixed 15%) | `tax_configurations.vat_rate` |
| **Default Currency**| `companySettings.defaultCurrency` | 🟢 Existing (SAR) | `companies.default_currency` |
| **Fiscal Year** | `companySettings.fiscalYear` | 🟢 Existing (2026) | `fiscal_years.name` |
| **Posting Rules** | `PostingAccountConfiguration` | 🟡 Partial (In-Memory default) | `posting_account_configurations` |
| **Invoice Format** | `companySettings.invoiceFormat` | 🟡 Partial (`INV-{YYYY}-{SEQ}`) | `document_numbering.format` |
| **Receipt Format** | `companySettings.receiptFormat` | 🟡 Partial (`REC-{YYYY}-{SEQ}`) | `document_numbering.format` |
| **Barcode Prefix** | `companySettings.barcodeSettings` | 🟡 Partial (Static prefix) | `barcode_configurations` |
| **Cost Centers** | N/A | 🔴 Missing | `cost_centers` |
| **Price Lists** | N/A | 🔴 Missing | `price_lists` |
| **Credit Limits** | `Customer.creditLimit` | 🟡 Partial (Field only) | `customers.credit_limit` |
| **POS Fast Tender** | N/A | 🟡 Partial (Hardcoded buttons) | `pos_profiles.payment_methods` |
| **JSON Backup** | `createBackup` | 🟢 Existing (Client download) | `system_backups` |
| **Audit Retention** | `LocalAuditRepository` (1000 logs) | 🟡 Partial (In-memory cap) | `system_audit_logs` |
| **RBAC Roles Matrix**| `permissionsByRole` | 🔵 Foundation Only | `roles`, `permissions`, `role_permissions` |
| **ZATCA Phase 2** | N/A | ⚫ Future | `zatca_phase2_credentials` |

---

## 3. Recommended Settings UI Redesign (Phase 3)

The settings module will be structured into multi-tab navigation:

1. **Tab 1: المنشأة والربط الضريبي (Company & VAT)**: Business details, ZATCA tax ID, VAT rates, currency setup.
2. **Tab 2: الحسابات وقواعد الترحيل (Accounting & Posting)**: Mapping default AR, AP, COGS, Tax Output, and Cashbox accounts.
3. **Tab 3: المستودعات والترقيم (Inventory & Numbering)**: Valuation rules (FIFO), stock alerts, document sequence formats.
4. **Tab 4: الأمان والأدوار (Security & RBAC)**: User management, role permissions matrix, audit log retention settings.
5. **Tab 5: النسخ الاحتياطي والنظام (System & Data)**: Export system backup JSON, restore snapshot, perform factory reset.
