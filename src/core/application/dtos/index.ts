import { Currency } from "../../../types";

export interface JournalEntryItemDTO {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
  costCenter?: string;
}

export interface CreateJournalEntryDTO {
  date: string;
  reference?: string;
  notes: string;
  items: JournalEntryItemDTO[];
  currency?: Currency;
  exchangeRate?: number;
  companyId?: string;
}

export interface PostJournalEntryDTO {
  entryId: string;
  postedBy?: string;
}

export interface ReverseJournalEntryDTO {
  entryId: string;
  reason: string;
  date?: string;
}

export interface SaleLineItemDTO {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface CreateSaleDTO {
  customerId: string;
  customerName: string;
  date: string;
  items: SaleLineItemDTO[];
  warehouseId?: string;
  paymentMethod: "Cash" | "Credit" | "Bank";
  currency?: Currency;
  exchangeRate?: number;
}

export interface PurchaseLineItemDTO {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
}

export interface CreatePurchaseDTO {
  supplierId: string;
  supplierName: string;
  orderDate: string;
  items: PurchaseLineItemDTO[];
  warehouseId?: string;
  currency?: Currency;
  exchangeRate?: number;
}

export interface ReceivePurchaseDTO {
  purchaseOrderId: string;
  receivedDate: string;
  warehouseId: string;
}
