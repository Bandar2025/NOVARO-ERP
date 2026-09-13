// NOVARO ERP Application Layer: Commerce Service & Transaction Orchestration
// Atomic Boundaries for Sales, Purchases, and Settlements
import { Batch, Customer, Supplier, SalesInvoice, PurchaseOrder, JournalEntry, BankTransaction, Currency } from "../../../types";
import { PostingAccountConfiguration } from "../../domain/accounting/PostingAccountConfiguration";
import { PostingRules } from "../../domain/accounting/PostingRule";
import { AccountingEngine } from "../accounting/AccountingEngine";
import { CostLayer } from "../../domain/inventory/CostLayer";
import { DomainStockMovement } from "../../domain/inventory/StockMovement";
import { InventoryEngine } from "../inventory/InventoryEngine";
import { DomainCustomerMovement } from "../../domain/commerce/CustomerLedger";
import { DomainSupplierMovement } from "../../domain/commerce/SupplierLedger";
import { TransactionBoundary } from "../../domain/commerce/TransactionBoundary";
import { FiscalPeriod } from "../../domain/accounting/FiscalPeriod";

export interface SalesInvoiceExecutionDTO {
  invoice: Omit<SalesInvoice, "id">;
  type: "Wholesale" | "Retail" | "POS";
  isPaid: boolean;
  actor: string;
}

export interface PurchaseReceiptExecutionDTO {
  purchaseOrder: PurchaseOrder;
  actor: string;
}

export interface CustomerCollectionDTO {
  customerId: string;
  customerName: string;
  amount: number;
  date: string;
  notes?: string;
  isBank?: boolean;
  actor: string;
}

export interface SupplierPaymentDTO {
  supplierId: string;
  supplierName: string;
  amount: number;
  date: string;
  notes?: string;
  isBank?: boolean;
  actor: string;
}

