// NOVARO ERP Application Layer: Central Manufacturing Engine & Production Flow
import { Batch, Item, JobStatus, RoastingJob, GrindingJob } from "../../../types";
import { CostLayer } from "../../domain/inventory/CostLayer";
import { DomainStockMovement } from "../../domain/inventory/StockMovement";
import { InventoryEngine } from "../inventory/InventoryEngine";

export interface ExecuteRoastingDTO {
  batchNumber: string;
  recipeId: string;
  recipeName: string;
  inputItemId: string;
  inputQuantity: number;
  outputItemId: string;
  outputQuantity: number;
  roastTimeMinutes: number;
  tempCelsius: number;
  workerName: string;
  jobDate: string;
  // Roastery UI form compatibility
  roastProfile?: string;
  operator?: string;
}

export interface ExecuteGrindingDTO {
  jobDate: string;
  inputBatchNumber?: string;
  inputItemId: string;
  inputQuantity: number;
  outputItemId: string;
  outputQuantity: number;
  finenessSetting?: string;
  operator?: string;
}

export class ManufacturingEngine {
  /**
   * 1. Execute Roasting Process:
   * Consumes green beans (FIFO/oldest batch), produces roasted beans batch, logs movements
   */
  static executeRoasting(
    dto: ExecuteRoastingDTO,
    items: Item[],
    batches: Batch[],
    layers: CostLayer[],
    movements: DomainStockMovement[]
  ): {
    success: boolean;
    error?: string;
    job?: RoastingJob;
    batches?: Batch[];
    layers?: CostLayer[];
    movements?: DomainStockMovement[];
  } {
    if (dto.inputQuantity <= 0) {
      return { success: false, error: "Input raw quantity must be greater than zero." };
    }
    if (dto.outputQuantity <= 0) {
      return { success: false, error: "Output roasted quantity must be greater than zero." };
    }
    if (dto.outputQuantity >= dto.inputQuantity) {
      return {
        success: false,
        error: "Invalid Yield: Roasted output cannot equal or exceed raw input weight due to moisture loss (12%-20% expected)."
      };
    }

    const inputItem = items.find(i => i.id === dto.inputItemId);
    const outputItem = items.find(i => i.id === dto.outputItemId);

    if (!inputItem || !outputItem) {
      return { success: false, error: "Input or Output item not found in catalog." };
    }

    // Deduct raw green beans using InventoryEngine
    const issueRes = InventoryEngine.issueStock(
      {
        itemId: dto.inputItemId,
        quantity: dto.inputQuantity,
        date: dto.jobDate,
        referenceType: "ROASTING_JOB",
        referenceId: dto.batchNumber,
        createdBy: dto.workerName || dto.operator || "system",
        notes: `Green coffee consumed for roasting lot ${dto.batchNumber}`
      },
      batches,
      layers,
      movements,
      inputItem.name
    );

    if (!issueRes.success || !issueRes.data) {
      return { success: false, error: issueRes.error || "Failed to deduct green coffee from stock" };
    }

    const rawCostConsumed = issueRes.data.totalCOGS;
    // Calculate cost per kg of roasted beans including standard roasting overhead
    const costPerRoastedKg = dto.outputQuantity > 0
      ? Math.round((rawCostConsumed / dto.outputQuantity) * 100) / 100
      : 25;

    // Receive roasted beans into inventory
    const receiveRes = InventoryEngine.receiveStock(
      {
        itemId: dto.outputItemId,
        itemName: outputItem.name,
        warehouseId: "wh-1",
        batchNumber: dto.batchNumber,
        quantity: dto.outputQuantity,
        unitCost: costPerRoastedKg,
        date: dto.jobDate,
        referenceType: "ROASTING_JOB",
        referenceId: dto.batchNumber,
        createdBy: dto.workerName || dto.operator || "system"
      },
      issueRes.data.batches,
      issueRes.data.layers,
      issueRes.data.movements
    );

    if (!receiveRes.success || !receiveRes.data) {
      return { success: false, error: receiveRes.error || "Failed to add roasted output to inventory" };
    }

    const weightLoss = dto.inputQuantity - dto.outputQuantity;
    const weightLossPct = parseFloat(((weightLoss / dto.inputQuantity) * 100).toFixed(2));

    const jobId = `RST-JOB-${Date.now().toString().slice(-4)}`;
    const completedJob: RoastingJob = {
      id: jobId,
      jobDate: dto.jobDate,
      batchNumber: dto.batchNumber,
      recipeId: dto.recipeId,
      recipeName: dto.recipeName,
      inputItemId: dto.inputItemId,
      inputQuantity: dto.inputQuantity,
      outputItemId: dto.outputItemId,
      outputQuantity: dto.outputQuantity,
      roastTimeMinutes: dto.roastTimeMinutes,
      tempCelsius: dto.tempCelsius,
      weightLossPct,
      status: JobStatus.Completed,
      workerName: dto.workerName || dto.operator || "Roaster",
      // UI aliases
      batchId: dto.batchNumber,
      greenItemId: dto.inputItemId,
      greenItemName: inputItem.nameAr || inputItem.name,
      greenQty: dto.inputQuantity,
      roastedItemId: dto.outputItemId,
      roastedItemName: outputItem.nameAr || outputItem.name,
      roastedQty: dto.outputQuantity,
      roastProfile: dto.roastProfile,
      operator: dto.workerName || dto.operator
    };

    return {
      success: true,
      job: completedJob,
      batches: receiveRes.data.batches,
      layers: receiveRes.data.layers,
      movements: receiveRes.data.movements
    };
  }

