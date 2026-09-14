import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { journalEntries, journalEntryItems } from "../schema/journalEntries";
import { JournalEntryRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { JournalEntry, JournalEntryItem, Currency, DocumentWorkflowStatus } from "../../../types";
import { AppError } from "../../../core/application/errors/ApiError";
import { extractTenantContext } from "./contextUtils";

export class DrizzleJournalEntryRepository implements JournalEntryRepository {
  constructor(private client: DbOrTx = db) {}

  private async executeTx<T>(fn: (txClient: any) => Promise<T>): Promise<T> {
    if (typeof this.client.transaction === "function") {
      return await this.client.transaction(fn);
    }
    return await fn(this.client);
  }

  async findById(id: string, context?: TenantContext): Promise<JournalEntry | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const headers = await this.client
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.id, id),
          eq(journalEntries.tenantId, tenantId),
          eq(journalEntries.companyId, companyId)
        )
      )
      .limit(1);

    if (headers.length === 0) return null;

    const items = await this.client
      .select()
      .from(journalEntryItems)
      .where(
        and(
          eq(journalEntryItems.journalEntryId, id),
          eq(journalEntryItems.tenantId, tenantId),
          eq(journalEntryItems.companyId, companyId)
        )
      );

    return this.mapToDomain(headers[0], items);
  }

  async findByReference(reference: string, context?: TenantContext): Promise<JournalEntry[]> {
    const { tenantId, companyId } = extractTenantContext(context);

    const headers = await this.client
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.reference, reference),
          eq(journalEntries.tenantId, tenantId),
          eq(journalEntries.companyId, companyId)
        )
      );

    const result: JournalEntry[] = [];
    for (const h of headers) {
      const items = await this.client
        .select()
        .from(journalEntryItems)
        .where(
          and(
            eq(journalEntryItems.journalEntryId, h.id),
            eq(journalEntryItems.tenantId, tenantId),
            eq(journalEntryItems.companyId, companyId)
          )
        );
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async getAll(options?: QueryOptions): Promise<JournalEntry[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const headers = await this.client
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.tenantId, tenantId),
          eq(journalEntries.companyId, companyId)
        )
      );

    const result: JournalEntry[] = [];
    for (const h of headers) {
      const items = await this.client
        .select()
        .from(journalEntryItems)
        .where(
          and(
            eq(journalEntryItems.journalEntryId, h.id),
            eq(journalEntryItems.tenantId, tenantId),
            eq(journalEntryItems.companyId, companyId)
          )
        );
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async getPostedEntries(options?: QueryOptions): Promise<JournalEntry[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const headers = await this.client
      .select()
      .from(journalEntries)
      .where(
        and(
          eq(journalEntries.tenantId, tenantId),
          eq(journalEntries.companyId, companyId),
          eq(journalEntries.posted, true)
        )
      );

    const result: JournalEntry[] = [];
    for (const h of headers) {
      const items = await this.client
        .select()
        .from(journalEntryItems)
        .where(
          and(
            eq(journalEntryItems.journalEntryId, h.id),
            eq(journalEntryItems.tenantId, tenantId),
            eq(journalEntryItems.companyId, companyId)
          )
        );
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async save(entry: JournalEntry, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    // Strict posted entry immutability check
    const existing = await this.findById(entry.id, context);
    if (existing && (existing.posted || existing.workflowStatus === "Posted")) {
      if (this.isFinancialDataChanged(existing, entry)) {
        throw AppError.postedEntryImmutable(entry.id);
      }
    }

    await this.executeTx(async (tx) => {
      await tx
        .insert(journalEntries)
        .values({
          id: entry.id,
          tenantId,
          companyId,
          date: entry.date,
          reference: entry.reference,
          notes: entry.notes || "",
          posted: entry.posted,
          workflowStatus: entry.workflowStatus || (entry.posted ? "Posted" : "Draft"),
          currency: entry.currency || "SAR",
          exchangeRate: (entry.exchangeRate ?? 1).toFixed(6),
          isRecurring: entry.isRecurring || false,
          reversalOfId: entry.reversalOfId || null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: journalEntries.id,
          set: {
            date: entry.date,
            reference: entry.reference,
            notes: entry.notes || "",
            posted: entry.posted,
            workflowStatus: entry.workflowStatus || (entry.posted ? "Posted" : "Draft"),
            currency: entry.currency || "SAR",
            exchangeRate: (entry.exchangeRate ?? 1).toFixed(6),
            isRecurring: entry.isRecurring || false,
            reversalOfId: entry.reversalOfId || null,
            updatedAt: new Date(),
          },
        });

      // Replace items
      await tx
        .delete(journalEntryItems)
        .where(
          and(
            eq(journalEntryItems.journalEntryId, entry.id),
            eq(journalEntryItems.tenantId, tenantId),
            eq(journalEntryItems.companyId, companyId)
          )
        );

      if (entry.items && entry.items.length > 0) {
        await tx.insert(journalEntryItems).values(
          entry.items.map((it, idx) => ({
            id: it.id || `${entry.id}-item-${idx + 1}`,
            tenantId,
            companyId,
            journalEntryId: entry.id,
            accountId: it.accountId,
            accountName: it.accountName,
            debit: (it.debit ?? 0).toFixed(4),
            credit: (it.credit ?? 0).toFixed(4),
            notes: it.notes || null,
          }))
        );
      }
    });
  }

  async delete(id: string, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);
    const existing = await this.findById(id, context);
    if (!existing) {
      return;
    }
    if (existing.posted || existing.workflowStatus === "Posted") {
      throw AppError.postedEntryImmutable(id);
    }
    await this.executeTx(async (tx) => {
      await tx
        .delete(journalEntryItems)
        .where(
          and(
            eq(journalEntryItems.journalEntryId, id),
            eq(journalEntryItems.tenantId, tenantId),
            eq(journalEntryItems.companyId, companyId)
          )
        );
      await tx
        .delete(journalEntries)
        .where(
          and(
            eq(journalEntries.id, id),
            eq(journalEntries.tenantId, tenantId),
            eq(journalEntries.companyId, companyId)
          )
        );
    });
  }

  async update(id: string, partial: Partial<JournalEntry>, context?: TenantContext): Promise<void> {
    const existing = await this.findById(id, context);
    if (!existing) {
      throw AppError.notFound(`Journal entry ${id} not found`);
    }

    if (existing.posted || existing.workflowStatus === "Posted") {
      throw AppError.postedEntryImmutable(id);
    }

    const updated: JournalEntry = {
      ...existing,
      ...partial,
      id: existing.id,
    };

    await this.save(updated, context);
  }

  async exists(id: string, context?: TenantContext): Promise<boolean> {
    const je = await this.findById(id, context);
    return je !== null;
  }

  private isFinancialDataChanged(existing: JournalEntry, newEntry: JournalEntry): boolean {
    if (existing.date !== newEntry.date) return true;
    if (existing.reference !== newEntry.reference) return true;
    if ((existing.currency || "SAR") !== (newEntry.currency || "SAR")) return true;
    if (Math.abs((existing.exchangeRate ?? 1) - (newEntry.exchangeRate ?? 1)) > 0.000001) return true;
    if (existing.posted !== newEntry.posted) return true;

    const existingItems = existing.items || [];
    const newItems = newEntry.items || [];
    if (existingItems.length !== newItems.length) return true;

    for (let i = 0; i < existingItems.length; i++) {
      const e = existingItems[i];
      const n = newItems[i];
      if (e.accountId !== n.accountId) return true;
      if (Math.abs((e.debit ?? 0) - (n.debit ?? 0)) > 0.0001) return true;
      if (Math.abs((e.credit ?? 0) - (n.credit ?? 0)) > 0.0001) return true;
    }
    return false;
  }

  private mapToDomain(
    header: typeof journalEntries.$inferSelect,
    itemsList: (typeof journalEntryItems.$inferSelect)[]
  ): JournalEntry {
    return {
      id: header.id,
      date: header.date,
      reference: header.reference,
      notes: header.notes || "",
      posted: header.posted,
      workflowStatus: header.workflowStatus as DocumentWorkflowStatus,
      currency: (header.currency as Currency) || Currency.SAR,
      exchangeRate: header.exchangeRate ? parseFloat(header.exchangeRate) : 1,
      isRecurring: header.isRecurring || false,
      reversalOfId: header.reversalOfId || undefined,
      items: itemsList.map(it => ({
        id: it.id,
        accountId: it.accountId,
        accountName: it.accountName,
        debit: parseFloat(it.debit),
        credit: parseFloat(it.credit),
        notes: it.notes || undefined,
      })),
    };
  }
}
