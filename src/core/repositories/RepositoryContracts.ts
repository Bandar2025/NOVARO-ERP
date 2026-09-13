// NOVARO ERP Repository Interfaces: Decoupling Domain & Application from Storage
export * from "../application/repositories/RepositoryInterfaces";
export * from "../application/repositories/TenantContext";
export * from "../application/repositories/UnitOfWork";

// Aliases for any legacy code using I-prefixed names
import {
  AccountRepository as IAccountRepository,
  JournalEntryRepository as IJournalEntryRepository,
  CustomerRepository as ICustomerRepository,
  SupplierRepository as ISupplierRepository,
  InventoryRepository as IInventoryRepository,
  SalesRepository as ISalesRepository,
  PurchaseRepository as IPurchaseRepository,
  FiscalPeriodRepository as IFiscalPeriodRepository,
  AuditRepository as IAuditRepository
} from "../application/repositories/RepositoryInterfaces";

export type {
  IAccountRepository,
  IJournalEntryRepository,
  ICustomerRepository,
  ISupplierRepository,
  IInventoryRepository,
  ISalesRepository,
  IPurchaseRepository,
  IFiscalPeriodRepository,
  IAuditRepository
};

