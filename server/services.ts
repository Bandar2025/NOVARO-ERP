import {
  LocalAccountRepository,
  LocalJournalEntryRepository,
  LocalCustomerRepository,
  LocalSupplierRepository,
  LocalInventoryRepository,
  LocalSalesRepository,
  LocalPurchaseRepository,
  LocalFiscalPeriodRepository,
  LocalUnitOfWork
} from "../src/infrastructure/persistence/local";
import {
  JournalEntryApplicationService,
  AccountApplicationService,
  SalesApplicationService,
  PurchaseApplicationService,
  InventoryApplicationService,
  CustomerApplicationService,
  SupplierApplicationService
} from "../src/core/application/services";

// Single shared repositories for server routes
export const accountRepo = new LocalAccountRepository();
export const journalEntryRepo = new LocalJournalEntryRepository();
export const customerRepo = new LocalCustomerRepository();
export const supplierRepo = new LocalSupplierRepository();
export const inventoryRepo = new LocalInventoryRepository();
export const salesRepo = new LocalSalesRepository();
export const purchaseRepo = new LocalPurchaseRepository();
export const fiscalPeriodRepo = new LocalFiscalPeriodRepository();
export const unitOfWork = new LocalUnitOfWork();

// Shared application services
export const journalEntryService = new JournalEntryApplicationService(journalEntryRepo, fiscalPeriodRepo, accountRepo);
export const accountService = new AccountApplicationService(accountRepo, journalEntryRepo);
export const salesService = new SalesApplicationService(salesRepo, inventoryRepo, customerRepo, journalEntryRepo, fiscalPeriodRepo);
export const purchaseService = new PurchaseApplicationService(purchaseRepo, inventoryRepo, journalEntryRepo, fiscalPeriodRepo);
export const inventoryService = new InventoryApplicationService(inventoryRepo);
export const customerService = new CustomerApplicationService(customerRepo);
export const supplierService = new SupplierApplicationService(supplierRepo);
