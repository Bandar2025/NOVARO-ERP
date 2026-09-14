import { pgTable, text, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { users } from "./users";
import { roles } from "./roles";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const userRoles = pgTable("user_roles", {
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "cascade" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.roleId, table.tenantId] }),
  userIdx: index("idx_user_roles_user").on(table.userId),
  roleIdx: index("idx_user_roles_role").on(table.roleId),
  tenantIdx: index("idx_user_roles_tenant").on(table.tenantId),
}));
