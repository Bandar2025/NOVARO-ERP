import { PurchaseOrder, Currency } from "../../../types";
import { CreatePurchaseDTO, ReceivePurchaseDTO } from "../dtos";
import {
  PurchaseRepository,
  InventoryRepository,
  JournalEntryRepository,
  FiscalPeriodRepository
} from "../repositories/RepositoryInterfaces";
import { CommerceService, PurchaseReceiptExecutionDTO } from "../commerce/CommerceService";
import { defaultPostingAccountConfiguration } from "../../domain/accounting/PostingAccountConfiguration";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class PurchaseApplicationService {
  constructor(
    private purchaseRepo: PurchaseRepository,
    private inventoryRepo: InventoryRepository,
    private journalEntryRepo: JournalEntryRepository,
    private fiscalPeriodRepo: FiscalPeriodRepository
  ) {}

  async getAll(options?: QueryOptions): Promise<PurchaseOrder[]> {
    return this.purchaseRepo.getAll(options);
  }

  async getById(id: string, context?: TenantContext): Promise<PurchaseOrder> {
    const po = await this.purchaseRepo.findById(id, context);
    if (!po) {
      throw AppError.notFound("Purchase order", id);
    }
    return po;
  }

  async createPurchase(dto: CreatePurchaseDTO, context?: TenantContext): Promise<PurchaseOrder> {
    if (!dto.items || dto.items.length === 0) {
      throw AppError.validation("Purchase order must contain at least one item.");
    }

    const subtotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
    const taxTotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (it.taxRate ?? 0.15)), 0);
    const total = subtotal + taxTotal;

    const newPO: PurchaseOrder = {
      id: `PO-${Date.now()}`,
      supplierName: dto.supplierName,
      supplierId: dto.supplierId,
      date: dto.orderDate || new Date().toISOString().split("T")[0],
      status: "Draft",
      workflowStatus: "Draft",
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

    await this.purchaseRepo.save(newPO, context);
    return newPO;
  }

  async receivePurchase(dto: ReceivePurchaseDTO, context?: TenantContext): Promise<PurchaseOrder> {
    const po = await this.purchaseRepo.findById(dto.purchaseOrderId, context);
    if (!po) {
      throw AppError.notFound("Purchase order", dto.purchaseOrderId);
    }

    if (po.status === "Received" || po.workflowStatus === "Posted") {
      throw AppError.conflict(`Purchase order '${dto.purchaseOrderId}' is already received.`);
    }

    const batches = await this.inventoryRepo.getBatches();
    const costLayers = await this.inventoryRepo.getCostLayers();
    const movements = await this.inventoryRepo.getMovements();
    const journalEntries = await this.journalEntryRepo.getAll();
    const fiscalPeriods = await this.fiscalPeriodRepo.getAll();

    const executionDTO: PurchaseReceiptExecutionDTO = {
      purchaseOrder: po,
      actor: "API System"
    };

    const result = CommerceService.processPurchaseReceipt({
      dto: executionDTO,
      config: defaultPostingAccountConfiguration,
      batches,
      costLayers,
      stockMovements: movements,
      journalEntries,
      suppliers: [],
      supplierMovements: [],
      fiscalPeriods,
      getAccountName: (id: string) => id
    });

    if (!result.success) {
      throw AppError.validation(result.errors.join("; ") || "Failed to receive purchase order.");
    }

    if (result.data) {
      await this.purchaseRepo.save(result.data.purchaseOrder, context);
      await this.inventoryRepo.saveBatches(result.data.batches, context);
      await this.inventoryRepo.saveCostLayers(result.data.costLayers, context);
      
      for (const m of result.data.stockMovements) {
        await this.inventoryRepo.saveMovement(m, context);
      }
      for (const je of result.data.journalEntries) {
        await this.journalEntryRepo.save(je, context);
      }
      return result.data.purchaseOrder;
    }

    const receivedPO: PurchaseOrder = {
      ...po,
      status: "Received",
      workflowStatus: "Posted"
    };
    await this.purchaseRepo.save(receivedPO, context);
    return receivedPO;
  }
}
