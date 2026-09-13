import { pgTable, text, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const customers = pgTable("customers", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  // CACHED DERIVED PROJECTION: Source of truth is customer_movements & AR GL account 1100
  balance: numeric("balance", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_customers_tenant").on(table.tenantId),
  companyIdx: index("idx_customers_company").on(table.companyId),
}));

export const customerMovements = pgTable("customer_movements", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  date: text("date").notNull(),
  type: text("type").notNull(), // sale, payment, return, transfer
  amount: numeric("amount", { precision: 15, scale: 4 }).notNull(),
  reference: text("reference").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_cust_mov_tenant").on(table.tenantId),
  companyIdx: index("idx_cust_mov_company").on(table.companyId),
  custIdx: index("idx_cust_mov_customer").on(table.customerId),
}));
