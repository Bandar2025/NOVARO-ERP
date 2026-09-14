import { pgTable, text, integer, timestamp, uniqueIndex, index, foreignKey } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";
import { companies } from "./companies";
import { branches } from "./branches";
import { fiscalYears } from "./fiscal";

export const documentSequences = pgTable("document_sequences", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "restrict" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "restrict" }),
  branchId: text("branch_id").notNull().references(() => branches.id, { onDelete: "restrict" }),
  documentType: text("document_type").notNull(), // INV, PO, JE, REC, etc.
  fiscalYearId: text("fiscal_year_id").notNull().references(() => fiscalYears.id, { onDelete: "restrict" }),
  lastSequence: integer("last_sequence").default(0).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  fiscalYearFk: foreignKey({
    columns: [table.tenantId, table.companyId, table.fiscalYearId],
    foreignColumns: [fiscalYears.tenantId, fiscalYears.companyId, fiscalYears.id],
    name: "fk_seq_fiscal_year",
  }).onDelete("restrict"),
  uniqueScopeIdx: uniqueIndex("idx_doc_seq_scope").on(table.tenantId, table.companyId, table.branchId, table.documentType, table.fiscalYearId),
  tenantIdx: index("idx_doc_seq_tenant").on(table.tenantId),
}));

