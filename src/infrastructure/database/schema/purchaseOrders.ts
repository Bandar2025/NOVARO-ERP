import { pgTable, text, numeric, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { suppliers } from "./suppliers";
import { items } from "./items";

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  supplierId: text("supplier_id").notNull().references(() => suppliers.id, { onDelete: "restrict" }),
  supplierName: text("supplier_name").notNull(),
  date: text("date").notNull(),
  status: text("status").default("Draft").notNull(), // Draft, Approved, Received
  workflowStatus: text("workflow_status").default("Draft").notNull(),
  currency: text("currency").default("SAR"),
  exchangeRate: numeric("exchange_rate", { precision: 10, scale: 6 }).default("1.000000"),
  subtotal: numeric("subtotal", { precision: 15, scale: 4 }).default("0.0000"),
  taxAmount: numeric("tax_amount", { precision: 15, scale: 4 }).default("0.0000"),
  totalAmount: numeric("total_amount", { precision: 15, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_po_tenant").on(table.tenantId),
  companyIdx: index("idx_po_company").on(table.companyId),
  supplierIdx: index("idx_po_supplier").on(table.supplierId),
  dateIdx: index("idx_po_date").on(table.date),
}));

export const purchaseOrderItems = pgTable("purchase_order_items", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").references(() => branches.id, { onDelete: "restrict" }),
  purchaseOrderId: text("purchase_order_id").notNull().references(() => purchaseOrders.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "restrict" }),
  itemName: text("item_name").notNull(),
  quantity: numeric("quantity", { precision: 12, scale: 4 }).notNull(),
  price: numeric("price", { precision: 15, scale: 4 }).notNull(),
  total: numeric("total", { precision: 15, scale: 4 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_po_items_tenant").on(table.tenantId),
  companyIdx: index("idx_po_items_company").on(table.companyId),
  poIdx: index("idx_po_items_po").on(table.purchaseOrderId),
}));
