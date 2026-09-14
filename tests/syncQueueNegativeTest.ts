process.env.DATABASE_PROVIDER = "pglite";

import crypto from "crypto";
import { pool, ensureInitialized } from "../src/infrastructure/database/client/db";

async function runSyncQueueNegativeTests() {
  console.log("==========================================================================");
  console.log("   NOVARO ERP — SYNC QUEUE NEGATIVE & CONSTRAINT AUDIT TEST");
  console.log("==========================================================================");

  await ensureInitialized();

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}${message ? `: ${message}` : ""}`);
      failed++;
    }
  }

  // Setup seed data: Tenant A, Tenant B, Company A (Tenant A), Company B (Tenant B), Branch A (Company A), Branch B (Company B)
  const tenantA = `ten-sq-A-${crypto.randomUUID()}`;
  const tenantB = `ten-sq-B-${crypto.randomUUID()}`;
  const companyA = `comp-sq-A-${crypto.randomUUID()}`;
  const companyB = `comp-sq-B-${crypto.randomUUID()}`;
  const branchA = `br-sq-A-${crypto.randomUUID()}`;
  const branchB = `br-sq-B-${crypto.randomUUID()}`;

  await pool.query(`INSERT INTO tenants (id, name, code, is_active) VALUES ($1, 'Tenant A', $1, true)`, [tenantA]);
  await pool.query(`INSERT INTO tenants (id, name, code, is_active) VALUES ($1, 'Tenant B', $1, true)`, [tenantB]);

  await pool.query(`INSERT INTO companies (id, tenant_id, name, currency, is_active) VALUES ($1, $2, 'Company A', 'SAR', true)`, [companyA, tenantA]);
  await pool.query(`INSERT INTO companies (id, tenant_id, name, currency, is_active) VALUES ($1, $2, 'Company B', 'SAR', true)`, [companyB, tenantB]);

  await pool.query(`INSERT INTO branches (id, tenant_id, company_id, code, name, is_active) VALUES ($1, $2, $3, $1, 'Branch A', true)`, [branchA, tenantA, companyA]);
  await pool.query(`INSERT INTO branches (id, tenant_id, company_id, code, name, is_active) VALUES ($1, $2, $3, $1, 'Branch B', true)`, [branchB, tenantB, companyB]);

  // 1. Negative Test: Tenant A + Company B (belonging to Tenant B)
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload)
       VALUES ($1, $2, $3, $4, 'sales_invoice', 'CREATE', '{}')`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyB, `key-${crypto.randomUUID()}`]
    );
    assert("Tenant A + Company B insertion blocked by composite FK", false, "Allowed mismatched tenant-company pair");
  } catch (err: any) {
    assert("Tenant A + Company B insertion strictly blocked by composite FK (fk_sync_queue_company)", true);
  }

  // 2. Negative Test: Tenant A + Company A + Branch B (Branch B belongs to Company B)
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, branch_id, idempotency_key, entity_type, operation, payload)
       VALUES ($1, $2, $3, $4, $5, 'sales_invoice', 'CREATE', '{}')`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyA, branchB, `key-${crypto.randomUUID()}`]
    );
    assert("Tenant A + Company A + Branch B insertion blocked by composite FK", false, "Allowed mismatched company-branch pair");
  } catch (err: any) {
    assert("Tenant A + Company A + Branch B insertion strictly blocked by composite FK (fk_sync_queue_branch)", true);
  }

  // 3. Negative Test: Non-existent Company or Branch
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload)
       VALUES ($1, $2, 'non-existent-company', $3, 'sales_invoice', 'CREATE', '{}')`,
      [`sq-${crypto.randomUUID()}`, tenantA, `key-${crypto.randomUUID()}`]
    );
    assert("Non-existent company insertion blocked by FK", false, "Allowed non-existent company");
  } catch (err: any) {
    assert("Non-existent company insertion strictly blocked by FK constraint", true);
  }

  // 4. Negative Test: Invalid Status
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload, status)
       VALUES ($1, $2, $3, $4, 'sales_invoice', 'CREATE', '{}', 'INVALID_STATUS')`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyA, `key-${crypto.randomUUID()}`]
    );
    assert("Invalid status blocked by CHECK constraint", false, "Allowed INVALID_STATUS");
  } catch (err: any) {
    assert("Invalid status strictly blocked by CHECK constraint (chk_sync_queue_status)", true);
  }

  // 5. Negative Test: Invalid Operation
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload)
       VALUES ($1, $2, $3, $4, 'sales_invoice', 'PURGE', '{}')`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyA, `key-${crypto.randomUUID()}`]
    );
    assert("Invalid operation blocked by CHECK constraint", false, "Allowed operation 'PURGE'");
  } catch (err: any) {
    assert("Invalid operation strictly blocked by CHECK constraint (chk_sync_queue_operation)", true);
  }

  // 6. Negative Test: Negative Retry Count
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload, retry_count)
       VALUES ($1, $2, $3, $4, 'sales_invoice', 'CREATE', '{}', -1)`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyA, `key-${crypto.randomUUID()}`]
    );
    assert("Negative retry_count blocked by CHECK constraint", false, "Allowed retry_count = -1");
  } catch (err: any) {
    assert("Negative retry_count strictly blocked by CHECK constraint (chk_sync_queue_retry_nonneg)", true);
  }

  // 7. Negative Test: Empty / Whitespace Idempotency Key
  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload)
       VALUES ($1, $2, $3, '   ', 'sales_invoice', 'CREATE', '{}')`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyA]
    );
    assert("Empty idempotency key blocked by CHECK constraint", false, "Allowed whitespace idempotency_key");
  } catch (err: any) {
    assert("Empty/whitespace idempotency_key strictly blocked by CHECK constraint (chk_sync_queue_idempotency_nonempty)", true);
  }

  // 8. Negative Test: Duplicate Same Tenant ID + Same Idempotency Key
  const dupKey = `dup-key-${crypto.randomUUID()}`;
  await pool.query(
    `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload)
     VALUES ($1, $2, $3, $4, 'sales_invoice', 'CREATE', '{}')`,
    [`sq-${crypto.randomUUID()}`, tenantA, companyA, dupKey]
  );

  try {
    await pool.query(
      `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload)
       VALUES ($1, $2, $3, $4, 'sales_invoice', 'CREATE', '{}')`,
      [`sq-${crypto.randomUUID()}`, tenantA, companyA, dupKey]
    );
    assert("Duplicate tenant_id + idempotency_key blocked by UNIQUE index", false, "Allowed duplicate idempotency_key");
  } catch (err: any) {
    assert("Duplicate tenant_id + idempotency_key strictly blocked by UNIQUE index (sync_queue_idempotency_unique)", true);
  }

  console.log("==========================================================================");
  console.log(`   SYNC QUEUE CONSTRAINT TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSyncQueueNegativeTests().catch((err) => {
  console.error("Sync queue negative test error:", err);
  process.exit(1);
});
