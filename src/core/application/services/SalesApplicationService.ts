import { SalesInvoice, Currency } from "../../../types";
import { CreateSaleDTO } from "../dtos";
import {
  SalesRepository,
  InventoryRepository,
  CustomerRepository,
  JournalEntryRepository,
  FiscalPeriodRepository
} from "../repositories/RepositoryInterfaces";
import { UnitOfWorkFactory } from "../repositories/UnitOfWork";
import { CommerceService, SalesInvoiceExecutionDTO } from "../commerce/CommerceService";
import { defaultPostingAccountConfiguration } from "../../domain/accounting/PostingAccountConfiguration";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class SalesApplicationService {
  constructor(
    private salesRepo: SalesRepository,
    private inventoryRepo: InventoryRepository,
    private customerRepo: CustomerRepository,
    private journalEntryRepo: JournalEntryRepository,
    private fiscalPeriodRepo: FiscalPeriodRepository,
    private uowFactory?: UnitOfWorkFactory
  ) {}

  async getAll(options?: QueryOptions): Promise<SalesInvoice[]> {
    return this.salesRepo.getAll(options);
  }

  async getById(id: string, context?: TenantContext): Promise<SalesInvoice> {
    const invoice = await this.salesRepo.findById(id, context);
    if (!invoice) {
      throw AppError.notFound("Sales invoice", id);
    }
    return invoice;
  }

  async createSale(dto: CreateSaleDTO, context?: TenantContext): Promise<SalesInvoice> {
    if (!dto.items || dto.items.length === 0) {
      throw AppError.validation("Sales invoice must contain at least one item line.");
    }

    if (this.uowFactory && context) {
      return await this.uowFactory.run(async (uow) => {
        const fiscalYearId = (dto.date || new Date().toISOString().split("T")[0]).substring(0, 4);
        const seq = await uow.documentSequences.getNextSequence({ documentType: "INV", fiscalYearId }, context);
        const invoiceId = uow.documentSequences.formatDocumentNumber("INV", seq, fiscalYearId);

        const subtotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
        const taxTotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (it.taxRate ?? 0.15)), 0);
        const total = subtotal + taxTotal;

        const newInvoice: SalesInvoice = {
          id: invoiceId,
          customerId: dto.customerId,
          customerName: dto.customerName,
          date: dto.date || new Date().toISOString().split("T")[0],
          status: dto.paymentMethod === "Cash" ? "Paid" : "Unpaid",
          workflowStatus: "Posted",
          type: "Wholesale",
          totalAmount: total,
          subtotal,
          taxAmount: taxTotal,
          currency: dto.currency || Currency.SAR,
          exchangeRate: dto.exchangeRate || 1,
          items: dto.items.map((it) => ({
            itemId: it.itemId,
            itemName: it.itemName,
            quantity: it.quantity,
            price: it.unitPrice,
            total: it.quantity * it.unitPrice * (1 + (it.taxRate ?? 0.15))
          }))
        };

        // 1. Lock items, batches, cost layers, and fiscal periods for update to prevent concurrent stock race conditions
        for (const item of dto.items) {
          await uow.inventory.getItemByIdForUpdate(item.itemId, context);
        }

        const batches = await uow.inventory.getBatches({ context, forUpdate: true });
        const costLayers = await uow.inventory.getCostLayers({ context, forUpdate: true });
        const movements = await uow.inventory.getMovements({ context });

        const journalEntries = await uow.journalEntries.getAll({ context });
        const customers = await uow.customers.getAll({ context });
        const fiscalPeriods = await uow.fiscalPeriods.getAll({ context, forUpdate: true });


        const executionDTO: SalesInvoiceExecutionDTO = {
          invoice: newInvoice,
          type: "Wholesale",
          isPaid: dto.paymentMethod === "Cash",
          actor: "API System"
        };

        const result = CommerceService.processSalesInvoice({
          dto: executionDTO,
          config: defaultPostingAccountConfiguration,
          batches,
          costLayers,
          stockMovements: movements,
          journalEntries,
          customers,
          customerMovements: [],
          fiscalPeriods,
          getAccountName: (id: string) => id
        });

        if (!result.success) {
          throw AppError.validation(result.errors.join("; ") || "Failed to process sales invoice.");
        }

        if (result.data) {
          await uow.sales.save(result.data.invoice, context);
          await uow.inventory.saveBatches(result.data.batches, context);
          await uow.inventory.saveCostLayers(result.data.costLayers, context);
          for (const m of result.data.stockMovements) {
            await uow.inventory.saveMovement(m, context);
          }
          for (const je of result.data.journalEntries) {
            await uow.journalEntries.save(je, context);
          }
          for (const item of newInvoice.items) {
            const dbItem = await uow.inventory.getItemById(item.itemId, context);
            if (dbItem) {
              dbItem.currentStock = Number(((dbItem.currentStock || 0) - item.quantity).toFixed(4));
              await uow.inventory.saveItem(dbItem, context);
            }
          }
          if (newInvoice.customerId && dto.paymentMethod !== "Cash") {
            const customer = await uow.customers.findById(newInvoice.customerId, context);
            if (customer) {
              customer.balance = Number(((customer.balance || 0) + newInvoice.totalAmount).toFixed(4));
              await uow.customers.save(customer, context);
            }
          }
          if (dto.paymentMethod === "Cash") {
            const cashAcc = await uow.accounts.findById("acc-1000", context);
            if (cashAcc) {
              cashAcc.balance = Number(((cashAcc.balance || 0) + newInvoice.totalAmount).toFixed(4));
              await uow.accounts.save(cashAcc, context);
            }
          }
          return result.data.invoice;
        } else {
          await uow.sales.save(newInvoice, context);
          return newInvoice;
        }
      }, context);
    }

    const subtotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
    const taxTotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (it.taxRate ?? 0.15)), 0);
    const total = subtotal + taxTotal;

    const invoiceId = `INV-${Date.now()}`;
    const newInvoice: SalesInvoice = {
      id: invoiceId,
      customerId: dto.customerId,
      customerName: dto.customerName,
      date: dto.date || new Date().toISOString().split("T")[0],
      status: dto.paymentMethod === "Cash" ? "Paid" : "Unpaid",
      workflowStatus: "Posted",
      type: "Wholesale",
      totalAmount: total,
      subtotal,
      taxAmount: taxTotal,
      currency: dto.currency || Currency.SAR,
      exchangeRate: dto.exchangeRate || 1,
      items: dto.items.map((it) => ({
        itemId: it.itemId,
        itemName: it.itemName,
        quantity: it.quantity,
        price: it.unitPrice,
        total: it.quantity * it.unitPrice * (1 + (it.taxRate ?? 0.15))
      }))
    };

    // Orchestrate with CommerceService
    const batches = await this.inventoryRepo.getBatches({ context });
    const costLayers = await this.inventoryRepo.getCostLayers({ context });
    const movements = await this.inventoryRepo.getMovements({ context });

    const journalEntries = await this.journalEntryRepo.getAll({ context });
    const customers = await this.customerRepo.getAll({ context });
    const fiscalPeriods = await this.fiscalPeriodRepo.getAll({ context });


    const executionDTO: SalesInvoiceExecutionDTO = {
      invoice: newInvoice,
      type: "Wholesale",
      isPaid: dto.paymentMethod === "Cash",
      actor: "API System"
    };

    const result = CommerceService.processSalesInvoice({
      dto: executionDTO,
      config: defaultPostingAccountConfiguration,
      batches,
      costLayers,
      stockMovements: movements,
      journalEntries,
      customers,
      customerMovements: [],
      fiscalPeriods,
      getAccountName: (id: string) => id
    });

    if (!result.success) {
      throw AppError.validation(result.errors.join("; ") || "Failed to process sales invoice.");
    }

    // Persist all generated artifacts atomically
    if (result.data) {
      await this.salesRepo.save(result.data.invoice, context);
      await this.inventoryRepo.saveBatches(result.data.batches, context);
      await this.inventoryRepo.saveCostLayers(result.data.costLayers, context);
      
      // Save all updated stock movements
      for (const m of result.data.stockMovements) {
        await this.inventoryRepo.saveMovement(m, context);
      }
      // Save all updated journal entries
      for (const je of result.data.journalEntries) {
        await this.journalEntryRepo.save(je, context);
      }
      return result.data.invoice;
    } else {
      await this.salesRepo.save(newInvoice, context);
      return newInvoice;
    }
  }
}

