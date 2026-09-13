// NOVARO ERP Domain Model: Posting Rules & Standard Templates
import { PostingAccountConfiguration } from "./PostingAccountConfiguration";

export interface LineDraft {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  notes?: string;
}

export class PostingRules {
  /**
   * Standard Sales Invoice Posting Rule (Wholesale / Retail)
   * Dr Accounts Receivable or Cash
   * Cr Revenue
   * Cr Output VAT (if applicable)
   */
  static buildSalesInvoiceEntry(params: {
    config: PostingAccountConfiguration;
    invoiceId: string;
    isPaid: boolean;
    isPOS: boolean;
    totalAmount: number;
    subtotal?: number;
    taxAmount?: number;
    customerName?: string;
    getAccountName: (id: string) => string;
  }): LineDraft[] {
    const { config, isPaid, isPOS, totalAmount, getAccountName } = params;
    const subtotal = params.subtotal !== undefined ? params.subtotal : (params.taxAmount ? totalAmount - params.taxAmount : totalAmount);
    const taxAmount = params.taxAmount || 0;

    const debitAccountId = isPaid
      ? (isPOS ? config.cashAccountId : config.bankAccountId)
      : config.accountsReceivableAccountId;

    const revenueAccountId = isPOS ? config.retailRevenueAccountId : config.wholesaleRevenueAccountId;

    const lines: LineDraft[] = [];

    // Debit line (Cash / Bank / AR)
    lines.push({
      accountId: debitAccountId,
      accountName: getAccountName(debitAccountId),
      debit: Math.round(totalAmount * 100) / 100,
      credit: 0,
      notes: `Invoice ${params.invoiceId} receivables / collection`
    });

    // Credit Revenue line
    lines.push({
      accountId: revenueAccountId,
      accountName: getAccountName(revenueAccountId),
      debit: 0,
      credit: Math.round(subtotal * 100) / 100,
      notes: `Invoice ${params.invoiceId} net sales revenue`
    });

    // Credit Tax line if any
    if (taxAmount > 0) {
      lines.push({
        accountId: config.vatOutputAccountId,
        accountName: getAccountName(config.vatOutputAccountId),
        debit: 0,
        credit: Math.round(taxAmount * 100) / 100,
        notes: `VAT 15% Output on invoice ${params.invoiceId}`
      });
    }

    return lines;
  }

  /**
   * Standard COGS & Inventory Deduction Matching Rule
   * Dr Cost of Goods Sold (COGS)
   * Cr Finished Goods Inventory
   */
  static buildCOGSEntry(params: {
    config: PostingAccountConfiguration;
    invoiceId: string;
    cogsAmount: number;
    getAccountName: (id: string) => string;
  }): LineDraft[] {
    const { config, invoiceId, cogsAmount, getAccountName } = params;
    const amount = Math.round(cogsAmount * 100) / 100;
    if (amount <= 0) return [];

    return [
      {
        accountId: config.cogsAccountId,
        accountName: getAccountName(config.cogsAccountId),
        debit: amount,
        credit: 0,
        notes: `COGS recognition for Invoice ${invoiceId}`
      },
      {
        accountId: config.finishedGoodsInventoryAccountId,
        accountName: getAccountName(config.finishedGoodsInventoryAccountId),
        debit: 0,
        credit: amount,
        notes: `Inventory reduction for Invoice ${invoiceId}`
      }
    ];
  }

  /**
   * Standard Purchase Invoice / GRN Receipt Rule
   * Dr Raw Materials Inventory
   * Dr Input VAT (if separated)
   * Cr Accounts Payable (or Cash if paid immediately)
   */
  static buildPurchaseReceiptEntry(params: {
    config: PostingAccountConfiguration;
    purchaseId: string;
    totalAmount: number;
    subtotal?: number;
    taxAmount?: number;
    isPaid?: boolean;
    getAccountName: (id: string) => string;
  }): LineDraft[] {
    const { config, purchaseId, totalAmount, isPaid, getAccountName } = params;
    const subtotal = params.subtotal !== undefined ? params.subtotal : (params.taxAmount ? totalAmount - params.taxAmount : totalAmount);
    const taxAmount = params.taxAmount || 0;

    const creditAccountId = isPaid ? config.cashAccountId : config.accountsPayableAccountId;

    const lines: LineDraft[] = [
      {
        accountId: config.rawMaterialsInventoryAccountId,
        accountName: getAccountName(config.rawMaterialsInventoryAccountId),
        debit: Math.round(subtotal * 100) / 100,
        credit: 0,
        notes: `Goods Receipt for PO ${purchaseId}`
      }
    ];

    if (taxAmount > 0) {
      lines.push({
        accountId: config.vatInputAccountId,
        accountName: getAccountName(config.vatInputAccountId),
        debit: Math.round(taxAmount * 100) / 100,
        credit: 0,
        notes: `VAT Input on PO ${purchaseId}`
      });
    }

    lines.push({
      accountId: creditAccountId,
      accountName: getAccountName(creditAccountId),
      debit: 0,
      credit: Math.round(totalAmount * 100) / 100,
      notes: `Payable liability for PO ${purchaseId}`
    });

    return lines;
  }

  /**
   * Customer Debt Collection Payment Rule
   * Dr Cash in Hand / Bank
   * Cr Accounts Receivable
   */
  static buildCustomerReceiptEntry(params: {
    config: PostingAccountConfiguration;
    reference: string;
    amount: number;
    customerName: string;
    isBank?: boolean;
    getAccountName: (id: string) => string;
  }): LineDraft[] {
    const { config, reference, amount, customerName, isBank, getAccountName } = params;
    const debitAcc = isBank ? config.bankAccountId : config.cashAccountId;
    const val = Math.round(amount * 100) / 100;

    return [
      {
        accountId: debitAcc,
        accountName: getAccountName(debitAcc),
        debit: val,
        credit: 0,
        notes: `Customer collection from ${customerName} (Ref: ${reference})`
      },
      {
        accountId: config.accountsReceivableAccountId,
        accountName: getAccountName(config.accountsReceivableAccountId),
        debit: 0,
        credit: val,
        notes: `AR debt settlement for ${customerName} (Ref: ${reference})`
      }
    ];
  }

  /**
   * Supplier Liability Settlement Payment Rule
   * Dr Accounts Payable
   * Cr Cash in Hand / Bank
   */
  static buildSupplierPaymentEntry(params: {
    config: PostingAccountConfiguration;
    reference: string;
    amount: number;
    supplierName: string;
    isBank?: boolean;
    getAccountName: (id: string) => string;
  }): LineDraft[] {
    const { config, reference, amount, supplierName, isBank, getAccountName } = params;
    const creditAcc = isBank ? config.bankAccountId : config.cashAccountId;
    const val = Math.round(amount * 100) / 100;

    return [
      {
        accountId: config.accountsPayableAccountId,
        accountName: getAccountName(config.accountsPayableAccountId),
        debit: val,
        credit: 0,
        notes: `AP liability settlement for ${supplierName} (Ref: ${reference})`
      },
      {
        accountId: creditAcc,
        accountName: getAccountName(creditAcc),
        debit: 0,
        credit: val,
        notes: `Payment to supplier ${supplierName} (Ref: ${reference})`
      }
    ];
  }
}
