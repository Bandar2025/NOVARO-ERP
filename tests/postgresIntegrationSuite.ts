import pg from "pg";
import fs from "fs";
import { db } from "../src/infrastructure/database/client/db";
import { DrizzleAccountRepository } from "../src/infrastructure/database/repositories/DrizzleAccountRepository";
import { DrizzleJournalEntryRepository } from "../src/infrastructure/database/repositories/DrizzleJournalEntryRepository";
import { DrizzleCustomerRepository } from "../src/infrastructure/database/repositories/DrizzleCustomerRepository";
import { DrizzleSupplierRepository } from "../src/infrastructure/database/repositories/DrizzleSupplierRepository";
import { DrizzleInventoryRepository } from "../src/infrastructure/database/repositories/DrizzleInventoryRepository";
import { Account, JournalEntry, Customer, Supplier, Item, AccountType, ItemCategory } from "../src/types";
import { TenantContext } from "../src/core/application/repositories/RepositoryInterfaces";
import { tenants } from "../src/infrastructure/database/schema/tenants";
import { companies } from "../src/infrastructure/database/schema/companies";
import { branches } from "../src/infrastructure/database/schema/branches";
import { AppError } from "../src/core/application/errors/ApiError";

const DB_URL = process.env.DATABASE_URL || "postgres://node@localhost:5432/novaro_erp";

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: string;
}

export async function runMigrationRunner(): Promise<void> {
  const pool = new pg.Pool({ connectionString: DB_URL });
  
  // Drop and recreate schema public to guarantee clean state
  await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
  await pool.query("CREATE SCHEMA public");

  const sqlContent = fs.readFileSync("./src/infrastructure/database/migrations/0000_daily_mac_gargan.sql", "utf-8");
  const statements = sqlContent.split("--> statement-breakpoint").map((s) => s.trim()).filter(Boolean);

  console.log(`[MigrationRunner] Executing ${statements.length} migration statements against PostgreSQL...`);
  for (let i = 0; i < statements.length; i++) {
    await pool.query(statements[i]);
  }
  console.log("[MigrationRunner] PostgreSQL Schema created successfully.");
  await pool.end();
}

export async function seedBaseHierarchy(): Promise<{
  tenantAContext: TenantContext;
  tenantBContext: TenantContext;
}> {
  // Seed Tenant A & Company A
  await db.insert(tenants).values({
    id: "tenant-alpha",
    code: "ALPHA",
    name: "Alpha Corp Tenant",
  }).onConflictDoNothing();

  await db.insert(companies).values({
    id: "company-alpha",
    tenantId: "tenant-alpha",
    name: "Alpha Company Ltd",
    currency: "SAR",
  }).onConflictDoNothing();

  await db.insert(branches).values({
    id: "branch-alpha",
    tenantId: "tenant-alpha",
    companyId: "company-alpha",
    code: "BR-A",
    name: "Alpha Main Branch",
  }).onConflictDoNothing();

  // Seed Tenant B & Company B
  await db.insert(tenants).values({
    id: "tenant-beta",
    code: "BETA",
    name: "Beta Corp Tenant",
  }).onConflictDoNothing();

  await db.insert(companies).values({
    id: "company-beta",
    tenantId: "tenant-beta",
    name: "Beta Company Ltd",
    currency: "SAR",
  }).onConflictDoNothing();

  await db.insert(branches).values({
    id: "branch-beta",
    tenantId: "tenant-beta",
    companyId: "company-beta",
    code: "BR-B",
    name: "Beta Main Branch",
  }).onConflictDoNothing();

  const tenantAContext: TenantContext = {
    tenantId: "tenant-alpha",
    companyId: "company-alpha",
    branchId: "branch-alpha",
  };

  const tenantBContext: TenantContext = {
    tenantId: "tenant-beta",
    companyId: "company-beta",
    branchId: "branch-beta",
  };

  return { tenantAContext, tenantBContext };
}

