# NOVARO ERP — Relational Database Hierarchy & Entity Map
**Document Ref:** `NOVARO_DATABASE_RELATIONSHIP_MAP.md`  
**Phase:** 2A.6 — Database Contract Review & Enterprise Data Architecture  

---

## 1. Multi-Tenant Organizational Structure Hierarchy

```
[Tenants] (1)
   │
   ├───> [Companies] (N)
   │        │
   │        ├───> [Branches] (N)
   │        │        │
   │        │        ├───> [Warehouses] (N)
   │        │        │        │
   │        │        │        └───> [Stock Batches] (N)
   │        │        │                 │
   │        │        │                 └───> [Cost Layers] (FIFO Queue)
   │        │        │
   │        │        └───> [Cashboxes] (N)
   │        │
   │        ├───> [Chart of Accounts] (N) (Parent-Child Tree)
   │        │
   │        ├───> [Fiscal Years] (N)
   │        │        │
   │        │        └───> [Fiscal Periods] (N) (Months/Quarters)
   │        │
   │        ├───> [Customers] (N)
   │        └───> [Suppliers] (N)
   │
   └───> [Users] (N) ───> [User Permissions / Roles] (N)
```

---

## 2. General Ledger & Financial Accounting Map

```
[Company] + [Branch] + [Fiscal Period]
   │
   └───> [Journal Entry] (Voucher Header)
            │
            ├───> [Journal Entry Items] (1..N Lines)
            │        │
            │        ├───> References [Account] (Chart of Accounts)
            │        │
            │        ├───> References [Customer] (if Accounts Receivable 1100)
            │        │        │
            │        │        └───> Updates [Customer Movements] (AR Sub-Ledger)
            │        │
            │        └───> References [Supplier] (if Accounts Payable 2100)
            │                 │
            │                 └───> Updates [Supplier Movements] (AP Sub-Ledger)
            │
            └───> Reversal Reference (Self-referencing Foreign Key: reversal_of_id)
```

---

## 3. Commercial Sales Transaction Flow & Ledger Map

```
[Sales Invoice] (Header)
   │
   ├───> Belongs to [Customer]
   │
   ├───> Belongs to [Branch] + [Fiscal Period]
   │
   ├───> [Sales Invoice Items] (Line Items)
   │        │
   │        ├───> References [Item] (SKU Catalog)
   │        │
   │        └───> Triggers FIFO Consumption ───> [Cost Layers]
   │                                                    │
   │                                                    └───> Calculates Actual COGS
   │
   ├───> Generates [Stock Movements] (Type: Issue)
   │
   ├───> Appends [Customer Movements] (AR Sub-Ledger)
   │
   └───> Generates & Posts [Journal Entry] (GL Ledger)
            ├── Debit: Accounts Receivable (1100) or Cash Safe (1010)
            ├── Credit: Sales Revenue (4100)
            ├── Credit: VAT Output Payable (2200)
            ├── Debit: Cost of Goods Sold (5100)
            └── Credit: Inventory Asset (1200)
```

---

## 4. Procurement & Inventory Receipt Map

```
[Purchase Order] (Header)
   │
   ├───> Belongs to [Supplier]
   │
   ├───> Belongs to [Branch] + [Warehouse]
   │
   ├───> [Purchase Order Items] (Line Items)
   │        │
   │        └───> References [Item] (SKU Catalog)
   │
   └───> On Receipt Execution:
            ├───> Appends new [Cost Layer] (FIFO Queue: unitCost, originalQty, remainingQty)
            ├───> Creates/Updates [Stock Batch] (Expiry & Batch Number)
            ├───> Records [Stock Movement] (Type: Receipt)
            ├───> Appends [Supplier Movement] (AP Sub-Ledger)
            └───> Posts [Journal Entry] (GL Ledger):
                     ├── Debit: Inventory Asset (1200)
                     ├── Debit: VAT Input Tax Receivable (1250)
                     └── Credit: Accounts Payable (2100)
```

---

## 5. Manufacturing & Industry Extensions Map

```
[BOM Recipe] (Formula Master)
   │
   ├───> Finished Output Item [Item]
   │
   └───> [Recipe Materials] (Raw Item Ratios)
            │
            └───> Raw Material Item [Item]

[Work Order / Roasting Job] (Execution)
   │
   ├───> References [BOM Recipe]
   │
   ├───> Consumes Raw Materials via FIFO ───> Consumes [Cost Layers]
   │                                                 │
   │                                                 └───> Generates Stock Issue Movement
   │
   └───> Produces Finished Goods ───> Appends new [Cost Layer]
                                           │
                                           └───> Generates Stock Receipt Movement
```
