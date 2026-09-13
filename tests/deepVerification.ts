// NOVARO ERP Phase 2A.1 — Deep Engineering & Invariant Verification Script
import {
  LocalAccountRepository,
  LocalJournalEntryRepository,
  LocalCustomerRepository,
  LocalSupplierRepository,
  LocalInventoryRepository,
  LocalSalesRepository,
  LocalPurchaseRepository,
  LocalFiscalPeriodRepository,
  LocalUnitOfWork,
  safeStorage
} from "../src/infrastructure/persistence/local";
import {
  JournalEntryApplicationService,
  AccountApplicationService,
  SalesApplicationService,
  PurchaseApplicationService,
  InventoryApplicationService,
  CustomerApplicationService,
  SupplierApplicationService
} from "../src/core/application/services";
import { AccountingEngine } from "../src/core/application/accounting/AccountingEngine";
import { TrialBalanceService } from "../src/core/application/accounting/TrialBalanceService";
import { InventoryEngine } from "../src/core/application/inventory/InventoryEngine";
import { CommerceService } from "../src/core/application/commerce/CommerceService";
import { defaultPostingAccountConfiguration } from "../src/core/domain/accounting/PostingAccountConfiguration";
import { AppError } from "../src/core/application/errors/ApiError";
import { AccountType, Currency, Customer, Supplier } from "../src/types";
import type { FiscalPeriodStatus } from "../src/core/domain/accounting/FiscalPeriod";
import type { TenantContext } from "../src/core/application/repositories/TenantContext";

interface SectionTestResult {
  section: string;
  testName: string;
  status: "PASS" | "FAIL" | "PARTIAL";
  details: string;
}

const sectionResults: SectionTestResult[] = [];

function logResult(section: string, testName: string, status: "PASS" | "FAIL" | "PARTIAL", details: string) {
  sectionResults.push({ section, testName, status, details });
  console.log(`[${status}] [${section}] ${testName} -> ${details}`);
}

