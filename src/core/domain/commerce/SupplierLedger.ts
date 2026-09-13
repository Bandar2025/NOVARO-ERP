// NOVARO ERP Domain Model: Supplier Ledger & Derived Payables
// Eliminates direct mutation of Supplier.balance

export type SupplierMovementType = "invoice" | "payment" | "return" | "adjustment";

export interface DomainSupplierMovement {
  id: string;
  supplierId: string;
  date: string;
  type: SupplierMovementType;
  amount: number;
  reference: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export class SupplierLedgerCalculator {
  /**
   * Derives current AP balance directly from movements without direct mutation
   */
  static calculateBalance(movements: DomainSupplierMovement[], supplierId: string): number {
    return movements
      .filter(m => m.supplierId === supplierId)
      .reduce((bal, m) => {
        // Purchases/invoices increase liability (credit)
        if (m.type === "invoice" || m.type === "adjustment") {
          return bal + m.amount;
        } else if (m.type === "payment" || m.type === "return") {
          return bal - m.amount;
        }
        return bal;
      }, 0);
  }
}
