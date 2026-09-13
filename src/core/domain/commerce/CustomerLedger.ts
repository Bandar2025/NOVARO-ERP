// NOVARO ERP Domain Model: Customer Ledger & Derived Receivables
// Eliminates direct mutation of Customer.balance

export type CustomerMovementType = "invoice" | "payment" | "return" | "adjustment";

export interface DomainCustomerMovement {
  id: string;
  customerId: string;
  date: string;
  type: CustomerMovementType;
  amount: number;
  reference: string;
  notes?: string;
  journalEntryId?: string;
  createdAt: string;
}

export interface CustomerStatementItem {
  id: string;
  date: string;
  type: CustomerMovementType;
  reference: string;
  debit: number;   // Invoices increase receivables
  credit: number;  // Payments decrease receivables
  runningBalance: number;
  notes?: string;
}

export class CustomerLedgerCalculator {
  /**
   * Derives current balance directly from movements/invoices without allowing direct mutation
   */
  static calculateBalance(movements: DomainCustomerMovement[], customerId: string): number {
    return movements
      .filter(m => m.customerId === customerId)
      .reduce((bal, m) => {
        if (m.type === "invoice" || m.type === "adjustment") {
          return bal + m.amount;
        } else if (m.type === "payment" || m.type === "return") {
          return bal - m.amount;
        }
        return bal;
      }, 0);
  }

  static buildStatement(movements: DomainCustomerMovement[], customerId: string): CustomerStatementItem[] {
    const customerMoves = movements
      .filter(m => m.customerId === customerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    return customerMoves.map(m => {
      const isDr = m.type === "invoice" || (m.type === "adjustment" && m.amount > 0);
      const debit = isDr ? m.amount : 0;
      const credit = !isDr ? m.amount : 0;
      running += debit - credit;

      return {
        id: m.id,
        date: m.date,
        type: m.type,
        reference: m.reference,
        debit,
        credit,
        runningBalance: Math.round(running * 100) / 100,
        notes: m.notes
      };
    });
  }
}
