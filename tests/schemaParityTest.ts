import { pool, ensureInitialized } from "../src/infrastructure/database/client/db";

async function runSchemaParityAudit() {
  process.env.DATABASE_PROVIDER = process.env.DATABASE_PROVIDER || "pglite";
  console.log("==========================================================================");
  console.log("   NOVARO ERP — SCHEMA & MIGRATION PARITY AUDIT TEST");
  console.log("==========================================================================");

  await ensureInitialized();

  const expectedTables = [
    "tenants",
    "companies",
    "branches",
    "users",
    "refresh_tokens",
    "audit_logs",
    "roles",
    "permissions",
    "role_permissions",
    "user_roles",
    "user_company_access",
    "accounts",
    "fiscal_years",
    "fiscal_periods",
    "journal_entries",
    "journal_entry_items",
    "customers",
    "suppliers",
    "items",
    "stock_batches",
    "cost_layers",
    "stock_movements",
    "sales_invoices",
    "sales_invoice_items",
    "purchase_orders",
    "purchase_order_items",
    "document_sequences",
    "warehouses",
    "sync_queue",
  ];

  let passed = 0;
  let failed = 0;

  for (const table of expectedTables) {
    try {
      const res = await pool.query(
        `SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = $1`,
        [table]
      );
      if (res.rows && res.rows.length > 0) {
        console.log(`✅ [PASS] Table '${table}' exists in database schema (${res.rows.length} columns)`);
        passed++;
      } else {
        console.error(`❌ [FAIL] Table '${table}' missing in database schema`);
        failed++;
      }
    } catch (err: any) {
      console.error(`❌ [FAIL] Table '${table}' query error:`, err.message);
      failed++;
    }
  }

  // Verify sync_queue constraints specifically
  try {
    const checkRes = await pool.query(
      `SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'sync_queue'`
    );
    const constraintNames = checkRes.rows.map((r: any) => r.constraint_name);
    console.log(`ℹ️ sync_queue constraints found: ${constraintNames.join(", ")}`);
    
    // Test constraint enforcement on sync_queue
    try {
      await pool.query(
        `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload, status)
         VALUES ('test-1', 'ten-1', 'comp-1', 'key-1', 'test', 'INVALID_OP', '{}', 'PENDING')`
      );
      console.error(`❌ [FAIL] sync_queue check constraint failed to reject invalid operation 'INVALID_OP'`);
      failed++;
    } catch (e: any) {
      console.log(`✅ [PASS] sync_queue check constraint correctly rejected invalid operation 'INVALID_OP'`);
      passed++;
    }

    try {
      await pool.query(
        `INSERT INTO sync_queue (id, tenant_id, company_id, idempotency_key, entity_type, operation, payload, status)
         VALUES ('test-2', 'ten-1', 'comp-1', 'key-2', 'test', 'CREATE', '{}', 'INVALID_STATUS')`
      );
      console.error(`❌ [FAIL] sync_queue check constraint failed to reject invalid status 'INVALID_STATUS'`);
      failed++;
    } catch (e: any) {
      console.log(`✅ [PASS] sync_queue check constraint correctly rejected invalid status 'INVALID_STATUS'`);
      passed++;
    }
  } catch (e: any) {
    console.warn("Constraint check warning:", e.message);
  }

  console.log("==========================================================================");
  console.log(`   SCHEMA PARITY AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==========================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runSchemaParityAudit().catch((err) => {
  console.error("Schema parity test error:", err);
  process.exit(1);
});
