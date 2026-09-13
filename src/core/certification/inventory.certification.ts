// NOVARO ERP Certification Test: Inventory Invariants & FIFO Engine
import { Batch } from "../../types";
import { CostLayer } from "../domain/inventory/CostLayer";
import { DomainStockMovement } from "../domain/inventory/StockMovement";
import { InventoryEngine } from "../application/inventory/InventoryEngine";
import { CertificationCheckResult } from "./accounting.certification";

export function runInventoryCertification(): CertificationCheckResult[] {
  const results: CertificationCheckResult[] = [];

  // Invariant 1: Stock Receipt creates batch + cost layer + ledger movement
  let batches: Batch[] = [];
  let layers: CostLayer[] = [];
  let movements: DomainStockMovement[] = [];

  try {
    const rec1 = InventoryEngine.receiveStock(
      {
        itemId: "item-bean-eth",
        itemName: "Ethiopian Yirgacheffe",
        warehouseId: "wh-1",
        batchNumber: "B-ETH-001",
        quantity: 100,
        unitCost: 30,
        date: "2026-07-01",
        referenceType: "PURCHASE_ORDER",
        referenceId: "PO-001",
        createdBy: "tester"
      },
      batches,
      layers,
      movements
    );

    if (rec1.success && rec1.data) {
      batches = rec1.data.batches;
      layers = rec1.data.layers;
      movements = rec1.data.movements;

      const hasBatch = batches.some(b => b.batchNumber === "B-ETH-001" && b.quantity === 100);
      const hasLayer = layers.some(l => l.batchNumber === "B-ETH-001" && l.remainingQuantity === 100 && l.unitCost === 30);
      const hasMovement = movements.some(m => m.movementType === "RECEIPT" && m.quantity === 100);

      if (hasBatch && hasLayer && hasMovement) {
        results.push({ code: "STOCK_LEDGER_RECEIPT", name: "Stock Receipt Batch, Layer & Movement Creation", status: "PASS" });
      } else {
        results.push({ code: "STOCK_LEDGER_RECEIPT", name: "Stock Receipt Batch, Layer & Movement Creation", status: "FAIL", details: "Missing batch, layer or movement" });
      }
    } else {
      results.push({ code: "STOCK_LEDGER_RECEIPT", name: "Stock Receipt Batch, Layer & Movement Creation", status: "FAIL", details: rec1.error });
    }
  } catch (e: any) {
    results.push({ code: "STOCK_LEDGER_RECEIPT", name: "Stock Receipt", status: "FAIL", details: e.message });
  }

  // Receive a second layer at higher cost (testing FIFO)
  try {
    const rec2 = InventoryEngine.receiveStock(
      {
        itemId: "item-bean-eth",
        itemName: "Ethiopian Yirgacheffe",
        warehouseId: "wh-1",
        batchNumber: "B-ETH-002",
        quantity: 100,
        unitCost: 40, // More expensive later layer
        date: "2026-07-05",
        referenceType: "PURCHASE_ORDER",
        referenceId: "PO-002",
        createdBy: "tester"
      },
      batches,
      layers,
      movements
    );

    if (rec2.success && rec2.data) {
      batches = rec2.data.batches;
      layers = rec2.data.layers;
      movements = rec2.data.movements;
    }
  } catch {
    // handled in issue test
  }

  // Invariant 2: FIFO Layer Consumption (100 @ 30 + 50 @ 40 = 150 kg total)
  try {
    const issueRes = InventoryEngine.issueStock(
      {
        itemId: "item-bean-eth",
        warehouseId: "wh-1",
        quantity: 150,
        date: "2026-07-06",
        referenceType: "SALES_INVOICE",
        referenceId: "INV-001",
        createdBy: "tester"
      },
      batches,
      layers,
      movements,
      "Ethiopian Yirgacheffe"
    );

    if (issueRes.success && issueRes.data) {
      const { fifoResult, totalCOGS, layers: postLayers, batches: postBatches } = issueRes.data;

      // Expected COGS: 100 * 30 (3000) + 50 * 40 (2000) = 5000 SAR
      const expectedCOGS = 5000;
      const consumedLayers = fifoResult.consumedLayers;

      const layer1 = consumedLayers.find(l => l.batchNumber === "B-ETH-001");
      const layer2 = consumedLayers.find(l => l.batchNumber === "B-ETH-002");

      const correctFIFO = layer1?.quantity === 100 && layer1?.unitCost === 30 && layer2?.quantity === 50 && layer2?.unitCost === 40;

      if (totalCOGS === expectedCOGS && correctFIFO) {
        results.push({ code: "STOCK_LEDGER_ISSUE_FIFO", name: "Strict Chronological FIFO Layer Consumption", status: "PASS" });
        batches = postBatches;
        layers = postLayers;
        movements = issueRes.data.movements;
      } else {
        results.push({
          code: "STOCK_LEDGER_ISSUE_FIFO",
          name: "Strict Chronological FIFO Layer Consumption",
          status: "FAIL",
          details: `Expected COGS ${expectedCOGS}, received ${totalCOGS}`
        });
      }
    } else {
      results.push({ code: "STOCK_LEDGER_ISSUE_FIFO", name: "Strict Chronological FIFO Layer Consumption", status: "FAIL", details: issueRes.error });
    }
  } catch (e: any) {
    results.push({ code: "STOCK_LEDGER_ISSUE_FIFO", name: "Strict FIFO", status: "FAIL", details: e.message });
  }

  // Invariant 3: Insufficient Stock Rejection (Remaining is 50, request 100)
  try {
    const overIssueRes = InventoryEngine.issueStock(
      {
        itemId: "item-bean-eth",
        warehouseId: "wh-1",
        quantity: 100, // Only 50 left!
        date: "2026-07-07",
        referenceType: "SALES_INVOICE",
        referenceId: "INV-FAIL",
        createdBy: "tester"
      },
      batches,
      layers,
      movements,
      "Ethiopian Yirgacheffe"
    );

    if (!overIssueRes.success && overIssueRes.error && overIssueRes.error.includes("Insufficient stock")) {
      results.push({ code: "INSUFFICIENT_STOCK_PREVENTION", name: "Negative Inventory Prevention Invariant", status: "PASS" });
    } else {
      results.push({ code: "INSUFFICIENT_STOCK_PREVENTION", name: "Negative Inventory Prevention Invariant", status: "FAIL", details: "Over-issue was accepted!" });
    }
  } catch (e: any) {
    results.push({ code: "INSUFFICIENT_STOCK_PREVENTION", name: "Negative Inventory Prevention", status: "FAIL", details: e.message });
  }

  // Invariant 4: Stock Transfer between warehouses
  try {
    const trRes = InventoryEngine.transferStock(
      {
        itemId: "item-bean-eth",
        fromWarehouseId: "wh-1",
        toWarehouseId: "wh-2",
        batchNumber: "B-ETH-002",
        quantity: 20,
        date: "2026-07-08",
        reference: "TR-001",
        createdBy: "tester"
      },
      batches,
      layers,
      movements
    );

    if (trRes.success && trRes.data) {
      const inMove = trRes.data.movements.find(m => m.movementType === "TRANSFER_IN");
      const outMove = trRes.data.movements.find(m => m.movementType === "TRANSFER_OUT");
      const targetBatch = trRes.data.batches.find(b => b.warehouseId === "wh-2" && b.quantity === 20);

      if (inMove && outMove && targetBatch) {
        results.push({ code: "STOCK_TRANSFER", name: "Warehouse Stock Transfer Ledger Consistency", status: "PASS" });
        batches = trRes.data.batches;
        layers = trRes.data.layers;
        movements = trRes.data.movements;
      } else {
        results.push({ code: "STOCK_TRANSFER", name: "Warehouse Stock Transfer", status: "FAIL", details: "Missing transfer in/out movements" });
      }
    } else {
      results.push({ code: "STOCK_TRANSFER", name: "Warehouse Stock Transfer", status: "FAIL", details: trRes.error });
    }
  } catch (e: any) {
    results.push({ code: "STOCK_TRANSFER", name: "Warehouse Stock Transfer", status: "FAIL", details: e.message });
  }

  // Invariant 5: Stock Adjustment
  try {
    const adjRes = InventoryEngine.adjustStock(
      {
        itemId: "item-bean-eth",
        warehouseId: "wh-2",
        batchNumber: "B-ETH-002",
        adjustmentQty: -2, // 2kg shrinkage
        date: "2026-07-09",
        reason: "Spillage during warehouse handling",
        reference: "ADJ-001",
        createdBy: "tester"
      },
      batches,
      layers,
      movements,
      "Ethiopian Yirgacheffe"
    );

    if (adjRes.success && adjRes.data) {
      const adjBatch = adjRes.data.batches.find(b => b.warehouseId === "wh-2" && b.batchNumber === "B-ETH-002");
      const adjMove = adjRes.data.movements.find(m => m.movementType === "ADJUSTMENT_OUT" && m.quantity === 2);

      if (adjBatch && adjBatch.quantity === 18 && adjMove) {
        results.push({ code: "STOCK_ADJUSTMENT", name: "Stock Adjustment with Reason & Audit Movement", status: "PASS" });
        batches = adjRes.data.batches;
      } else {
        results.push({ code: "STOCK_ADJUSTMENT", name: "Stock Adjustment", status: "FAIL", details: `Unexpected quantity: ${adjBatch?.quantity}` });
      }
    } else {
      results.push({ code: "STOCK_ADJUSTMENT", name: "Stock Adjustment", status: "FAIL", details: adjRes.error });
    }
  } catch (e: any) {
    results.push({ code: "STOCK_ADJUSTMENT", name: "Stock Adjustment", status: "FAIL", details: e.message });
  }

  // Invariant 6: Real Inventory Valuation
  try {
    const val = InventoryEngine.calculateTotalValuation(batches);
    // wh-1 has 30kg @ 40 = 1200. wh-2 has 18kg @ 40 = 720. Total = 1920.
    if (val === 1920) {
      results.push({ code: "FIFO_VALUATION", name: "Derived Stock Valuation (No Estimation)", status: "PASS" });
    } else {
      results.push({ code: "FIFO_VALUATION", name: "Derived Stock Valuation", status: "FAIL", details: `Expected 1920, got ${val}` });
    }
  } catch (e: any) {
    results.push({ code: "FIFO_VALUATION", name: "Derived Stock Valuation", status: "FAIL", details: e.message });
  }

  return results;
}
