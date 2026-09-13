import { Account } from "../../../types";
import { AccountRepository, JournalEntryRepository } from "../repositories/RepositoryInterfaces";
import { AccountingEngine } from "../accounting/AccountingEngine";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export interface AccountWithDerivedBalance extends Account {
  derivedBalance: number;
  derivedDebitTotal: number;
  derivedCreditTotal: number;
}

export class AccountApplicationService {
  constructor(
    private accountRepo: AccountRepository,
    private journalEntryRepo: JournalEntryRepository
  ) {}

  async getAll(options?: QueryOptions): Promise<AccountWithDerivedBalance[]> {
    const accounts = await this.accountRepo.getAll(options);
    const journalEntries = await this.journalEntryRepo.getAll();
    const trialBalance = AccountingEngine.calculateTrialBalance(accounts, journalEntries);

    const balanceMap = new Map(trialBalance.rows.map(r => [r.accountId, r]));

    return accounts.map(acc => {
      const tbRow = balanceMap.get(acc.id);
      const isDebitNature = acc.type === "Asset" || acc.type === "Expense";
      const derivedBalance = tbRow 
        ? (isDebitNature ? (tbRow.balanceDebit - tbRow.balanceCredit) : (tbRow.balanceCredit - tbRow.balanceDebit))
        : 0;

      return {
        ...acc,
        balance: derivedBalance,
        derivedBalance,
        derivedDebitTotal: tbRow?.debitTotal || 0,
        derivedCreditTotal: tbRow?.creditTotal || 0
      };
    });
  }

  async getById(id: string, context?: TenantContext): Promise<AccountWithDerivedBalance> {
    const account = await this.accountRepo.findById(id, context);
    if (!account) {
      throw AppError.notFound("Account", id);
    }

    const journalEntries = await this.journalEntryRepo.getAll();
    const tbRow = AccountingEngine.calculateTrialBalance([account], journalEntries).rows[0];
    const isDebitNature = account.type === "Asset" || account.type === "Expense";
    const derivedBalance = tbRow 
      ? (isDebitNature ? (tbRow.balanceDebit - tbRow.balanceCredit) : (tbRow.balanceCredit - tbRow.balanceDebit))
      : 0;

    return {
      ...account,
      balance: derivedBalance,
      derivedBalance,
      derivedDebitTotal: tbRow?.debitTotal || 0,
      derivedCreditTotal: tbRow?.creditTotal || 0
    };
  }

  async create(accountData: Account, context?: TenantContext): Promise<Account> {
    const existing = await this.accountRepo.findByCode(accountData.code, context);
    if (existing) {
      throw AppError.conflict(`Account with code '${accountData.code}' already exists.`);
    }

    await this.accountRepo.save(accountData, context);
    return accountData;
  }
}
