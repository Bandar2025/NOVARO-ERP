import { Router, Response, NextFunction } from "express";
import { pool, dbConfig, ensureInitialized } from "../../src/infrastructure/database/client/db";
import { authenticateToken, AuthRequest, getAuthTenantContext } from "../middleware/authMiddleware";
import {
  accountRepo,
  journalEntryRepo,
  customerRepo,
  supplierRepo,
  inventoryRepo,
  salesRepo,
  purchaseRepo,
  fiscalPeriodRepo
} from "../services";
import crypto from "crypto";

const router = Router();

let syncTableInitialized = false;

async function ensureSyncTable() {
  await ensureInitialized();
  if (syncTableInitialized) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS erp_state_snapshots (
        id TEXT PRIMARY KEY,
        tenant_id TEXT NOT NULL,
        company_id TEXT NOT NULL,
        snapshot_json TEXT NOT NULL,
        accounts_count INT NOT NULL DEFAULT 0,
        journal_entries_count INT NOT NULL DEFAULT 0,
        items_count INT NOT NULL DEFAULT 0,
        batches_count INT NOT NULL DEFAULT 0,
        cost_layers_count INT NOT NULL DEFAULT 0,
        invoices_count INT NOT NULL DEFAULT 0,
        zatca_count INT NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );
      ALTER TABLE erp_state_snapshots ADD COLUMN IF NOT EXISTS tenant_id TEXT NOT NULL DEFAULT 'tenant-novaro-prod';
      ALTER TABLE erp_state_snapshots ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT 'comp-novaro-prod';
    `);
    syncTableInitialized = true;
  } finally {
    client.release();
  }
}

function getScopedSnapshotId(tenantId: string, companyId: string): string {
  return `${tenantId}:${companyId}:PRIMARY_SNAPSHOT`;
}

function toTenantScopedRecordId(tenantId: string, rawId: string): string {
  if (!rawId || typeof rawId !== "string") {
    throw new Error("VALIDATION_ERROR: Every synced entity must have a valid string 'id'.");
  }
  return rawId.startsWith(`${tenantId}:`) ? rawId : `${tenantId}:${rawId}`;
}

function validateSyncEntities(list: any[], entityName: string) {
  if (!Array.isArray(list)) {
    throw new Error(`VALIDATION_ERROR: Expected '${entityName}' to be an array.`);
  }
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!item || typeof item !== "object" || !item.id || typeof item.id !== "string") {
      throw new Error(`VALIDATION_ERROR: Invalid record in '${entityName}' at index ${i} (missing valid 'id').`);
    }
  }
}

// GET /api/v1/sync/status (Protected by JWT + Tenant Isolation)
router.get("/status", authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ensureSyncTable();
    const { tenantId, companyId } = getAuthTenantContext(req);
    const snapshotId = getScopedSnapshotId(tenantId, companyId);

    const versionRes = await pool.query("SELECT version() AS version");
    const tablesRes = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const snapRes = await pool.query(
      `SELECT id, tenant_id, company_id, accounts_count, journal_entries_count, items_count,
              batches_count, cost_layers_count, invoices_count, zatca_count, updated_at
       FROM erp_state_snapshots
       WHERE id = $1 AND tenant_id = $2 AND company_id = $3`,
      [snapshotId, tenantId, companyId]
    );

    const snap = snapRes.rows[0] || null;
    res.json({
      success: true,
      data: {
        tenantId,
        companyId,
        provider: dbConfig.provider,
        engineVersion: versionRes.rows[0]?.version || "PGlite PostgreSQL Engine",
        tableCount: Number(tablesRes.rows[0]?.cnt || 31),
        hasSnapshot: Boolean(snap),
        lastSyncAt: snap?.updated_at || null,
        counts: snap
          ? {
              accounts: Number(snap.accounts_count || 0),
              journalEntries: Number(snap.journal_entries_count || 0),
              items: Number(snap.items_count || 0),
              batches: Number(snap.batches_count || 0),
              costLayers: Number(snap.cost_layers_count || 0),
              salesInvoices: Number(snap.invoices_count || 0),
              zatcaRecords: Number(snap.zatca_count || 0)
            }
          : null
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/sync/push (Protected by JWT + Tenant Isolation + Atomic SQL Transaction + Idempotency)
router.post("/push", authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ensureSyncTable();
    const { tenantId, companyId, branchId } = getAuthTenantContext(req);
    const effectiveBranchId = branchId || `${tenantId}:branch-main`;
    const snapshotId = getScopedSnapshotId(tenantId, companyId);

    const payload = req.body;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      res.status(400).json({
        success: false,
        error: { code: "INVALID_SYNC_PAYLOAD", message: "Sync payload must be a valid JSON object.", statusCode: 400 }
      });
      return;
    }

    const idempotencyKey =
      (req.headers["idempotency-key"] as string) ||
      (typeof payload.idempotencyKey === "string" ? payload.idempotencyKey : undefined);

    const accounts = payload.accounts !== undefined ? payload.accounts : [];
    const journalEntries = payload.journalEntries !== undefined ? payload.journalEntries : [];
    const items = payload.items !== undefined ? payload.items : [];
    const batches = payload.batches !== undefined ? payload.batches : [];
    const costLayers = payload.costLayers !== undefined ? payload.costLayers : [];
    const salesInvoices = payload.salesInvoices !== undefined ? payload.salesInvoices : [];
    const purchaseOrders = payload.purchaseOrders !== undefined ? payload.purchaseOrders : [];
    const customers = payload.customers !== undefined ? payload.customers : [];
    const suppliers = payload.suppliers !== undefined ? payload.suppliers : [];
    const warehouses = payload.warehouses !== undefined ? payload.warehouses : [];
    const fiscalPeriods = payload.fiscalPeriods !== undefined ? payload.fiscalPeriods : [];
    const zatcaRecords = payload.zatcaRecords !== undefined ? payload.zatcaRecords : [];

    // Strict input schema validation before opening transaction
    try {
      validateSyncEntities(accounts, "accounts");
      validateSyncEntities(journalEntries, "journalEntries");
      validateSyncEntities(items, "items");
      validateSyncEntities(batches, "batches");
      validateSyncEntities(costLayers, "costLayers");
      validateSyncEntities(salesInvoices, "salesInvoices");
      validateSyncEntities(purchaseOrders, "purchaseOrders");
      validateSyncEntities(customers, "customers");
      validateSyncEntities(suppliers, "suppliers");
      validateSyncEntities(warehouses, "warehouses");
      validateSyncEntities(fiscalPeriods, "fiscalPeriods");
      validateSyncEntities(zatcaRecords, "zatcaRecords");
    } catch (validationErr: any) {
      res.status(400).json({
        success: false,
        error: { code: "SYNC_VALIDATION_FAILED", message: validationErr.message, statusCode: 400 }
      });
      return;
    }

    const nowIso = new Date().toISOString();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // 0. Check idempotency key inside transaction
      if (idempotencyKey) {
        const existingSync = await client.query(
          `SELECT id, status, payload FROM sync_queue WHERE tenant_id = $1 AND idempotency_key = $2`,
          [tenantId, idempotencyKey]
        );
        if (existingSync.rows.length > 0 && existingSync.rows[0].status === "SYNCED") {
          await client.query("COMMIT");
          const cachedResult = JSON.parse(existingSync.rows[0].payload);
          res.json({
            ...cachedResult,
            idempotentReplay: true
          });
          return;
        }
      }

      // Ensure tenant, company, and branch exist in relational tables for FK integrity
      await client.query(
        `INSERT INTO tenants (id, name, code, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (id) DO NOTHING`,
        [tenantId, payload.companySettings?.name || "Novaro Organization", tenantId.toUpperCase().slice(0, 16)]
      );

      await client.query(
        `INSERT INTO companies (id, tenant_id, name, legal_name, tax_number, currency, is_active)
         VALUES ($1, $2, $3, $4, $5, 'SAR', true)
         ON CONFLICT (id) DO NOTHING`,
        [
          companyId,
          tenantId,
          payload.companySettings?.name || "Novaro Specialty Roastery",
          payload.companySettings?.nameAr || "محمصة نوفارو المختصة",
          payload.companySettings?.taxNumber || "310492039200003"
        ]
      );

      await client.query(
        `INSERT INTO branches (id, tenant_id, company_id, name, code, is_active)
         VALUES ($1, $2, $3, 'Main Branch', 'BR-01', true)
         ON CONFLICT (id) DO NOTHING`,
        [effectiveBranchId, tenantId, companyId]
      );

      // 1. Persist tenant-scoped snapshot into erp_state_snapshots table
      await client.query(
        `INSERT INTO erp_state_snapshots (
          id, tenant_id, company_id, snapshot_json, accounts_count, journal_entries_count, items_count,
          batches_count, cost_layers_count, invoices_count, zatca_count, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          snapshot_json = EXCLUDED.snapshot_json,
          accounts_count = EXCLUDED.accounts_count,
          journal_entries_count = EXCLUDED.journal_entries_count,
          items_count = EXCLUDED.items_count,
          batches_count = EXCLUDED.batches_count,
          cost_layers_count = EXCLUDED.cost_layers_count,
          invoices_count = EXCLUDED.invoices_count,
          zatca_count = EXCLUDED.zatca_count,
          updated_at = EXCLUDED.updated_at
        WHERE erp_state_snapshots.tenant_id = EXCLUDED.tenant_id
          AND erp_state_snapshots.company_id = EXCLUDED.company_id`,
        [
          snapshotId,
          tenantId,
          companyId,
          JSON.stringify(payload),
          accounts.length,
          journalEntries.length,
          items.length,
          batches.length,
          costLayers.length,
          salesInvoices.length,
          zatcaRecords.length,
          nowIso
        ]
      );

      // 2. Sync relational master records into tenant-scoped rows
      for (const acc of accounts) {
        if (!acc.code || !acc.name || !acc.type) {
          throw new Error(`ATOMIC_SYNC_ERROR: Account '${acc.id}' is missing required fields (code, name, or type).`);
        }
        const scopedAccId = toTenantScopedRecordId(tenantId, acc.id);
        await client.query(
          `INSERT INTO accounts (id, tenant_id, company_id, code, name, name_ar, type, is_active, balance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             name_ar = EXCLUDED.name_ar,
             balance = EXCLUDED.balance
           WHERE accounts.tenant_id = EXCLUDED.tenant_id`,
          [scopedAccId, tenantId, companyId, acc.code, acc.name, acc.nameAr || acc.name, acc.type, String(acc.balance || 0)]
        );
      }

      for (const wh of warehouses) {
        const scopedWhId = toTenantScopedRecordId(tenantId, wh.id);
        await client.query(
          `INSERT INTO warehouses (id, tenant_id, company_id, branch_id, name, name_ar, location, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             name_ar = EXCLUDED.name_ar,
             location = EXCLUDED.location
           WHERE warehouses.tenant_id = EXCLUDED.tenant_id`,
          [scopedWhId, tenantId, companyId, effectiveBranchId, wh.name, wh.nameAr || wh.name, wh.location || ""]
        );
      }

      for (const cust of customers) {
        const scopedCustId = toTenantScopedRecordId(tenantId, cust.id);
        await client.query(
          `INSERT INTO customers (id, tenant_id, company_id, name, name_ar, email, phone, address, balance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             name_ar = EXCLUDED.name_ar,
             balance = EXCLUDED.balance
           WHERE customers.tenant_id = EXCLUDED.tenant_id`,
          [scopedCustId, tenantId, companyId, cust.name, cust.nameAr || cust.name, cust.email || "", cust.phone || "", cust.address || "", String(cust.balance || 0)]
        );
      }

      for (const sup of suppliers) {
        const scopedSupId = toTenantScopedRecordId(tenantId, sup.id);
        await client.query(
          `INSERT INTO suppliers (id, tenant_id, company_id, name, name_ar, email, phone, address, balance)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO UPDATE SET
             name = EXCLUDED.name,
             name_ar = EXCLUDED.name_ar,
             balance = EXCLUDED.balance
           WHERE suppliers.tenant_id = EXCLUDED.tenant_id`,
          [scopedSupId, tenantId, companyId, sup.name, sup.nameAr || sup.name, sup.email || "", sup.phone || "", sup.address || "", String(sup.balance || 0)]
        );
      }

      for (const item of items) {
        const scopedItemId = toTenantScopedRecordId(tenantId, item.id);
        await client.query(
          `INSERT INTO items (id, tenant_id, company_id, sku, name, name_ar, category, unit, price, cost, barcode, current_stock)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (id) DO UPDATE SET
             price = EXCLUDED.price,
             cost = EXCLUDED.cost,
             current_stock = EXCLUDED.current_stock
           WHERE items.tenant_id = EXCLUDED.tenant_id`,
          [
            scopedItemId,
            tenantId,
            companyId,
            item.sku || item.id,
            item.name,
            item.nameAr || item.name,
            item.category || "FinishedProduct",
            item.unit || "kg",
            String(item.price || 0),
            String(item.cost || 0),
            item.barcode || "",
            String(item.currentStock || 0)
          ]
        );
      }

      // Support deterministic mid-transaction failure injection for atomic rollback verification
      if (payload.simulateAtomicFailure === true) {
        throw new Error("SIMULATED_MID_SYNC_FAILURE: Transaction must roll back all preceding writes.");
      }

      const tablesRes = await client.query(
        "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public'"
      );

      const responsePayload = {
        success: true,
        data: {
          tenantId,
          companyId,
          branchId: effectiveBranchId,
          syncedAt: nowIso,
          provider: dbConfig.provider,
          tableCount: Number(tablesRes.rows[0]?.cnt || 31),
          counts: {
            accounts: accounts.length,
            journalEntries: journalEntries.length,
            items: items.length,
            batches: batches.length,
            costLayers: costLayers.length,
            salesInvoices: salesInvoices.length,
            zatcaRecords: zatcaRecords.length
          }
        }
      };

      if (idempotencyKey) {
        await client.query(
          `INSERT INTO sync_queue (
             id, tenant_id, company_id, branch_id, idempotency_key, entity_type,
             operation, payload, status, processed_at
           ) VALUES ($1, $2, $3, $4, $5, 'ERP_SNAPSHOT', 'UPDATE', $6, 'SYNCED', CURRENT_TIMESTAMP)
           ON CONFLICT (tenant_id, idempotency_key) DO UPDATE SET
             status = 'SYNCED',
             payload = EXCLUDED.payload,
             processed_at = CURRENT_TIMESTAMP`,
          [
            `sq-${crypto.randomUUID()}`,
            tenantId,
            companyId,
            effectiveBranchId,
            idempotencyKey,
            JSON.stringify(responsePayload)
          ]
        );
      }

      await client.query("COMMIT");

      // 3. Synchronize in-memory server repositories after DB transaction commits
      for (const acc of accounts) await accountRepo.save(acc);
      for (const je of journalEntries) await journalEntryRepo.save(je);
      for (const cust of customers) await customerRepo.save(cust);
      for (const sup of suppliers) await supplierRepo.save(sup);
      for (const inv of salesInvoices) await salesRepo.save(inv);
      for (const po of purchaseOrders) await purchaseRepo.save(po);
      for (const fp of fiscalPeriods) await fiscalPeriodRepo.save(fp);
      if (batches.length > 0) await inventoryRepo.saveBatches(batches);
      if (costLayers.length > 0) await inventoryRepo.saveCostLayers(costLayers);

      res.json(responsePayload);
    } catch (txErr: any) {
      await client.query("ROLLBACK");
      res.status(400).json({
        success: false,
        error: {
          code: "SYNC_TRANSACTION_ROLLED_BACK",
          message: txErr.message || "Sync transaction failed and was rolled back atomically.",
          statusCode: 400
        }
      });
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sync/pull (Protected by JWT + Tenant Isolation)
router.get("/pull", authenticateToken, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await ensureSyncTable();
    const { tenantId, companyId } = getAuthTenantContext(req);
    const snapshotId = getScopedSnapshotId(tenantId, companyId);

    const snapRes = await pool.query(
      `SELECT snapshot_json, updated_at
       FROM erp_state_snapshots
       WHERE id = $1 AND tenant_id = $2 AND company_id = $3`,
      [snapshotId, tenantId, companyId]
    );
    const row = snapRes.rows[0];
    if (!row) {
      res.json({
        success: true,
        data: {
          tenantId,
          companyId,
          hasSnapshot: false,
          syncedAt: null,
          snapshot: null
        }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        tenantId,
        companyId,
        hasSnapshot: true,
        syncedAt: row.updated_at,
        snapshot: JSON.parse(row.snapshot_json)
      }
    });
  } catch (err) {
    next(err);
  }
});

export default router;
