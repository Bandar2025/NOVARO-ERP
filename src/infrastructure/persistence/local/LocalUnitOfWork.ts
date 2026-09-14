import { UnitOfWork, UnitOfWorkFactory, UnitOfWorkOptions } from "../../../core/application/repositories/UnitOfWork";
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
  DocumentSequenceRepository
} from "../../../core/application/repositories/RepositoryInterfaces";
import {
  LocalAccountRepository,
  LocalJournalEntryRepository,
  LocalCustomerRepository,
  LocalSupplierRepository,
  LocalInventoryRepository,
  LocalSalesRepository,
  LocalPurchaseRepository,
  LocalFiscalPeriodRepository,
  LocalAuditRepository,
  LocalDocumentSequenceRepository
} from "./LocalRepositories";
import { TenantContext } from "../../../core/application/repositories/TenantContext";
import { AppError } from "../../../core/application/errors/ApiError";
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
  public audit: AuditRepository;
  public documentSequences: DocumentSequenceRepository;

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
    "novaro_fiscal_periods",
    "novaro_audit_logs",
    "novaro_doc_sequences"
  ];

  constructor(private context: TenantContext = { tenantId: "default-tenant", companyId: "default-company" }) {
    this.accounts = new LocalAccountRepository();
    this.journalEntries = new LocalJournalEntryRepository();
    this.customers = new LocalCustomerRepository();
    this.suppliers = new LocalSupplierRepository();
    this.inventory = new LocalInventoryRepository();
    this.sales = new LocalSalesRepository();
    this.purchases = new LocalPurchaseRepository();
    this.fiscalPeriods = new LocalFiscalPeriodRepository();
    this.audit = new LocalAuditRepository();
    this.documentSequences = new LocalDocumentSequenceRepository();
  }

  getContext(): TenantContext {
    return this.context;
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

export class LocalUnitOfWorkFactory implements UnitOfWorkFactory {
  async run<T>(fn: (uow: UnitOfWork) => Promise<T>, options: UnitOfWorkOptions): Promise<T> {
    if (!options || !options.tenantId || !options.companyId) {
      throw AppError.missingTenantId();
    }
    const uow = new LocalUnitOfWork(options);
    await uow.begin();
    try {
      const result = await fn(uow);
      await uow.commit();
      return result;
    } catch (err) {
      await uow.rollback();
      throw err;
    }
  }
}

