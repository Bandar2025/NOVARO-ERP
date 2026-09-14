import { Account, JournalEntry, Customer, Supplier, Item, Batch, SalesInvoice, PurchaseOrder, AuditLog } from "../../../types";
import { DomainStockMovement } from "../../../core/domain/inventory/StockMovement";
import { CostLayer } from "../../../core/domain/inventory/CostLayer";
import { FiscalPeriod } from "../../../core/domain/accounting/FiscalPeriod";
import {
  AccountRepository,
  JournalEntryRepository,
  CustomerRepository,
  SupplierRepository,
  InventoryRepository,
  SalesRepository,
  PurchaseRepository,
  FiscalPeriodRepository,
  DocumentSequenceRepository,
  DocumentSequenceParams,
  AuditRepository,
  TenantContext,
  QueryOptions
} from "../../../core/application/repositories/RepositoryInterfaces";
import {
  initialAccounts,
  initialCustomers,
  initialSuppliers,
  initialJournalEntries,
  initialItems,
  initialBatches,
  initialSalesInvoices,
  initialPurchaseOrders,
  initialAuditLogs
} from "../../../data/novaroInitialData";
import { safeStorage } from "./safeStorage";

// 1. Account Repository
export class LocalAccountRepository implements AccountRepository {
  private key = "novaro_accounts";

  private load(): Account[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialAccounts));
      return initialAccounts;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialAccounts;
    }
  }

  private saveAll(accounts: Account[]): void {
    safeStorage.setItem(this.key, JSON.stringify(accounts));
  }

  async findById(id: string, _context?: TenantContext): Promise<Account | null> {
    const list = this.load();
    return list.find(a => a.id === id) || null;
  }

  async findByCode(code: string, _context?: TenantContext): Promise<Account | null> {
    const list = this.load();
    return list.find(a => a.code === code) || null;
  }

  async getAll(_options?: QueryOptions): Promise<Account[]> {
    return this.load();
  }

  async save(account: Account, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(a => a.id === account.id);
    if (idx >= 0) {
      list[idx] = account;
    } else {
      list.push(account);
    }
    this.saveAll(list);
  }

  async saveBatch(accounts: Account[], _context?: TenantContext): Promise<void> {
    const list = this.load();
    const map = new Map(list.map(a => [a.id, a]));
    accounts.forEach(a => map.set(a.id, a));
    this.saveAll(Array.from(map.values()));
  }

  async exists(id: string, _context?: TenantContext): Promise<boolean> {
    const list = this.load();
    return list.some(a => a.id === id);
  }
}

// 2. Journal Entry Repository
export class LocalJournalEntryRepository implements JournalEntryRepository {
  private key = "novaro_journal_entries";

  private load(): JournalEntry[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialJournalEntries));
      return initialJournalEntries;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialJournalEntries;
    }
  }

  private saveAll(entries: JournalEntry[]): void {
    safeStorage.setItem(this.key, JSON.stringify(entries));
  }

  async findById(id: string, _context?: TenantContext): Promise<JournalEntry | null> {
    const list = this.load();
    return list.find(e => e.id === id) || null;
  }

  async findByReference(reference: string, _context?: TenantContext): Promise<JournalEntry[]> {
    const list = this.load();
    return list.filter(e => e.reference === reference);
  }

  async getAll(_options?: QueryOptions): Promise<JournalEntry[]> {
    return this.load();
  }

  async getPostedEntries(_options?: QueryOptions): Promise<JournalEntry[]> {
    const list = this.load();
    return list.filter(e => e.workflowStatus === "Posted" || e.posted);
  }

  async save(entry: JournalEntry, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(e => e.id === entry.id);
    if (idx >= 0) {
      list[idx] = entry;
    } else {
      list.unshift(entry);
    }
    this.saveAll(list);
  }

  async update(id: string, partial: Partial<JournalEntry>, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(e => e.id === id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...partial };
      this.saveAll(list);
    }
  }

  async delete(id: string, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const filtered = list.filter(e => e.id !== id);
    this.saveAll(filtered);
  }

  async exists(id: string, _context?: TenantContext): Promise<boolean> {
    const list = this.load();
    return list.some(e => e.id === id);
  }
}

// 3. Customer Repository
export class LocalCustomerRepository implements CustomerRepository {
  private key = "novaro_customers";

  private load(): Customer[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialCustomers));
      return initialCustomers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialCustomers;
    }
  }

  private saveAll(customers: Customer[]): void {
    safeStorage.setItem(this.key, JSON.stringify(customers));
  }

  async findById(id: string, _context?: TenantContext): Promise<Customer | null> {
    const list = this.load();
    return list.find(c => c.id === id) || null;
  }

  async getAll(_options?: QueryOptions): Promise<Customer[]> {
    return this.load();
  }

  async save(customer: Customer, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(c => c.id === customer.id);
    if (idx >= 0) {
      list[idx] = customer;
    } else {
      list.push(customer);
    }
    this.saveAll(list);
  }

  async delete(id: string, _context?: TenantContext): Promise<void> {
    const list = this.load().filter(c => c.id !== id);
    this.saveAll(list);
  }

  async exists(id: string, _context?: TenantContext): Promise<boolean> {
    const list = this.load();
    return list.some(c => c.id === id);
  }
}

