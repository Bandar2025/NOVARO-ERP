// NOVARO ERP Application Layer: Central Accounting Engine
import { Account, AccountType, Currency, DocumentWorkflowStatus, JournalEntry, JournalEntryItem } from "../../../types";
import { FiscalPeriod, assertPeriodAllowsPosting } from "../../domain/accounting/FiscalPeriod";
import { DomainJournalEntry, DomainJournalLine, validateJournalEntryInvariants } from "../../domain/accounting/JournalEntry";
import { isDebitNormal } from "../../domain/accounting/Account";

export interface CreateDraftEntryDTO {
  date: string;
  reference: string;
  source?: string;
  notes: string;
  items: Array<{
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
    notes?: string;
  }>;
  currency?: Currency;
  exchangeRate?: number;
  createdBy?: string;
}

export interface PostEntryResult {
  success: boolean;
  entry?: JournalEntry;
  errors?: string[];
  error?: string;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountNameAr: string;
  type: AccountType;
  debitTotal: number;
  creditTotal: number;
  balanceDebit: number;
  balanceCredit: number;
}

export interface TrialBalanceResult {
  rows: TrialBalanceRow[];
  totalDebitSum: number;
  totalCreditSum: number;
  totalDebitBalance: number;
  totalCreditBalance: number;
  isBalanced: boolean;
  discrepancy: number;
}

export class AccountingEngine {
  /**
   * 1. Create a draft journal entry
   */
  static createDraftEntry(dto: CreateDraftEntryDTO): JournalEntry {
    const entryId = `JE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      id: entryId,
      date: dto.date,
      reference: dto.reference,
      notes: dto.notes,
      posted: false,
      workflowStatus: "Draft" as DocumentWorkflowStatus,
      currency: dto.currency || Currency.SAR,
      exchangeRate: dto.exchangeRate || 1,
      items: dto.items.map((it, idx) => ({
        id: `jei-${Date.now()}-${idx}`,
        accountId: it.accountId,
        accountName: it.accountName,
        debit: Math.round(Number(it.debit) * 100) / 100,
        credit: Math.round(Number(it.credit) * 100) / 100,
        notes: it.notes
      }))
    };
  }

  /**
   * 2. Validate Journal Entry against all domain rules
   */
  static validateEntry(
    entry: {
      date: string;
      items: Array<{ accountId: string; debit: number; credit: number }>;
    },
    fiscalPeriods: FiscalPeriod[] = []
  ): { valid: boolean; errors: string[] } {
    const invariantCheck = validateJournalEntryInvariants({
      lines: entry.items,
      date: entry.date
    });

    const errors = [...invariantCheck.errors];

    // Fiscal Period Lock invariant (Rule 6)
    const periodCheck = assertPeriodAllowsPosting(entry.date, fiscalPeriods);
    if (!periodCheck.allowed && periodCheck.reason) {
      errors.push(periodCheck.reason);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 3. Post Journal Entry (Enforces Double-Entry Invariants)
   */
  static postEntry(
    candidate: Omit<JournalEntry, "id" | "posted"> & { id?: string },
    existingEntries: JournalEntry[] = [],
    fiscalPeriods: FiscalPeriod[] = [],
    actor = "system"
  ): PostEntryResult {
    // If updating an already posted entry, reject immediately (Rule 3 & 4)
    if (candidate.id) {
      const existing = existingEntries.find(e => e.id === candidate.id);
      if (existing && (existing.posted || existing.workflowStatus === "Posted")) {
        return {
          success: false,
          error: "Inviolable rule: Posted journal entries are strictly immutable and cannot be overwritten."
        };
      }
    }

    // Validate
    const validation = this.validateEntry(candidate, fiscalPeriods);
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors,
        error: validation.errors.join(" | ")
      };
    }

    const entryId = candidate.id || `JE-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const postedEntry: JournalEntry = {
      ...candidate,
      id: entryId,
      posted: true,
      workflowStatus: "Posted" as DocumentWorkflowStatus,
      items: candidate.items.map((it, idx) => ({
        ...it,
        id: it.id || `jei-${Date.now()}-${idx}`,
        debit: Math.round(Number(it.debit) * 100) / 100,
        credit: Math.round(Number(it.credit) * 100) / 100
      }))
    };

    return {
      success: true,
      entry: postedEntry
    };
  }

