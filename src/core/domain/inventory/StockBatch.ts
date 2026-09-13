// NOVARO ERP Domain Model: Stock Batch & Valuation Policy

export interface DomainBatch {
  id: string;
  batchNumber: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  manufactureDate: string;
  expiryDate: string;
  quantity: number;
  costPerUnit: number;
  supplierId?: string;
}

export enum CostingMethod {
  FIFO = "FIFO",
  WEIGHTED_AVERAGE = "WEIGHTED_AVERAGE",
  STANDARD_COST = "STANDARD_COST"
}

export interface InventoryValuationItem {
  itemId: string;
  itemName: string;
  sku: string;
  totalQuantity: number;
  totalValuation: number;
  averageUnitCost: number;
}
