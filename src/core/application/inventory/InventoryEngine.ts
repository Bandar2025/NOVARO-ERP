// NOVARO ERP Application Layer: Central Inventory Engine
// FIFO Valuation, Cost Layers, Batch Tracking, and Non-Negative Stock Invariants
import { Batch, Item } from "../../../types";
import { CostLayer, FIFOCostLayerQueue, FIFOConsumptionResult } from "../../domain/inventory/CostLayer";
import { DomainStockMovement, StockMovementType } from "../../domain/inventory/StockMovement";

export interface StockOperationResult<T = unknown> {
  success: boolean;
  error?: string;
  data?: T;
}

export interface ReceiveStockDTO {
  itemId: string;
  itemName: string;
  warehouseId: string;
  batchNumber: string;
  quantity: number;
  unitCost: number;
  date: string;
  referenceType: string;
  referenceId: string;
  supplierId?: string;
  createdBy: string;
  expiryDate?: string;
}

export interface IssueStockDTO {
  itemId: string;
  warehouseId?: string;
  quantity: number;
  date: string;
  referenceType: string;
  referenceId: string;
  createdBy: string;
  notes?: string;
}

export interface TransferStockDTO {
  itemId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  batchNumber: string;
  quantity: number;
  date: string;
  reference: string;
  createdBy: string;
  notes?: string;
}

export interface AdjustStockDTO {
  itemId: string;
  warehouseId: string;
  batchNumber: string;
  adjustmentQty: number; // positive (gain) or negative (shrinkage/loss)
  unitCost?: number;
  date: string;
  reason: string;
  reference: string;
  createdBy: string;
}

