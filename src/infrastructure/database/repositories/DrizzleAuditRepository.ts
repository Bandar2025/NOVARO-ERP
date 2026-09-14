import { eq, and } from "drizzle-orm";
import { db, ensureInitialized, DbOrTx } from "../client/db";
import { auditLogs } from "../schema/auditLogs";
import { AuditRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { AuditLog } from "../../../types";
import { extractTenantContext } from "./contextUtils";
import crypto from "crypto";

export class DrizzleAuditRepository implements AuditRepository {
  constructor(private client: DbOrTx = db) {}

  async log(audit: AuditLog, context?: TenantContext): Promise<void> {
    await ensureInitialized();
    const { tenantId, companyId, branchId } = extractTenantContext(context);
    const entryId = audit.id || `audit-${crypto.randomUUID()}`;
    const timestamp = audit.timestamp || new Date().toISOString();

    await this.client.insert(auditLogs).values({
      id: entryId,
      tenantId,
      companyId: companyId || "company-main",
      branchId: branchId || null,
      timestamp,
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
    await ensureInitialized();
    const { tenantId, companyId } = extractTenantContext(options);

    const rows = await this.client
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