  /**
   * 2. Execute Grinding Process:
   * Consumes roasted beans, produces ground coffee batch, logs movements
   */
  static executeGrinding(
    dto: ExecuteGrindingDTO,
    items: Item[],
    batches: Batch[],
    layers: CostLayer[],
    movements: DomainStockMovement[]
  ): {
    success: boolean;
    error?: string;
    job?: GrindingJob;
    batches?: Batch[];
    layers?: CostLayer[];
    movements?: DomainStockMovement[];
  } {
    if (dto.inputQuantity <= 0) {
      return { success: false, error: "Input roasted beans quantity must be greater than zero." };
    }
    if (dto.outputQuantity <= 0) {
      return { success: false, error: "Output ground coffee quantity must be greater than zero." };
    }
    if (dto.outputQuantity > dto.inputQuantity) {
      return { success: false, error: "Ground output weight cannot exceed roasted input weight!" };
    }

    const inputItem = items.find(i => i.id === dto.inputItemId);
    const outputItem = items.find(i => i.id === dto.outputItemId);

    if (!inputItem || !outputItem) {
      return { success: false, error: "Input or Output item not found in catalog." };
    }

    const issueRes = InventoryEngine.issueStock(
      {
        itemId: dto.inputItemId,
        quantity: dto.inputQuantity,
        date: dto.jobDate,
        referenceType: "GRINDING_JOB",
        referenceId: `GRD-${Date.now().toString().slice(-4)}`,
        createdBy: dto.operator || "system",
        notes: `Roasted beans consumed for grinding run`
      },
      batches,
      layers,
      movements,
      inputItem.name
    );

    if (!issueRes.success || !issueRes.data) {
      return { success: false, error: issueRes.error || "Failed to deduct roasted beans from stock" };
    }

    const roastedCostConsumed = issueRes.data.totalCOGS;
    const costPerGroundKg = dto.outputQuantity > 0
      ? Math.round((roastedCostConsumed / dto.outputQuantity) * 100) / 100
      : 30;

    const groundBatchNo = `G-${dto.inputBatchNumber || Date.now().toString().slice(-6)}`;

    const receiveRes = InventoryEngine.receiveStock(
      {
        itemId: dto.outputItemId,
        itemName: outputItem.name,
        warehouseId: "wh-2",
        batchNumber: groundBatchNo,
        quantity: dto.outputQuantity,
        unitCost: costPerGroundKg,
        date: dto.jobDate,
        referenceType: "GRINDING_JOB",
        referenceId: groundBatchNo,
        createdBy: dto.operator || "system"
      },
      issueRes.data.batches,
      issueRes.data.layers,
      issueRes.data.movements
    );

    if (!receiveRes.success || !receiveRes.data) {
      return { success: false, error: receiveRes.error || "Failed to add ground output to inventory" };
    }

    const jobId = `GRD-JOB-${Date.now().toString().slice(-4)}`;
    const completedJob: GrindingJob = {
      id: jobId,
      jobDate: dto.jobDate,
      inputBatchNumber: dto.inputBatchNumber || "FIFO-AUTO",
      inputItemId: dto.inputItemId,
      inputQuantity: dto.inputQuantity,
      outputItemId: dto.outputItemId,
      outputQuantity: dto.outputQuantity,
      status: JobStatus.Completed
    };

    return {
      success: true,
      job: completedJob,
      batches: receiveRes.data.batches,
      layers: receiveRes.data.layers,
      movements: receiveRes.data.movements
    };
  }
}
