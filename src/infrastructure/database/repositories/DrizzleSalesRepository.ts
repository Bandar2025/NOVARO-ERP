import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { salesInvoices, salesInvoiceItems } from "../schema/salesInvoices";
import { SalesRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { SalesInvoice, Currency, DocumentWorkflowStatus } from "../../../types";

const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_COMPANY_ID = "default-company";

export class DrizzleSalesRepository implements SalesRepository {
  async findById(id: string, context?: TenantContext): Promise<SalesInvoice | null> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const headers = await db
      .select()
      .from(salesInvoices)
      .where(
        and(
          eq(salesInvoices.id, id),
          eq(salesInvoices.tenantId, tenantId),
          eq(salesInvoices.companyId, companyId)
        )
      )
      .limit(1);

    if (headers.length === 0) return null;

    const items = await db
      .select()
      .from(salesInvoiceItems)
      .where(eq(salesInvoiceItems.salesInvoiceId, id));

    return this.mapToDomain(headers[0], items);
  }

  async getAll(options?: QueryOptions): Promise<SalesInvoice[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const headers = await db
      .select()
      .from(salesInvoices)
      .where(
        and(
          eq(salesInvoices.tenantId, tenantId),
          eq(salesInvoices.companyId, companyId)
        )
      );

    const result: SalesInvoice[] = [];
    for (const h of headers) {
      const items = await db
        .select()
        .from(salesInvoiceItems)
        .where(eq(salesInvoiceItems.salesInvoiceId, h.id));
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async save(invoice: SalesInvoice, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .insert(salesInvoices)
      .values({
        id: invoice.id,
        tenantId,
        companyId,
        customerId: invoice.customerId,
        customerName: invoice.customerName,
        date: invoice.date,
        status: invoice.status,
        workflowStatus: invoice.workflowStatus || (invoice.status === "Paid" ? "Posted" : "Draft"),
        type: invoice.type || "Wholesale",
        currency: invoice.currency || "SAR",
        exchangeRate: (invoice.exchangeRate ?? 1).toFixed(6),
        subtotal: (invoice.subtotal ?? 0).toFixed(4),
        taxAmount: (invoice.taxAmount ?? 0).toFixed(4),
        totalAmount: (invoice.totalAmount ?? 0).toFixed(4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: salesInvoices.id,
        set: {
          customerId: invoice.customerId,
          customerName: invoice.customerName,
          date: invoice.date,
          status: invoice.status,
          workflowStatus: invoice.workflowStatus || (invoice.status === "Paid" ? "Posted" : "Draft"),
          type: invoice.type || "Wholesale",
          currency: invoice.currency || "SAR",
          exchangeRate: (invoice.exchangeRate ?? 1).toFixed(6),
          subtotal: (invoice.subtotal ?? 0).toFixed(4),
          taxAmount: (invoice.taxAmount ?? 0).toFixed(4),
          totalAmount: (invoice.totalAmount ?? 0).toFixed(4),
          updatedAt: new Date(),
        },
      });

    // Replace items
    await db.delete(salesInvoiceItems).where(eq(salesInvoiceItems.salesInvoiceId, invoice.id));

    if (invoice.items && invoice.items.length > 0) {
      await db.insert(salesInvoiceItems).values(
        invoice.items.map((it, idx) => ({
          id: `${invoice.id}-item-${idx + 1}`,
          tenantId,
          companyId,
          salesInvoiceId: invoice.id,
          itemId: it.itemId,
          itemName: it.itemName,
          quantity: (it.quantity ?? 0).toFixed(4),
          price: (it.price ?? 0).toFixed(4),
          total: (it.total ?? 0).toFixed(4),
          cogsAmount: "0.0000",
        }))
      );
    }
  }

  async exists(id: string, context?: TenantContext): Promise<boolean> {
    const inv = await this.findById(id, context);
    return inv !== null;
  }

  private mapToDomain(
    header: typeof salesInvoices.$inferSelect,
    itemsList: (typeof salesInvoiceItems.$inferSelect)[]
  ): SalesInvoice {
    return {
      id: header.id,
      customerId: header.customerId,
      customerName: header.customerName,
      date: header.date,
      status: header.status as "Paid" | "Unpaid",
      workflowStatus: header.workflowStatus as DocumentWorkflowStatus,
      type: (header.type as "Wholesale" | "Retail" | "POS") || "Wholesale",
      currency: (header.currency as Currency) || Currency.SAR,
      exchangeRate: header.exchangeRate ? parseFloat(header.exchangeRate) : 1,
      subtotal: header.subtotal ? parseFloat(header.subtotal) : undefined,
      taxAmount: header.taxAmount ? parseFloat(header.taxAmount) : undefined,
      totalAmount: parseFloat(header.totalAmount),
      items: itemsList.map(it => ({
        itemId: it.itemId,
        itemName: it.itemName,
        quantity: parseFloat(it.quantity),
        price: parseFloat(it.price),
        total: parseFloat(it.total),
      })),
    };
  }
}
