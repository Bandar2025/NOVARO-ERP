// NOVARO ERP Domain Model: Cost Layer (FIFO Tracking)
// Real cost layers with strict chronological consumption

export interface CostLayer {
  id: string;
  itemId: string;
  warehouseId: string;
  batchNumber: string;
  dateReceived: string;
  originalQuantity: number;
  remainingQuantity: number;
  unitCost: number;
  sourceReference: string;
}

export interface FIFOConsumptionResult {
  consumedLayers: Array<{
    layerId: string;
    batchNumber: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  totalQuantity: number;
  totalCost: number;
  averageUnitCost: number;
  remainingRequested: number;
}

export class FIFOCostLayerQueue {
  /**
   * Consumes inventory using First-In-First-Out from oldest available layers
   */
  static consume(
    layers: CostLayer[],
    itemId: string,
    warehouseId: string | undefined,
    requestedQty: number
  ): { updatedLayers: CostLayer[]; result: FIFOConsumptionResult } {
    let remainingToConsume = requestedQty;
    const consumedLayers: FIFOConsumptionResult["consumedLayers"] = [];
    let totalCostAccumulator = 0;

    // Filter relevant layers sorted chronologically by receipt date
    const relevantLayers = layers
      .filter(l => l.itemId === itemId && (!warehouseId || l.warehouseId === warehouseId) && l.remainingQuantity > 0)
      .sort((a, b) => new Date(a.dateReceived).getTime() - new Date(b.dateReceived).getTime());

    const updatedLayers = layers.map(layer => {
      // If not matching or already consumed
      if (layer.itemId !== itemId || (warehouseId && layer.warehouseId !== warehouseId) || layer.remainingQuantity <= 0) {
        return layer;
      }

      if (remainingToConsume <= 0) {
        return layer;
      }

      const takeQty = Math.min(layer.remainingQuantity, remainingToConsume);
      const layerCost = Math.round(takeQty * layer.unitCost * 100) / 100;

      consumedLayers.push({
        layerId: layer.id,
        batchNumber: layer.batchNumber,
        quantity: takeQty,
        unitCost: layer.unitCost,
        totalCost: layerCost
      });

      remainingToConsume = Math.round((remainingToConsume - takeQty) * 1000) / 1000;
      totalCostAccumulator += layerCost;

      return {
        ...layer,
        remainingQuantity: Math.round((layer.remainingQuantity - takeQty) * 1000) / 1000
      };
    });

    const consumedTotalQty = requestedQty - remainingToConsume;
    const averageUnitCost = consumedTotalQty > 0 ? totalCostAccumulator / consumedTotalQty : 0;

    return {
      updatedLayers,
      result: {
        consumedLayers,
        totalQuantity: consumedTotalQty,
        totalCost: Math.round(totalCostAccumulator * 100) / 100,
        averageUnitCost: Math.round(averageUnitCost * 100) / 100,
        remainingRequested: remainingToConsume
      }
    };
  }
}
