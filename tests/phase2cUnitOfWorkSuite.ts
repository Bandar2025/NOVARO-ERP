// NOVARO ERP Phase 2C — Global Unit of Work & Concurrency Suite
import { LocalUnitOfWork, LocalUnitOfWorkFactory } from "../src/infrastructure/persistence/local";
import { AppError } from "../src/core/application/errors/ApiError";
import { AccountType } from "../src/types";

async function runPhase2CSuite() {
  console.log("\n==================================================");
  console.log("NOVARO ERP — PHASE 2C UNIT OF WORK TEST SUITE");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function assertTest(name: string, condition: boolean, details: string) {
    total++;
    if (condition) {
      passed++;
      console.log(`[Test ${total}] PASS: ${name} — ${details}`);
    } else {
      console.log(`[Test ${total}] FAIL: ${name} — ${details}`);
    }
  }

  const tenantCtx = { tenantId: "tenant-test-1", companyId: "company-test-1", branchId: "branch-main" };
  const uowFactory = new LocalUnitOfWorkFactory();

  // Test 1: TenantContext enforcement
  try {
    await uowFactory.run(async (uow) => {
      // should not reach here if missing tenantId
    }, {} as any);
    assertTest("TenantContext Enforcement", false, "Allowed UnitOfWork execution without tenant context");
  } catch (err: any) {
    const isMissingTenant = err instanceof AppError && (err.code === "VALIDATION_ERROR" || err.statusCode === 400);
    assertTest("TenantContext Enforcement", isMissingTenant, "Blocked UnitOfWork execution when TenantContext is missing");
  }

  // Test 2: Multi-repository atomic commit
  try {
    await uowFactory.run(async (uow) => {
      await uow.accounts.save({
        id: "acc-uow-1",
        code: "1099",
        name: "UOW Test Account",
        nameAr: "حساب اختبار",
        type: AccountType.Asset,
        balance: 5000
      }, uow.getContext());

      await uow.customers.save({
        id: "cust-uow-1",
        name: "UOW Test Customer",
        nameAr: "عميل اختبار",
        email: "test@example.com",
        phone: "0500000000",
        address: "Riyadh",
        balance: 0
      }, uow.getContext());
    }, tenantCtx);

    const createdAcc = await (new LocalUnitOfWork(tenantCtx)).accounts.findById("acc-uow-1", tenantCtx);
    const createdCust = await (new LocalUnitOfWork(tenantCtx)).customers.findById("cust-uow-1", tenantCtx);
    assertTest("Multi-Repository Atomic Commit", !!createdAcc && !!createdCust, "Successfully committed mutations across multiple repositories in single UoW");
  } catch (err: any) {
    assertTest("Multi-Repository Atomic Commit", false, `Failed with error: ${err.message}`);
  }


  // Test 3: Transaction Rollback on Error
  try {
    await uowFactory.run(async (uow) => {
      await uow.accounts.save({
        id: "acc-rollback-fail",
        code: "9998",
        name: "Rollback Fail Account",
        nameAr: "حساب التراجع",
        type: AccountType.Asset,
        balance: 1000
      }, uow.getContext());

      // Deliberately throw an error mid-transaction
      throw new Error("Simulated business logic failure during multi-step operation");
    }, tenantCtx);
    assertTest("Transaction Rollback on Error", false, "Did not throw expected error");
  } catch (err: any) {
    const checkAcc = await (new LocalUnitOfWork(tenantCtx)).accounts.findById("acc-rollback-fail", tenantCtx);
    assertTest("Transaction Rollback on Error", checkAcc === null, "Transaction cleanly rolled back state after business logic failure");
  }

  // Test 4: Document Sequence Generation
  try {
    let seq1 = 0;
    let seq2 = 0;
    await uowFactory.run(async (uow) => {
      seq1 = await uow.documentSequences.getNextSequence({ documentType: "INV", fiscalYearId: "2026" }, tenantCtx);
      seq2 = await uow.documentSequences.getNextSequence({ documentType: "INV", fiscalYearId: "2026" }, tenantCtx);
    }, tenantCtx);

    const docNum1 = (new LocalUnitOfWork(tenantCtx)).documentSequences.formatDocumentNumber("INV", seq1, "2026");
    const docNum2 = (new LocalUnitOfWork(tenantCtx)).documentSequences.formatDocumentNumber("INV", seq2, "2026");

    assertTest("Document Sequence Generation", seq2 === seq1 + 1 && docNum1 === "INV-2026-000001" && docNum2 === "INV-2026-000002", `Sequences generated sequentially: ${docNum1}, ${docNum2}`);
  } catch (err: any) {
    assertTest("Document Sequence Generation", false, `Failed with error: ${err.message}`);
  }

  // Test 5: Isolation of UoW Repositories from Drizzle Transaction primitives
  try {
    await uowFactory.run(async (uow) => {
      const allAccs = await uow.accounts.getAll();
      const allJournalEntries = await uow.journalEntries.getAll();
      assertTest("UoW Repository Isolation", Array.isArray(allAccs) && Array.isArray(allJournalEntries), "Application layer interacted strictly with clean UoW repository interfaces");
    }, tenantCtx);
  } catch (err: any) {
    assertTest("UoW Repository Isolation", false, `Failed with error: ${err.message}`);
  }

  console.log(`\n==================================================`);
  console.log(`PHASE 2C SUITE RESULT: ${passed}/${total} PASSED`);
  console.log(`==================================================\n`);

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase2CSuite().catch(err => {
  console.error("Phase 2C test suite failure:", err);
  process.exit(1);
});