// 4. Supplier Repository
export class LocalSupplierRepository implements SupplierRepository {
  private key = "novaro_suppliers";

  private load(): Supplier[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialSuppliers));
      return initialSuppliers;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialSuppliers;
    }
  }

  private saveAll(suppliers: Supplier[]): void {
    safeStorage.setItem(this.key, JSON.stringify(suppliers));
  }

  async findById(id: string, _context?: TenantContext): Promise<Supplier | null> {
    const list = this.load();
    return list.find(s => s.id === id) || null;
  }

  async getAll(_options?: QueryOptions): Promise<Supplier[]> {
    return this.load();
  }

  async save(supplier: Supplier, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(s => s.id === supplier.id);
    if (idx >= 0) {
      list[idx] = supplier;
    } else {
      list.push(supplier);
    }
    this.saveAll(list);
  }

  async delete(id: string, _context?: TenantContext): Promise<void> {
    const list = this.load().filter(s => s.id !== id);
    this.saveAll(list);
  }

  async exists(id: string, _context?: TenantContext): Promise<boolean> {
    const list = this.load();
    return list.some(s => s.id === id);
  }
}

// 5. Inventory Repository
export class LocalInventoryRepository implements InventoryRepository {
  private itemsKey = "novaro_items";
  private batchesKey = "novaro_batches";
  private movementsKey = "novaro_stock_movements";
  private costLayersKey = "novaro_cost_layers";

  async getItemById(id: string, _context?: TenantContext): Promise<Item | null> {
    const items = await this.getAllItems();
    return items.find(i => i.id === id) || null;
  }

  async getItemByIdForUpdate(id: string, context?: TenantContext): Promise<Item | null> {
    return this.getItemById(id, context);
  }

  async getAllItems(_options?: QueryOptions): Promise<Item[]> {
    const raw = safeStorage.getItem(this.itemsKey);
    if (!raw) {
      safeStorage.setItem(this.itemsKey, JSON.stringify(initialItems));
      return initialItems;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialItems;
    }
  }

  async saveItem(item: Item, _context?: TenantContext): Promise<void> {
    const list = await this.getAllItems();
    const idx = list.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    safeStorage.setItem(this.itemsKey, JSON.stringify(list));
  }

  async getBatches(_options?: QueryOptions): Promise<Batch[]> {
    const raw = safeStorage.getItem(this.batchesKey);
    if (!raw) {
      safeStorage.setItem(this.batchesKey, JSON.stringify(initialBatches));
      return initialBatches;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialBatches;
    }
  }

  async getBatchesByItem(itemId: string, _context?: TenantContext): Promise<Batch[]> {
    const batches = await this.getBatches();
    return batches.filter(b => b.itemId === itemId);
  }

  async saveBatch(batch: Batch, _context?: TenantContext): Promise<void> {
    const list = await this.getBatches();
    const idx = list.findIndex(b => b.id === batch.id);
    if (idx >= 0) {
      list[idx] = batch;
    } else {
      list.push(batch);
    }
    safeStorage.setItem(this.batchesKey, JSON.stringify(list));
  }

  async saveBatches(batches: Batch[], _context?: TenantContext): Promise<void> {
    const list = await this.getBatches();
    const map = new Map(list.map(b => [b.id, b]));
    batches.forEach(b => map.set(b.id, b));
    safeStorage.setItem(this.batchesKey, JSON.stringify(Array.from(map.values())));
  }

  async getMovements(_options?: QueryOptions): Promise<DomainStockMovement[]> {
    const raw = safeStorage.getItem(this.movementsKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveMovement(movement: DomainStockMovement, _context?: TenantContext): Promise<void> {
    const list = await this.getMovements();
    list.unshift(movement);
    safeStorage.setItem(this.movementsKey, JSON.stringify(list));
  }

  async getCostLayers(_options?: QueryOptions): Promise<CostLayer[]> {
    const raw = safeStorage.getItem(this.costLayersKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async saveCostLayers(layers: CostLayer[], _context?: TenantContext): Promise<void> {
    safeStorage.setItem(this.costLayersKey, JSON.stringify(layers));
  }
}

// 6. Sales Repository
export class LocalSalesRepository implements SalesRepository {
  private key = "novaro_sales_invoices";

  private load(): SalesInvoice[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialSalesInvoices));
      return initialSalesInvoices;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialSalesInvoices;
    }
  }

  private saveAll(invoices: SalesInvoice[]): void {
    safeStorage.setItem(this.key, JSON.stringify(invoices));
  }

  async findById(id: string, _context?: TenantContext): Promise<SalesInvoice | null> {
    const list = this.load();
    return list.find(inv => inv.id === id) || null;
  }

  async getAll(_options?: QueryOptions): Promise<SalesInvoice[]> {
    return this.load();
  }

  async save(invoice: SalesInvoice, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(inv => inv.id === invoice.id);
    if (idx >= 0) {
      list[idx] = invoice;
    } else {
      list.unshift(invoice);
    }
    this.saveAll(list);
  }

  async exists(id: string, _context?: TenantContext): Promise<boolean> {
    const list = this.load();
    return list.some(inv => inv.id === id);
  }
}

// 7. Purchase Repository
export class LocalPurchaseRepository implements PurchaseRepository {
  private key = "novaro_purchase_orders";

