import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { purchaseOrders, purchaseOrderItems } from "../schema/purchaseOrders";
import { PurchaseRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { PurchaseOrder, Currency, DocumentWorkflowStatus } from "../../../types";
import { extractTenantContext } from "./contextUtils";

export class DrizzlePurchaseRepository implements PurchaseRepository {
  constructor(private client: DbOrTx = db) {}

  async findById(id: string, context?: TenantContext): Promise<PurchaseOrder | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const headers = await this.client
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, id),
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.companyId, companyId)
        )
      )
      .limit(1);

    if (headers.length === 0) return null;

    const items = await this.client
      .select()
      .from(purchaseOrderItems)
      .where(
        and(
          eq(purchaseOrderItems.purchaseOrderId, id),
          eq(purchaseOrderItems.tenantId, tenantId),
          eq(purchaseOrderItems.companyId, companyId)
        )
      );

    return this.mapToDomain(headers[0], items);
  }

  async getAll(options?: QueryOptions): Promise<PurchaseOrder[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const headers = await this.client
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.tenantId, tenantId),
          eq(purchaseOrders.companyId, companyId)
        )
      );

    const result: PurchaseOrder[] = [];
    for (const h of headers) {
      const items = await this.client
        .select()
        .from(purchaseOrderItems)
        .where(
          and(
            eq(purchaseOrderItems.purchaseOrderId, h.id),
            eq(purchaseOrderItems.tenantId, tenantId),
            eq(purchaseOrderItems.companyId, companyId)
          )
        );
      result.push(this.mapToDomain(h, items));
    }
    return result;
  }

  private async executeTx<T>(fn: (txClient: any) => Promise<T>): Promise<T> {
    if (typeof (this.client as any).transaction === "function") {
      return await (this.client as any).transaction(fn);
    }
    return await fn(this.client);
  }

  async save(po: PurchaseOrder, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await this.executeTx(async (tx) => {
      await tx
        .insert(purchaseOrders)
        .values({
          id: po.id,
          tenantId,
          companyId,
          supplierId: po.supplierId,
          supplierName: po.supplierName,
          date: po.date,
          status: po.status,
          workflowStatus: po.workflowStatus || (po.status === "Received" ? "Posted" : "Draft"),
          currency: po.currency || "SAR",
          exchangeRate: (po.exchangeRate ?? 1).toFixed(6),
          subtotal: (po.subtotal ?? 0).toFixed(4),
          taxAmount: (po.taxAmount ?? 0).toFixed(4),
          totalAmount: (po.totalAmount ?? 0).toFixed(4),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: purchaseOrders.id,
          set: {
            supplierId: po.supplierId,
            supplierName: po.supplierName,
            date: po.date,
            status: po.status,
            workflowStatus: po.workflowStatus || (po.status === "Received" ? "Posted" : "Draft"),
            currency: po.currency || "SAR",
            exchangeRate: (po.exchangeRate ?? 1).toFixed(6),
            subtotal: (po.subtotal ?? 0).toFixed(4),
            taxAmount: (po.taxAmount ?? 0).toFixed(4),
            totalAmount: (po.totalAmount ?? 0).toFixed(4),
            updatedAt: new Date(),
          },
        });

      // Replace items
      await tx
        .delete(purchaseOrderItems)
        .where(
          and(
            eq(purchaseOrderItems.purchaseOrderId, po.id),
            eq(purchaseOrderItems.tenantId, tenantId),
            eq(purchaseOrderItems.companyId, companyId)
          )
        );

      if (po.items && po.items.length > 0) {
        await tx.insert(purchaseOrderItems).values(
          po.items.map((it, idx) => ({
            id: `${po.id}-item-${idx + 1}`,
            tenantId,
            companyId,
            purchaseOrderId: po.id,
            itemId: it.itemId,
            itemName: it.itemName,
            quantity: (it.quantity ?? 0).toFixed(4),
            price: (it.price ?? 0).toFixed(4),
            total: (it.total ?? 0).toFixed(4),
          }))
        );
      }
    });
  }

  async exists(id: string, context?: TenantContext): Promise<boolean> {
    const po = await this.findById(id, context);
    return po !== null;
  }

  private mapToDomain(
    header: typeof purchaseOrders.$inferSelect,
    itemsList: (typeof purchaseOrderItems.$inferSelect)[]
  ): PurchaseOrder {
    return {
      id: header.id,
      supplierId: header.supplierId,
      supplierName: header.supplierName,
      date: header.date,
      status: header.status as "Draft" | "Approved" | "Received",
      workflowStatus: header.workflowStatus as DocumentWorkflowStatus,
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
