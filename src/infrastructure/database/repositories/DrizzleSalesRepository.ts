import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { salesInvoices, salesInvoiceItems } from "../schema/salesInvoices";
import { SalesRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { SalesInvoice, Currency, DocumentWorkflowStatus } from "../../../types";
import { extractTenantContext } from "./contextUtils";

export class DrizzleSalesRepository implements SalesRepository {
  constructor(private client: DbOrTx = db) {}

  async findById(id: string, context?: TenantContext): Promise<SalesInvoice | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const headers = await this.client
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

    const items = await this.client
      .select()
      .from(salesInvoiceItems)
      .where(
        and(
          eq(salesInvoiceItems.salesInvoiceId, id),
          eq(salesInvoiceItems.tenantId, tenantId),
          eq(salesInvoiceItems.companyId, companyId)
        )
      );

    return this.mapToDomain(headers[0], items);
  }

  async getAll(options?: QueryOptions): Promise<SalesInvoice[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const headers = await this.client
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
      const items = await this.client
        .select()
        .from(salesInvoiceItems)
        .where(
          and(
            eq(salesInvoiceItems.salesInvoiceId, h.id),
            eq(salesInvoiceItems.tenantId, tenantId),
            eq(salesInvoiceItems.companyId, companyId)
          )
        );
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  async save(invoice: SalesInvoice, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await this.client
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
    await this.client
      .delete(salesInvoiceItems)
      .where(
        and(
          eq(salesInvoiceItems.salesInvoiceId, invoice.id),
          eq(salesInvoiceItems.tenantId, tenantId),
          eq(salesInvoiceItems.companyId, companyId)
        )
      );

    if (invoice.items && invoice.items.length > 0) {
      await this.client.insert(salesInvoiceItems).values(
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