export async function runPostgresIntegrationTests(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log("\n==================================================");
  console.log("NOVARO ERP - POSTGRESQL REAL INTEGRATION TEST SUITE");
  console.log("==================================================\n");

  const accountRepo = new DrizzleAccountRepository();
  const jeRepo = new DrizzleJournalEntryRepository();
  const custRepo = new DrizzleCustomerRepository();
  const suppRepo = new DrizzleSupplierRepository();
  const itemRepo = new DrizzleInventoryRepository();

  const pool = new pg.Pool({ connectionString: DB_URL });

  try {
    // Step 0: Run Migration
    await runMigrationRunner();
    const { tenantAContext, tenantBContext } = await seedBaseHierarchy();

    // --------------------------------------------------
    // TEST 1: Tenant Isolation across Accounts
    // --------------------------------------------------
    try {
      const accA: Account = {
        id: "acc-1010-alpha",
        code: "1010",
        name: "Cash Alpha",
        nameAr: "النقدية ألفا",
        type: AccountType.Asset,
        balance: 1000,
      };

      const accB: Account = {
        id: "acc-1010-beta",
        code: "1010",
        name: "Cash Beta",
        nameAr: "النقدية بيتا",
        type: AccountType.Asset,
        balance: 2000,
      };

      await accountRepo.save(accA, tenantAContext);
      await accountRepo.save(accB, tenantBContext);

      const accountsA = await accountRepo.getAll({ context: tenantAContext });
      const accountsB = await accountRepo.getAll({ context: tenantBContext });

      const crossFetchA = await accountRepo.findById("acc-1010-beta", tenantAContext);
      const crossFetchB = await accountRepo.findById("acc-1010-alpha", tenantBContext);

      const isIsolated =
        accountsA.every((a) => a.id !== "acc-1010-beta") &&
        accountsB.every((b) => b.id !== "acc-1010-alpha") &&
        crossFetchA === null &&
        crossFetchB === null;

      if (!isIsolated) {
        throw new Error("Accounts tenant isolation failed: cross-tenant data leaked!");
      }

      results.push({
        name: "Tenant Isolation - Accounts Repository",
        passed: true,
        details: `Tenant A Accounts: ${accountsA.length}, Tenant B Accounts: ${accountsB.length}. Cross-tenant reads returned null.`,
      });
    } catch (err: any) {
      results.push({
        name: "Tenant Isolation - Accounts Repository",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 2: Tenant Isolation across Journal Entries
    // --------------------------------------------------
    try {
      // Add expense account for journal entries
      await accountRepo.save(
        {
          id: "acc-5010-alpha",
          code: "5010",
          name: "Rent Expense Alpha",
          nameAr: "مصروف إيجار",
          type: AccountType.Expense,
          balance: 0,
        },
        tenantAContext
      );

      await accountRepo.save(
        {
          id: "acc-5010-beta",
          code: "5010",
          name: "Rent Expense Beta",
          nameAr: "مصروف إيجار",
          type: AccountType.Expense,
          balance: 0,
        },
        tenantBContext
      );

      const jeA: JournalEntry = {
        id: "je-alpha-001",
        date: "2026-01-01",
        reference: "REF-ALPHA-01",
        notes: "Alpha Rent",
        posted: false,
        workflowStatus: "Draft",
        items: [
          { id: "jei-a1", accountId: "acc-5010-alpha", accountName: "Rent", debit: 500, credit: 0 },
          { id: "jei-a2", accountId: "acc-1010-alpha", accountName: "Cash", debit: 0, credit: 500 },
        ],
      };

      const jeB: JournalEntry = {
        id: "je-beta-001",
        date: "2026-01-01",
        reference: "REF-BETA-01",
        notes: "Beta Rent",
        posted: false,
        workflowStatus: "Draft",
        items: [
          { id: "jei-b1", accountId: "acc-5010-beta", accountName: "Rent", debit: 800, credit: 0 },
          { id: "jei-b2", accountId: "acc-1010-beta", accountName: "Cash", debit: 0, credit: 800 },
        ],
      };

      await jeRepo.save(jeA, tenantAContext);
      await jeRepo.save(jeB, tenantBContext);

      const jesA = await jeRepo.getAll({ context: tenantAContext });
      const jesB = await jeRepo.getAll({ context: tenantBContext });

      const crossA = await jeRepo.findById("je-beta-001", tenantAContext);
      const crossB = await jeRepo.findById("je-alpha-001", tenantBContext);

      const isIsolated =
        jesA.some((j) => j.id === "je-alpha-001") &&
        !jesA.some((j) => j.id === "je-beta-001") &&
        jesB.some((j) => j.id === "je-beta-001") &&
        !jesB.some((j) => j.id === "je-alpha-001") &&
        crossA === null &&
        crossB === null;

      if (!isIsolated) {
        throw new Error("Journal Entries tenant isolation failed: cross-tenant leak detected!");
      }

      results.push({
        name: "Tenant Isolation - Journal Entries Repository",
        passed: true,
        details: `Tenant A JEs: ${jesA.length}, Tenant B JEs: ${jesB.length}. Cross-tenant reads returned null.`,
      });
    } catch (err: any) {
      results.push({
        name: "Tenant Isolation - Journal Entries Repository",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 3: Tenant Isolation across Customers, Suppliers, Inventory
    // --------------------------------------------------
    try {
      const custA: Customer = {
        id: "cust-alpha-1",
        name: "Alpha Customer",
        nameAr: "عميل ألفا",
        balance: 100,
        email: "alpha@cust.com",
        phone: "123456",
        address: "Riyadh",
      };

      const custB: Customer = {
        id: "cust-beta-1",
        name: "Beta Customer",
        nameAr: "عميل بيتا",
        balance: 200,
        email: "beta@cust.com",
        phone: "654321",
        address: "Jeddah",
      };

      await custRepo.save(custA, tenantAContext);
      await custRepo.save(custB, tenantBContext);

      const custsA = await custRepo.getAll({ context: tenantAContext });
      const custCross = await custRepo.findById("cust-beta-1", tenantAContext);

      const suppA: Supplier = {
        id: "supp-alpha-1",
        name: "Alpha Supplier",
        nameAr: "مورد ألفا",
        balance: 300,
        email: "alpha@supp.com",
        phone: "123456",
        address: "Riyadh",
      };

      const suppB: Supplier = {
        id: "supp-beta-1",
        name: "Beta Supplier",
        nameAr: "مورد بيتا",
        balance: 400,
        email: "beta@supp.com",
        phone: "654321",
        address: "Jeddah",
      };

      await suppRepo.save(suppA, tenantAContext);
      await suppRepo.save(suppB, tenantBContext);

      const suppsA = await suppRepo.getAll({ context: tenantAContext });
      const suppCross = await suppRepo.findById("supp-beta-1", tenantAContext);

      const itemA: Item = {
        id: "item-alpha-1",
        sku: "SKU-A",
        name: "Alpha Laptop",
        nameAr: "حاسوب ألفا",
        category: ItemCategory.FinishedProduct,
        unit: "PCS",
        price: 3000,
        cost: 2000,
        barcode: "123456789",
        currentStock: 10,
      };

      const itemB: Item = {
        id: "item-beta-1",
        sku: "SKU-B",
        name: "Beta Monitor",
        nameAr: "شاشة بيتا",
        category: ItemCategory.FinishedProduct,
        unit: "PCS",
        price: 1000,
        cost: 700,
        barcode: "987654321",
        currentStock: 20,
      };

      await itemRepo.saveItem(itemA, tenantAContext);
      await itemRepo.saveItem(itemB, tenantBContext);

      const itemsA = await itemRepo.getAllItems({ context: tenantAContext });
      const itemCross = await itemRepo.getItemById("item-beta-1", tenantAContext);

      const isIsolated =
        custsA.length === 1 &&
        custCross === null &&
        suppsA.length === 1 &&
        suppCross === null &&
        itemsA.length === 1 &&
        itemCross === null;

      if (!isIsolated) {
        throw new Error("Entities tenant isolation failed for Customers, Suppliers, or Items!");
      }

      results.push({
        name: "Tenant Isolation - Customers, Suppliers, Inventory",
        passed: true,
        details: "Customers, Suppliers, and Items isolated strictly per tenantContext.",
      });
    } catch (err: any) {
      results.push({
        name: "Tenant Isolation - Customers, Suppliers, Inventory",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 4: Constraint Enforcement - Foreign Keys
    // --------------------------------------------------
    try {
      let fkErrorCaught = false;
      try {
        await pool.query(`
          INSERT INTO journal_entry_items (id, tenant_id, company_id, journal_entry_id, account_id, account_name, debit, credit)
          VALUES ('jei-invalid-fk', 'tenant-alpha', 'company-alpha', 'je-alpha-001', 'non-existent-acc-id', 'Ghost Account', 100, 0)
        `);
      } catch (err: any) {
        if (err.code === "23503") {
          fkErrorCaught = true;
        } else {
          throw err;
        }
      }

      if (!fkErrorCaught) {
        throw new Error("PostgreSQL failed to throw Foreign Key violation code 23503!");
      }

      results.push({
        name: "Constraint Enforcement - Foreign Key (23503)",
        passed: true,
        details: "PostgreSQL correctly threw foreign key constraint violation (code 23503) on invalid account_id.",
      });
    } catch (err: any) {
      results.push({
        name: "Constraint Enforcement - Foreign Key (23503)",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 5: Constraint Enforcement - Unique Constraints
    // --------------------------------------------------
    try {
      let uniqueErrorCaught = false;
      try {
        await pool.query(`
          INSERT INTO accounts (id, tenant_id, company_id, code, name, name_ar, type, is_active, balance)
          VALUES ('acc-dup-code', 'tenant-alpha', 'company-alpha', '1010', 'Duplicate Cash', 'نقد مكرر', 'ASSET', true, 0)
        `);
      } catch (err: any) {
        if (err.code === "23505") {
          uniqueErrorCaught = true;
        } else {
          throw err;
        }
      }

      if (!uniqueErrorCaught) {
        throw new Error("PostgreSQL failed to throw Unique violation code 23505 on duplicate account code!");
      }

      results.push({
        name: "Constraint Enforcement - Unique Constraint (23505)",
        passed: true,
        details: "PostgreSQL correctly threw unique constraint violation (code 23505) on duplicate (company_id, code).",
      });
    } catch (err: any) {
      results.push({
        name: "Constraint Enforcement - Unique Constraint (23505)",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 6: Constraint Enforcement - CHECK Constraints
    // --------------------------------------------------
    try {
      let checkErrorCaught = false;
      try {
        await pool.query(`
          INSERT INTO journal_entry_items (id, tenant_id, company_id, journal_entry_id, account_id, account_name, debit, credit)
          VALUES ('jei-neg-debit', 'tenant-alpha', 'company-alpha', 'je-alpha-001', 'acc-1010-alpha', 'Cash', -50.0000, 0)
        `);
      } catch (err: any) {
        if (err.code === "23514") {
          checkErrorCaught = true;
        } else {
          throw err;
        }
      }

      if (!checkErrorCaught) {
        throw new Error("PostgreSQL failed to throw CHECK constraint violation code 23514 on negative debit!");
      }

      results.push({
        name: "Constraint Enforcement - CHECK Constraint (23514)",
        passed: true,
        details: "PostgreSQL correctly threw CHECK constraint violation (code 23514) on negative debit value.",
      });
    } catch (err: any) {
      results.push({
        name: "Constraint Enforcement - CHECK Constraint (23514)",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 7: Immutability of Posted Journal Entries
    // --------------------------------------------------
    try {
      const postedEntry: JournalEntry = {
        id: "je-posted-001",
        date: "2026-01-02",
        reference: "POSTED-REF-01",
        notes: "Posted Sale Entry",
        posted: true,
        workflowStatus: "Posted",
        items: [
          { id: "p-item-1", accountId: "acc-1010-alpha", accountName: "Cash", debit: 1000, credit: 0 },
          { id: "p-item-2", accountId: "acc-5010-alpha", accountName: "Revenue", debit: 0, credit: 1000 },
        ],
      };

      await jeRepo.save(postedEntry, tenantAContext);

      // Attempt to modify debit amount of posted entry
      const modifiedEntry: JournalEntry = {
        ...postedEntry,
        items: [
          { id: "p-item-1", accountId: "acc-1010-alpha", accountName: "Cash", debit: 9999, credit: 0 },
          { id: "p-item-2", accountId: "acc-5010-alpha", accountName: "Revenue", debit: 0, credit: 9999 },
        ],
      };

      let immutabilityErrorCaught = false;
      try {
        await jeRepo.save(modifiedEntry, tenantAContext);
      } catch (err: any) {
        if (err instanceof AppError && err.statusCode === 409) {
          immutabilityErrorCaught = true;
        } else {
          throw err;
        }
      }

      if (!immutabilityErrorCaught) {
        throw new Error("Repository failed to prevent modification of posted journal entry!");
      }

      // Query PostgreSQL directly to verify DB state remained untouched
      const dbRes = await pool.query(
        "SELECT debit FROM journal_entry_items WHERE id = 'p-item-1' AND tenant_id = 'tenant-alpha'"
      );
      const actualDebit = parseFloat(dbRes.rows[0].debit);

      if (actualDebit !== 1000) {
        throw new Error(`DB state was modified despite error! Actual debit: ${actualDebit}`);
      }

      results.push({
        name: "Immutability of Posted Journal Entries",
        passed: true,
        details: "Repository blocked modification (HTTP 409 Conflict) and DB verified debit remained 1000.0000.",
      });
    } catch (err: any) {
      results.push({
        name: "Immutability of Posted Journal Entries",
        passed: false,
        error: err.message,
      });
    }

    // --------------------------------------------------
    // TEST 8: Atomicity of DrizzleJournalEntryRepository.save()
    // --------------------------------------------------
    try {
      const invalidAtomicEntry: JournalEntry = {
        id: "je-atomic-fail-001",
        date: "2026-01-03",
        reference: "ATOMIC-FAIL-REF",
        notes: "Should fail and rollback completely",
        posted: false,
        workflowStatus: "Draft",
        items: [
          { id: "atomic-i1", accountId: "acc-1010-alpha", accountName: "Cash", debit: 500, credit: 0 },
          { id: "atomic-i2", accountId: "non-existent-account-id", accountName: "Ghost", debit: 0, credit: 500 },
        ],
      };

      let saveFailed = false;
      try {
        await jeRepo.save(invalidAtomicEntry, tenantAContext);
      } catch (err: any) {
        saveFailed = true;
      }

      if (!saveFailed) {
        throw new Error("save() should have failed due to invalid FK on item 2!");
      }

      // Query PostgreSQL directly to verify transaction rollback
      const headerRes = await pool.query(
        "SELECT * FROM journal_entries WHERE id = 'je-atomic-fail-001'"
      );
      const itemsRes = await pool.query(
        "SELECT * FROM journal_entry_items WHERE journal_entry_id = 'je-atomic-fail-001'"
      );

      if (headerRes.rows.length > 0 || itemsRes.rows.length > 0) {
        throw new Error(`Atomicity broken! Header rows: ${headerRes.rows.length}, Item rows: ${itemsRes.rows.length}`);
      }

      results.push({
        name: "Atomicity of DrizzleJournalEntryRepository.save()",
        passed: true,
        details: "Local transaction rolled back cleanly. Direct SQL confirmed 0 rows in journal_entries and 0 in journal_entry_items.",
      });
    } catch (err: any) {
      results.push({
        name: "Atomicity of DrizzleJournalEntryRepository.save()",
        passed: false,
        error: err.message,
      });
    }
  } finally {
    await pool.end();
  }

  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPostgresIntegrationTests()
    .then((results) => {
      console.log("\n==================================================");
      console.log("POSTGRESQL REAL INTEGRATION CERTIFICATION SUMMARY");
      console.log("==================================================");

      let allPassed = true;
      for (const res of results) {
        const icon = res.passed ? "✅ [PASS]" : "❌ [FAIL]";
        console.log(`${icon} ${res.name}`);
        if (res.details) console.log(`   --> ${res.details}`);
        if (res.error) {
          console.log(`   --> ERROR: ${res.error}`);
          allPassed = false;
        }
      }

      console.log("\n==================================================");
      if (allPassed) {
        console.log("STATUS: ALL REAL POSTGRESQL INTEGRATION TESTS PASSED 100%");
        process.exit(0);
      } else {
        console.log("STATUS: INTEGRATION SUITE FAILED");
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Fatal test runner error:", err);
      process.exit(1);
    });
}
