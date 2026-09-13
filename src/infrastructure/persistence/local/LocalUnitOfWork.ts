import { UnitOfWork } from "../../../core/application/repositories/UnitOfWork";
import {
  AccountRepository,
  JournalEntryRepository,
  CustomerRepository,
  SupplierRepository,
  InventoryRepository,
  SalesRepository,
  PurchaseRepository,
  FiscalPeriodRepository
} from "../../../core/application/repositories/RepositoryInterfaces";
import {
  LocalAccountRepository,
  LocalJournalEntryRepository,
  LocalCustomerRepository,
  LocalSupplierRepository,
  LocalInventoryRepository,
  LocalSalesRepository,
  LocalPurchaseRepository,
  LocalFiscalPeriodRepository
} from "./LocalRepositories";
import { safeStorage } from "./safeStorage";

export class LocalUnitOfWork implements UnitOfWork {
  public accounts: AccountRepository;
  public journalEntries: JournalEntryRepository;
  public customers: CustomerRepository;
  public suppliers: SupplierRepository;
  public inventory: InventoryRepository;
  public sales: SalesRepository;
  public purchases: PurchaseRepository;
  public fiscalPeriods: FiscalPeriodRepository;

  private snapshot: Map<string, string | null> = new Map();
  private inTransaction: boolean = false;

  private monitoredKeys = [
    "novaro_accounts",
    "novaro_journal_entries",
    "novaro_customers",
    "novaro_suppliers",
    "novaro_items",
    "novaro_batches",
    "novaro_stock_movements",
    "novaro_cost_layers",
    "novaro_sales_invoices",
    "novaro_purchase_orders",
    "novaro_fiscal_periods"
  ];

  constructor() {
    this.accounts = new LocalAccountRepository();
    this.journalEntries = new LocalJournalEntryRepository();
    this.customers = new LocalCustomerRepository();
    this.suppliers = new LocalSupplierRepository();
    this.inventory = new LocalInventoryRepository();
    this.sales = new LocalSalesRepository();
    this.purchases = new LocalPurchaseRepository();
    this.fiscalPeriods = new LocalFiscalPeriodRepository();
  }

  async begin(): Promise<void> {
    this.snapshot.clear();
    for (const key of this.monitoredKeys) {
      this.snapshot.set(key, safeStorage.getItem(key));
    }
    this.inTransaction = true;
  }

  async commit(): Promise<void> {
    if (!this.inTransaction) return;
    this.snapshot.clear();
    this.inTransaction = false;
  }

  async rollback(): Promise<void> {
    if (!this.inTransaction) return;
    for (const [key, val] of this.snapshot.entries()) {
      if (val === null) {
        safeStorage.removeItem(key);
      } else {
        safeStorage.setItem(key, val);
      }
    }
    this.snapshot.clear();
    this.inTransaction = false;
  }
}
