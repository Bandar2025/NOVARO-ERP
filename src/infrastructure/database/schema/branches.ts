import { pgTable, text, boolean, timestamp, index, unique, foreignKey } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";

export const branches = pgTable("branches", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  address: text("address"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  companyFk: foreignKey({
    columns: [table.tenantId, table.companyId],
    foreignColumns: [companies.tenantId, companies.id],
    name: "fk_branches_company",
  }).onDelete("restrict"),
  tenantCompanyBranchUnique: unique("uq_branches_tenant_company_id").on(table.tenantId, table.companyId, table.id),
  tenantIdx: index("idx_branches_tenant").on(table.tenantId),
  companyIdx: index("idx_branches_company").on(table.companyId),
}));

