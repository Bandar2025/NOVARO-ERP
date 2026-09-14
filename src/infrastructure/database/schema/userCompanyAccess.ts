import { pgTable, text, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const userCompanyAccess = pgTable("user_company_access", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  grantedAt: timestamp("granted_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.tenantId, table.companyId] }),
  userIdx: index("idx_user_company_user").on(table.userId),
  tenantIdx: index("idx_user_company_tenant").on(table.tenantId),
  companyIdx: index("idx_user_company_comp").on(table.companyId),
}));
