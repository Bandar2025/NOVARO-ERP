// NOVARO ERP Repository Interfaces: Decoupled Domain & Application from Storage
import { Account, JournalEntry, Customer, Supplier, Item, Batch, SalesInvoice, PurchaseOrder, AuditLog } from "../../../types";
import { DomainStockMovement } from "../../domain/inventory/StockMovement";
import { CostLayer } from "../../domain/inventory/CostLayer";
import { FiscalPeriod } from "../../domain/accounting/FiscalPeriod";
import { TenantContext, QueryOptions } from "./TenantContext";

export type { TenantContext, QueryOptions };

export interface AccountRepository {
  findById(id: string, context?: TenantContext): Promise<Account | null>;
  findByCode(code: string, context?: TenantContext): Promise<Account | null>;
  getAll(options?: QueryOptions): Promise<Account[]>;
  save(account: Account, context?: TenantContext): Promise<void>;
  saveBatch(accounts: Account[], context?: TenantContext): Promise<void>;
  exists(id: string, context?: TenantContext): Promise<boolean>;
}

export interface JournalEntryRepository {
  findById(id: string, context?: TenantContext): Promise<JournalEntry | null>;
  findByReference(reference: string, context?: TenantContext): Promise<JournalEntry[]>;
  getAll(options?: QueryOptions): Promise<JournalEntry[]>;
  getPostedEntries(options?: QueryOptions): Promise<JournalEntry[]>;
  save(entry: JournalEntry, context?: TenantContext): Promise<void>;
  update(id: string, entry: Partial<JournalEntry>, context?: TenantContext): Promise<void>;
  delete(id: string, context?: TenantContext): Promise<void>;
  exists(id: string, context?: TenantContext): Promise<boolean>;
}

export interface CustomerRepository {
  findById(id: string, context?: TenantContext): Promise<Customer | null>;
  getAll(options?: QueryOptions): Promise<Customer[]>;
  save(customer: Customer, context?: TenantContext): Promise<void>;
  delete(id: string, context?: TenantContext): Promise<void>;
  exists(id: string, context?: TenantContext): Promise<boolean>;
}

export interface SupplierRepository {
  findById(id: string, context?: TenantContext): Promise<Supplier | null>;
  getAll(options?: QueryOptions): Promise<Supplier[]>;
  save(supplier: Supplier, context?: TenantContext): Promise<void>;
  delete(id: string, context?: TenantContext): Promise<void>;
  exists(id: string, context?: TenantContext): Promise<boolean>;
}

export interface InventoryRepository {
  getItemById(id: string, context?: TenantContext): Promise<Item | null>;
  getItemByIdForUpdate(id: string, context?: TenantContext): Promise<Item | null>;
  getAllItems(options?: QueryOptions): Promise<Item[]>;
  saveItem(item: Item, context?: TenantContext): Promise<void>;
  
  getBatches(options?: QueryOptions): Promise<Batch[]>;
  getBatchesByItem(itemId: string, context?: TenantContext): Promise<Batch[]>;
  saveBatch(batch: Batch, context?: TenantContext): Promise<void>;
  saveBatches(batches: Batch[], context?: TenantContext): Promise<void>;
  
  getMovements(options?: QueryOptions): Promise<DomainStockMovement[]>;
  saveMovement(movement: DomainStockMovement, context?: TenantContext): Promise<void>;
  
  getCostLayers(options?: QueryOptions): Promise<CostLayer[]>;
  saveCostLayers(layers: CostLayer[], context?: TenantContext): Promise<void>;
}

export interface SalesRepository {
  findById(id: string, context?: TenantContext): Promise<SalesInvoice | null>;
  getAll(options?: QueryOptions): Promise<SalesInvoice[]>;
  save(invoice: SalesInvoice, context?: TenantContext): Promise<void>;
  exists(id: string, context?: TenantContext): Promise<boolean>;
}

export interface PurchaseRepository {
  findById(id: string, context?: TenantContext): Promise<PurchaseOrder | null>;
  getAll(options?: QueryOptions): Promise<PurchaseOrder[]>;
  save(po: PurchaseOrder, context?: TenantContext): Promise<void>;
  exists(id: string, context?: TenantContext): Promise<boolean>;
}

export interface FiscalPeriodRepository {
  getAll(options?: QueryOptions): Promise<FiscalPeriod[]>;
  getById(id: string, context?: TenantContext): Promise<FiscalPeriod | null>;
  getByIdForUpdate(id: string, context?: TenantContext): Promise<FiscalPeriod | null>;
  save(period: FiscalPeriod, context?: TenantContext): Promise<void>;
}

export interface DocumentSequenceParams {
  documentType: string;
  fiscalYearId: string;
  branchId?: string;
}

export interface DocumentSequenceRepository {
  getNextSequence(params: DocumentSequenceParams, context?: TenantContext): Promise<number>;
  formatDocumentNumber(documentType: string, sequenceNumber: number, fiscalYearStr?: string): string;
}

export interface AuditRepository {
  log(audit: AuditLog, context?: TenantContext): Promise<void>;
  getAll(options?: QueryOptions): Promise<AuditLog[]>;
}
