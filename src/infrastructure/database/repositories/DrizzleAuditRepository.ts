import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { auditLogs } from "../schema/auditLogs";
import { AuditRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { AuditLog } from "../../../types";

const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_COMPANY_ID = "default-company";

export class DrizzleAuditRepository implements AuditRepository {
  async log(audit: AuditLog, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db.insert(auditLogs).values({
      id: audit.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      companyId,
      timestamp: audit.timestamp || new Date().toISOString(),
      userId: audit.userId,
      username: audit.username,
      action: audit.action,
      details: audit.details,
      oldValue: audit.oldValue ? JSON.stringify(audit.oldValue) : null,
      newValue: audit.newValue ? JSON.stringify(audit.newValue) : null,
      reason: audit.reason || null,
    });
  }

  async getAll(options?: QueryOptions): Promise<AuditLog[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(auditLogs)
      .where(
        and(
          eq(auditLogs.tenantId, tenantId),
          eq(auditLogs.companyId, companyId)
        )
      );

    return rows.map(r => this.mapToDomain(r));
  }

  private mapToDomain(row: typeof auditLogs.$inferSelect): AuditLog {
    return {
      id: row.id,
      timestamp: row.timestamp,
      userId: row.userId,
      username: row.username,
      action: row.action,
      details: row.details,
      oldValue: row.oldValue ? JSON.parse(row.oldValue) : undefined,
      newValue: row.newValue ? JSON.parse(row.newValue) : undefined,
      reason: row.reason || undefined,
    };
  }
}