export class CommerceService {
  /**
   * 1. Process Sales Invoice with complete atomic boundary
   */
  static processSalesInvoice(params: {
    dto: SalesInvoiceExecutionDTO;
    config: PostingAccountConfiguration;
    batches: Batch[];
    costLayers: CostLayer[];
    stockMovements: DomainStockMovement[];
    journalEntries: JournalEntry[];
    customers: Customer[];
    customerMovements: DomainCustomerMovement[];
    fiscalPeriods: FiscalPeriod[];
    getAccountName: (id: string) => string;
  }) {
    const boundary = new TransactionBoundary("TX-SALE");
    const { dto, config, fiscalPeriods, getAccountName } = params;

    let currentBatches = [...params.batches];
    let currentLayers = [...params.costLayers];
    let currentMovements = [...params.stockMovements];
    let currentJournals = [...params.journalEntries];
    let currentCustMovements = [...params.customerMovements];

    const invoiceId = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceDate = dto.invoice.date || new Date().toISOString().split("T")[0];

    let totalCogsCalculated = 0;
    const isPOS = dto.type === "POS";

    // Step 1: Inventory Deduction & COGS calculation via FIFO for each item
    boundary.executeStep("Inventory Deduction & FIFO Valuation", () => {
      for (const item of dto.invoice.items) {
        const issueRes = InventoryEngine.issueStock(
          {
            itemId: item.itemId,
            quantity: item.quantity,
            date: invoiceDate,
            referenceType: "SALES_INVOICE",
            referenceId: invoiceId,
            createdBy: dto.actor,
            notes: `Sale of ${item.quantity} ${item.itemName} on invoice ${invoiceId}`
          },
          currentBatches,
          currentLayers,
          currentMovements,
          item.itemName
        );

        if (!issueRes.success || !issueRes.data) {
          return { success: false, error: issueRes.error || "Inventory deduction failed" };
        }

        currentBatches = issueRes.data.batches;
        currentLayers = issueRes.data.layers;
        currentMovements = issueRes.data.movements;
        totalCogsCalculated += issueRes.data.totalCOGS;
      }
      return { success: true };
    });

    // Step 2: Post Sales Value Journal Entry
    boundary.executeStep("Sales Revenue Accounting Journal", () => {
      const salesLines = PostingRules.buildSalesInvoiceEntry({
        config,
        invoiceId,
        isPaid: dto.isPaid,
        isPOS,
        totalAmount: dto.invoice.totalAmount,
        subtotal: dto.invoice.subtotal,
        taxAmount: dto.invoice.taxAmount,
        customerName: dto.invoice.customerName,
        getAccountName
      });

      const postRes = AccountingEngine.postEntry(
        {
          date: invoiceDate,
          reference: invoiceId,
          notes: `Automated Sales Recognition for Invoice ${invoiceId} (${dto.type})`,
          items: salesLines.map((l, i) => ({ id: `jei-sales-${i}`, ...l })),
          workflowStatus: "Posted",
          currency: dto.invoice.currency || Currency.SAR,
          exchangeRate: dto.invoice.exchangeRate || 1
        },
        currentJournals,
        fiscalPeriods,
        dto.actor
      );

      if (!postRes.success || !postRes.entry) {
        return { success: false, error: postRes.error || "Failed to post sales journal entry" };
      }

      currentJournals = [postRes.entry, ...currentJournals];
      return { success: true };
    });

    // Step 3: Post COGS Matching Journal Entry
    boundary.executeStep("COGS Inventory Matching Journal", () => {
      if (totalCogsCalculated > 0) {
        const cogsLines = PostingRules.buildCOGSEntry({
          config,
          invoiceId,
          cogsAmount: totalCogsCalculated,
          getAccountName
        });

        const cogsPostRes = AccountingEngine.postEntry(
          {
            date: invoiceDate,
            reference: invoiceId,
            notes: `Automated COGS deduction for Invoice ${invoiceId}`,
            items: cogsLines.map((l, i) => ({ id: `jei-cogs-${i}`, ...l })),
            workflowStatus: "Posted",
            currency: dto.invoice.currency || Currency.SAR,
            exchangeRate: dto.invoice.exchangeRate || 1
          },
          currentJournals,
          fiscalPeriods,
          dto.actor
        );

        if (!cogsPostRes.success || !cogsPostRes.entry) {
          return { success: false, error: cogsPostRes.error || "Failed to post COGS journal entry" };
        }

        currentJournals = [cogsPostRes.entry, ...currentJournals];
      }
      return { success: true };
    });

    // Step 4: Customer AR Movement (if unpaid/credit)
    boundary.executeStep("Customer AR Ledger Update", () => {
      if (!dto.isPaid) {
        const movement: DomainCustomerMovement = {
          id: `cmov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
          customerId: dto.invoice.customerId,
          date: invoiceDate,
          type: "invoice",
          amount: dto.invoice.totalAmount,
          reference: invoiceId,
          notes: `Credit Sales Invoice ${invoiceId}`,
          createdAt: new Date().toISOString()
        };
        currentCustMovements = [movement, ...currentCustMovements];
      }
      return { success: true };
    });

    const newInvoice: SalesInvoice = {
      ...dto.invoice,
      id: invoiceId,
      status: dto.isPaid ? "Paid" : "Unpaid",
      type: dto.type,
      workflowStatus: "Posted"
    };

    const completion = boundary.complete({
      invoice: newInvoice,
      batches: currentBatches,
      costLayers: currentLayers,
      stockMovements: currentMovements,
      journalEntries: currentJournals,
      customerMovements: currentCustMovements,
      totalCOGS: totalCogsCalculated
    });

    return completion;
  }

  /**
   * 2. Process Purchase Order Goods Receipt with complete atomic boundary
   */
  static processPurchaseReceipt(params: {
    dto: PurchaseReceiptExecutionDTO;
    config: PostingAccountConfiguration;
    batches: Batch[];
    costLayers: CostLayer[];
    stockMovements: DomainStockMovement[];
    journalEntries: JournalEntry[];
    suppliers: Supplier[];
    supplierMovements: DomainSupplierMovement[];
    fiscalPeriods: FiscalPeriod[];
    getAccountName: (id: string) => string;
  }) {
    const boundary = new TransactionBoundary("TX-PURCH");
    const { dto, config, fiscalPeriods, getAccountName } = params;

    let currentBatches = [...params.batches];
    let currentLayers = [...params.costLayers];
    let currentMovements = [...params.stockMovements];
    let currentJournals = [...params.journalEntries];
    let currentSuppMovements = [...params.supplierMovements];

    const po = dto.purchaseOrder;
    const receiptDate = po.date || new Date().toISOString().split("T")[0];

    // Step 1: Stock Inflows for each purchase line
    boundary.executeStep("Inventory Batch & Cost Layer Receipt", () => {
      for (const item of po.items) {
        const recRes = InventoryEngine.receiveStock(
          {
            itemId: item.itemId,
            itemName: item.itemName,
            warehouseId: "wh-1",
            batchNumber: `B-${item.itemId.slice(-4)}-${receiptDate.replace(/-/g, "")}`,
            quantity: item.quantity,
            unitCost: item.price,
            date: receiptDate,
            referenceType: "PURCHASE_ORDER",
            referenceId: po.id,
            supplierId: po.supplierId,
            createdBy: dto.actor
          },
          currentBatches,
          currentLayers,
          currentMovements
        );

        if (!recRes.success || !recRes.data) {
          return { success: false, error: recRes.error || "Goods receipt failed" };
        }

        currentBatches = recRes.data.batches;
        currentLayers = recRes.data.layers;
        currentMovements = recRes.data.movements;
      }
      return { success: true };
    });

    // Step 2: Post Purchase Liability Journal Entry
    boundary.executeStep("Purchase Liability Accounting Journal", () => {
      const purchaseLines = PostingRules.buildPurchaseReceiptEntry({
        config,
        purchaseId: po.id,
        totalAmount: po.totalAmount,
        subtotal: po.subtotal,
        taxAmount: po.taxAmount,
        isPaid: false,
        getAccountName
      });

      const postRes = AccountingEngine.postEntry(
        {
          date: receiptDate,
          reference: po.id,
          notes: `Automated Goods Receipt Allocation for PO ${po.id}`,
          items: purchaseLines.map((l, i) => ({ id: `jei-po-${i}`, ...l })),
          workflowStatus: "Posted",
          currency: po.currency || Currency.SAR,
          exchangeRate: po.exchangeRate || 1
        },
        currentJournals,
        fiscalPeriods,
        dto.actor
      );

      if (!postRes.success || !postRes.entry) {
        return { success: false, error: postRes.error || "Failed to post purchase receipt journal" };
      }

      currentJournals = [postRes.entry, ...currentJournals];
      return { success: true };
    });

    // Step 3: Supplier AP Movement
    boundary.executeStep("Supplier AP Ledger Update", () => {
      const movement: DomainSupplierMovement = {
        id: `smov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        supplierId: po.supplierId,
        date: receiptDate,
        type: "invoice",
        amount: po.totalAmount,
        reference: po.id,
        notes: `Purchase Receipt for PO ${po.id}`,
        createdAt: new Date().toISOString()
      };
      currentSuppMovements = [movement, ...currentSuppMovements];
      return { success: true };
    });

    const updatedPO: PurchaseOrder = {
      ...po,
      status: "Received",
      workflowStatus: "Posted"
    };

    return boundary.complete({
      purchaseOrder: updatedPO,
      batches: currentBatches,
      costLayers: currentLayers,
      stockMovements: currentMovements,
      journalEntries: currentJournals,
      supplierMovements: currentSuppMovements
    });
  }

  /**
   * 3. Process Customer Debt Collection (Atomic Cash Inflow + AR Reduction + Journal Entry)
   */
  static processCustomerCollection(params: {
    dto: CustomerCollectionDTO;
    config: PostingAccountConfiguration;
    journalEntries: JournalEntry[];
    customerMovements: DomainCustomerMovement[];
    fiscalPeriods: FiscalPeriod[];
    getAccountName: (id: string) => string;
  }) {
    const boundary = new TransactionBoundary("TX-COLL");
    const { dto, config, fiscalPeriods, getAccountName } = params;

    let currentJournals = [...params.journalEntries];
    let currentMovements = [...params.customerMovements];

    const ref = `COLL-${Date.now().toString().slice(-4)}`;

    // Step 1: Post Journal Entry
    boundary.executeStep("Post Collection Journal Entry", () => {
      const lines = PostingRules.buildCustomerReceiptEntry({
        config,
        reference: ref,
        amount: dto.amount,
        customerName: dto.customerName,
        isBank: dto.isBank,
        getAccountName
      });

      const postRes = AccountingEngine.postEntry(
        {
          date: dto.date,
          reference: ref,
          notes: `Customer collection from ${dto.customerName}`,
          items: lines.map((l, i) => ({ id: `jei-coll-${i}`, ...l })),
          workflowStatus: "Posted",
          currency: Currency.SAR,
          exchangeRate: 1
        },
        currentJournals,
        fiscalPeriods,
        dto.actor
      );

      if (!postRes.success || !postRes.entry) {
        return { success: false, error: postRes.error || "Failed to post collection journal" };
      }

      currentJournals = [postRes.entry, ...currentJournals];
      return { success: true };
    });

    // Step 2: Customer Statement Movement
    boundary.executeStep("Record Customer Ledger Movement", () => {
      const movement: DomainCustomerMovement = {
        id: `cmov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        customerId: dto.customerId,
        date: dto.date,
        type: "payment",
        amount: dto.amount,
        reference: ref,
        notes: dto.notes || `Cash collection payment`,
        createdAt: new Date().toISOString()
      };
      currentMovements = [movement, ...currentMovements];
      return { success: true };
    });

    return boundary.complete({
      reference: ref,
      journalEntries: currentJournals,
      customerMovements: currentMovements
    });
  }

  /**
   * 4. Process Supplier Liability Settlement (Atomic Cash Outflow + AP Reduction + Journal Entry)
   */
  static processSupplierPayment(params: {
    dto: SupplierPaymentDTO;
    config: PostingAccountConfiguration;
    journalEntries: JournalEntry[];
    supplierMovements: DomainSupplierMovement[];
    fiscalPeriods: FiscalPeriod[];
    getAccountName: (id: string) => string;
  }) {
    const boundary = new TransactionBoundary("TX-PAY");
    const { dto, config, fiscalPeriods, getAccountName } = params;

    let currentJournals = [...params.journalEntries];
    let currentMovements = [...params.supplierMovements];

    const ref = `PAY-${Date.now().toString().slice(-4)}`;

    boundary.executeStep("Post Supplier Payment Journal Entry", () => {
      const lines = PostingRules.buildSupplierPaymentEntry({
        config,
        reference: ref,
        amount: dto.amount,
        supplierName: dto.supplierName,
        isBank: dto.isBank,
        getAccountName
      });

      const postRes = AccountingEngine.postEntry(
        {
          date: dto.date,
          reference: ref,
          notes: `Supplier payment settlement to ${dto.supplierName}`,
          items: lines.map((l, i) => ({ id: `jei-pay-${i}`, ...l })),
          workflowStatus: "Posted",
          currency: Currency.SAR,
          exchangeRate: 1
        },
        currentJournals,
        fiscalPeriods,
        dto.actor
      );

      if (!postRes.success || !postRes.entry) {
        return { success: false, error: postRes.error || "Failed to post payment journal" };
      }

      currentJournals = [postRes.entry, ...currentJournals];
      return { success: true };
    });

    boundary.executeStep("Record Supplier Ledger Movement", () => {
      const movement: DomainSupplierMovement = {
        id: `smov-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        supplierId: dto.supplierId,
        date: dto.date,
        type: "payment",
        amount: dto.amount,
        reference: ref,
        notes: dto.notes || `Supplier payment`,
        createdAt: new Date().toISOString()
      };
      currentMovements = [movement, ...currentMovements];
      return { success: true };
    });

    return boundary.complete({
      reference: ref,
      journalEntries: currentJournals,
      supplierMovements: currentMovements
    });
  }
}
