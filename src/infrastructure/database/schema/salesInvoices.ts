import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { customers } from "./customers";
import { items } from "./items";

export const salesInvoices = pgTable("sales_invoices", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  customerId: text("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
  customerName: text("customer_name").notNull(),
  date: text("date").notNull(),
  status: text("status").default("Unpaid").notNull(), // Paid, Unpaid
  workflowStatus: text("workflow_status").default("Draft").notNull(),
  type: text("type").default("Wholesale").notNull(), // Wholesale, Retail, POS
  currency: text("currency").default("SAR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }).default("1.000000"),
  subtotal: numeric("subtotal", { precision: 15, scale: 4 }).default("0.0000"),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 4 }).default("0.0000"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_sales_inv_tenant").on(table.tenantId),
  companyIdx: index("idx_sales_inv_company").on(table.companyId),
  customerIdx: index("idx_sales_inv_cust").on(table.customerId),
  dateIdx: index("idx_sales_inv_date").on(table.date),
}));

export const salesInvoiceItems = pgTable("sales_invoice_items", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  salesInvoiceId: text("sales_invoice_id").notNull().references(() => salesInvoices.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  price: numeric("price", { precision: 15, scale: 4 }).notNull(),
  total: numeric("total", { precision: 15, scale: 4 }).notNull(),
  // Actual realized FIFO COGS
  cogsAmount: numeric("cogs_amount", { precision: 15, scale: 4 }).default("0.0000"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_sales_inv_items_tenant").on(table.tenantId),
  companyIdx: index("idx_sales_inv_items_company").on(table.companyId),
  invIdx: index("idx_sales_inv_items_inv").on(table.salesInvoiceId),
}));