export class InventoryEngine {
  /**
   * 1. Receive Stock (PO Goods Receipt, Production Inflow)
   * Creates a new Cost Layer, new/updated Batch, and Stock Movement
   */
  static receiveStock(
    dto: ReceiveStockDTO,
    existingBatches: Batch[],
    existingLayers: CostLayer[],
    existingMovements: DomainStockMovement[]
  ): StockOperationResult<{
    batches: Batch[];
    layers: CostLayer[];
    movements: DomainStockMovement[];
    newBatch: Batch;
    newLayer: CostLayer;
    newMovement: DomainStockMovement;
  }> {
    if (dto.quantity <= 0) {
      return { success: false, error: "Received quantity must be strictly greater than zero." };
    }
    if (dto.unitCost < 0) {
      return { success: false, error: "Unit cost cannot be negative." };
    }

    const nowStr = dto.date || new Date().toISOString().split("T")[0];
    const totalCost = Math.round(dto.quantity * dto.unitCost * 100) / 100;

    // 1. Create or update batch
    const batchId = `bat-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const expiryDate = dto.expiryDate || new Date(new Date(nowStr).setFullYear(new Date(nowStr).getFullYear() + 2)).toISOString().split("T")[0];

    const newBatch: Batch = {
      id: batchId,
      batchNumber: dto.batchNumber,
      itemId: dto.itemId,
      itemName: dto.itemName,
      manufactureDate: nowStr,
      expiryDate,
      quantity: dto.quantity,
      costPerUnit: dto.unitCost,
      supplierId: dto.supplierId,
      warehouseId: dto.warehouseId
    };

    // 2. Create Cost Layer for FIFO queue
    const layerId = `layer-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newLayer: CostLayer = {
      id: layerId,
      itemId: dto.itemId,
      warehouseId: dto.warehouseId,
      batchNumber: dto.batchNumber,
      dateReceived: nowStr,
      originalQuantity: dto.quantity,
      remainingQuantity: dto.quantity,
      unitCost: dto.unitCost,
      sourceReference: `${dto.referenceType}:${dto.referenceId}`
    };

    // 3. Create Stock Movement Ledger entry
    const movementId = `sm-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newMovement: DomainStockMovement = {
      id: movementId,
      itemId: dto.itemId,
      itemName: dto.itemName,
      warehouseId: dto.warehouseId,
      movementType: "RECEIPT",
      quantity: dto.quantity,
      unitCost: dto.unitCost,
      totalCost,
      batchNumber: dto.batchNumber,
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      date: nowStr,
      createdBy: dto.createdBy,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      data: {
        batches: [...existingBatches, newBatch],
        layers: [...existingLayers, newLayer],
        movements: [newMovement, ...existingMovements],
        newBatch,
        newLayer,
        newMovement
      }
    };
  }

  /**
   * 2. Issue Stock (Sales Invoicing, COGS, Production Raw Consumption)
   * Strictly consumes oldest cost layers via FIFO, prevents negative inventory
   */
  static issueStock(
    dto: IssueStockDTO,
    existingBatches: Batch[],
    existingLayers: CostLayer[],
    existingMovements: DomainStockMovement[],
    itemName = ""
  ): StockOperationResult<{
    batches: Batch[];
    layers: CostLayer[];
    movements: DomainStockMovement[];
    fifoResult: FIFOConsumptionResult;
    totalCOGS: number;
  }> {
    if (dto.quantity <= 0) {
      return { success: false, error: "Issue quantity must be strictly greater than zero." };
    }

    // Check available stock in batches
    const itemBatches = existingBatches.filter(
      b => b.itemId === dto.itemId && (!dto.warehouseId || b.warehouseId === dto.warehouseId) && b.quantity > 0
    );
    const totalAvailable = itemBatches.reduce((sum, b) => sum + b.quantity, 0);

    if (totalAvailable < dto.quantity) {
      return {
        success: false,
        error: `Insufficient stock for item '${itemName || dto.itemId}'. Available: ${totalAvailable}, Requested: ${dto.quantity}. Negative inventory is forbidden.`
      };
    }

    // Consume layers using FIFO
    const { updatedLayers, result: fifoResult } = FIFOCostLayerQueue.consume(
      existingLayers,
      dto.itemId,
      dto.warehouseId,
      dto.quantity
    );

    // If layers were insufficient or not yet tracked, fallback to batch weighted cost
    let totalCOGS = fifoResult.totalCost;
    if (fifoResult.remainingRequested > 0) {
      // Find average batch cost for remainder
      const avgBatchCost = itemBatches.length > 0
        ? itemBatches.reduce((acc, b) => acc + (b.costPerUnit || 0), 0) / itemBatches.length
        : 20;
      const unlayeredCost = Math.round(fifoResult.remainingRequested * avgBatchCost * 100) / 100;
      totalCOGS = Math.round((totalCOGS + unlayeredCost) * 100) / 100;
    }

    // Deduct quantity from batches chronologically
    let remainingToDeduct = dto.quantity;
    const updatedBatches = existingBatches.map(batch => {
      if (batch.itemId === dto.itemId && (!dto.warehouseId || batch.warehouseId === dto.warehouseId) && batch.quantity > 0 && remainingToDeduct > 0) {
        if (batch.quantity >= remainingToDeduct) {
          const newQty = Math.round((batch.quantity - remainingToDeduct) * 1000) / 1000;
          remainingToDeduct = 0;
          return { ...batch, quantity: newQty };
        } else {
          remainingToDeduct = Math.round((remainingToDeduct - batch.quantity) * 1000) / 1000;
          return { ...batch, quantity: 0 };
        }
      }
      return batch;
    });

    // Create Stock Movement record
    const movementId = `sm-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const unitCost = dto.quantity > 0 ? Math.round((totalCOGS / dto.quantity) * 100) / 100 : 0;
    const newMovement: DomainStockMovement = {
      id: movementId,
      itemId: dto.itemId,
      itemName,
      warehouseId: dto.warehouseId || "wh-1",
      movementType: "ISSUE",
      quantity: dto.quantity,
      unitCost,
      totalCost: totalCOGS,
      batchNumber: fifoResult.consumedLayers.map(l => l.batchNumber).join(", ") || "FIFO-ISSUE",
      referenceType: dto.referenceType,
      referenceId: dto.referenceId,
      date: dto.date || new Date().toISOString().split("T")[0],
      createdBy: dto.createdBy,
      notes: dto.notes,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      data: {
        batches: updatedBatches,
        layers: updatedLayers,
        movements: [newMovement, ...existingMovements],
        fifoResult,
        totalCOGS
      }
    };
  }

