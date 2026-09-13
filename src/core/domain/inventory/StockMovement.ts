// NOVARO ERP Domain Model: Stock Movement & Stock Ledger
// Single source of truth for stock quantities and valuations

export type StockMovementType =
  | "RECEIPT"         // Goods receipt / PO
  | "ISSUE"           // Sales invoice / COGS
  | "TRANSFER_IN"     // Warehouse transfer entry
  | "TRANSFER_OUT"    // Warehouse transfer exit
  | "ADJUSTMENT_IN"   // Physical count positive variance
  | "ADJUSTMENT_OUT"  // Physical count shrinkage/loss
  | "PRODUCTION_IN"   // Manufacturing finished/roasted product
  | "PRODUCTION_OUT"  // Manufacturing raw green beans used
  | "RETURN_CUSTOMER" // Sales return
  | "RETURN_SUPPLIER";// Purchase return

export interface DomainStockMovement {
  id: string;
  itemId: string;
  itemName: string;
  warehouseId: string;
  movementType: StockMovementType;
  quantity: number;   // Positive magnitude
  unitCost: number;
  totalCost: number;
  batchNumber: string;
  referenceType: string; // e.g., "PURCHASE_ORDER", "SALES_INVOICE", "ROASTING_JOB", "GRINDING_JOB", "COUNT"
  referenceId: string;
  date: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
}

export function isPositiveMovement(type: StockMovementType): boolean {
  return (
    type === "RECEIPT" ||
    type === "TRANSFER_IN" ||
    type === "ADJUSTMENT_IN" ||
    type === "PRODUCTION_IN" ||
    type === "RETURN_CUSTOMER"
  );
}
