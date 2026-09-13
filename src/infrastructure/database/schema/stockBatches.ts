import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { items } from "./items";
import { warehouses } from "./warehouses";
import { suppliers } from "./suppliers";

export const stockBatches = pgTable("stock_batches", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  batchNumber: text("batch_number").notNull(),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  manufactureDate: text("manufacture_date").notNull(),
  expiryDate: text("expiry_date").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  supplierId: text("supplier_id").references(() => suppliers.id, { onDelete: "restrict" }),
  costPerUnit: numeric("cost_per_unit", { precision: 15, scale: 4 }).notNull(),
  warehouseId: text("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_batches_tenant").on(table.tenantId),
  companyIdx: index("idx_batches_company").on(table.companyId),
  itemIdx: index("idx_batches_item").on(table.itemId),
  warehouseIdx: index("idx_batches_warehouse").on(table.warehouseId),
}));
