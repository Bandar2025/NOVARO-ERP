# NOVARO ERP — Document Workflow & Lifecycle Blueprint
**Document Ref:** `NOVARO_WORKFLOW_BLUEPRINT.md`  
**Phase:** 2A.5 — Enterprise Functional Blueprint  

---

## 1. Document Lifecycle States Overview

NOVARO ERP enforces formal document state transitions across all core transactional entities:

```
[Draft] ---> (Submit) ---> [Pending Review] ---> (Approve) ---> [Approved] ---> (Post) ---> [Posted]
   |                             |                                  |                        |
   +-------> (Cancel) ---------> +-----------> (Reject) -----------> +------> (Reverse) ----> [Cancelled / Reversed]
```

---

## 2. Allowed States & State Transition Matrix

### 2.1 Journal Entries (`JournalEntry`)
| Current State | Allowed Action | Target State | System & Ledger Trigger |
| :--- | :--- | :--- | :--- |
| `Draft` | Submit | `Pending Review` | Locks draft for review; validates debit = credit equality. |
| `Pending Review` | Approve | `Approved` | Authorizes voucher for GL posting. |
| `Pending Review` | Reject | `Rejected` | Returns voucher to draft with rejection notes. |
| `Approved` | Post | `Posted` | Appends double-entry lines to General Ledger. |
| `Posted` | Reverse | `Cancelled` | Generates offsetting reversal voucher in General Ledger. |

### 2.2 Purchase Orders (`PurchaseOrder`)
| Current State | Allowed Action | Target State | System & Ledger Trigger |
| :--- | :--- | :--- | :--- |
| `Draft` | Approve | `Approved` | Issues purchase order to vendor. |
| `Approved` | Receive | `Received` | Appends stock to warehouse, creates FIFO cost layer, debits Inventory & credits AP. |
| `Draft` / `Approved` | Cancel | `Cancelled` | Voids purchase order. |

### 2.3 Sales Invoices (`SalesInvoice`)
| Current State | Allowed Action | Target State | System & Ledger Trigger |
| :--- | :--- | :--- | :--- |
| `Draft` | Issue | `Unpaid` / `Paid` | Consumes FIFO stock layer, calculates COGS, credits Sales & VAT Output, debits AR or Cash. |
| `Unpaid` | Settle Payment | `Paid` | Debits Cash/Bank account, credits Customer AR. |
| `Unpaid` / `Paid` | Cancel / Credit Note | `Cancelled` | Reverses revenue, restocks FIFO layer, issues credit note. |

### 2.4 Stock Adjustments & Transfers (`InventoryAdjustment` / `StockTransfer`)
| Current State | Allowed Action | Target State | System & Ledger Trigger |
| :--- | :--- | :--- | :--- |
| `Draft` | Submit | `Pending Review` | Prepares variance/transfer record for warehouse manager review. |
| `Pending Review` | Post | `Posted` | Adjusts physical stock balance and posts inventory shrinkage/gain to GL. |
| `Pending Review` | Cancel | `Cancelled` | Voids adjustment/transfer. |

---

## 3. Workflow Engine Execution Rules

1. **Immutable Posted State**: Once a document transitions to `Posted`, direct mutation or deletion is strictly forbidden. Any modification must execute via formal `Reverse` or `Credit Note` transactions.
2. **Fiscal Period Validation**: A document cannot be posted or reversed if the transaction date falls within a `CLOSED` or `LOCKED` fiscal period (`FiscalPeriod`).
3. **Double-Entry Balancing Rule**: No financial document can transition to `Approved` or `Posted` if total debits do not equal total credits (`sum(debit) == sum(credit)`).
4. **FIFO Stock Validation**: No sales invoice or stock transfer can transition to `Posted` if the requested item quantity exceeds available unexpired FIFO stock layers (unless negative stock overrides are explicitly enabled in settings).
