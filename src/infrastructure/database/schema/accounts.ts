import { pgTable, text, boolean, numeric, timestamp, index, unique, foreignKey } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  type: text("type").notNull(), // Asset, Liability, Equity, Income, Expense
  parentId: text("parent_id"),
  // CACHED DERIVED PROJECTION: Source of truth is posted journal_entry_items
  balance: numeric("balance", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.tenantId, table.companyId],
    foreignColumns: [companies.tenantId, companies.id],
    name: "fk_accounts_company",
  }).onDelete("restrict"),
  parentFk: foreignKey({
    columns: [table.tenantId, table.companyId, table.parentId],
    foreignColumns: [table.tenantId, table.companyId, table.id],
    name: "fk_accounts_parent",
  }).onDelete("restrict"),
  tenantCompanyIdUnique: unique("uq_accounts_tenant_company_id").on(table.tenantId, table.companyId, table.id),
  tenantCompanyCodeUnique: unique("uq_accounts_tenant_company_code").on(table.tenantId, table.companyId, table.code),
  tenantIdx: index("idx_accounts_tenant").on(table.tenantId),
  companyIdx: index("idx_accounts_company").on(table.companyId),
  codeIdx: index("idx_accounts_code").on(table.companyId, table.code),
}));

