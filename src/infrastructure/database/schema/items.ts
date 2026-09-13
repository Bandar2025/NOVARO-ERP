import { pgTable, text, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const items = pgTable("items", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  sku: text("sku").notNull(),
  category: text("category").notNull(),
  unit: text("unit").notNull(),
  price: numeric("price", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  cost: numeric("cost", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  barcode: text("barcode"),
  // CACHED DERIVED PROJECTION: Source of truth is cost_layers & stock_movements
  currentStock: numeric("current_stock", { precision: 12, scale: 4 }).default("0.0000").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_items_tenant").on(table.tenantId),
  companyIdx: index("idx_items_company").on(table.companyId),
  skuIdx: index("idx_items_sku").on(table.companyId, table.sku),
}));
