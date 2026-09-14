import { pgTable, text, integer, timestamp, uniqueIndex, index, foreignKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const syncQueue = pgTable(
  "sync_queue",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    companyId: text("company_id").notNull(),
    branchId: text("branch_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    entityType: text("entity_type").notNull(), // sales_invoice, journal_entry, stock_movement, etc.
    operation: text("operation").notNull(), // CREATE, UPDATE, DELETE
    payload: text("payload").notNull(), // JSON string payload
    status: text("status").default("PENDING").notNull(), // PENDING, PROCESSING, SYNCED, FAILED, CONFLICT
    retryCount: integer("retry_count").default(0).notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => ({
    companyFk: foreignKey({
      columns: [table.tenantId, table.companyId],
      foreignColumns: [companies.tenantId, companies.id],
      name: "fk_sync_queue_company",
    }).onDelete("restrict"),
    branchFk: foreignKey({
      columns: [table.tenantId, table.companyId, table.branchId],
      foreignColumns: [branches.tenantId, branches.companyId, branches.id],
      name: "fk_sync_queue_branch",
    }).onDelete("restrict"),
    idempotencyIdx: uniqueIndex("idx_sync_idempotency").on(table.tenantId, table.idempotencyKey),
    statusIdx: index("idx_sync_status").on(table.tenantId, table.status),
    tenantIdx: index("idx_sync_tenant").on(table.tenantId),
    chkStatus: check("chk_sync_queue_status", sql`status IN ('PENDING', 'PROCESSING', 'SYNCED', 'FAILED', 'CONFLICT')`),
    chkOperation: check("chk_sync_queue_operation", sql`operation IN ('CREATE', 'UPDATE', 'DELETE')`),
    chkRetryCount: check("chk_sync_queue_retry_nonneg", sql`retry_count >= 0`),
    chkIdempotencyKeyNonEmpty: check("chk_sync_queue_idempotency_nonempty", sql`length(trim(idempotency_key)) > 0`),
  })
);
