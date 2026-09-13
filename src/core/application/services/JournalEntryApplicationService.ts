import { JournalEntry } from "../../../types";
import { CreateJournalEntryDTO, PostJournalEntryDTO, ReverseJournalEntryDTO } from "../dtos";
import { JournalEntryRepository, FiscalPeriodRepository, AccountRepository } from "../repositories/RepositoryInterfaces";
import { AccountingEngine } from "../accounting/AccountingEngine";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class JournalEntryApplicationService {
  constructor(
    private journalEntryRepo: JournalEntryRepository,
    private fiscalPeriodRepo: FiscalPeriodRepository,
    private accountRepo?: AccountRepository
  ) {}

  async getAll(options?: QueryOptions): Promise<JournalEntry[]> {
    return this.journalEntryRepo.getAll(options);
  }

  async getById(id: string, context?: TenantContext): Promise<JournalEntry> {
    const entry = await this.journalEntryRepo.findById(id, context);
    if (!entry) {
      throw AppError.notFound("Journal entry", id);
    }
    return entry;
  }

  async createDraft(dto: CreateJournalEntryDTO, context?: TenantContext): Promise<JournalEntry> {
    // 1. Structure validation
    if (!dto.items || dto.items.length < 2) {
      throw AppError.validation("Journal entry must contain at least two line items.");
    }

    const accounts = this.accountRepo ? await this.accountRepo.getAll() : [];
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const draftEntry: Omit<JournalEntry, "id"> = {
      date: dto.date || new Date().toISOString().split("T")[0],
      reference: dto.reference || `JE-MANUAL-${Date.now()}`,
      notes: dto.notes || "Draft Manual Journal Entry",
      items: dto.items.map((it, idx) => ({
        id: `line-${Date.now()}-${idx}`,
        accountId: it.accountId,
        accountName: accountMap.get(it.accountId)?.name || it.description || it.accountId,
        debit: Number(it.debit || 0),
        credit: Number(it.credit || 0),
        notes: it.description || it.costCenter
      })),
      workflowStatus: "Draft",
      posted: false,
      currency: dto.currency,
      exchangeRate: dto.exchangeRate || 1
    };

    // 2. Validate double entry balance
    const totalDebit = draftEntry.items.reduce((s, it) => s + it.debit, 0);
    const totalCredit = draftEntry.items.reduce((s, it) => s + it.credit, 0);
    const discrepancy = Math.abs(totalDebit - totalCredit);
    if (Math.round(discrepancy * 100) > 0) {
      throw AppError.unbalancedEntry(discrepancy);
    }

    const validation = AccountingEngine.validateEntry(draftEntry);
    if (!validation.valid) {
      throw AppError.validation(validation.errors.join("; "));
    }

    const fullEntry: JournalEntry = {
      id: `je-${Date.now()}`,
      ...draftEntry
    };

    await this.journalEntryRepo.save(fullEntry, context);
    return fullEntry;
  }

  async post(id: string, dto?: PostJournalEntryDTO, context?: TenantContext): Promise<JournalEntry> {
    const entry = await this.journalEntryRepo.findById(id, context);
    if (!entry) {
      throw AppError.notFound("Journal entry", id);
    }

    if (entry.workflowStatus === "Posted" || entry.posted) {
      throw AppError.conflict(`Journal entry '${id}' is already posted.`);
    }

    const allEntries = await this.journalEntryRepo.getAll();
    const periods = await this.fiscalPeriodRepo.getAll();

    const postResult = AccountingEngine.postEntry(entry, allEntries, periods);
    if (!postResult.success || !postResult.entry) {
      if (
        postResult.error?.toLowerCase().includes("period") ||
        postResult.error?.includes("CLOSED") ||
        postResult.error?.includes("LOCKED")
      ) {
        throw AppError.periodLocked(entry.date);
      }
      throw AppError.validation(postResult.error || "Failed to post journal entry.");
    }

    await this.journalEntryRepo.save(postResult.entry, context);
    return postResult.entry;
  }

  async reverse(id: string, reason: string, context?: TenantContext): Promise<{ originalEntry: JournalEntry; reversalEntry: JournalEntry }> {
    if (!reason || reason.trim().length === 0) {
      throw AppError.validation("Reason is mandatory for reversing a posted journal entry.");
    }

    const entry = await this.journalEntryRepo.findById(id, context);
    if (!entry) {
      throw AppError.notFound("Journal entry", id);
    }

    if (entry.workflowStatus !== "Posted" && !entry.posted) {
      throw AppError.validation(`Journal entry '${id}' is not posted and cannot be reversed. Only posted vouchers can be reversed.`);
    }

    const allEntries = await this.journalEntryRepo.getAll();
    const reversalResult = AccountingEngine.reverseEntry(id, allEntries, reason);
    if (!reversalResult.success || !reversalResult.reversalEntry) {
      throw AppError.validation(reversalResult.error || "Failed to reverse journal entry.");
    }

    // Save reversal entry
    await this.journalEntryRepo.save(reversalResult.reversalEntry, context);

    // Save updated original entry with reversal annotation
    const updatedOriginal = reversalResult.updatedOriginalEntry || {
      ...entry,
      notes: `${entry.notes} [REVERSED by ${reversalResult.reversalEntry.id}]`
    };
    await this.journalEntryRepo.save(updatedOriginal, context);

    return {
      originalEntry: updatedOriginal,
      reversalEntry: reversalResult.reversalEntry
    };
  }

  async updateDraft(id: string, partial: Partial<JournalEntry>, context?: TenantContext): Promise<JournalEntry> {
    const entry = await this.journalEntryRepo.findById(id, context);
    if (!entry) {
      throw AppError.notFound("Journal entry", id);
    }

    if (entry.workflowStatus === "Posted" || entry.posted) {
      throw AppError.postedEntryImmutable(id);
    }

    const updated: JournalEntry = { ...entry, ...partial };
    if (updated.items && updated.items.length >= 2) {
      const totalDebit = updated.items.reduce((s, it) => s + (it.debit || 0), 0);
      const totalCredit = updated.items.reduce((s, it) => s + (it.credit || 0), 0);
      const discrepancy = Math.abs(totalDebit - totalCredit);
      if (Math.round(discrepancy * 100) > 0) {
        throw AppError.unbalancedEntry(discrepancy);
      }

      const validation = AccountingEngine.validateEntry(updated);
      if (!validation.valid) {
        throw AppError.validation(validation.errors.join("; "));
      }
    }

    await this.journalEntryRepo.save(updated, context);
    return updated;
  }
}
