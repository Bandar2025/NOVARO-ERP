import { pgTable, text, boolean, numeric, timestamp, index, unique, foreignKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { fiscalPeriods } from "./fiscal";
import { accounts } from "./accounts";

export const journalEntries = pgTable("journal_entries", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull(),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  fiscalPeriodId: text("fiscal_period_id").references(() => fiscalPeriods.id, { onDelete: "restrict" }),
  date: text("date").notNull(),
  reference: text("reference").notNull(),
  notes: text("notes"),
  posted: boolean("posted").default(false).notNull(),
  workflowStatus: text("workflow_status").default("Draft").notNull(),
  currency: text("currency").default("SAR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }).default("1.000000"),
  isRecurring: boolean("is_recurring").default(false),
  reversalOfId: text("reversal_of_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.tenantId, table.companyId],
    foreignColumns: [companies.tenantId, companies.id],
    name: "fk_je_company",
  }).onDelete("restrict"),
  reversalFk: foreignKey({
    columns: [table.tenantId, table.companyId, table.reversalOfId],
    foreignColumns: [table.tenantId, table.companyId, table.id],
    name: "fk_je_reversal_of",
  }).onDelete("restrict"),
  tenantCompanyIdUnique: unique("uq_je_tenant_company_id").on(table.tenantId, table.companyId, table.id),
  tenantIdx: index("idx_je_tenant").on(table.tenantId),
  companyIdx: index("idx_je_company").on(table.companyId),
  branchIdx: index("idx_je_branch").on(table.branchId),
  statusIdx: index("idx_je_status").on(table.tenantId, table.companyId, table.posted),
  dateIdx: index("idx_je_date").on(table.tenantId, table.companyId, table.date),
}));

export const journalEntryItems = pgTable("journal_entry_items", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  journalEntryId: text("journal_entry_id").notNull().references(() => journalEntries.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  accountName: text("account_name").notNull(),
  debit: numeric("debit", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  credit: numeric("credit", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  chkDebitNonNeg: check("chk_jei_debit_nonneg", sql`debit >= 0`),
  chkCreditNonNeg: check("chk_jei_credit_nonneg", sql`credit >= 0`),
  chkNotBothPositive: check("chk_jei_not_both_positive", sql`debit = 0 OR credit = 0`),
  tenantIdx: index("idx_jei_tenant").on(table.tenantId),
  companyIdx: index("idx_jei_company").on(table.companyId),
  jeIdx: index("idx_jei_entry").on(table.journalEntryId),
  accountIdx: index("idx_jei_account").on(table.accountId),
}));

