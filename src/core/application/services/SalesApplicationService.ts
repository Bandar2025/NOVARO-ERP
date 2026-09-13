import { SalesInvoice, Currency } from "../../../types";
import { CreateSaleDTO } from "../dtos";
import {
  SalesRepository,
  InventoryRepository,
  CustomerRepository,
  JournalEntryRepository,
  FiscalPeriodRepository
} from "../repositories/RepositoryInterfaces";
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
    private fiscalPeriodRepo: FiscalPeriodRepository
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
    const batches = await this.inventoryRepo.getBatches();
    const costLayers = await this.inventoryRepo.getCostLayers();
    const movements = await this.inventoryRepo.getMovements();
    const journalEntries = await this.journalEntryRepo.getAll();
    const customers = await this.customerRepo.getAll();
    const fiscalPeriods = await this.fiscalPeriodRepo.getAll();

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