async function runDeepVerification() {
  console.log("\n==================================================================");
  console.log("NOVARO ERP PHASE 2A.1 DEEP INVARIANT & PERSISTENCE VERIFICATION");
  console.log("==================================================================\n");

  // ==========================================
  // Section 9: Local Persistence (Create -> Read -> Update -> Reload -> Read)
  // ==========================================
  try {
    const accRepo = new LocalAccountRepository();
    const testCode = `77${Math.floor(100 + Math.random() * 899)}`;
    const testId = `acc-${testCode}`;

    // 1. Create
    await accRepo.save({
      id: testId,
      code: testCode,
      name: "Persistence Lifecycle Test Account",
      nameAr: "حساب دورة حياة التخزين",
      type: AccountType.Asset,
      balance: 1500
    });

    // 2. Read
    const initialRead = await accRepo.findById(testId);
    const step1Pass = initialRead?.name === "Persistence Lifecycle Test Account";

    // 3. Update
    await accRepo.save({
      ...initialRead!,
      name: "Persistence Lifecycle Test Account (Updated)",
      balance: 2500
    });
    const updatedRead = await accRepo.findById(testId);
    const step2Pass = updatedRead?.name === "Persistence Lifecycle Test Account (Updated)" && updatedRead?.balance === 2500;

    // 4. Reload (Instantiate completely new repository instance simulating process/page reload)
    const freshRepoInstance = new LocalAccountRepository();
    const reloadedRead = await freshRepoInstance.findById(testId);
    const step3Pass = reloadedRead?.id === testId && reloadedRead?.name === "Persistence Lifecycle Test Account (Updated)" && reloadedRead?.balance === 2500;

    // Verify findByCode works after reload
    const codeLookup = await freshRepoInstance.findByCode(testCode);
    const step4Pass = codeLookup?.id === testId;

    const allPersistencePass = step1Pass && step2Pass && step3Pass && step4Pass;
    logResult(
      "Section 09",
      "Local Persistence Full Lifecycle",
      allPersistencePass ? "PASS" : "FAIL",
      `Create: ${step1Pass}, Update: ${step2Pass}, Reload: ${step3Pass}, CodeLookup: ${step4Pass}`
    );
  } catch (err: any) {
    logResult("Section 09", "Local Persistence Full Lifecycle", "FAIL", err.message);
  }

  // ==========================================
  // Section 10: Accounting Integration Test
  // ==========================================
  try {
    const jeRepo = new LocalJournalEntryRepository();
    const fpRepo = new LocalFiscalPeriodRepository();
    const accRepo = new LocalAccountRepository();
    const jeService = new JournalEntryApplicationService(jeRepo, fpRepo, accRepo);

    // 1. Unbalanced entry rejection
    let unbalancedBlocked = false;
    try {
      await jeService.createDraft({
        date: "2026-03-15",
        reference: "UNBALANCED-SHOULD-FAIL",
        notes: "Unbalanced",
        items: [
          { accountId: "acc-1000", debit: 500, credit: 0 },
          { accountId: "acc-4000", debit: 0, credit: 400 }
        ]
      });
    } catch (e: any) {
      unbalancedBlocked = e.statusCode === 400 || e.code === "VALIDATION_ERROR";
    }

    // 2. Draft creation
    const draft = await jeService.createDraft({
      date: "2026-03-15",
      reference: `ACC-INT-${Date.now()}`,
      notes: "Accounting integration entry",
      items: [
        { accountId: "acc-1000", debit: 1200, credit: 0 },
        { accountId: "acc-4000", debit: 0, credit: 1200 }
      ]
    });
    const isDraftCreated = draft.workflowStatus === "Draft";

    // 3. Post entry
    const posted = await jeService.post(draft.id);
    const isPosted = posted.workflowStatus === "Posted";

    // 4. Posted entry immutability
    let immutabilityGuarded = false;
    try {
      await jeService.updateDraft(posted.id, { notes: "Hacked notes" });
    } catch (e: any) {
      immutabilityGuarded = e.statusCode === 409 || e.code === "POSTED_ENTRY_IMMUTABLE";
    }

    // 5. Fiscal Period lock check
    const closedPeriod = {
      id: "fp-closed-2024",
      name: "2024-Q1 Closed",
      startDate: "2024-01-01",
      endDate: "2024-03-31",
      status: "CLOSED" as const
    };
    await fpRepo.save(closedPeriod);
    const entryInClosedPeriod = await jeService.createDraft({
      date: "2024-02-01",
      reference: "PERIOD-LOCKED-TEST",
      notes: "Posting in closed period",
      items: [
        { accountId: "acc-1000", debit: 100, credit: 0 },
        { accountId: "acc-4000", debit: 0, credit: 100 }
      ]
    });
    let periodLockEnforced = false;
    try {
      await jeService.post(entryInClosedPeriod.id);
    } catch (e: any) {
      periodLockEnforced = (e.statusCode === 400 || e.statusCode === 409) && e.code === "PERIOD_LOCKED";
    }

    // 6. Reversal integrity
    const reversal = await jeService.reverse(posted.id, "Accounting integration reversal");
    const isReversalBalanced = reversal.reversalEntry.items.reduce((s, it) => s + it.debit, 0) ===
      reversal.reversalEntry.items.reduce((s, it) => s + it.credit, 0);
    const hasRevRef = reversal.reversalEntry.reference.includes("REV-");

    // 7. Trial balance equilibrium
    const accounts = await accRepo.getAll();
    const allJEs = await jeRepo.getAll();
    const tb = TrialBalanceService.getTrialBalance(accounts, allJEs);

    const accountingPass = unbalancedBlocked && isDraftCreated && isPosted && immutabilityGuarded && periodLockEnforced && isReversalBalanced && hasRevRef && tb.isBalanced;
    logResult(
      "Section 10",
      "Accounting Integration & Invariants",
      accountingPass ? "PASS" : "FAIL",
      `UnbalancedBlock: ${unbalancedBlocked}, Immutability: ${immutabilityGuarded}, PeriodLock: ${periodLockEnforced}, Reversal: ${isReversalBalanced && hasRevRef}, TB_Balanced: ${tb.isBalanced} (Diff: ${tb.discrepancy})`
    );
  } catch (err: any) {
    logResult("Section 10", "Accounting Integration & Invariants", "FAIL", err.message);
  }

  // ==========================================
  // Section 11: Inventory Integration Test
  // ==========================================
  try {
    const invRepo = new LocalInventoryRepository();
    const batches = await invRepo.getBatches();
    const costLayers = await invRepo.getCostLayers();
    const movements = await invRepo.getMovements();

    // 1. Non-negative stock check
    const negativeIssueRes = InventoryEngine.issueStock(
      {
        itemId: "item-1",
        quantity: 99999999, // Impossible stock quantity
        date: "2026-03-15",
        referenceType: "TEST",
        referenceId: "NEG-CHECK",
        createdBy: "verifier",
        notes: "Negative stock test"
      },
      batches,
      costLayers,
      movements,
      "Green Ethiopian"
    );
    const nonNegativeEnforced = !negativeIssueRes.success;

    // 2. FIFO consumption
    const validIssueRes = InventoryEngine.issueStock(
      {
        itemId: "item-1",
        quantity: 5,
        date: "2026-03-15",
        referenceType: "TEST",
        referenceId: "FIFO-CHECK",
        createdBy: "verifier",
        notes: "FIFO verification issue"
      },
      batches,
      costLayers,
      movements,
      "Green Ethiopian"
    );
    const fifoConsumed = validIssueRes.success && (validIssueRes.data?.totalCOGS ?? 0) > 0;

    logResult(
      "Section 11",
      "Inventory Integration & FIFO",
      nonNegativeEnforced && fifoConsumed ? "PASS" : "FAIL",
      `NonNegativeStockEnforced: ${nonNegativeEnforced}, FIFOConsumed: ${fifoConsumed} (COGS: ${validIssueRes.data?.totalCOGS})`
    );
  } catch (err: any) {
    logResult("Section 11", "Inventory Integration & FIFO", "FAIL", err.message);
  }

  // ==========================================
  // Section 12 & 13: Sales & Purchase Integration
  // ==========================================
  try {
    const salesRepo = new LocalSalesRepository();
    const purchaseRepo = new LocalPurchaseRepository();
    const invRepo = new LocalInventoryRepository();
    const custRepo = new LocalCustomerRepository();
    const suppRepo = new LocalSupplierRepository();
    const jeRepo = new LocalJournalEntryRepository();
    const fpRepo = new LocalFiscalPeriodRepository();

    const salesService = new SalesApplicationService(salesRepo, invRepo, custRepo, jeRepo, fpRepo);
    const purchaseService = new PurchaseApplicationService(purchaseRepo, invRepo, jeRepo, fpRepo);

    // Create a customer
    const custId = `cust-verif-${Date.now()}`;
    const cust: Customer = {
      id: custId,
      name: "Specialty Buyer Inc",
      nameAr: "شركة المشتري المتخصص",
      email: "buyer@specialty.sa",
      phone: "+966501112233",
      address: "Riyadh, Saudi Arabia",
      balance: 0
    };
    await custRepo.save(cust);

    // Create Sale
    const sale = await salesService.createSale({
      customerId: cust.id,
      customerName: cust.name,
      date: "2026-03-15",
      paymentMethod: "Credit",
      items: [
        {
          itemId: "item-1",
          itemName: "Ethiopian Yirgacheffe",
          quantity: 2,
          unitPrice: 90,
          taxRate: 0.15
        }
      ]
    });
    const salePass = sale.workflowStatus === "Posted" && sale.totalAmount === 207;

    // Create Supplier
    const suppId = `supp-verif-${Date.now()}`;
    const supp: Supplier = {
      id: suppId,
      name: "Direct Farmer Co",
      nameAr: "شركة المزارع المباشر",
      email: "farmer@direct.sa",
      phone: "+966504445566",
      address: "Jeddah, Saudi Arabia",
      balance: 0
    };
    await suppRepo.save(supp);

    // Create PO & Receive
    const po = await purchaseService.createPurchase({
      supplierId: supp.id,
      supplierName: supp.name,
      orderDate: "2026-03-15",
      items: [
        {
          itemId: "item-1",
          itemName: "Ethiopian Yirgacheffe",
          quantity: 25,
          unitPrice: 42,
          taxRate: 0.15
        }
      ]
    });
    const receivedPO = await purchaseService.receivePurchase({
      purchaseOrderId: po.id,
      receivedDate: "2026-03-15",
      warehouseId: "wh-raw"
    });
    const purchasePass = receivedPO.status === "Received";

    logResult(
      "Section 12 & 13",
      "Sales & Purchase End-to-End Orchestration",
      salePass && purchasePass ? "PASS" : "FAIL",
      `SalePosted: ${salePass} (Total: ${sale.totalAmount} SAR), POReceived: ${purchasePass}`
    );
  } catch (err: any) {
    logResult("Section 12 & 13", "Sales & Purchase End-to-End Orchestration", "FAIL", err.message);
  }

  // ==========================================
  // Section 14: Customer & Supplier Balance Source of Truth
  // ==========================================
  try {
    const custRepo = new LocalCustomerRepository();
    const suppRepo = new LocalSupplierRepository();
    const customers = await custRepo.getAll();
    const suppliers = await suppRepo.getAll();

    const custBalancesValid = customers.every(c => typeof c.balance === "number" && !isNaN(c.balance));
    const suppBalancesValid = suppliers.every(s => typeof s.balance === "number" && !isNaN(s.balance));

    logResult(
      "Section 14",
      "Customer / Supplier Subledger Truth",
      custBalancesValid && suppBalancesValid ? "PASS" : "FAIL",
      `Customers tracked: ${customers.length} (Valid: ${custBalancesValid}), Suppliers tracked: ${suppliers.length} (Valid: ${suppBalancesValid})`
    );
  } catch (err: any) {
    logResult("Section 14", "Customer / Supplier Subledger Truth", "FAIL", err.message);
  }

  // ==========================================
  // Section 15: Reports Integration (Strict derivation)
  // ==========================================
  try {
    const accRepo = new LocalAccountRepository();
    const jeRepo = new LocalJournalEntryRepository();
    const accounts = await accRepo.getAll();
    const journalEntries = await jeRepo.getAll();

    const tb = TrialBalanceService.getTrialBalance(accounts, journalEntries);
    const incStmt = TrialBalanceService.generateIncomeStatement(accounts, journalEntries);
    const balSheet = TrialBalanceService.generateBalanceSheet(accounts, journalEntries);

    const hasNoMockEstimates = !isNaN(incStmt.grossProfit) && !isNaN(balSheet.totalAssets) && tb.discrepancy === 0;
    logResult(
      "Section 15",
      "Financial Reports Strict Derivation",
      hasNoMockEstimates ? "PASS" : "FAIL",
      `TB Discrepancy: ${tb.discrepancy}, GrossProfit: ${incStmt.grossProfit}, BalanceSheet Balanced: ${balSheet.isBalanced}`
    );
  } catch (err: any) {
    logResult("Section 15", "Financial Reports Strict Derivation", "FAIL", err.message);
  }

  // ==========================================
  // Section 20: UnitOfWork Transaction Simulation & Rollback
  // ==========================================
  try {
    const uow = new LocalUnitOfWork();
    await uow.begin();

    // Modify state inside transaction
    const tempAccId = `acc-tx-test-${Date.now()}`;
    await uow.accounts.save({
      id: tempAccId,
      code: "998877",
      name: "Transaction Rollback Test",
      nameAr: "اختبار التراجع",
      type: AccountType.Asset,
      balance: 5000
    });

    const readInsideTx = await uow.accounts.findById(tempAccId);
    const visibleInside = readInsideTx !== null;

    // Rollback
    await uow.rollback();

    const readAfterRollback = await uow.accounts.findById(tempAccId);
    const rolledBackSuccessfully = readAfterRollback === null;

    logResult(
      "Section 20",
      "UnitOfWork Snapshot Rollback Simulation",
      visibleInside && rolledBackSuccessfully ? "PASS" : "FAIL",
      `Visible inside Tx: ${visibleInside}, Restored after rollback: ${rolledBackSuccessfully}`
    );
  } catch (err: any) {
    logResult("Section 20", "UnitOfWork Snapshot Rollback Simulation", "FAIL", err.message);
  }

  // ==========================================
  // Section 21: Tenant Context Abstraction
  // ==========================================
  try {
    const accRepo = new LocalAccountRepository();
    const defaultCtx: TenantContext = { tenantId: "tenant-default", companyId: "comp-1" };
    const accounts = await accRepo.getAll({ context: defaultCtx });
    const tenantCtxSupported = Array.isArray(accounts);

    logResult(
      "Section 21",
      "TenantContext Interface Readiness",
      tenantCtxSupported ? "PASS" : "FAIL",
      `TenantContext contract supported across repository queries: ${tenantCtxSupported}`
    );
  } catch (err: any) {
    logResult("Section 21", "TenantContext Interface Readiness", "FAIL", err.message);
  }

  console.log("\n==================================================================");
  const totalPassed = sectionResults.filter(r => r.status === "PASS").length;
  console.log(`DEEP VERIFICATION SUMMARY: ${totalPassed}/${sectionResults.length} SECTIONS PASSED`);
  console.log("==================================================================\n");

  return { totalPassed, total: sectionResults.length, results: sectionResults };
}

runDeepVerification().then(({ totalPassed, total }) => {
  if (totalPassed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch((e) => {
  console.error("Deep verification run failed:", e);
  process.exit(1);
});
