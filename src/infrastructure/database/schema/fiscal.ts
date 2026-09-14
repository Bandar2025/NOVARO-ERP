import { pgTable, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";

export const fiscalYears = pgTable("fiscal_years", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").default("OPEN").notNull(), // OPEN, CLOSED
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantCompanyIdUnique: unique("uq_fiscal_years_tenant_company_id").on(table.tenantId, table.companyId, table.id),
  tenantIdx: index("idx_fiscal_years_tenant").on(table.tenantId),
  companyIdx: index("idx_fiscal_years_company").on(table.companyId),
}));

export const fiscalPeriods = pgTable("fiscal_periods", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  fiscalYearId: text("fiscal_year_id").references(() => fiscalYears.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  status: text("status").default("OPEN").notNull(), // OPEN, CLOSED
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_fiscal_periods_tenant").on(table.tenantId),
  companyIdx: index("idx_fiscal_periods_company").on(table.companyId),
}));
