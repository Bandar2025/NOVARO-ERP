// NOVARO ERP Certification Test: Enterprise Engines (Manufacturing FIFO WIP, ZATCA Chain, Subledger-to-GL Reconciliation, Year-End Closing)
import { Batch, Currency, Item, ItemCategory, ZatcaDocumentRecord } from "../../types";
import { CostLayer } from "../domain/inventory/CostLayer";
import { DomainStockMovement } from "../domain/inventory/StockMovement";
import { ManufacturingEngine } from "../application/manufacturing/ManufacturingEngine";
import { InventoryEngine } from "../application/inventory/InventoryEngine";
import { ZatcaEngine, ZATCA_GENESIS_PIH } from "../domain/zatca/ZatcaEngine";
import { DataIntegrityChecker } from "../diagnostics/DataIntegrityChecker";
import { defaultPostingAccountConfiguration } from "../domain/accounting/PostingAccountConfiguration";
import {
  initialAccounts,
  initialJournalEntries,
  initialBatches,
  initialItems,
  initialCustomers,
  initialSuppliers,
  initialSalesInvoices,
  initialPurchaseOrders
} from "../../data/novaroInitialData";
import { AccountingEngine } from "../application/accounting/AccountingEngine";
import { TrialBalanceService } from "../application/accounting/TrialBalanceService";
import { assertPeriodAllowsPosting } from "../domain/accounting/FiscalPeriod";
import { CertificationCheckResult } from "./accounting.certification";

