import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { items } from "./items";
import { warehouses } from "./warehouses";

export const stockMovements = pgTable("stock_movements", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "restrict" }),
  movementType: text("movement_type").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  unitCost: numeric("unit_cost", { precision: 15, scale: 4 }).notNull(),
  totalCost: numeric("total_cost", { precision: 15, scale: 4 }).notNull(),
  batchNumber: text("batch_number").notNull(),
  referenceType: text("reference_type").notNull(),
  referenceId: text("reference_id").notNull(),
  date: text("date").notNull(),
  createdBy: text("created_by").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_sm_tenant").on(table.tenantId),
  companyIdx: index("idx_sm_company").on(table.companyId),
  itemIdx: index("idx_sm_item").on(table.itemId),
  warehouseIdx: index("idx_sm_warehouse").on(table.warehouseId),
  refIdx: index("idx_sm_ref").on(table.referenceType, table.referenceId),
}));
