// NOVARO ERP Domain Model: Journal Entry & Double-Entry Invariants
import { Currency, DocumentWorkflowStatus } from "../../../types";

export interface DomainJournalLine {
  id: string;
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
  costCenterId?: string;
}

export interface DomainJournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string;
  source: string; // e.g., "SALES_INVOICE", "PURCHASE_RECEIPT", "PAYMENT", "MANUAL", "CLOSING"
  notes: string;
  lines: DomainJournalLine[];
  posted: boolean;
  workflowStatus: DocumentWorkflowStatus;
  currency: Currency;
  exchangeRate: number;
  createdAt: string;
  createdBy: string;
  postedAt?: string;
  postedBy?: string;
  isReversed?: boolean;
  reversedEntryId?: string;
  reversalReason?: string;
}

export interface EntryValidationResult {
  valid: boolean;
  errors: string[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

export function validateJournalEntryInvariants(entry: {
  lines: Array<{ debit: number; credit: number; accountId: string }>;
  date?: string;
}): EntryValidationResult {
  const errors: string[] = [];

  if (!entry.lines || entry.lines.length < 2) {
    errors.push("Journal Entry must contain at least 2 allocation lines.");
  }

  let totalDebit = 0;
  let totalCredit = 0;

  entry.lines.forEach((line, idx) => {
    if (!line.accountId || !line.accountId.trim()) {
      errors.push(`Line #${idx + 1} must specify an account.`);
    }
    if (line.debit < 0 || line.credit < 0) {
      errors.push(`Line #${idx + 1} cannot contain negative debit or credit values.`);
    }
    if (line.debit > 0 && line.credit > 0) {
      errors.push(`Line #${idx + 1} cannot have both debit and credit amounts.`);
    }
    totalDebit += Number(line.debit) || 0;
    totalCredit += Number(line.credit) || 0;
  });

  // Precision check to 4 decimals
  const difference = Math.abs(Math.round((totalDebit - totalCredit) * 10000) / 10000);
  if (difference > 0.0001) {
    errors.push(
      `Unbalanced entry: Total Debit (${totalDebit.toFixed(2)}) does not equal Total Credit (${totalCredit.toFixed(2)}). Difference: ${difference.toFixed(4)}.`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    totalDebit: Math.round(totalDebit * 100) / 100,
    totalCredit: Math.round(totalCredit * 100) / 100,
    difference
  };
}