export function runEnterpriseCertification(): CertificationCheckResult[] {
  const results: CertificationCheckResult[] = [];

  // 1. Multi-Stage Manufacturing FIFO & WIP Cost Rollup Conservation
  try {
    const testItems: Item[] = [
      { id: "it-green", name: "Green Coffee", nameAr: "بن أخضر", sku: "G-1", category: ItemCategory.GreenCoffee, unit: "kg", price: 0, cost: 30, barcode: "1", currentStock: 100 },
      { id: "it-roasted", name: "Roasted Coffee", nameAr: "بن محمص", sku: "R-1", category: ItemCategory.RoastedCoffee, unit: "kg", price: 50, cost: 35, barcode: "2", currentStock: 0 },
      { id: "it-ground", name: "Ground Coffee", nameAr: "بن مطحون", sku: "GR-1", category: ItemCategory.GroundCoffee, unit: "kg", price: 60, cost: 38, barcode: "3", currentStock: 0 }
    ];
    let batches: Batch[] = [
      { id: "b-green-1", batchNumber: "B-GRN-01", itemId: "it-green", itemName: "Green Coffee", manufactureDate: "2026-07-01", expiryDate: "2028-07-01", quantity: 100, costPerUnit: 30, warehouseId: "wh-1" }
    ];
    let layers: CostLayer[] = [
      {
        id: "l-green-1",
        batchId: "b-green-1",
        batchNumber: "B-GRN-01",
        itemId: "it-green",
        warehouseId: "wh-1",
        receivedDate: "2026-07-01",
        initialQuantity: 100,
        remainingQuantity: 100,
        unitCost: 30,
        currency: Currency.SAR,
        isExhausted: false
      }
    ];
    let movements: DomainStockMovement[] = [];

    const initialTotalVal = InventoryEngine.calculateTotalValuation(batches); // 3000 SAR

    // Stage 1: Roast 50kg green (@30 = 1500 SAR) -> 40kg roasted (@37.50 = 1500 SAR)
    const roastRes = ManufacturingEngine.executeRoasting(
      {
        batchNumber: "RST-TEST-01",
        recipeId: "rec-1",
        recipeName: "Test Roast",
        inputItemId: "it-green",
        inputQuantity: 50,
        outputItemId: "it-roasted",
        outputQuantity: 40,
        roastTimeMinutes: 14,
        tempCelsius: 205,
        workerName: "Tester",
        jobDate: "2026-07-10"
      },
      testItems,
      batches,
      layers,
      movements
    );

    if (roastRes.success && roastRes.batches && roastRes.layers && roastRes.movements) {
      batches = roastRes.batches;
      layers = roastRes.layers;
      movements = roastRes.movements;

      // Stage 2: Grind 20kg roasted (@37.50 = 750 SAR) -> 20kg ground (@37.50 = 750 SAR)
      const grindRes = ManufacturingEngine.executeGrinding(
        {
          jobDate: "2026-07-11",
          inputBatchNumber: "RST-TEST-01",
          inputItemId: "it-roasted",
          inputQuantity: 20,
          outputItemId: "it-ground",
          outputQuantity: 20,
          operator: "Tester"
        },
        testItems,
        batches,
        layers,
        movements
      );

      if (grindRes.success && grindRes.batches) {
        const afterVal = InventoryEngine.calculateTotalValuation(grindRes.batches);
        if (Math.abs(afterVal - initialTotalVal) < 0.05) {
          results.push({
            code: "MANUFACTURING_FIFO_WIP",
            name: "Multi-Stage Manufacturing FIFO Cost Rollup & Conservation",
            status: "PASS"
          });
        } else {
          results.push({
            code: "MANUFACTURING_FIFO_WIP",
            name: "Multi-Stage Manufacturing FIFO Cost Rollup",
            status: "FAIL",
            details: `Valuation drifted from ${initialTotalVal} to ${afterVal}`
          });
        }
      } else {
        results.push({ code: "MANUFACTURING_FIFO_WIP", name: "Multi-Stage Manufacturing FIFO", status: "FAIL", details: grindRes.error });
      }
    } else {
      results.push({ code: "MANUFACTURING_FIFO_WIP", name: "Multi-Stage Manufacturing FIFO", status: "FAIL", details: roastRes.error });
    }
  } catch (e: any) {
    results.push({ code: "MANUFACTURING_FIFO_WIP", name: "Multi-Stage Manufacturing FIFO", status: "FAIL", details: e.message });
  }

  // 2. ZATCA Phase 2 Cryptographic Hash Chain (388 Tax Invoice -> 381 Credit Note -> 383 Debit Note)
  try {
    const chain: ZatcaDocumentRecord[] = [];
    const s1 = ZatcaEngine.generateStamp({
      invoiceId: "INV-2026-1001",
      documentType: "SalesInvoice",
      invoiceTypeCode: "388",
      subType: "0100000",
      sellerName: "نوفارو للقهوة",
      vatNumber: "310492039200003",
      issueTimestamp: "2026-07-10T10:00:00Z",
      subtotal: 1000,
      vatAmount: 150,
      totalAmount: 1150,
      currency: "SAR",
      customerName: "أسواق التميمي",
      icv: 1,
      previousInvoiceHash: ZATCA_GENESIS_PIH,
      items: [{ itemId: "item-11", itemName: "قهوة نوفارو", quantity: 20, price: 50, total: 1000 }]
    });
    chain.push({
      id: "ZATCA-0001",
      documentId: "INV-2026-1001",
      documentType: "SalesInvoice",
      invoiceTypeCode: "388",
      subType: "0100000",
      ...s1,
      icv: 1,
      sellerName: "نوفارو للقهوة",
      vatNumber: "310492039200003",
      customerName: "أسواق التميمي",
      issueTimestamp: "2026-07-10T10:00:00Z",
      subtotal: 1000,
      vatAmount: 150,
      totalAmount: 1150,
      status: "CLEARED"
    });

    const s2 = ZatcaEngine.generateStamp({
      invoiceId: "CN-2026-1002",
      documentType: "CreditNote",
      invoiceTypeCode: "381",
      subType: "0100000",
      sellerName: "نوفارو للقهوة",
      vatNumber: "310492039200003",
      issueTimestamp: "2026-07-11T12:00:00Z",
      subtotal: 200,
      vatAmount: 30,
      totalAmount: 230,
      currency: "SAR",
      customerName: "أسواق التميمي",
      icv: 2,
      previousInvoiceHash: s1.invoiceHash,
      items: [{ itemId: "item-11", itemName: "قهوة نوفارو", quantity: 4, price: 50, total: 200 }]
    });
    chain.push({
      id: "ZATCA-0002",
      documentId: "CN-2026-1002",
      documentType: "CreditNote",
      invoiceTypeCode: "381",
      subType: "0100000",
      ...s2,
      icv: 2,
      sellerName: "نوفارو للقهوة",
      vatNumber: "310492039200003",
      customerName: "أسواق التميمي",
      issueTimestamp: "2026-07-11T12:00:00Z",
      subtotal: 200,
      vatAmount: 30,
      totalAmount: 230,
      status: "CLEARED"
    });

    const s3 = ZatcaEngine.generateStamp({
      invoiceId: "DN-2026-1003",
      documentType: "DebitNote",
      invoiceTypeCode: "383",
      subType: "0100000",
      sellerName: "نوفارو للقهوة",
      vatNumber: "310492039200003",
      issueTimestamp: "2026-07-12T14:00:00Z",
      subtotal: 500,
      vatAmount: 75,
      totalAmount: 575,
      currency: "SAR",
      customerName: "الشركة الأفريقية لتجارة البن",
      icv: 3,
      previousInvoiceHash: s2.invoiceHash,
      items: [{ itemId: "item-1", itemName: "بن إثيوبي", quantity: 10, price: 50, total: 500 }]
    });
    chain.push({
      id: "ZATCA-0003",
      documentId: "DN-2026-1003",
      documentType: "DebitNote",
      invoiceTypeCode: "383",
      subType: "0100000",
      ...s3,
      icv: 3,
      sellerName: "نوفارو للقهوة",
      vatNumber: "310492039200003",
      customerName: "الشركة الأفريقية لتجارة البن",
      issueTimestamp: "2026-07-12T14:00:00Z",
      subtotal: 500,
      vatAmount: 75,
      totalAmount: 575,
      status: "CLEARED"
    });

    const chainCheck = ZatcaEngine.verifyChain(chain);
    if (chainCheck.valid && s2.xmlContent.includes("381") && s3.xmlContent.includes("383")) {
      results.push({
        code: "ZATCA_HASH_CHAIN_381_383",
        name: "ZATCA Phase 2 Cryptographic Chain (388 Invoice + 381 Credit + 383 Debit)",
        status: "PASS"
      });
    } else {
      results.push({
        code: "ZATCA_HASH_CHAIN_381_383",
        name: "ZATCA Phase 2 Cryptographic Chain",
        status: "FAIL",
        details: chainCheck.reason || "Invalid XML type code"
      });
    }
  } catch (e: any) {
    results.push({ code: "ZATCA_HASH_CHAIN_381_383", name: "ZATCA Phase 2 Cryptographic Chain", status: "FAIL", details: e.message });
  }

  // 3. Subledger-to-GL Control Account Reconciliation (AR 1200, AP 2000, Inventory 1300/1310/1320)
  try {
    const audit = DataIntegrityChecker.runFullAudit({
      accounts: initialAccounts,
      journalEntries: initialJournalEntries,
      batches: initialBatches,
      items: initialItems,
      customers: initialCustomers,
      suppliers: initialSuppliers,
      salesInvoices: initialSalesInvoices,
      purchaseOrders: initialPurchaseOrders,
      postingConfig: defaultPostingAccountConfiguration
    });

    const rec = audit.reconciliation;
    if (
      audit.overallStatus === "HEALTHY" &&
      rec &&
      Math.abs(rec.arVariance) < 0.01 &&
      Math.abs(rec.apVariance) < 0.01 &&
      Math.abs(rec.inventoryVariance) < 0.01
    ) {
      results.push({
        code: "SUBLEDGER_GL_RECONCILIATION",
        name: "Subledger-to-GL Control Reconciliation (AR 1200, AP 2000, FIFO Inventory)",
        status: "PASS"
      });
    } else {
      results.push({
        code: "SUBLEDGER_GL_RECONCILIATION",
        name: "Subledger-to-GL Control Reconciliation",
        status: "FAIL",
        details: `Status: ${audit.overallStatus}, AR var: ${rec?.arVariance}, AP var: ${rec?.apVariance}, Inv var: ${rec?.inventoryVariance}`
      });
    }
  } catch (e: any) {
    results.push({ code: "SUBLEDGER_GL_RECONCILIATION", name: "Subledger-to-GL Control Reconciliation", status: "FAIL", details: e.message });
  }

  // 4. Fiscal Year-End Closing & Retained Earnings Transfer Equilibrium
  try {
    const derivedAccounts = AccountingEngine.calculateAllAccountBalances(initialAccounts, initialJournalEntries);
    const incomeAccs = derivedAccounts.filter(a => a.type === "Income");
    const expenseAccs = derivedAccounts.filter(a => a.type === "Expense");
    const totalInc = incomeAccs.reduce((s, a) => s + a.balance, 0);
    const totalExp = expenseAccs.reduce((s, a) => s + a.balance, 0);
    const netSurplus = totalInc - totalExp;

    const closeLines: any[] = [];
    incomeAccs.forEach(a => {
      if (a.balance > 0) closeLines.push({ id: `cl-${a.id}`, accountId: a.id, accountName: a.name, debit: a.balance, credit: 0 });
    });
    expenseAccs.forEach(a => {
      if (a.balance > 0) closeLines.push({ id: `cl-${a.id}`, accountId: a.id, accountName: a.name, debit: 0, credit: a.balance });
    });
    closeLines.push({
      id: "cl-re",
      accountId: "acc-3100",
      accountName: "Retained Earnings",
      debit: netSurplus < 0 ? Math.abs(netSurplus) : 0,
      credit: netSurplus > 0 ? netSurplus : 0
    });

    const closePost = AccountingEngine.postEntry(
      {
        date: "2026-12-31",
        reference: "CLOSE-2026",
        notes: "Year-End Closing Entry",
        items: closeLines,
        workflowStatus: "Posted"
      },
      initialJournalEntries,
      []
    );

    if (closePost.success && closePost.entry) {
      const postCloseEntries = [closePost.entry, ...initialJournalEntries];
      const tbAfter = TrialBalanceService.getTrialBalance(initialAccounts, postCloseEntries);
      const bsAfter = TrialBalanceService.generateBalanceSheet(initialAccounts, postCloseEntries);
      const isStmtAfter = TrialBalanceService.generateIncomeStatement(initialAccounts, postCloseEntries);

      if (tbAfter.isBalanced && bsAfter.isBalanced && isStmtAfter.netIncome === 0) {
        results.push({
          code: "FISCAL_YEAR_CLOSING_ZEROING",
          name: "Fiscal Year-End Closing (Zero P&L into Retained Earnings 3100)",
          status: "PASS"
        });
      } else {
        results.push({
          code: "FISCAL_YEAR_CLOSING_ZEROING",
          name: "Fiscal Year-End Closing",
          status: "FAIL",
          details: `NetIncome after close: ${isStmtAfter.netIncome}, TB Balanced: ${tbAfter.isBalanced}`
        });
      }
    } else {
      results.push({ code: "FISCAL_YEAR_CLOSING_ZEROING", name: "Fiscal Year-End Closing", status: "FAIL", details: closePost.error });
    }
  } catch (e: any) {
    results.push({ code: "FISCAL_YEAR_CLOSING_ZEROING", name: "Fiscal Year-End Closing", status: "FAIL", details: e.message });
  }

  // 5. Fixed Assets Straight-Line Depreciation & GOSI Payroll GL Posting
  try {
    const depPost = AccountingEngine.postEntry({
      date: "2026-07-31",
      reference: "DEP-2026-07",
      notes: "Monthly Roaster Depreciation",
      workflowStatus: "Posted",
      items: [
        { id: "d1", accountId: "acc-5200", accountName: "Depreciation Expense", debit: 1416.67, credit: 0 },
        { id: "d2", accountId: "acc-1400", accountName: "Machinery & Equipment", debit: 0, credit: 1416.67 }
      ]
    });
    const payPost = AccountingEngine.postEntry({
      date: "2026-07-31",
      reference: "PAY-2026-07",
      notes: "Monthly Payroll Run",
      workflowStatus: "Posted",
      items: [
        { id: "p1", accountId: "acc-5300", accountName: "Wages & Salaries", debit: 34250, credit: 0 },
        { id: "p2", accountId: "acc-1100", accountName: "Al-Rajhi Bank", debit: 0, credit: 34250 }
      ]
    });
    const checkPeriod = assertPeriodAllowsPosting("2025-12-15", [
      { id: "fp-locked", name: "2025", startDate: "2025-01-01", endDate: "2025-12-31", status: "CLOSED", isClosed: true }
    ]);

    if (depPost.success && payPost.success && !checkPeriod.allowed) {
      results.push({
        code: "ASSETS_PAYROLL_PERIOD_SHIELD",
        name: "Fixed Asset Depreciation, Payroll GL & Closed Period Shield",
        status: "PASS"
      });
    } else {
      results.push({
        code: "ASSETS_PAYROLL_PERIOD_SHIELD",
        name: "Fixed Asset Depreciation, Payroll GL & Closed Period Shield",
        status: "FAIL"
      });
    }
  } catch (e: any) {
    results.push({ code: "ASSETS_PAYROLL_PERIOD_SHIELD", name: "Fixed Asset Depreciation & Payroll", status: "FAIL", details: e.message });
  }

  return results;
}
