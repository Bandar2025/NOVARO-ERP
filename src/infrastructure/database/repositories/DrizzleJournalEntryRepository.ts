import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { journalEntries, journalEntryItems } from "../schema/journalEntries";
import { JournalEntryRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { JournalEntry, JournalEntryItem, Currency, DocumentWorkflowStatus } from "../../../types";
import { AppError } from "../../../core/application/errors/ApiError";

const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_COMPANY_ID = "default-company";

export class DrizzleJournalEntryRepository implements JournalEntryRepository {
  async findById(id: string, context?: TenantContext): Promise<JournalEntry | null> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const headers = await db
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

    const items = await db
      .select()
      .from(journalEntryItems)
      .where(eq(journalEntryItems.journalEntryId, id));

    return this.mapToDomain(headers[0], items);
  }

  async findByReference(reference: string, context?: TenantContext): Promise<JournalEntry[]> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const headers = await db
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
      const items = await db
        .select()
        .from(journalEntryItems)
        .where(eq(journalEntryItems.journalEntryId, h.id));
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async getAll(options?: QueryOptions): Promise<JournalEntry[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const headers = await db
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
      const items = await db
        .select()
        .from(journalEntryItems)
        .where(eq(journalEntryItems.journalEntryId, h.id));
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async getPostedEntries(options?: QueryOptions): Promise<JournalEntry[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const headers = await db
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
      const items = await db
        .select()
        .from(journalEntryItems)
        .where(eq(journalEntryItems.journalEntryId, h.id));
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async save(entry: JournalEntry, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    // Check if entry already exists and is posted (defense in depth)
    const existing = await this.findById(entry.id, context);
    if (existing && existing.posted && !entry.posted) {
      throw AppError.conflict("Posted journal entry is immutable and cannot be edited", "POSTED_ENTRY_IMMUTABLE");
    }

    await db
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
          updatedAt: new Date(),
        },
      });

    // Replace items
    await db.delete(journalEntryItems).where(eq(journalEntryItems.journalEntryId, entry.id));

    if (entry.items && entry.items.length > 0) {
      await db.insert(journalEntryItems).values(
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
  }

  async update(id: string, partial: Partial<JournalEntry>, context?: TenantContext): Promise<void> {
    const existing = await this.findById(id, context);
    if (!existing) {
      throw AppError.notFound(`Journal entry ${id} not found`);
    }

    if (existing.posted) {
      throw AppError.conflict("Posted journal entry is immutable and cannot be edited", "POSTED_ENTRY_IMMUTABLE");
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
