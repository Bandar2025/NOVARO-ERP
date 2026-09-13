// NOVARO ERP Application Layer: Trial Balance & Financial Statement Service
// Asserts Debit = Credit without tolerating discrepancies
import { Account, AccountType, JournalEntry } from "../../../types";
import { AccountingEngine, TrialBalanceResult } from "./AccountingEngine";

export type { TrialBalanceResult };

export interface IncomeStatementResult {
  revenues: Array<{ accountId: string; name: string; nameAr: string; amount: number }>;
  cogs: Array<{ accountId: string; name: string; nameAr: string; amount: number }>;
  expenses: Array<{ accountId: string; name: string; nameAr: string; amount: number }>;
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  grossMarginPct: number;
  totalOperatingExpenses: number;
  netIncome: number;
  netMarginPct: number;
  hasSufficientData: boolean;
}

export interface BalanceSheetResult {
  assets: Array<{ accountId: string; name: string; nameAr: string; amount: number }>;
  liabilities: Array<{ accountId: string; name: string; nameAr: string; amount: number }>;
  equity: Array<{ accountId: string; name: string; nameAr: string; amount: number }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquityBeforeNetIncome: number;
  retainedEarnings: number;
  totalEquityAndLiabilities: number;
  isBalanced: boolean;
  discrepancy: number;
  hasSufficientData: boolean;
}

export class TrialBalanceService {
  /**
   * Generates Trial Balance and enforces strict zero-tolerance equality
   */
  static getTrialBalance(accounts: Account[], journalEntries: JournalEntry[]): TrialBalanceResult {
    return AccountingEngine.calculateTrialBalance(accounts, journalEntries);
  }

  /**
   * Generates Income Statement strictly from posted journal entries (Revenue, COGS, Expenses)
   * NO arbitrary percentages like * 0.45 or * 0.55!
   */
  static generateIncomeStatement(accounts: Account[], journalEntries: JournalEntry[]): IncomeStatementResult {
    const updatedAccounts = AccountingEngine.calculateAllAccountBalances(accounts, journalEntries);

    const revenues: IncomeStatementResult["revenues"] = [];
    const cogs: IncomeStatementResult["cogs"] = [];
    const expenses: IncomeStatementResult["expenses"] = [];

    let totalRevenue = 0;
    let totalCOGS = 0;
    let totalOperatingExpenses = 0;

    updatedAccounts.forEach(acc => {
      if (acc.type === AccountType.Income) {
        if (acc.balance !== 0) {
          revenues.push({
            accountId: acc.id,
            name: acc.name,
            nameAr: acc.nameAr,
            amount: acc.balance
          });
          totalRevenue += acc.balance;
        }
      } else if (acc.type === AccountType.Expense) {
        // Distinguish COGS from other operating expenses
        const isCOGS = acc.id === "acc-5000" || acc.code.startsWith("50") || acc.name.toLowerCase().includes("cost of goods");
        if (acc.balance !== 0) {
          if (isCOGS) {
            cogs.push({
              accountId: acc.id,
              name: acc.name,
              nameAr: acc.nameAr,
              amount: acc.balance
            });
            totalCOGS += acc.balance;
          } else {
            expenses.push({
              accountId: acc.id,
              name: acc.name,
              nameAr: acc.nameAr,
              amount: acc.balance
            });
            totalOperatingExpenses += acc.balance;
          }
        }
      }
    });

    totalRevenue = Math.round(totalRevenue * 100) / 100;
    totalCOGS = Math.round(totalCOGS * 100) / 100;
    totalOperatingExpenses = Math.round(totalOperatingExpenses * 100) / 100;

    const grossProfit = Math.round((totalRevenue - totalCOGS) * 100) / 100;
    const grossMarginPct = totalRevenue > 0 ? Math.round(((grossProfit / totalRevenue) * 100) * 10) / 10 : 0;
    const netIncome = Math.round((grossProfit - totalOperatingExpenses) * 100) / 100;
    const netMarginPct = totalRevenue > 0 ? Math.round(((netIncome / totalRevenue) * 100) * 10) / 10 : 0;

    const hasSufficientData = revenues.length > 0 || cogs.length > 0 || expenses.length > 0;

    return {
      revenues,
      cogs,
      expenses,
      totalRevenue,
      totalCOGS,
      grossProfit,
      grossMarginPct,
      totalOperatingExpenses,
      netIncome,
      netMarginPct,
      hasSufficientData
    };
  }

  /**
   * Generates Balance Sheet strictly from Assets, Liabilities, and Equity
   * Assets = Liabilities + Equity + Net Income
   */
  static generateBalanceSheet(accounts: Account[], journalEntries: JournalEntry[]): BalanceSheetResult {
    const updatedAccounts = AccountingEngine.calculateAllAccountBalances(accounts, journalEntries);
    const incomeStmt = this.generateIncomeStatement(accounts, journalEntries);

    const assets: BalanceSheetResult["assets"] = [];
    const liabilities: BalanceSheetResult["liabilities"] = [];
    const equity: BalanceSheetResult["equity"] = [];

    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquityBeforeNetIncome = 0;

    updatedAccounts.forEach(acc => {
      if (acc.type === AccountType.Asset) {
        if (acc.balance !== 0) {
          assets.push({ accountId: acc.id, name: acc.name, nameAr: acc.nameAr, amount: acc.balance });
          totalAssets += acc.balance;
        }
      } else if (acc.type === AccountType.Liability) {
        if (acc.balance !== 0) {
          liabilities.push({ accountId: acc.id, name: acc.name, nameAr: acc.nameAr, amount: acc.balance });
          totalLiabilities += acc.balance;
        }
      } else if (acc.type === AccountType.Equity) {
        if (acc.balance !== 0) {
          equity.push({ accountId: acc.id, name: acc.name, nameAr: acc.nameAr, amount: acc.balance });
          totalEquityBeforeNetIncome += acc.balance;
        }
      }
    });

    totalAssets = Math.round(totalAssets * 100) / 100;
    totalLiabilities = Math.round(totalLiabilities * 100) / 100;
    totalEquityBeforeNetIncome = Math.round(totalEquityBeforeNetIncome * 100) / 100;
    const retainedEarnings = incomeStmt.netIncome;

    const totalEquityAndLiabilities = Math.round((totalLiabilities + totalEquityBeforeNetIncome + retainedEarnings) * 100) / 100;
    const discrepancy = Math.abs(Math.round((totalAssets - totalEquityAndLiabilities) * 100) / 100);

    return {
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquityBeforeNetIncome,
      retainedEarnings,
      totalEquityAndLiabilities,
      isBalanced: discrepancy === 0,
      discrepancy,
      hasSufficientData: assets.length > 0
    };
  }
}
