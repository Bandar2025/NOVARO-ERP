import { pgTable, text, integer, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";
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
    companyId: text("company_id")
      .notNull()
      .references(() => companies.id, { onDelete: "restrict" }),
    branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
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
    idempotencyIdx: uniqueIndex("idx_sync_idempotency").on(table.tenantId, table.idempotencyKey),
    statusIdx: index("idx_sync_status").on(table.tenantId, table.status),
    tenantIdx: index("idx_sync_tenant").on(table.tenantId),
  })
);
