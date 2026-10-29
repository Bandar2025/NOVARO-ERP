import { Router, Request, Response, NextFunction } from "express";
import { pool, dbConfig, ensureInitialized } from "../../src/infrastructure/database/client/db";
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

      INSERT INTO tenants (id, name, code, is_active)
      VALUES ('tenant-novaro-prod', 'Novaro Holdings', 'NOVARO-PROD', true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO companies (id, tenant_id, name, legal_name, tax_number, currency, is_active)
      VALUES ('comp-novaro-prod', 'tenant-novaro-prod', 'Novaro Specialty Roastery', 'محمصة نوفارو المختصة', '310492039200003', 'SAR', true)
      ON CONFLICT (id) DO NOTHING;

      INSERT INTO branches (id, tenant_id, company_id, name, code, is_active)
      VALUES ('branch-riyadh-main', 'tenant-novaro-prod', 'comp-novaro-prod', 'Riyadh Flagship Branch', 'BR-RYD-01', true)
      ON CONFLICT (id) DO NOTHING;
    `);
    syncTableInitialized = true;
  } finally {
    client.release();
  }
}

// GET /api/v1/sync/status
router.get("/status", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureSyncTable();
    const versionRes = await pool.query("SELECT version() AS version");
    const tablesRes = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public'"
    );
    const snapRes = await pool.query(
      "SELECT id, accounts_count, journal_entries_count, items_count, batches_count, cost_layers_count, invoices_count, zatca_count, updated_at FROM erp_state_snapshots WHERE id = $1",
      ["PRIMARY_SNAPSHOT"]
    );

    const snap = snapRes.rows[0] || null;
    res.json({
      success: true,
      data: {
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

// POST /api/v1/sync/push
router.post("/push", async (req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureSyncTable();
    const payload = req.body || {};
    const nowIso = new Date().toISOString();

    const accounts = Array.isArray(payload.accounts) ? payload.accounts : [];
    const journalEntries = Array.isArray(payload.journalEntries) ? payload.journalEntries : [];
    const items = Array.isArray(payload.items) ? payload.items : [];
    const batches = Array.isArray(payload.batches) ? payload.batches : [];
    const costLayers = Array.isArray(payload.costLayers) ? payload.costLayers : [];
    const salesInvoices = Array.isArray(payload.salesInvoices) ? payload.salesInvoices : [];
    const purchaseOrders = Array.isArray(payload.purchaseOrders) ? payload.purchaseOrders : [];
    const customers = Array.isArray(payload.customers) ? payload.customers : [];
    const suppliers = Array.isArray(payload.suppliers) ? payload.suppliers : [];
    const warehouses = Array.isArray(payload.warehouses) ? payload.warehouses : [];
    const fiscalPeriods = Array.isArray(payload.fiscalPeriods) ? payload.fiscalPeriods : [];
    const zatcaRecords = Array.isArray(payload.zatcaRecords) ? payload.zatcaRecords : [];

    // 1. Persist snapshot into PGlite erp_state_snapshots table
    await pool.query(
      `INSERT INTO erp_state_snapshots (
        id, snapshot_json, accounts_count, journal_entries_count, items_count,
        batches_count, cost_layers_count, invoices_count, zatca_count, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        snapshot_json = EXCLUDED.snapshot_json,
        accounts_count = EXCLUDED.accounts_count,
        journal_entries_count = EXCLUDED.journal_entries_count,
        items_count = EXCLUDED.items_count,
        batches_count = EXCLUDED.batches_count,
        cost_layers_count = EXCLUDED.cost_layers_count,
        invoices_count = EXCLUDED.invoices_count,
        zatca_count = EXCLUDED.zatca_count,
        updated_at = EXCLUDED.updated_at`,
      [
        "PRIMARY_SNAPSHOT",
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

    // 2. Sync relational master records into PGlite tables (accounts, warehouses, customers, suppliers, items)
    for (const acc of accounts) {
      await pool.query(
        `INSERT INTO accounts (id, tenant_id, company_id, code, name, name_ar, type, is_postable, is_active, balance)
         VALUES ($1, 'tenant-novaro-prod', 'comp-novaro-prod', $2, $3, $4, $5, true, true, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_ar = EXCLUDED.name_ar,
           balance = EXCLUDED.balance`,
        [acc.id, acc.code, acc.name, acc.nameAr || acc.name, acc.type, String(acc.balance || 0)]
      );
    }

    for (const wh of warehouses) {
      await pool.query(
        `INSERT INTO warehouses (id, tenant_id, company_id, branch_id, name, name_ar, location, is_active)
         VALUES ($1, 'tenant-novaro-prod', 'comp-novaro-prod', 'branch-riyadh-main', $2, $3, $4, true)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_ar = EXCLUDED.name_ar,
           location = EXCLUDED.location`,
        [wh.id, wh.name, wh.nameAr || wh.name, wh.location || ""]
      );
    }

    for (const cust of customers) {
      await pool.query(
        `INSERT INTO customers (id, tenant_id, company_id, name, name_ar, email, phone, address, balance)
         VALUES ($1, 'tenant-novaro-prod', 'comp-novaro-prod', $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_ar = EXCLUDED.name_ar,
           balance = EXCLUDED.balance`,
        [cust.id, cust.name, cust.nameAr || cust.name, cust.email || "", cust.phone || "", cust.address || "", String(cust.balance || 0)]
      );
    }

    for (const sup of suppliers) {
      await pool.query(
        `INSERT INTO suppliers (id, tenant_id, company_id, name, name_ar, email, phone, address, balance)
         VALUES ($1, 'tenant-novaro-prod', 'comp-novaro-prod', $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           name_ar = EXCLUDED.name_ar,
           balance = EXCLUDED.balance`,
        [sup.id, sup.name, sup.nameAr || sup.name, sup.email || "", sup.phone || "", sup.address || "", String(sup.balance || 0)]
      );
    }

    for (const item of items) {
      await pool.query(
        `INSERT INTO items (id, tenant_id, company_id, sku, name, name_ar, category, unit, price, cost, barcode, current_stock)
         VALUES ($1, 'tenant-novaro-prod', 'comp-novaro-prod', $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           price = EXCLUDED.price,
           cost = EXCLUDED.cost,
           current_stock = EXCLUDED.current_stock`,
        [
          item.id,
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

    // 3. Synchronize in-memory server repositories so REST API endpoints (/api/v1/*) match UI state
    for (const acc of accounts) {
      await accountRepo.save(acc);
    }
    for (const je of journalEntries) {
      await journalEntryRepo.save(je);
    }
    for (const cust of customers) {
      await customerRepo.save(cust);
    }
    for (const sup of suppliers) {
      await supplierRepo.save(sup);
    }
    for (const inv of salesInvoices) {
      await salesRepo.save(inv);
    }
    for (const po of purchaseOrders) {
      await purchaseRepo.save(po);
    }
    for (const fp of fiscalPeriods) {
      await fiscalPeriodRepo.save(fp);
    }
    if (batches.length > 0) {
      await inventoryRepo.saveBatches(batches);
    }
    if (costLayers.length > 0) {
      await inventoryRepo.saveCostLayers(costLayers);
    }

    const tablesRes = await pool.query(
      "SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public'"
    );

    res.json({
      success: true,
      data: {
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
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/sync/pull
router.get("/pull", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    await ensureSyncTable();
    const snapRes = await pool.query(
      "SELECT snapshot_json, updated_at FROM erp_state_snapshots WHERE id = $1",
      ["PRIMARY_SNAPSHOT"]
    );
    const row = snapRes.rows[0];
    if (!row) {
      res.json({
        success: true,
        data: {
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
