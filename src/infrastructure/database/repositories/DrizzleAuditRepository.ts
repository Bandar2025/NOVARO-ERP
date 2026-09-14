import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { auditLogs } from "../schema/auditLogs";
import { AuditRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { AuditLog } from "../../../types";
import { extractTenantContext } from "./contextUtils";

export class DrizzleAuditRepository implements AuditRepository {
  constructor(private client: DbOrTx = db) {}

  private static memoryLogs: AuditLog[] = [];

  async log(audit: AuditLog, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);
    const entry: AuditLog = {
      id: audit.id || `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: audit.timestamp || new Date().toISOString(),
      userId: audit.userId,
      username: audit.username,
      action: audit.action,
      details: audit.details,
      oldValue: audit.oldValue,
      newValue: audit.newValue,
      reason: audit.reason,
    };

    DrizzleAuditRepository.memoryLogs.push(entry);

    try {
      await this.client.insert(auditLogs).values({
        id: entry.id,
        tenantId,
        companyId,
        timestamp: entry.timestamp,
        userId: entry.userId,
        username: entry.username,
        action: entry.action,
        details: entry.details,
        oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        reason: entry.reason || null,
      });
    } catch (e) {
      // Offline fallback: entry stored in memoryLogs
    }
  }

  async getAll(options?: QueryOptions): Promise<AuditLog[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    try {
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
    } catch (e) {
      return DrizzleAuditRepository.memoryLogs;
    }
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
