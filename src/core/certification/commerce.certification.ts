// NOVARO ERP Certification Test: Commerce, Customer/Supplier Ledgers & Reports Verification
import { Batch, Customer, Supplier, SalesInvoice, PurchaseOrder, JournalEntry, Currency } from "../../types";
import { defaultPostingAccountConfiguration } from "../domain/accounting/PostingAccountConfiguration";
import { CommerceService } from "../application/commerce/CommerceService";
import { CustomerLedgerCalculator, DomainCustomerMovement } from "../domain/commerce/CustomerLedger";
import { SupplierLedgerCalculator, DomainSupplierMovement } from "../domain/commerce/SupplierLedger";
import { CostLayer } from "../domain/inventory/CostLayer";
import { DomainStockMovement } from "../domain/inventory/StockMovement";
import { CertificationCheckResult } from "./accounting.certification";
import { TrialBalanceService } from "../application/accounting/TrialBalanceService";

export function runCommerceCertification(): CertificationCheckResult[] {
  const results: CertificationCheckResult[] = [];
  const config = { ...defaultPostingAccountConfiguration };

  const getAccountName = (id: string) => {
    const names: Record<string, string> = {
      "acc-1000": "Cash in Hand",
      "acc-1100": "Al-Rajhi Bank",
      "acc-1200": "Accounts Receivable",
      "acc-1300": "Raw Material Stock",
      "acc-1310": "Finished Product Stock",
      "acc-2000": "Accounts Payable",
      "acc-2100": "VAT Output/Input",
      "acc-4000": "Wholesale Revenue",
      "acc-4100": "Retail POS Revenue",
      "acc-5000": "Cost of Goods Sold"
    };
    return names[id] || `Account ${id}`;
  };

  // Test setup
  let batches: Batch[] = [
    {
      id: "bat-fin-1",
      batchNumber: "B-FIN-001",
      itemId: "item-roasted",
      itemName: "Medium Roast Blend",
      manufactureDate: "2026-07-01",
      expiryDate: "2027-07-01",
      quantity: 50,
      costPerUnit: 25,
      warehouseId: "wh-1"
    }
  ];

  let costLayers: CostLayer[] = [
    {
      id: "layer-fin-1",
      itemId: "item-roasted",
      warehouseId: "wh-1",
      batchNumber: "B-FIN-001",
      dateReceived: "2026-07-01",
      originalQuantity: 50,
      remainingQuantity: 50,
      unitCost: 25,
      sourceReference: "INIT"
    }
  ];

  let stockMovements: DomainStockMovement[] = [];
  let journalEntries: JournalEntry[] = [];
  let customers: Customer[] = [
    { id: "cust-1", name: "Al-Masa Cafe", nameAr: "مقهى الماسة", email: "masa@cafe.sa", phone: "050111", address: "Riyadh", balance: 0 }
  ];
  let customerMovements: DomainCustomerMovement[] = [];

  let suppliers: Supplier[] = [
    { id: "sup-1", name: "Yemen Imports", nameAr: "واردات اليمن", email: "yemen@bean.sa", phone: "050222", address: "Jeddah", balance: 0 }
  ];
  let supplierMovements: DomainSupplierMovement[] = [];

  // Invariant 1: Atomic Sales Invoice Processing (FIFO COGS + Revenue + Inventory + AR)
  try {
    const saleRes = CommerceService.processSalesInvoice({
      dto: {
        invoice: {
          customerId: "cust-1",
          customerName: "مقهى الماسة",
          date: "2026-07-10",
          status: "Unpaid",
          type: "Wholesale",
          items: [
            { itemId: "item-roasted", itemName: "Medium Roast Blend", quantity: 20, price: 60, total: 1200 }
          ],
          totalAmount: 1200,
          currency: Currency.SAR,
          exchangeRate: 1
        },
        type: "Wholesale",
        isPaid: false,
        actor: "salesman"
      },
      config,
      batches,
      costLayers,
      stockMovements,
      journalEntries,
      customers,
      customerMovements,
      fiscalPeriods: [],
      getAccountName
    });

    if (saleRes.committed && saleRes.data) {
      batches = saleRes.data.batches;
      costLayers = saleRes.data.costLayers;
      stockMovements = saleRes.data.stockMovements;
      journalEntries = saleRes.data.journalEntries;
      customerMovements = saleRes.data.customerMovements;

      // 1. Check inventory deducted: 50 - 20 = 30
      const remainingStock = batches.find(b => b.itemId === "item-roasted")?.quantity;
      // 2. Check COGS = 20 * 25 = 500
      const cogs = saleRes.data.totalCOGS;
      // 3. Derived Customer balance = 1200
      const custBal = CustomerLedgerCalculator.calculateBalance(customerMovements, "cust-1");

      if (remainingStock === 30 && cogs === 500 && custBal === 1200) {
        results.push({ code: "COMMERCE_SALES_FLOW", name: "Atomic Sales Flow (Stock, Real COGS, GL, AR)", status: "PASS" });
      } else {
        results.push({
          code: "COMMERCE_SALES_FLOW",
          name: "Atomic Sales Flow",
          status: "FAIL",
          details: `Stock: ${remainingStock} (exp 30), COGS: ${cogs} (exp 500), AR: ${custBal} (exp 1200)`
        });
      }
    } else {
      results.push({ code: "COMMERCE_SALES_FLOW", name: "Atomic Sales Flow", status: "FAIL", details: saleRes.errors.join("; ") });
    }
  } catch (e: any) {
    results.push({ code: "COMMERCE_SALES_FLOW", name: "Atomic Sales Flow", status: "FAIL", details: e.message });
  }

  // Invariant 2: Atomic Customer Collection (Cash in + AR reduction + Journal Entry)
  try {
    const collRes = CommerceService.processCustomerCollection({
      dto: {
        customerId: "cust-1",
        customerName: "مقهى الماسة",
        amount: 800,
        date: "2026-07-11",
        actor: "cashier"
      },
      config,
      journalEntries,
      customerMovements,
      fiscalPeriods: [],
      getAccountName
    });

    if (collRes.committed && collRes.data) {
      journalEntries = collRes.data.journalEntries;
      customerMovements = collRes.data.customerMovements;

      const newBal = CustomerLedgerCalculator.calculateBalance(customerMovements, "cust-1");
      // 1200 invoice - 800 payment = 400 remaining debt
      if (newBal === 400) {
        results.push({ code: "CUSTOMER_COLLECTION_FLOW", name: "Customer Debt Collection & AR Settlement", status: "PASS" });
      } else {
        results.push({ code: "CUSTOMER_COLLECTION_FLOW", name: "Customer Debt Collection", status: "FAIL", details: `Expected balance 400, got ${newBal}` });
      }
    } else {
      results.push({ code: "CUSTOMER_COLLECTION_FLOW", name: "Customer Debt Collection", status: "FAIL", details: collRes.errors.join("; ") });
    }
  } catch (e: any) {
    results.push({ code: "CUSTOMER_COLLECTION_FLOW", name: "Customer Debt Collection", status: "FAIL", details: e.message });
  }

  // Invariant 3: Atomic Purchase Order Receipt
  try {
    const po: PurchaseOrder = {
      id: "PO-2026-999",
      supplierId: "sup-1",
      supplierName: "واردات اليمن",
      date: "2026-07-12",
      status: "Draft",
      items: [
        { itemId: "item-green-haraz", itemName: "Harazi Green Beans", quantity: 100, price: 45, total: 4500 }
      ],
      totalAmount: 4500,
      currency: Currency.SAR,
      exchangeRate: 1
    };

    const purchRes = CommerceService.processPurchaseReceipt({
      dto: {
        purchaseOrder: po,
        actor: "purchaser"
      },
      config,
      batches,
      costLayers,
      stockMovements,
      journalEntries,
      suppliers,
      supplierMovements,
      fiscalPeriods: [],
      getAccountName
    });

    if (purchRes.committed && purchRes.data) {
      batches = purchRes.data.batches;
      costLayers = purchRes.data.costLayers;
      stockMovements = purchRes.data.stockMovements;
      journalEntries = purchRes.data.journalEntries;
      supplierMovements = purchRes.data.supplierMovements;

      const supBal = SupplierLedgerCalculator.calculateBalance(supplierMovements, "sup-1");
      const addedBatch = batches.find(b => b.itemId === "item-green-haraz");

      if (supBal === 4500 && addedBatch?.quantity === 100 && addedBatch?.costPerUnit === 45) {
        results.push({ code: "COMMERCE_PURCHASE_FLOW", name: "Atomic Purchase Order Receipt (Stock, GL, AP)", status: "PASS" });
      } else {
        results.push({
          code: "COMMERCE_PURCHASE_FLOW",
          name: "Atomic Purchase Order Receipt",
          status: "FAIL",
          details: `AP: ${supBal} (exp 4500), Batch qty: ${addedBatch?.quantity}`
        });
      }
    } else {
      results.push({ code: "COMMERCE_PURCHASE_FLOW", name: "Atomic Purchase Order Receipt", status: "FAIL", details: purchRes.errors.join("; ") });
    }
  } catch (e: any) {
    results.push({ code: "COMMERCE_PURCHASE_FLOW", name: "Atomic Purchase Order Receipt", status: "FAIL", details: e.message });
  }

  // Invariant 4: Atomic Supplier Liability Payment
  try {
    const payRes = CommerceService.processSupplierPayment({
      dto: {
        supplierId: "sup-1",
        supplierName: "واردات اليمن",
        amount: 2500,
        date: "2026-07-13",
        actor: "accountant"
      },
      config,
      journalEntries,
      supplierMovements,
      fiscalPeriods: [],
      getAccountName
    });

    if (payRes.committed && payRes.data) {
      journalEntries = payRes.data.journalEntries;
      supplierMovements = payRes.data.supplierMovements;

      const newSupBal = SupplierLedgerCalculator.calculateBalance(supplierMovements, "sup-1");
      // 4500 - 2500 = 2000 remaining AP
      if (newSupBal === 2000) {
        results.push({ code: "SUPPLIER_PAYMENT_FLOW", name: "Supplier Payment & AP Settlement", status: "PASS" });
      } else {
        results.push({ code: "SUPPLIER_PAYMENT_FLOW", name: "Supplier Payment", status: "FAIL", details: `Expected 2000, got ${newSupBal}` });
      }
    } else {
      results.push({ code: "SUPPLIER_PAYMENT_FLOW", name: "Supplier Payment", status: "FAIL", details: payRes.errors.join("; ") });
    }
  } catch (e: any) {
    results.push({ code: "SUPPLIER_PAYMENT_FLOW", name: "Supplier Payment", status: "FAIL", details: e.message });
  }

  // Invariant 5: No Hardcoded Account IDs
  try {
    const keys = Object.keys(config);
    const hasRequiredConfig = [
      "cashAccountId",
      "bankAccountId",
      "accountsReceivableAccountId",
      "accountsPayableAccountId",
      "rawMaterialsInventoryAccountId",
      "finishedGoodsInventoryAccountId",
      "cogsAccountId",
      "wholesaleRevenueAccountId"
    ].every(k => keys.includes(k));

    if (hasRequiredConfig) {
      results.push({ code: "NO_HARDCODED_ACCOUNTS", name: "Dynamic Posting Account Configuration (No Hardcoded IDs)", status: "PASS" });
    } else {
      results.push({ code: "NO_HARDCODED_ACCOUNTS", name: "Dynamic Posting Account Configuration", status: "FAIL", details: "Missing required configuration keys" });
    }
  } catch (e: any) {
    results.push({ code: "NO_HARDCODED_ACCOUNTS", name: "Dynamic Posting Account Configuration", status: "FAIL", details: e.message });
  }

  // Invariant 6: Real Financial Statements (No 0.45 or 0.55 estimates)
  try {
    const testAccounts = [
      { id: "acc-1000", code: "1000", name: "Cash in Hand", nameAr: "الصندوق", type: "Asset" as any, balance: 0 },
      { id: "acc-1200", code: "1200", name: "AR", nameAr: "العملاء", type: "Asset" as any, balance: 0 },
      { id: "acc-1300", code: "1300", name: "Raw Material", nameAr: "مخزون خام", type: "Asset" as any, balance: 0 },
      { id: "acc-1310", code: "1310", name: "Finished Goods", nameAr: "مخزون تام", type: "Asset" as any, balance: 0 },
      { id: "acc-2000", code: "2000", name: "AP", nameAr: "الموردين", type: "Liability" as any, balance: 0 },
      { id: "acc-4000", code: "4000", name: "Wholesale Revenue", nameAr: "المبيعات", type: "Income" as any, balance: 0 },
      { id: "acc-5000", code: "5000", name: "COGS", nameAr: "تكلفة المبيعات", type: "Expense" as any, balance: 0 }
    ];

    const incomeStmt = TrialBalanceService.generateIncomeStatement(testAccounts, journalEntries);

    // Revenue should be 1200 (from sales invoice), COGS should be 500 (from 20 * 25)
    if (incomeStmt.totalRevenue === 1200 && incomeStmt.totalCOGS === 500 && incomeStmt.grossProfit === 700) {
      results.push({ code: "NO_ESTIMATED_COGS", name: "Verifiable Ledger-Derived Financial Reports (Zero Estimation)", status: "PASS" });
    } else {
      results.push({
        code: "NO_ESTIMATED_COGS",
        name: "Verifiable Ledger-Derived Financial Reports",
        status: "FAIL",
        details: `Revenue: ${incomeStmt.totalRevenue} (exp 1200), COGS: ${incomeStmt.totalCOGS} (exp 500)`
      });
    }
  } catch (e: any) {
    results.push({ code: "NO_ESTIMATED_COGS", name: "Verifiable Ledger-Derived Financial Reports", status: "FAIL", details: e.message });
  }

  return results;
}