  /**
   * 3. Transfer Stock Between Warehouses
   */
  static transferStock(
    dto: TransferStockDTO,
    existingBatches: Batch[],
    existingLayers: CostLayer[],
    existingMovements: DomainStockMovement[]
  ): StockOperationResult<{
    batches: Batch[];
    layers: CostLayer[];
    movements: DomainStockMovement[];
  }> {
    if (dto.quantity <= 0) {
      return { success: false, error: "Transfer quantity must be greater than zero." };
    }
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      return { success: false, error: "Source and destination warehouses cannot be identical." };
    }

    const sourceBatch = existingBatches.find(
      b => b.itemId === dto.itemId && b.warehouseId === dto.fromWarehouseId && b.batchNumber === dto.batchNumber
    );

    if (!sourceBatch || sourceBatch.quantity < dto.quantity) {
      return {
        success: false,
        error: `Insufficient batch stock in source warehouse ${dto.fromWarehouseId}. Available: ${sourceBatch?.quantity || 0}`
      };
    }

    // Deduct from source batch
    const updatedSourceBatch = {
      ...sourceBatch,
      quantity: Math.round((sourceBatch.quantity - dto.quantity) * 1000) / 1000
    };

    // Add to target batch
    const targetBatchId = `bat-tr-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
    const newTargetBatch: Batch = {
      ...sourceBatch,
      id: targetBatchId,
      warehouseId: dto.toWarehouseId,
      quantity: dto.quantity
    };

    const updatedBatches = existingBatches
      .map(b => (b.id === sourceBatch.id ? updatedSourceBatch : b))
      .concat(newTargetBatch);

    // Update cost layers warehouse
    let remainingTransfer = dto.quantity;
    const updatedLayers = existingLayers.map(layer => {
      if (layer.itemId === dto.itemId && layer.warehouseId === dto.fromWarehouseId && layer.remainingQuantity > 0 && remainingTransfer > 0) {
        const moveQty = Math.min(layer.remainingQuantity, remainingTransfer);
        remainingTransfer -= moveQty;
        return {
          ...layer,
          remainingQuantity: layer.remainingQuantity - moveQty
        };
      }
      return layer;
    });

    const newTargetLayer: CostLayer = {
      id: `layer-tr-${Date.now()}`,
      itemId: dto.itemId,
      warehouseId: dto.toWarehouseId,
      batchNumber: dto.batchNumber,
      dateReceived: dto.date,
      originalQuantity: dto.quantity,
      remainingQuantity: dto.quantity,
      unitCost: sourceBatch.costPerUnit,
      sourceReference: `TRANSFER:${dto.reference}`
    };

    const outMovement: DomainStockMovement = {
      id: `sm-out-${Date.now()}`,
      itemId: dto.itemId,
      itemName: sourceBatch.itemName,
      warehouseId: dto.fromWarehouseId,
      movementType: "TRANSFER_OUT",
      quantity: dto.quantity,
      unitCost: sourceBatch.costPerUnit,
      totalCost: Math.round(dto.quantity * sourceBatch.costPerUnit * 100) / 100,
      batchNumber: dto.batchNumber,
      referenceType: "TRANSFER",
      referenceId: dto.reference,
      date: dto.date,
      createdBy: dto.createdBy,
      notes: `Transfer out to ${dto.toWarehouseId}`,
      createdAt: new Date().toISOString()
    };

    const inMovement: DomainStockMovement = {
      id: `sm-in-${Date.now()}`,
      itemId: dto.itemId,
      itemName: sourceBatch.itemName,
      warehouseId: dto.toWarehouseId,
      movementType: "TRANSFER_IN",
      quantity: dto.quantity,
      unitCost: sourceBatch.costPerUnit,
      totalCost: Math.round(dto.quantity * sourceBatch.costPerUnit * 100) / 100,
      batchNumber: dto.batchNumber,
      referenceType: "TRANSFER",
      referenceId: dto.reference,
      date: dto.date,
      createdBy: dto.createdBy,
      notes: `Transfer in from ${dto.fromWarehouseId}`,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      data: {
        batches: updatedBatches,
        layers: [...updatedLayers, newTargetLayer],
        movements: [inMovement, outMovement, ...existingMovements]
      }
    };
  }

  /**
   * 4. Stock Adjustment (Physical Count Variance, Damage, Shrinkage)
   */
  static adjustStock(
    dto: AdjustStockDTO,
    existingBatches: Batch[],
    existingLayers: CostLayer[],
    existingMovements: DomainStockMovement[],
    itemName = ""
  ): StockOperationResult<{
    batches: Batch[];
    layers: CostLayer[];
    movements: DomainStockMovement[];
  }> {
    if (dto.adjustmentQty === 0) {
      return { success: false, error: "Adjustment quantity cannot be zero." };
    }

    const isGain = dto.adjustmentQty > 0;
    const absQty = Math.abs(dto.adjustmentQty);

    let updatedBatches = [...existingBatches];
    let targetBatch = existingBatches.find(
      b => b.itemId === dto.itemId && b.warehouseId === dto.warehouseId && b.batchNumber === dto.batchNumber
    );

    const unitCost = dto.unitCost || targetBatch?.costPerUnit || 25;

    if (!isGain) {
      // Shrinkage/loss: ensure available
      if (!targetBatch || targetBatch.quantity < absQty) {
        return {
          success: false,
          error: `Cannot adjust negative quantity larger than available batch balance (${targetBatch?.quantity || 0}).`
        };
      }
      updatedBatches = updatedBatches.map(b =>
        b.id === targetBatch!.id ? { ...b, quantity: Math.round((b.quantity - absQty) * 1000) / 1000 } : b
      );
    } else {
      // Gain: create or increase batch
      if (targetBatch) {
        updatedBatches = updatedBatches.map(b =>
          b.id === targetBatch!.id ? { ...b, quantity: Math.round((b.quantity + absQty) * 1000) / 1000 } : b
        );
      } else {
        const newBatch: Batch = {
          id: `bat-adj-${Date.now()}`,
          batchNumber: dto.batchNumber,
          itemId: dto.itemId,
          itemName,
          manufactureDate: dto.date,
          expiryDate: new Date(new Date(dto.date).setFullYear(new Date(dto.date).getFullYear() + 1)).toISOString().split("T")[0],
          quantity: absQty,
          costPerUnit: unitCost,
          warehouseId: dto.warehouseId
        };
        updatedBatches.push(newBatch);
      }
    }

    const movement: DomainStockMovement = {
      id: `sm-adj-${Date.now()}`,
      itemId: dto.itemId,
      itemName,
      warehouseId: dto.warehouseId,
      movementType: isGain ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
      quantity: absQty,
      unitCost,
      totalCost: Math.round(absQty * unitCost * 100) / 100,
      batchNumber: dto.batchNumber,
      referenceType: "ADJUSTMENT",
      referenceId: dto.reference,
      date: dto.date,
      createdBy: dto.createdBy,
      notes: dto.reason,
      createdAt: new Date().toISOString()
    };

    return {
      success: true,
      data: {
        batches: updatedBatches,
        layers: existingLayers,
        movements: [movement, ...existingMovements]
      }
    };
  }

  /**
   * 5. Calculate Stock Balance Projections for all items
   */
  static calculateItemStockBalances(items: Item[], batches: Batch[]): Item[] {
    return items.map(item => {
      const activeBatches = batches.filter(b => b.itemId === item.id);
      const totalStock = activeBatches.reduce((acc, b) => acc + (b.quantity || 0), 0);
      return {
        ...item,
        currentStock: Math.round(totalStock * 1000) / 1000
      };
    });
  }

  /**
   * 6. Calculate Real Total Inventory Valuation from Cost Layers / Batches
   * Single source of truth — NO arbitrary estimates!
   */
  static calculateTotalValuation(batches: Batch[]): number {
    const total = batches.reduce((sum, b) => {
      const qty = b.quantity || 0;
      const cost = b.costPerUnit || 0;
      return sum + (qty * cost);
    }, 0);
    return Math.round(total * 100) / 100;
  }
}
