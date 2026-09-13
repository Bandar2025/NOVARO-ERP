// NOVARO ERP Domain Model: Generic Manufacturing & Work Orders
import { JobStatus } from "../../../types";

export type ManufacturingType = "ROASTING" | "GRINDING" | "PACKAGING" | "CUSTOM";

export interface ManufacturingInputItem {
  itemId: string;
  itemName: string;
  quantity: number;
  batchNumber?: string;
  unitCost?: number;
}

export interface ManufacturingOutputItem {
  itemId: string;
  itemName: string;
  quantity: number;
  expectedYield?: number;
  batchNumber: string;
  targetWarehouseId: string;
}

export interface GenericWorkOrder {
  id: string;
  orderNumber: string;
  type: ManufacturingType;
  date: string;
  inputs: ManufacturingInputItem[];
  output: ManufacturingOutputItem;
  status: JobStatus;
  operatorName: string;
  notes?: string;
  // Cost breakdown
  rawMaterialCost: number;
  directLaborCost: number;
  overheadCost: number;
  totalProductionCost: number;
  costPerUnit: number;
  // Yield & Loss tracking
  weightLossPercentage: number;
  durationMinutes?: number;
  temperatureCelsius?: number;
}

export class ManufacturingYieldCalculator {
  static calculateLoss(inputQty: number, outputQty: number): {
    lossQty: number;
    lossPercentage: number;
    yieldPercentage: number;
  } {
    const lossQty = Math.max(0, inputQty - outputQty);
    const lossPercentage = inputQty > 0 ? parseFloat(((lossQty / inputQty) * 100).toFixed(2)) : 0;
    const yieldPercentage = inputQty > 0 ? parseFloat(((outputQty / inputQty) * 100).toFixed(2)) : 100;
    return { lossQty, lossPercentage, yieldPercentage };
  }
}
