import { pgTable, text, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const roles = pgTable("roles", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  isSystemRole: boolean("is_system_role").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_roles_tenant").on(table.tenantId),
  tenantCodeUq: unique("uq_roles_tenant_code").on(table.tenantId, table.code),
}));
