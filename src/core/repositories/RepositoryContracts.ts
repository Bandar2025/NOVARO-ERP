// NOVARO ERP Repository Interfaces: Decoupling Domain & Application from Storage
import { Account, JournalEntry, Customer, Supplier, Item, Batch, SalesInvoice, PurchaseOrder, AuditLog } from "../../types";
import { DomainStockMovement } from "../domain/inventory/StockMovement";
import { CostLayer } from "../domain/inventory/CostLayer";
import { FiscalPeriod } from "../domain/accounting/FiscalPeriod";

export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCode(code: string): Promise<Account | null>;
  getAll(): Promise<Account[]>;
  save(account: Account): Promise<void>;
  saveBatch(accounts: Account[]): Promise<void>;
}

export interface IJournalEntryRepository {
  findById(id: string): Promise<JournalEntry | null>;
  findByReference(reference: string): Promise<JournalEntry[]>;
  getAll(): Promise<JournalEntry[]>;
  getPostedEntries(): Promise<JournalEntry[]>;
  save(entry: JournalEntry): Promise<void>;
  update(id: string, entry: Partial<JournalEntry>): Promise<void>;
}

export interface ICustomerRepository {
  findById(id: string): Promise<Customer | null>;
  getAll(): Promise<Customer[]>;
  save(customer: Customer): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ISupplierRepository {
  findById(id: string): Promise<Supplier | null>;
  getAll(): Promise<Supplier[]>;
  save(supplier: Supplier): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface IInventoryRepository {
  getItemById(id: string): Promise<Item | null>;
  getAllItems(): Promise<Item[]>;
  saveItem(item: Item): Promise<void>;
  
  getBatches(): Promise<Batch[]>;
  getBatchesByItem(itemId: string): Promise<Batch[]>;
  saveBatch(batch: Batch): Promise<void>;
  saveBatches(batches: Batch[]): Promise<void>;
  
  getMovements(): Promise<DomainStockMovement[]>;
  saveMovement(movement: DomainStockMovement): Promise<void>;
  
  getCostLayers(): Promise<CostLayer[]>;
  saveCostLayers(layers: CostLayer[]): Promise<void>;
}

export interface ISalesRepository {
  findById(id: string): Promise<SalesInvoice | null>;
  getAll(): Promise<SalesInvoice[]>;
  save(invoice: SalesInvoice): Promise<void>;
}

export interface IPurchaseRepository {
  findById(id: string): Promise<PurchaseOrder | null>;
  getAll(): Promise<PurchaseOrder[]>;
  save(po: PurchaseOrder): Promise<void>;
}

export interface IFiscalPeriodRepository {
  getAll(): Promise<FiscalPeriod[]>;
  save(period: FiscalPeriod): Promise<void>;
}

export interface IAuditRepository {
  log(audit: AuditLog): Promise<void>;
  getAll(): Promise<AuditLog[]>;
}
