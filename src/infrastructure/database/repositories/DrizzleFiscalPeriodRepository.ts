import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { fiscalPeriods } from "../schema/fiscal";
import { FiscalPeriodRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { FiscalPeriod } from "../../../core/domain/accounting/FiscalPeriod";
import { extractTenantContext } from "./contextUtils";

export class DrizzleFiscalPeriodRepository implements FiscalPeriodRepository {
  async getAll(options?: QueryOptions): Promise<FiscalPeriod[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const rows = await db
      .select()
      .from(fiscalPeriods)
      .where(
        and(
          eq(fiscalPeriods.tenantId, tenantId),
          eq(fiscalPeriods.companyId, companyId)
        )
      );

    return rows.map(r => this.mapToDomain(r));
  }

  async getById(id: string, context?: TenantContext): Promise<FiscalPeriod | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const rows = await db
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

  async save(period: FiscalPeriod, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await db
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
