import {
  AccountRepository,
  JournalEntryRepository,
  CustomerRepository,
  SupplierRepository,
  InventoryRepository,
  SalesRepository,
  PurchaseRepository,
  FiscalPeriodRepository,
  AuditRepository,
  DocumentSequenceRepository,
  TenantContext
} from "./RepositoryInterfaces";

export interface UnitOfWorkOptions extends TenantContext {
  isolationLevel?: "read uncommitted" | "read committed" | "repeatable read" | "serializable";
}

export interface UnitOfWork {
  readonly accounts: AccountRepository;
  readonly journalEntries: JournalEntryRepository;
  readonly customers: CustomerRepository;
  readonly suppliers: SupplierRepository;
  readonly inventory: InventoryRepository;
  readonly sales: SalesRepository;
  readonly purchases: PurchaseRepository;
  readonly fiscalPeriods: FiscalPeriodRepository;
  readonly audit: AuditRepository;
  readonly documentSequences: DocumentSequenceRepository;

  getContext(): TenantContext;
}

export interface UnitOfWorkFactory {
  run<T>(fn: (uow: UnitOfWork) => Promise<T>, options: UnitOfWorkOptions): Promise<T>;
}

