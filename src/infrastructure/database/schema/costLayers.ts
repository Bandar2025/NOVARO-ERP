import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { items } from "./items";
import { warehouses } from "./warehouses";

export const costLayers = pgTable("cost_layers", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "restrict" }),
  batchNumber: text("batch_number").notNull(),
  dateReceived: text("date_received").notNull(),
  originalQuantity: numeric("original_quantity", { precision: 12, scale: 4 }).notNull(),
  remainingQuantity: numeric("remaining_quantity", { precision: 12, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 15, scale: 4 }).notNull(),
  sourceReference: text("source_reference").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_cost_layers_tenant").on(table.tenantId),
  companyIdx: index("idx_cost_layers_company").on(table.companyId),
  itemWarehouseIdx: index("idx_cost_layers_item_wh").on(table.itemId, table.warehouseId),
  dateIdx: index("idx_cost_layers_date").on(table.dateReceived),
}));
