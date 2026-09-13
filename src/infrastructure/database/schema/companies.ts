import { pgTable, text, boolean, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const companies = pgTable("companies", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  legalName: text("legal_name"),
  commercialRegistration: text("commercial_registration"),
  taxNumber: text("tax_number"),
  currency: text("currency").default("SAR").notNull(),
  settings: jsonb("settings"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_companies_tenant").on(table.tenantId),
}));
