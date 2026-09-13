import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { items } from "../schema/items";
import { stockBatches } from "../schema/stockBatches";
import { stockMovements } from "../schema/stockMovements";
import { costLayers } from "../schema/costLayers";
import { InventoryRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { Item, ItemCategory, Batch } from "../../../types";
import { DomainStockMovement, StockMovementType } from "../../../core/domain/inventory/StockMovement";
import { CostLayer } from "../../../core/domain/inventory/CostLayer";

const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_COMPANY_ID = "default-company";
const DEFAULT_WAREHOUSE_ID = "wh-main";

export class DrizzleInventoryRepository implements InventoryRepository {
  // Items
  async getItemById(id: string, context?: TenantContext): Promise<Item | null> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.id, id),
          eq(items.tenantId, tenantId),
          eq(items.companyId, companyId)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapItemToDomain(rows[0]);
  }

  async getAllItems(options?: QueryOptions): Promise<Item[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.tenantId, tenantId),
          eq(items.companyId, companyId)
        )
      );

    return rows.map(r => this.mapItemToDomain(r));
  }

  async saveItem(item: Item, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .insert(items)
      .values({
        id: item.id,
        tenantId,
        companyId,
        name: item.name,
        nameAr: item.nameAr,
        sku: item.sku,
        category: item.category,
        unit: item.unit,
        price: (item.price ?? 0).toFixed(4),
        cost: (item.cost ?? 0).toFixed(4),
        barcode: item.barcode || "",
        currentStock: (item.currentStock ?? 0).toFixed(4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: items.id,
        set: {
          name: item.name,
          nameAr: item.nameAr,
          sku: item.sku,
          category: item.category,
          unit: item.unit,
          price: (item.price ?? 0).toFixed(4),
          cost: (item.cost ?? 0).toFixed(4),
          barcode: item.barcode || "",
          currentStock: (item.currentStock ?? 0).toFixed(4),
          updatedAt: new Date(),
        },
      });
  }

  // Batches
  async getBatches(options?: QueryOptions): Promise<Batch[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(stockBatches)
      .where(
        and(
          eq(stockBatches.tenantId, tenantId),
          eq(stockBatches.companyId, companyId)
        )
      );

    return rows.map(r => this.mapBatchToDomain(r));
  }

  async getBatchesByItem(itemId: string, context?: TenantContext): Promise<Batch[]> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(stockBatches)
      .where(
        and(
          eq(stockBatches.itemId, itemId),
          eq(stockBatches.tenantId, tenantId),
          eq(stockBatches.companyId, companyId)
        )
      );

    return rows.map(r => this.mapBatchToDomain(r));
  }

  async saveBatch(batch: Batch, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .insert(stockBatches)
      .values({
        id: batch.id,
        tenantId,
        companyId,
        batchNumber: batch.batchNumber,
        itemId: batch.itemId,
        itemName: batch.itemName,
        manufactureDate: batch.manufactureDate,
        expiryDate: batch.expiryDate,
        quantity: (batch.quantity ?? 0).toFixed(4),
        supplierId: batch.supplierId || null,
        costPerUnit: (batch.costPerUnit ?? 0).toFixed(4),
        warehouseId: batch.warehouseId || DEFAULT_WAREHOUSE_ID,
      })
      .onConflictDoUpdate({
        target: stockBatches.id,
        set: {
          batchNumber: batch.batchNumber,
          itemId: batch.itemId,
          itemName: batch.itemName,
          manufactureDate: batch.manufactureDate,
          expiryDate: batch.expiryDate,
          quantity: (batch.quantity ?? 0).toFixed(4),
          supplierId: batch.supplierId || null,
          costPerUnit: (batch.costPerUnit ?? 0).toFixed(4),
          warehouseId: batch.warehouseId || DEFAULT_WAREHOUSE_ID,
        },
      });
  }

  async saveBatches(batchesList: Batch[], context?: TenantContext): Promise<void> {
    for (const b of batchesList) {
      await this.saveBatch(b, context);
    }
  }

  // Movements
  async getMovements(options?: QueryOptions): Promise<DomainStockMovement[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.tenantId, tenantId),
          eq(stockMovements.companyId, companyId)
        )
      );

    return rows.map(r => this.mapMovementToDomain(r));
  }

  async saveMovement(movement: DomainStockMovement, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .insert(stockMovements)
      .values({
        id: movement.id,
        tenantId,
        companyId,
        itemId: movement.itemId,
        itemName: movement.itemName,
        warehouseId: movement.warehouseId || DEFAULT_WAREHOUSE_ID,
        movementType: movement.movementType,
        quantity: (movement.quantity ?? 0).toFixed(4),
        unitCost: (movement.unitCost ?? 0).toFixed(4),
        totalCost: (movement.totalCost ?? 0).toFixed(4),
        batchNumber: movement.batchNumber,
        referenceType: movement.referenceType,
        referenceId: movement.referenceId,
        date: movement.date,
        createdBy: movement.createdBy,
        notes: movement.notes || null,
      })
      .onConflictDoUpdate({
        target: stockMovements.id,
        set: {
          itemId: movement.itemId,
          itemName: movement.itemName,
          warehouseId: movement.warehouseId || DEFAULT_WAREHOUSE_ID,
          movementType: movement.movementType,
          quantity: (movement.quantity ?? 0).toFixed(4),
          unitCost: (movement.unitCost ?? 0).toFixed(4),
          totalCost: (movement.totalCost ?? 0).toFixed(4),
          batchNumber: movement.batchNumber,
          referenceType: movement.referenceType,
          referenceId: movement.referenceId,
          date: movement.date,
          createdBy: movement.createdBy,
          notes: movement.notes || null,
        },
      });
  }

  // Cost Layers
  async getCostLayers(options?: QueryOptions): Promise<CostLayer[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(costLayers)
      .where(
        and(
          eq(costLayers.tenantId, tenantId),
          eq(costLayers.companyId, companyId)
        )
      );

    return rows.map(r => this.mapCostLayerToDomain(r));
  }

  async saveCostLayers(layersList: CostLayer[], context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    for (const layer of layersList) {
      await db
        .insert(costLayers)
        .values({
          id: layer.id,
          tenantId,
          companyId,
          itemId: layer.itemId,
          warehouseId: layer.warehouseId || DEFAULT_WAREHOUSE_ID,
          batchNumber: layer.batchNumber,
          dateReceived: layer.dateReceived,
          originalQuantity: (layer.originalQuantity ?? 0).toFixed(4),
          remainingQuantity: (layer.remainingQuantity ?? 0).toFixed(4),
          unitCost: (layer.unitCost ?? 0).toFixed(4),
          sourceReference: layer.sourceReference,
        })
        .onConflictDoUpdate({
          target: costLayers.id,
          set: {
            itemId: layer.itemId,
            warehouseId: layer.warehouseId || DEFAULT_WAREHOUSE_ID,
            batchNumber: layer.batchNumber,
            dateReceived: layer.dateReceived,
            originalQuantity: (layer.originalQuantity ?? 0).toFixed(4),
            remainingQuantity: (layer.remainingQuantity ?? 0).toFixed(4),
            unitCost: (layer.unitCost ?? 0).toFixed(4),
            sourceReference: layer.sourceReference,
          },
        });
    }
  }

  private mapItemToDomain(row: typeof items.$inferSelect): Item {
    return {
      id: row.id,
      name: row.name,
      nameAr: row.nameAr,
      sku: row.sku,
      category: row.category as ItemCategory,
      unit: row.unit,
      price: parseFloat(row.price),
      cost: parseFloat(row.cost),
      barcode: row.barcode || "",
      currentStock: parseFloat(row.currentStock),
    };
  }

  private mapBatchToDomain(row: typeof stockBatches.$inferSelect): Batch {
    return {
      id: row.id,
      batchNumber: row.batchNumber,
      itemId: row.itemId,
      itemName: row.itemName,
      manufactureDate: row.manufactureDate,
      expiryDate: row.expiryDate,
      quantity: parseFloat(row.quantity),
      supplierId: row.supplierId || undefined,
      costPerUnit: parseFloat(row.costPerUnit),
      warehouseId: row.warehouseId,
    };
  }

  private mapMovementToDomain(row: typeof stockMovements.$inferSelect): DomainStockMovement {
    return {
      id: row.id,
      itemId: row.itemId,
      itemName: row.itemName,
      warehouseId: row.warehouseId,
      movementType: row.movementType as StockMovementType,
      quantity: parseFloat(row.quantity),
      unitCost: parseFloat(row.unitCost),
      totalCost: parseFloat(row.totalCost),
      batchNumber: row.batchNumber,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      date: row.date,
      createdBy: row.createdBy,
      notes: row.notes || undefined,
      createdAt: row.createdAt ? row.createdAt.toISOString() : new Date().toISOString(),
    };
  }

  private mapCostLayerToDomain(row: typeof costLayers.$inferSelect): CostLayer {
    return {
      id: row.id,
      itemId: row.itemId,
      warehouseId: row.warehouseId,
      batchNumber: row.batchNumber,
      dateReceived: row.dateReceived,
      originalQuantity: parseFloat(row.originalQuantity),
      remainingQuantity: parseFloat(row.remainingQuantity),
      unitCost: parseFloat(row.unitCost),
      sourceReference: row.sourceReference,
    };
  }
}
