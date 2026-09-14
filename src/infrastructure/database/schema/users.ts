import { pgTable, text, boolean, timestamp, integer, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  username: text("username").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull(),
  passwordHash: text("password_hash"),
  status: text("status").default("ACTIVE").notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_users_tenant").on(table.tenantId),
  companyIdx: index("idx_users_company").on(table.companyId),
  usernameIdx: index("idx_users_username").on(table.username),
  emailIdx: index("idx_users_email").on(table.email),
}));

