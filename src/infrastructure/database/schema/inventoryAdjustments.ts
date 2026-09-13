import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { warehouses } from "./warehouses";
import { items } from "./items";

export const inventoryAdjustments = pgTable("inventory_adjustments", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "restrict" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  type: text("type").notNull(), // Addition, Deduction
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  costPerUnit: numeric("cost_per_unit", { precision: 15, scale: 4 }).notNull(),
  notes: text("notes"),
  workflowStatus: text("workflow_status").default("Draft").notNull(),
  date: text("date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_adj_tenant").on(table.tenantId),
  companyIdx: index("idx_adj_company").on(table.companyId),
}));