  /**
   * 4. Reverse Journal Entry (Rule 5: Cancellation via Reversal Entry)
   */
  static reverseEntry(
    targetEntryId: string,
    existingEntries: JournalEntry[],
    reversalReason: string,
    reversalDate?: string,
    actor = "system"
  ): {
    success: boolean;
    reversalEntry?: JournalEntry;
    updatedOriginalEntry?: JournalEntry;
    error?: string;
  } {
    const original = existingEntries.find(e => e.id === targetEntryId);
    if (!original) {
      return { success: false, error: `Journal entry with ID ${targetEntryId} not found.` };
    }

    if (!original.posted && original.workflowStatus !== "Posted") {
      return { success: false, error: "Cannot reverse an unposted draft entry. Simply discard or edit it." };
    }

    const nowStr = reversalDate || new Date().toISOString().split("T")[0];

    // Invert debit and credit symmetrically
    const reversedLines: JournalEntryItem[] = original.items.map((it, idx) => ({
      id: `jei-rev-${Date.now()}-${idx}`,
      accountId: it.accountId,
      accountName: it.accountName,
      debit: it.credit, // Invert
      credit: it.debit, // Invert
      notes: `Reversal of line in ${original.id}: ${it.notes || ""}`.trim()
    }));

    const reversalEntryId = `JE-REV-${Date.now().toString().slice(-6)}`;
    const reversalEntry: JournalEntry = {
      id: reversalEntryId,
      date: nowStr,
      reference: `REV-${original.reference || original.id}`,
      notes: `Reversal of Entry ${original.id}. Reason: ${reversalReason}`,
      posted: true,
      workflowStatus: "Posted",
      currency: original.currency || Currency.SAR,
      exchangeRate: original.exchangeRate || 1,
      items: reversedLines
    };

    const updatedOriginal: JournalEntry = {
      ...original,
      notes: `${original.notes} [REVERSED by ${reversalEntryId}]`
    };

    return {
      success: true,
      reversalEntry,
      updatedOriginalEntry: updatedOriginal
    };
  }

  /**
   * 5. Calculate Single Account Balance (Single Source of Truth from Journal Entry Lines)
   * Asset/Expense: Debit - Credit
   * Liability/Equity/Income: Credit - Debit
   */
  static calculateAccountBalance(
    accountId: string,
    accountType: AccountType,
    journalEntries: JournalEntry[]
  ): number {
    let debitSum = 0;
    let creditSum = 0;

    journalEntries.forEach(je => {
      const isPosted = je.posted || je.workflowStatus === "Posted";
      if (isPosted) {
        je.items.forEach(item => {
          if (item.accountId === accountId) {
            debitSum += Number(item.debit) || 0;
            creditSum += Number(item.credit) || 0;
          }
        });
      }
    });

    if (isDebitNormal(accountType)) {
      return Math.round((debitSum - creditSum) * 100) / 100;
    }
    return Math.round((creditSum - debitSum) * 100) / 100;
  }

  /**
   * 6. Calculate Complete Accounts Balance Projections
   */
  static calculateAllAccountBalances(
    accounts: Account[],
    journalEntries: JournalEntry[]
  ): Account[] {
    return accounts.map(acc => {
      const derivedBalance = this.calculateAccountBalance(acc.id, acc.type, journalEntries);
      return {
        ...acc,
        balance: derivedBalance
      };
    });
  }

  /**
   * 7. Calculate Trial Balance
   * Guarantees Sum(Debit) = Sum(Credit) with zero discrepancy check
   */
  static calculateTrialBalance(
    accounts: Account[],
    journalEntries: JournalEntry[]
  ): TrialBalanceResult {
    // Map debit/credit aggregations per account
    const aggregates: Record<string, { debits: number; credits: number }> = {};
    accounts.forEach(a => {
      aggregates[a.id] = { debits: 0, credits: 0 };
    });

    journalEntries.forEach(je => {
      const isPosted = je.posted || je.workflowStatus === "Posted";
      if (isPosted) {
        je.items.forEach(line => {
          if (!aggregates[line.accountId]) {
            aggregates[line.accountId] = { debits: 0, credits: 0 };
          }
          aggregates[line.accountId].debits += Number(line.debit) || 0;
          aggregates[line.accountId].credits += Number(line.credit) || 0;
        });
      }
    });

    let totalDebitSum = 0;
    let totalCreditSum = 0;
    let totalDebitBalance = 0;
    let totalCreditBalance = 0;

    const rows: TrialBalanceRow[] = accounts.map(acc => {
      const agg = aggregates[acc.id] || { debits: 0, credits: 0 };
      const d = Math.round(agg.debits * 100) / 100;
      const c = Math.round(agg.credits * 100) / 100;

      totalDebitSum += d;
      totalCreditSum += c;

      let bDebit = 0;
      let bCredit = 0;

      if (isDebitNormal(acc.type)) {
        const net = d - c;
        if (net >= 0) {
          bDebit = net;
        } else {
          bCredit = Math.abs(net);
        }
      } else {
        const net = c - d;
        if (net >= 0) {
          bCredit = net;
        } else {
          bDebit = Math.abs(net);
        }
      }

      totalDebitBalance += bDebit;
      totalCreditBalance += bCredit;

      return {
        accountId: acc.id,
        accountCode: acc.code,
        accountName: acc.name,
        accountNameAr: acc.nameAr,
        type: acc.type,
        debitTotal: d,
        creditTotal: c,
        balanceDebit: Math.round(bDebit * 100) / 100,
        balanceCredit: Math.round(bCredit * 100) / 100
      };
    });

    totalDebitSum = Math.round(totalDebitSum * 100) / 100;
    totalCreditSum = Math.round(totalCreditSum * 100) / 100;
    totalDebitBalance = Math.round(totalDebitBalance * 100) / 100;
    totalCreditBalance = Math.round(totalCreditBalance * 100) / 100;

    const discrepancy = Math.abs(Math.round((totalDebitSum - totalCreditSum) * 100) / 100);

    return {
      rows,
      totalDebitSum,
      totalCreditSum,
      totalDebitBalance,
      totalCreditBalance,
      isBalanced: discrepancy === 0,
      discrepancy
    };
  }
}
