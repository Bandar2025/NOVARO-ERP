import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";

export const cashboxTransactions = pgTable("cashbox_transactions", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  date: text("date").notNull(),
  type: text("type").notNull(), // receipt, payment, expense
  amount: numeric("amount", { precision: 15, scale: 4 }).notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  recipient: text("recipient").notNull(),
  paymentMethod: text("payment_method").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_cashbox_tx_tenant").on(table.tenantId),
  companyIdx: index("idx_cashbox_tx_company").on(table.companyId),
}));
