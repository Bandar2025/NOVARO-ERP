// NOVARO ERP Certification Test: Accounting Invariants
import { Account, AccountType, Currency, JournalEntry } from "../../types";
import { AccountingEngine } from "../application/accounting/AccountingEngine";
import { TrialBalanceService } from "../application/accounting/TrialBalanceService";
import { FiscalPeriod } from "../domain/accounting/FiscalPeriod";

export interface CertificationCheckResult {
  code: string;
  name: string;
  status: "PASS" | "FAIL";
  details?: string;
}

export function runAccountingCertification(): CertificationCheckResult[] {
  const results: CertificationCheckResult[] = [];

  const testAccounts: Account[] = [
    { id: "acc-1000", code: "1000", name: "Cash in Hand", nameAr: "الصندوق", type: AccountType.Asset, balance: 0 },
    { id: "acc-1200", code: "1200", name: "Accounts Receivable", nameAr: "العملاء", type: AccountType.Asset, balance: 0 },
    { id: "acc-1300", code: "1300", name: "Inventory", nameAr: "المخزون", type: AccountType.Asset, balance: 0 },
    { id: "acc-2000", code: "2000", name: "Accounts Payable", nameAr: "الموردين", type: AccountType.Liability, balance: 0 },
    { id: "acc-3000", code: "3000", name: "Capital", nameAr: "رأس المال", type: AccountType.Equity, balance: 0 },
    { id: "acc-4000", code: "4000", name: "Wholesale Revenue", nameAr: "إيرادات الجملة", type: AccountType.Income, balance: 0 },
    { id: "acc-5000", code: "5000", name: "Cost of Goods Sold", nameAr: "تكلفة المبيعات", type: AccountType.Expense, balance: 0 }
  ];

  // Invariant 1: Balanced Entry Succeeds (Double-Entry Rule 1)
  try {
    const postRes = AccountingEngine.postEntry(
      {
        date: "2026-07-01",
        reference: "TEST-INIT",
        notes: "Initial Capital Deposit",
        items: [
          { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 50000, credit: 0 },
          { id: "2", accountId: "acc-3000", accountName: "Capital", debit: 0, credit: 50000 }
        ],
        workflowStatus: "Posted",
        currency: Currency.SAR,
        exchangeRate: 1
      },
      [],
      []
    );

    if (postRes.success && postRes.entry && postRes.entry.posted) {
      results.push({ code: "ACCOUNTING_BALANCE", name: "Double-Entry Balance (Debit = Credit)", status: "PASS" });
    } else {
      results.push({ code: "ACCOUNTING_BALANCE", name: "Double-Entry Balance", status: "FAIL", details: postRes.error });
    }
  } catch (e: any) {
    results.push({ code: "ACCOUNTING_BALANCE", name: "Double-Entry Balance", status: "FAIL", details: e.message });
  }

  // Invariant 2: Unbalanced Entry Rejected (Double-Entry Rule 2)
  try {
    const badRes = AccountingEngine.postEntry(
      {
        date: "2026-07-01",
        reference: "TEST-UNBALANCED",
        notes: "Flawed Unbalanced Entry",
        items: [
          { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 5000, credit: 0 },
          { id: "2", accountId: "acc-3000", accountName: "Capital", debit: 0, credit: 4000 } // Diff 1000!
        ],
        workflowStatus: "Posted",
        currency: Currency.SAR,
        exchangeRate: 1
      },
      [],
      []
    );

    if (!badRes.success && badRes.error && badRes.error.includes("Unbalanced")) {
      results.push({ code: "UNBALANCED_ENTRY_REJECTED", name: "Unbalanced Entry Strict Rejection", status: "PASS" });
    } else {
      results.push({ code: "UNBALANCED_ENTRY_REJECTED", name: "Unbalanced Entry Strict Rejection", status: "FAIL", details: "Unbalanced entry was accepted!" });
    }
  } catch (e: any) {
    results.push({ code: "UNBALANCED_ENTRY_REJECTED", name: "Unbalanced Entry Strict Rejection", status: "FAIL", details: e.message });
  }

  // Invariant 3: Posted Entry Immutability (Rule 3 & 4)
  try {
    const existingEntry: JournalEntry = {
      id: "JE-LOCKED-001",
      date: "2026-07-01",
      reference: "LOCK-01",
      notes: "Original Locked Entry",
      posted: true,
      workflowStatus: "Posted",
      items: [
        { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 1000, credit: 0 },
        { id: "2", accountId: "acc-4000", accountName: "Sales", debit: 0, credit: 1000 }
      ]
    };

    const editRes = AccountingEngine.postEntry(
      {
        id: "JE-LOCKED-001",
        date: "2026-07-01",
        reference: "MODIFIED",
        notes: "Illegal Overwrite Attempt",
        items: [
          { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 2000, credit: 0 },
          { id: "2", accountId: "acc-4000", accountName: "Sales", debit: 0, credit: 2000 }
        ],
        workflowStatus: "Posted"
      },
      [existingEntry]
    );

    if (!editRes.success && editRes.error && editRes.error.includes("immutable")) {
      results.push({ code: "POSTED_ENTRY_IMMUTABILITY", name: "Posted Entry Immutability Enforcement", status: "PASS" });
    } else {
      results.push({ code: "POSTED_ENTRY_IMMUTABILITY", name: "Posted Entry Immutability Enforcement", status: "FAIL", details: "Posted entry was overwritten!" });
    }
  } catch (e: any) {
    results.push({ code: "POSTED_ENTRY_IMMUTABILITY", name: "Posted Entry Immutability Enforcement", status: "FAIL", details: e.message });
  }

  // Invariant 4: Reversal Entry Symmetry (Rule 5)
  try {
    const originalEntry: JournalEntry = {
      id: "JE-TO-REVERSE",
      date: "2026-07-01",
      reference: "REV-SRC",
      notes: "Erroneous posting to be cancelled",
      posted: true,
      workflowStatus: "Posted",
      items: [
        { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 3500, credit: 0 },
        { id: "2", accountId: "acc-4000", accountName: "Sales", debit: 0, credit: 3500 }
      ]
    };

    const revRes = AccountingEngine.reverseEntry("JE-TO-REVERSE", [originalEntry], "Customer refund and cancel");
    if (revRes.success && revRes.reversalEntry) {
      const revLine1 = revRes.reversalEntry.items.find(i => i.accountId === "acc-1000");
      const revLine2 = revRes.reversalEntry.items.find(i => i.accountId === "acc-4000");

      if (revLine1?.credit === 3500 && revLine2?.debit === 3500) {
        // Now compute balance: Cash should net to 0!
        const netCash = AccountingEngine.calculateAccountBalance("acc-1000", AccountType.Asset, [originalEntry, revRes.reversalEntry]);
        if (netCash === 0) {
          results.push({ code: "REVERSAL_ENTRY_SYMMETRY", name: "Reversal Entry Financial Symmetry", status: "PASS" });
        } else {
          results.push({ code: "REVERSAL_ENTRY_SYMMETRY", name: "Reversal Entry Financial Symmetry", status: "FAIL", details: `Net balance was ${netCash}, expected 0` });
        }
      } else {
        results.push({ code: "REVERSAL_ENTRY_SYMMETRY", name: "Reversal Entry Financial Symmetry", status: "FAIL", details: "Inverted debits/credits not matched" });
      }
    } else {
      results.push({ code: "REVERSAL_ENTRY_SYMMETRY", name: "Reversal Entry Financial Symmetry", status: "FAIL", details: revRes.error });
    }
  } catch (e: any) {
    results.push({ code: "REVERSAL_ENTRY_SYMMETRY", name: "Reversal Entry Financial Symmetry", status: "FAIL", details: e.message });
  }

  // Invariant 5: Closed Period Lock Protection (Rule 6)
  try {
    const closedPeriod: FiscalPeriod = {
      id: "fp-2025",
      name: "Fiscal Year 2025",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
      status: "CLOSED",
      closedAt: "2026-01-01"
    };

    const periodPostRes = AccountingEngine.postEntry(
      {
        date: "2025-06-15", // Inside closed period
        reference: "ILLEGAL-POST",
        notes: "Posting back into closed year",
        items: [
          { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 500, credit: 0 },
          { id: "2", accountId: "acc-4000", accountName: "Sales", debit: 0, credit: 500 }
        ],
        workflowStatus: "Posted"
      },
      [],
      [closedPeriod]
    );

    if (!periodPostRes.success && periodPostRes.error && periodPostRes.error.includes("CLOSED")) {
      results.push({ code: "PERIOD_LOCK_PROTECTION", name: "Fiscal Period Lock Invariant", status: "PASS" });
    } else {
      results.push({ code: "PERIOD_LOCK_PROTECTION", name: "Fiscal Period Lock Invariant", status: "FAIL", details: "Allowed posting into closed period!" });
    }
  } catch (e: any) {
    results.push({ code: "PERIOD_LOCK_PROTECTION", name: "Fiscal Period Lock Invariant", status: "FAIL", details: e.message });
  }

  // Invariant 6: Trial Balance Discrepancy Strict 0.00
  try {
    const entries: JournalEntry[] = [
      {
        id: "je-1",
        date: "2026-07-01",
        reference: "REF-1",
        notes: "Capital injection",
        posted: true,
        workflowStatus: "Posted",
        items: [
          { id: "1", accountId: "acc-1000", accountName: "Cash", debit: 100000, credit: 0 },
          { id: "2", accountId: "acc-3000", accountName: "Capital", debit: 0, credit: 100000 }
        ]
      },
      {
        id: "je-2",
        date: "2026-07-02",
        reference: "REF-2",
        notes: "Inventory Purchase",
        posted: true,
        workflowStatus: "Posted",
        items: [
          { id: "3", accountId: "acc-1300", accountName: "Inventory", debit: 30000, credit: 0 },
          { id: "4", accountId: "acc-1000", accountName: "Cash", debit: 0, credit: 30000 }
        ]
      },
      {
        id: "je-3",
        date: "2026-07-03",
        reference: "REF-3",
        notes: "Sales and COGS",
        posted: true,
        workflowStatus: "Posted",
        items: [
          { id: "5", accountId: "acc-1200", accountName: "AR", debit: 25000, credit: 0 },
          { id: "6", accountId: "acc-4000", accountName: "Sales", debit: 0, credit: 25000 },
          { id: "7", accountId: "acc-5000", accountName: "COGS", debit: 12000, credit: 0 },
          { id: "8", accountId: "acc-1300", accountName: "Inventory", debit: 0, credit: 12000 }
        ]
      }
    ];

    const tb = TrialBalanceService.getTrialBalance(testAccounts, entries);
    if (tb.isBalanced && tb.discrepancy === 0 && tb.totalDebitSum === tb.totalCreditSum) {
      results.push({ code: "TRIAL_BALANCE", name: "Trial Balance Zero Discrepancy (Tolerance 0.00)", status: "PASS" });
    } else {
      results.push({ code: "TRIAL_BALANCE", name: "Trial Balance Zero Discrepancy", status: "FAIL", details: `Discrepancy: ${tb.discrepancy}` });
    }
  } catch (e: any) {
    results.push({ code: "TRIAL_BALANCE", name: "Trial Balance Zero Discrepancy", status: "FAIL", details: e.message });
  }

  return results;
}
