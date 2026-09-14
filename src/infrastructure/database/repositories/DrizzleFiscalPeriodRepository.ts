import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { fiscalPeriods } from "../schema/fiscal";
import { FiscalPeriodRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { FiscalPeriod } from "../../../core/domain/accounting/FiscalPeriod";
import { extractTenantContext } from "./contextUtils";

export class DrizzleFiscalPeriodRepository implements FiscalPeriodRepository {
  constructor(private client: DbOrTx = db) {}

  async getAll(options?: QueryOptions): Promise<FiscalPeriod[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    let query = this.client
      .select()
      .from(fiscalPeriods)
      .where(
        and(
          eq(fiscalPeriods.tenantId, tenantId),
          eq(fiscalPeriods.companyId, companyId)
        )
      )
      .orderBy(fiscalPeriods.id);

    if (options?.forUpdate) {
      query = query.for("update");
    }

    const rows = await query;
    return rows.map(r => this.mapToDomain(r));
  }

  async getById(id: string, context?: TenantContext): Promise<FiscalPeriod | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const rows = await this.client
      .select()
      .from(fiscalPeriods)
      .where(
        and(
          eq(fiscalPeriods.id, id),
          eq(fiscalPeriods.tenantId, tenantId),
          eq(fiscalPeriods.companyId, companyId)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async getByIdForUpdate(id: string, context?: TenantContext): Promise<FiscalPeriod | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const rows = await this.client
      .select()
      .from(fiscalPeriods)
      .where(
        and(
          eq(fiscalPeriods.id, id),
          eq(fiscalPeriods.tenantId, tenantId),
          eq(fiscalPeriods.companyId, companyId)
        )
      )
      .for("update")
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async save(period: FiscalPeriod, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await this.client
      .insert(fiscalPeriods)
      .values({
        id: period.id,
        tenantId,
        companyId,
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        status: period.status,
      })
      .onConflictDoUpdate({
        target: fiscalPeriods.id,
        set: {
          name: period.name,
          startDate: period.startDate,
          endDate: period.endDate,
          status: period.status,
        },
      });
  }

  private mapToDomain(row: typeof fiscalPeriods.$inferSelect): FiscalPeriod {
    return {
      id: row.id,
      name: row.name,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status as "OPEN" | "CLOSED",
    };
  }
}
