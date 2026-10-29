// NOVARO ERP Diagnostic Tool: Data Integrity & Subledger-to-GL Reconciliation Checker
import {
  Account,
  AccountType,
  Batch,
  Customer,
  Supplier,
  Item,
  JournalEntry,
  SalesInvoice,
  PurchaseOrder,
  ZatcaDocumentRecord
} from "../../types";
import { validateJournalEntryInvariants } from "../domain/accounting/JournalEntry";
import { PostingAccountConfiguration } from "../domain/accounting/PostingAccountConfiguration";
import { TrialBalanceService } from "../application/accounting/TrialBalanceService";
import { AccountingEngine } from "../application/accounting/AccountingEngine";
import { CostLayer } from "../domain/inventory/CostLayer";
import { ZatcaEngine } from "../domain/zatca/ZatcaEngine";

export interface IntegrityFinding {
  severity: "CRITICAL" | "WARNING" | "INFO";
  code: string;
  message: string;
  messageAr?: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export interface SubledgerReconciliationSummary {
  arSubledgerTotal: number;
  arGlBalance: number;
  arVariance: number;
  apSubledgerTotal: number;
  apGlBalance: number;
  apVariance: number;
  inventorySubledgerTotal: number;
  inventoryLayersTotal: number;
  inventoryGlBalance: number;
  inventoryVariance: number;
  zatcaChainValid: boolean;
  zatcaDocumentsCount: number;
}

export interface DataIntegrityReport {
  timestamp: string;
  overallStatus: "HEALTHY" | "DEGRADED" | "CORRUPTED";
  criticalCount: number;
  warningCount: number;
  findings: IntegrityFinding[];
  reconciliation?: SubledgerReconciliationSummary;
}

export class DataIntegrityChecker {
  static runFullAudit(params: {
    accounts: Account[];
    journalEntries: JournalEntry[];
    batches: Batch[];
    costLayers?: CostLayer[];
    items: Item[];
    customers: Customer[];
    suppliers: Supplier[];
    salesInvoices: SalesInvoice[];
    purchaseOrders: PurchaseOrder[];
    postingConfig: PostingAccountConfiguration;
    zatcaRecords?: ZatcaDocumentRecord[];
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
          messageAr: `القيد المحاسبي ${entry.id} غير متوازن: المدين=${val.totalDebit}، الدائن=${val.totalCredit}`,
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
            messageAr: `سطر القيد رقم ${idx + 1} يشير إلى حساب غير موجود '${line.accountId}'`,
            entityType: "JournalEntryItem",
            entityId: line.id
          });
        }
      });
    });

    // 1B. Check Global Trial Balance & Balance Sheet Equilibrium
    const tb = TrialBalanceService.getTrialBalance(params.accounts, params.journalEntries);
    if (!tb.isBalanced) {
      findings.push({
        severity: "CRITICAL",
        code: "TRIAL_BALANCE_DISCREPANCY",
        message: `Global Trial Balance discrepancy detected: ${tb.discrepancy.toFixed(2)} SAR`,
        messageAr: `عدم تطابق في ميزان المراجعة العام بفرق: ${tb.discrepancy.toFixed(2)} ر.س`,
        entityType: "TrialBalance"
      });
    }

    const bs = TrialBalanceService.generateBalanceSheet(params.accounts, params.journalEntries);
    if (!bs.isBalanced) {
      findings.push({
        severity: "CRITICAL",
        code: "BALANCE_SHEET_DISCREPANCY",
        message: `Balance Sheet equation discrepancy detected: ${bs.discrepancy.toFixed(2)} SAR`,
        messageAr: `عدم توازن في معادلة الميزانية العمومية بفرق: ${bs.discrepancy.toFixed(2)} ر.س`,
        entityType: "BalanceSheet"
      });
    }

    // 2. Check Negative Inventory or Invalid Batch Items
    const itemIdSet = new Set(params.items.map(i => i.id));
    params.batches.forEach(b => {
      if (b.quantity < 0) {
        findings.push({
          severity: "CRITICAL",
          code: "NEGATIVE_INVENTORY_BATCH",
          message: `Batch ${b.batchNumber} has negative quantity (${b.quantity})`,
          messageAr: `التشغيلة المخزنية ${b.batchNumber} تحمل كمية سالبة (${b.quantity})`,
          entityType: "Batch",
          entityId: b.id
        });
      }
      if (!itemIdSet.has(b.itemId)) {
        findings.push({
          severity: "CRITICAL",
          code: "ORPHAN_BATCH_ITEM_REF",
          message: `Batch ${b.batchNumber} references non-existent item '${b.itemId}'`,
          messageAr: `التشغيلة ${b.batchNumber} تشير إلى صنف غير معرف '${b.itemId}'`,
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
          messageAr: `تكرار في رقم فاتورة المبيعات: ${invId} ظهر ${count} مرات`,
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
          messageAr: `إعدادات الترحيل تشير إلى حساب غير موجود في الدليل المحاسبي '${id}'`,
          entityType: "PostingAccountConfiguration",
          entityId: id
        });
      }
    });

    // 5. Subledger-to-GL Control Account Reconciliation
    const arAccId = params.postingConfig.accountsReceivableAccountId || "acc-1200";
    const apAccId = params.postingConfig.accountsPayableAccountId || "acc-2000";
    const rawInvAccId = params.postingConfig.rawMaterialsInventoryAccountId || "acc-1300";
    const finInvAccId = params.postingConfig.finishedGoodsInventoryAccountId || "acc-1310";
    const wipInvAccId = params.postingConfig.wipInventoryAccountId || "acc-1320";

    const arGlBalance = AccountingEngine.calculateAccountBalance(arAccId, AccountType.Asset, params.journalEntries);
    const apGlBalance = AccountingEngine.calculateAccountBalance(apAccId, AccountType.Liability, params.journalEntries);
    const rawInvGl = AccountingEngine.calculateAccountBalance(rawInvAccId, AccountType.Asset, params.journalEntries);
    const finInvGl = AccountingEngine.calculateAccountBalance(finInvAccId, AccountType.Asset, params.journalEntries);
    const wipInvGl = AccountingEngine.calculateAccountBalance(wipInvAccId, AccountType.Asset, params.journalEntries);
    const inventoryGlBalance = Math.round((rawInvGl + finInvGl + wipInvGl) * 100) / 100;

    const arSubledgerTotal = Math.round(params.customers.reduce((sum, c) => sum + (Number(c.balance) || 0), 0) * 100) / 100;
    const apSubledgerTotal = Math.round(params.suppliers.reduce((sum, s) => sum + (Number(s.balance) || 0), 0) * 100) / 100;
    const inventorySubledgerTotal = Math.round(
      params.batches.reduce((sum, b) => sum + (Number(b.quantity) || 0) * (Number(b.costPerUnit) || 0), 0) * 100
    ) / 100;
    const inventoryLayersTotal = params.costLayers
      ? Math.round(
          params.costLayers.reduce((sum, l) => sum + (Number(l.remainingQuantity) || 0) * (Number(l.unitCost) || 0), 0) * 100
        ) / 100
      : inventorySubledgerTotal;

    const arVariance = Math.round((arSubledgerTotal - arGlBalance) * 100) / 100;
    const apVariance = Math.round((apSubledgerTotal - apGlBalance) * 100) / 100;
    const inventoryVariance = Math.round((inventorySubledgerTotal - inventoryGlBalance) * 100) / 100;

    if (Math.abs(arVariance) > 0.05) {
      findings.push({
        severity: "WARNING",
        code: "AR_SUBLEDGER_GL_VARIANCE",
        message: `Customer Subledger (${arSubledgerTotal.toFixed(2)} SAR) differs from GL AR Account 1200 (${arGlBalance.toFixed(2)} SAR) by ${arVariance.toFixed(2)} SAR`,
        messageAr: `فرق مطابقة بين سجل العملاء الفرعي (${arSubledgerTotal.toFixed(2)} ر.س) وحساب الذمم المدينة 1200 بالأستاذ العام (${arGlBalance.toFixed(2)} ر.س) بمقدار ${arVariance.toFixed(2)} ر.س`,
        entityType: "SubledgerReconciliation",
        entityId: arAccId
      });
    }

    if (Math.abs(apVariance) > 0.05) {
      findings.push({
        severity: "WARNING",
        code: "AP_SUBLEDGER_GL_VARIANCE",
        message: `Supplier Subledger (${apSubledgerTotal.toFixed(2)} SAR) differs from GL AP Account 2000 (${apGlBalance.toFixed(2)} SAR) by ${apVariance.toFixed(2)} SAR`,
        messageAr: `فرق مطابقة بين سجل الموردين الفرعي (${apSubledgerTotal.toFixed(2)} ر.س) وحساب الذمم الدائنة 2000 بالأستاذ العام (${apGlBalance.toFixed(2)} ر.س) بمقدار ${apVariance.toFixed(2)} ر.س`,
        entityType: "SubledgerReconciliation",
        entityId: apAccId
      });
    }

    if (Math.abs(inventoryVariance) > 0.5) {
      findings.push({
        severity: "WARNING",
        code: "INVENTORY_SUBLEDGER_GL_VARIANCE",
        message: `FIFO Inventory Valuation (${inventorySubledgerTotal.toFixed(2)} SAR) differs from GL Inventory Accounts 1300/1310/1320 (${inventoryGlBalance.toFixed(2)} SAR) by ${inventoryVariance.toFixed(2)} SAR`,
        messageAr: `فرق مطابقة بين تقييم دفعات المخزون FIFO (${inventorySubledgerTotal.toFixed(2)} ر.س) وحسابات المخزون بالأستاذ العام (${inventoryGlBalance.toFixed(2)} ر.س) بمقدار ${inventoryVariance.toFixed(2)} ر.س`,
        entityType: "SubledgerReconciliation",
        entityId: rawInvAccId
      });
    }

    // 6. ZATCA Cryptographic Chain Verification
    let zatcaChainValid = true;
    const zatcaDocs = params.zatcaRecords || [];
    if (zatcaDocs.length > 0) {
      const chronological = [...zatcaDocs].sort((a, b) => a.icv - b.icv);
      const chainRes = ZatcaEngine.verifyChain(chronological);
      zatcaChainValid = chainRes.valid;
      if (!chainRes.valid) {
        findings.push({
          severity: "CRITICAL",
          code: "ZATCA_HASH_CHAIN_BROKEN",
          message: `ZATCA Cryptographic Chain broken at ICV #${chainRes.brokenAtIcv}: ${chainRes.reason}`,
          messageAr: `خلل في تسلسل التشفير التراكمي لهيئة الزكاة (ZATCA) عند العداد ICV #${chainRes.brokenAtIcv}: ${chainRes.reason}`,
          entityType: "ZatcaChain"
        });
      }
    }

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
      findings,
      reconciliation: {
        arSubledgerTotal,
        arGlBalance,
        arVariance,
        apSubledgerTotal,
        apGlBalance,
        apVariance,
        inventorySubledgerTotal,
        inventoryLayersTotal,
        inventoryGlBalance,
        inventoryVariance,
        zatcaChainValid,
        zatcaDocumentsCount: zatcaDocs.length
      }
    };
  }
}
