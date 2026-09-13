import { pgTable, text, boolean, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
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
  tenantIdx: index("idx_accounts_tenant").on(table.tenantId),
  companyIdx: index("idx_accounts_company").on(table.companyId),
  codeIdx: index("idx_accounts_code").on(table.companyId, table.code),
}));
