import {
  AccountRepository,
  JournalEntryRepository,
  CustomerRepository,
  SupplierRepository,
  InventoryRepository,
  SalesRepository,
  PurchaseRepository,
  FiscalPeriodRepository
} from "./RepositoryInterfaces";

export interface UnitOfWork {
  accounts: AccountRepository;
  journalEntries: JournalEntryRepository;
  customers: CustomerRepository;
  suppliers: SupplierRepository;
  inventory: InventoryRepository;
  sales: SalesRepository;
  purchases: PurchaseRepository;
  fiscalPeriods: FiscalPeriodRepository;

  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}
