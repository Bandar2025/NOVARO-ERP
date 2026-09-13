# NOVARO ERP — Target PostgreSQL Database Entity Blueprint
**Document Ref:** `NOVARO_DATABASE_ENTITY_BLUEPRINT.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Relational Database Entity Catalog (Phase 2B Target)

This document details all 32 relational database entities planned for the PostgreSQL / Drizzle ORM schema migration in Phase 2B.

---

## 2. Entity Categorization & Schema Definition

### A. Core Multi-Tenancy & Structure Entities (4)
1. `tenants`: Multi-tenant organization accounts (`id`, `name`, `status`, `created_at`).
2. `companies`: Legal company entities under a tenant (`id`, `tenant_id`, `name`, `tax_number`, `commercial_registration`).
3. `branches`: Physical or virtual company branches (`id`, `company_id`, `name`, `code`, `location`).
4. `cost_centers`: Cost allocation nodes (`id`, `company_id`, `code`, `name`, `parent_id`).

### B. Financial Master & Ledger Entities (6)
5. `accounts`: Chart of Accounts tree (`id`, `company_id`, `code`, `name`, `type`, `parent_id`, `balance`).
6. `fiscal_years`: Financial years (`id`, `company_id`, `year_name`, `start_date`, `end_date`, `status`).
7. `fiscal_periods`: Accounting quarters/months (`id`, `fiscal_year_id`, `name`, `start_date`, `end_date`, `status`).
8. `journal_entries`: Double-entry header (`id`, `company_id`, `voucher_no`, `date`, `posted`, `workflow_status`).
9. `journal_entry_items`: Debit/credit voucher lines (`id`, `journal_entry_id`, `account_id`, `debit`, `credit`, `notes`).
10. `exchange_rates`: FX currency conversion matrix (`id`, `from_currency`, `to_currency`, `rate`, `date`).

### C. Commercial & Sub-Ledger Entities (6)
11. `customers`: Customer directory (`id`, `company_id`, `name`, `email`, `phone`, `credit_limit`, `balance`).
12. `customer_movements`: Customer AR sub-ledger (`id`, `customer_id`, `date`, `type`, `amount`, `journal_entry_id`).
13. `suppliers`: Vendor directory (`id`, `company_id`, `name`, `tax_id`, `email`, `phone`, `balance`).
14. `supplier_movements`: Vendor AP sub-ledger (`id`, `supplier_id`, `date`, `type`, `amount`, `journal_entry_id`).
15. `sales_invoices`: Customer invoice header (`id`, `company_id`, `customer_id`, `total_amount`, `vat_amount`, `status`, `type`).
16. `sales_invoice_items`: Invoice line items (`id`, `sales_invoice_id`, `item_id`, `quantity`, `unit_price`, `total`).

### D. Inventory & Warehouse Entities (6)
17. `items`: Stock SKU master catalog (`id`, `company_id`, `sku`, `barcode`, `name`, `category`, `unit`, `cost`, `price`).
18. `warehouses`: Storage locations (`id`, `company_id`, `name`, `code`, `address`).
19. `stock_batches`: Batch & lot master (`id`, `item_id`, `warehouse_id`, `batch_number`, `manufacture_date`, `expiry_date`, `quantity`).
20. `cost_layers`: FIFO valuation layers (`id`, `item_id`, `batch_id`, `quantity`, `unit_cost`, `created_at`).
21. `stock_movements`: Stock transaction audit log (`id`, `item_id`, `warehouse_id`, `type`, `quantity`, `cost_per_unit`).
22. `inventory_adjustments`: Physical variance headers (`id`, `warehouse_id`, `item_id`, `type`, `quantity`, `reason`).

### E. Procurement & POS Entities (4)
23. `purchase_orders`: Supplier PO header (`id`, `company_id`, `supplier_id`, `date`, `total_amount`, `status`).
24. `purchase_order_items`: PO line items (`id`, `purchase_order_id`, `item_id`, `quantity`, `price`).
25. `pos_sessions`: POS shift sessions (`id`, `cashier_id`, `opened_at`, `closed_at`, `starting_cash`, `closing_cash`, `status`).
26. `cashbox_transactions`: Cash safe vouchers (`id`, `company_id`, `type`, `amount`, `description`, `recipient`).

### F. Manufacturing & Extension Entities (4)
27. `recipes`: Bill of Materials header (`id`, `company_id`, `name`, `output_item_id`, `expected_yield_pct`).
28. `recipe_materials`: BOM raw material lines (`id`, `recipe_id`, `raw_item_id`, `quantity`).
29. `roasting_jobs`: Coffee kiln production batch (`id`, `recipe_id`, `input_qty`, `output_qty`, `temp_celsius`, `weight_loss_pct`).
30. `grinding_jobs`: Industrial milling batch (`id`, `input_qty`, `output_qty`, `fineness_setting`).

### G. Security & System Entities (2)
31. `users`: System account users (`id`, `company_id`, `username`, `email`, `password_hash`, `role`).
32. `audit_logs`: Enterprise audit log (`id`, `user_id`, `action`, `entity_name`, `entity_id`, `old_value`, `new_value`, `timestamp`).
