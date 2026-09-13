import { pgTable, text, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const suppliers = pgTable("suppliers", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  // CACHED DERIVED PROJECTION: Source of truth is supplier_movements & AP GL account 2100
  balance: numeric("balance", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_suppliers_tenant").on(table.tenantId),
  companyIdx: index("idx_suppliers_company").on(table.companyId),
}));

export const supplierMovements = pgTable("supplier_movements", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: "restrict" }),
  date: text("date").notNull(),
  type: text("type").notNull(), // purchase, payment, return, transfer
  amount: numeric("amount", { precision: 15, scale: 4 }).notNull(),
  reference: text("reference").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_supp_mov_tenant").on(table.tenantId),
  companyIdx: index("idx_supp_mov_company").on(table.companyId),
  suppIdx: index("idx_supp_mov_supplier").on(table.supplierId),
}));