  private load(): PurchaseOrder[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialPurchaseOrders));
      return initialPurchaseOrders;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialPurchaseOrders;
    }
  }

  private saveAll(pos: PurchaseOrder[]): void {
    safeStorage.setItem(this.key, JSON.stringify(pos));
  }

  async findById(id: string, _context?: TenantContext): Promise<PurchaseOrder | null> {
    const list = this.load();
    return list.find(po => po.id === id) || null;
  }

  async getAll(_options?: QueryOptions): Promise<PurchaseOrder[]> {
    return this.load();
  }

  async save(po: PurchaseOrder, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(p => p.id === po.id);
    if (idx >= 0) {
      list[idx] = po;
    } else {
      list.unshift(po);
    }
    this.saveAll(list);
  }

  async exists(id: string, _context?: TenantContext): Promise<boolean> {
    const list = this.load();
    return list.some(p => p.id === id);
  }
}

// 8. Fiscal Period Repository
export class LocalFiscalPeriodRepository implements FiscalPeriodRepository {
  private key = "novaro_fiscal_periods";

  private defaultPeriods: FiscalPeriod[] = [
    { id: "fp-2026-q1", name: "Q1-2026", startDate: "2026-01-01", endDate: "2026-03-31", status: "OPEN" },
    { id: "fp-2026-q2", name: "Q2-2026", startDate: "2026-04-01", endDate: "2026-06-30", status: "OPEN" },
    { id: "fp-2026-q3", name: "Q3-2026", startDate: "2026-07-01", endDate: "2026-09-30", status: "OPEN" },
    { id: "fp-2026-q4", name: "Q4-2026", startDate: "2026-10-01", endDate: "2026-12-31", status: "OPEN" }
  ];

  private load(): FiscalPeriod[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(this.defaultPeriods));
      return this.defaultPeriods;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return this.defaultPeriods;
    }
  }

  async getAll(_options?: QueryOptions): Promise<FiscalPeriod[]> {
    return this.load();
  }

  async getById(id: string, _context?: TenantContext): Promise<FiscalPeriod | null> {
    const list = this.load();
    return list.find(p => p.id === id) || null;
  }

  async getByIdForUpdate(id: string, context?: TenantContext): Promise<FiscalPeriod | null> {
    return this.getById(id, context);
  }

  async save(period: FiscalPeriod, _context?: TenantContext): Promise<void> {
    const list = this.load();
    const idx = list.findIndex(p => p.id === period.id);
    if (idx >= 0) {
      list[idx] = period;
    } else {
      list.push(period);
    }
    safeStorage.setItem(this.key, JSON.stringify(list));
  }
}

// 9. Document Sequence Repository
export class LocalDocumentSequenceRepository implements DocumentSequenceRepository {
  private key = "novaro_document_sequences";

  private load(): Record<string, number> {
    const raw = safeStorage.getItem(this.key);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  async getNextSequence(params: DocumentSequenceParams, context?: TenantContext): Promise<number> {
    const tenantId = context?.tenantId || "default-tenant";
    const companyId = context?.companyId || "default-company";
    const branchId = params.branchId || context?.branchId || "main-branch";
    const seqKey = `${tenantId}:${companyId}:${branchId}:${params.documentType}:${params.fiscalYearId}`;

    const seqs = this.load();
    const nextVal = (seqs[seqKey] || 0) + 1;
    seqs[seqKey] = nextVal;
    safeStorage.setItem(this.key, JSON.stringify(seqs));
    return nextVal;
  }

  formatDocumentNumber(documentType: string, sequenceNumber: number, fiscalYearStr: string = "2026"): string {
    const padded = sequenceNumber.toString().padStart(6, "0");
    return `${documentType}-${fiscalYearStr}-${padded}`;
  }
}

// 10. Audit Repository
export class LocalAuditRepository implements AuditRepository {
  private key = "novaro_audit_logs";

  private load(): AuditLog[] {
    const raw = safeStorage.getItem(this.key);
    if (!raw) {
      safeStorage.setItem(this.key, JSON.stringify(initialAuditLogs));
      return initialAuditLogs;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialAuditLogs;
    }
  }

  async log(audit: AuditLog, _context?: TenantContext): Promise<void> {
    const list = this.load();
    list.unshift(audit);
    safeStorage.setItem(this.key, JSON.stringify(list.slice(0, 1000))); // Cap at 1000 logs
  }

  async getAll(_options?: QueryOptions): Promise<AuditLog[]> {
    return this.load();
  }
}


