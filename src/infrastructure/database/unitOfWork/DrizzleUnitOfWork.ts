import { db, DbOrTx } from "../client/db";
import { UnitOfWork, UnitOfWorkFactory, UnitOfWorkOptions } from "../../../core/application/repositories/UnitOfWork";
import { TenantContext } from "../../../core/application/repositories/RepositoryInterfaces";
import { extractTenantContext } from "../repositories/contextUtils";
import { DrizzleAccountRepository } from "../repositories/DrizzleAccountRepository";
import { DrizzleJournalEntryRepository } from "../repositories/DrizzleJournalEntryRepository";
import { DrizzleCustomerRepository } from "../repositories/DrizzleCustomerRepository";
import { DrizzleSupplierRepository } from "../repositories/DrizzleSupplierRepository";
import { DrizzleInventoryRepository } from "../repositories/DrizzleInventoryRepository";
import { DrizzleSalesRepository } from "../repositories/DrizzleSalesRepository";
import { DrizzlePurchaseRepository } from "../repositories/DrizzlePurchaseRepository";
import { DrizzleFiscalPeriodRepository } from "../repositories/DrizzleFiscalPeriodRepository";
import { DrizzleAuditRepository } from "../repositories/DrizzleAuditRepository";
import { DrizzleDocumentSequenceRepository } from "../repositories/DrizzleDocumentSequenceRepository";

export class DrizzleUnitOfWork implements UnitOfWork {
  readonly accounts: DrizzleAccountRepository;
  readonly journalEntries: DrizzleJournalEntryRepository;
  readonly customers: DrizzleCustomerRepository;
  readonly suppliers: DrizzleSupplierRepository;
  readonly inventory: DrizzleInventoryRepository;
  readonly sales: DrizzleSalesRepository;
  readonly purchases: DrizzlePurchaseRepository;
  readonly fiscalPeriods: DrizzleFiscalPeriodRepository;
  readonly audit: DrizzleAuditRepository;
  readonly documentSequences: DrizzleDocumentSequenceRepository;

  constructor(
    private client: DbOrTx,
    private context: TenantContext
  ) {
    this.accounts = new DrizzleAccountRepository(this.client);
    this.journalEntries = new DrizzleJournalEntryRepository(this.client);
    this.customers = new DrizzleCustomerRepository(this.client);
    this.suppliers = new DrizzleSupplierRepository(this.client);
    this.inventory = new DrizzleInventoryRepository(this.client);
    this.sales = new DrizzleSalesRepository(this.client);
    this.purchases = new DrizzlePurchaseRepository(this.client);
    this.fiscalPeriods = new DrizzleFiscalPeriodRepository(this.client);
    this.audit = new DrizzleAuditRepository(this.client);
    this.documentSequences = new DrizzleDocumentSequenceRepository(this.client);
  }

  getContext(): TenantContext {
    return this.context;
  }
}

export class DrizzleUnitOfWorkFactory implements UnitOfWorkFactory {
  async run<T>(fn: (uow: UnitOfWork) => Promise<T>, options: UnitOfWorkOptions): Promise<T> {
    const context = extractTenantContext(options);
    const isolationLevel = options.isolationLevel;

    return await db.transaction(
      async (tx) => {
        const uow = new DrizzleUnitOfWork(tx, context);
        return await fn(uow);
      },
      isolationLevel ? { isolationLevel } : undefined
    );
  }
}
