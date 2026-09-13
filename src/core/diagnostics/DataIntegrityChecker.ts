// NOVARO ERP Diagnostic Tool: Data Integrity Checker
import { Account, Batch, Customer, Supplier, Item, JournalEntry, SalesInvoice, PurchaseOrder } from "../../types";
import { validateJournalEntryInvariants } from "../domain/accounting/JournalEntry";
import { PostingAccountConfiguration } from "../domain/accounting/PostingAccountConfiguration";

export interface IntegrityFinding {
  severity: "CRITICAL" | "WARNING" | "INFO";
  code: string;
  message: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export interface DataIntegrityReport {
  timestamp: string;
  overallStatus: "HEALTHY" | "DEGRADED" | "CORRUPTED";
  criticalCount: number;
  warningCount: number;
  findings: IntegrityFinding[];
}

export class DataIntegrityChecker {
  static runFullAudit(params: {
    accounts: Account[];
    journalEntries: JournalEntry[];
    batches: Batch[];
    items: Item[];
    customers: Customer[];
    suppliers: Supplier[];
    salesInvoices: SalesInvoice[];
    purchaseOrders: PurchaseOrder[];
    postingConfig: PostingAccountConfiguration;
  }): DataIntegrityReport {
    const findings: IntegrityFinding[] = [];
    const accountIdSet = new Set(params.accounts.map(a => a.id));

    // 1. Check Unbalanced Journal Entries & Invalid Account References
    params.journalEntries.forEach(entry => {
      const val = validateJournalEntryInvariants({
        lines: entry.items,
        date: entry.date
      });

      if (!val.valid) {
        findings.push({
          severity: "CRITICAL",
          code: "UNBALANCED_JOURNAL_ENTRY",
          message: `Journal Entry ${entry.id} is unbalanced: Debits=${val.totalDebit}, Credits=${val.totalCredit}`,
          entityType: "JournalEntry",
          entityId: entry.id
        });
      }

      entry.items.forEach((line, idx) => {
        if (!accountIdSet.has(line.accountId)) {
          findings.push({
            severity: "CRITICAL",
            code: "ORPHAN_JOURNAL_ACCOUNT_REF",
            message: `Journal Line #${idx + 1} references non-existent account ID '${line.accountId}'`,
            entityType: "JournalEntryItem",
            entityId: line.id
          });
        }
      });
    });

    // 2. Check Negative Inventory or Invalid Batch Items
    const itemIdSet = new Set(params.items.map(i => i.id));
    params.batches.forEach(b => {
      if (b.quantity < 0) {
        findings.push({
          severity: "CRITICAL",
          code: "NEGATIVE_INVENTORY_BATCH",
          message: `Batch ${b.batchNumber} has negative quantity (${b.quantity})`,
          entityType: "Batch",
          entityId: b.id
        });
      }
      if (!itemIdSet.has(b.itemId)) {
        findings.push({
          severity: "CRITICAL",
          code: "ORPHAN_BATCH_ITEM_REF",
          message: `Batch ${b.batchNumber} references non-existent item '${b.itemId}'`,
          entityType: "Batch",
          entityId: b.id
        });
      }
    });

    // 3. Check Duplicate Invoice Numbers
    const invoiceNumberCounts: Record<string, number> = {};
    params.salesInvoices.forEach(inv => {
      invoiceNumberCounts[inv.id] = (invoiceNumberCounts[inv.id] || 0) + 1;
    });
    Object.entries(invoiceNumberCounts).forEach(([invId, count]) => {
      if (count > 1) {
        findings.push({
          severity: "CRITICAL",
          code: "DUPLICATE_INVOICE_ID",
          message: `Duplicate invoice ID detected: ${invId} appeared ${count} times`,
          entityType: "SalesInvoice",
          entityId: invId
        });
      }
    });

    // 4. Check Posting Account Configuration validity
    const configAccountIds = Object.values(params.postingConfig);
    configAccountIds.forEach(id => {
      if (!accountIdSet.has(id)) {
        findings.push({
          severity: "WARNING",
          code: "CONFIGURED_ACCOUNT_NOT_FOUND",
          message: `Posting configuration references account ID '${id}' which is not in Chart of Accounts`,
          entityType: "PostingAccountConfiguration",
          entityId: id
        });
      }
    });

    const criticalCount = findings.filter(f => f.severity === "CRITICAL").length;
    const warningCount = findings.filter(f => f.severity === "WARNING").length;

    let overallStatus: DataIntegrityReport["overallStatus"] = "HEALTHY";
    if (criticalCount > 0) {
      overallStatus = "CORRUPTED";
    } else if (warningCount > 0) {
      overallStatus = "DEGRADED";
    }

    return {
      timestamp: new Date().toISOString(),
      overallStatus,
      criticalCount,
      warningCount,
      findings
    };
  }
}
