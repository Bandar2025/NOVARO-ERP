import { pgTable, text, integer, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const posSessions = pgTable("pos_sessions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  openedAt: text("opened_at").notNull(),
  closedAt: text("closed_at"),
  startingCash: numeric("starting_cash", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  salesCount: integer("sales_count").default(0).notNull(),
  totalCashSales: numeric("total_cash_sales", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  totalCardSales: numeric("total_card_sales", { precision: 15, scale: 4 }).default("0.0000").notNull(),
  status: text("status").default("Open").notNull(), // Open, Closed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_pos_ses_tenant").on(table.tenantId),
  companyIdx: index("idx_pos_ses_company").on(table.companyId),
}));
