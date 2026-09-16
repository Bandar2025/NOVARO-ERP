import { PurchaseOrder, Currency } from "../../../types";
import { CreatePurchaseDTO, ReceivePurchaseDTO } from "../dtos";
import {
  PurchaseRepository,
  InventoryRepository,
  JournalEntryRepository,
  FiscalPeriodRepository
} from "../repositories/RepositoryInterfaces";
import { UnitOfWorkFactory } from "../repositories/UnitOfWork";
import { CommerceService, PurchaseReceiptExecutionDTO } from "../commerce/CommerceService";
import { defaultPostingAccountConfiguration } from "../../domain/accounting/PostingAccountConfiguration";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class PurchaseApplicationService {
  constructor(
    private purchaseRepo: PurchaseRepository,
    private inventoryRepo: InventoryRepository,
    private journalEntryRepo: JournalEntryRepository,
    private fiscalPeriodRepo: FiscalPeriodRepository,
    private uowFactory?: UnitOfWorkFactory
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

    if (this.uowFactory && context) {
      return await this.uowFactory.run(async (uow) => {
        const fiscalYearId = (dto.orderDate || new Date().toISOString().split("T")[0]).substring(0, 4);
        const seq = await uow.documentSequences.getNextSequence({ documentType: "PO", fiscalYearId }, context);
        const poId = uow.documentSequences.formatDocumentNumber("PO", seq, fiscalYearId);

        const subtotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice), 0);
        const taxTotal = dto.items.reduce((acc, it) => acc + (it.quantity * it.unitPrice * (it.taxRate ?? 0.15)), 0);
        const total = subtotal + taxTotal;

        const newPO: PurchaseOrder = {
          id: poId,
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

        await uow.purchases.save(newPO, context);
        return newPO;
      }, context);
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
    if (this.uowFactory && context) {
      return await this.uowFactory.run(async (uow) => {
        const po = await uow.purchases.findById(dto.purchaseOrderId, context);
        if (!po) {
          throw AppError.notFound("Purchase order", dto.purchaseOrderId);
        }

        if (po.status === "Received" || po.workflowStatus === "Posted") {
          throw AppError.conflict(`Purchase order '${dto.purchaseOrderId}' is already received.`);
        }

        const batches = await uow.inventory.getBatches({ context });
        const costLayers = await uow.inventory.getCostLayers({ context });
        const movements = await uow.inventory.getMovements({ context });

        const journalEntries = await uow.journalEntries.getAll({ context });
        const fiscalPeriods = await uow.fiscalPeriods.getAll({ context });


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
          await uow.purchases.save(result.data.purchaseOrder, context);
          await uow.inventory.saveBatches(result.data.batches, context);
          await uow.inventory.saveCostLayers(result.data.costLayers, context);
          for (const m of result.data.stockMovements) {
            await uow.inventory.saveMovement(m, context);
          }
          for (const je of result.data.journalEntries) {
            await uow.journalEntries.save(je, context);
          }
          for (const item of po.items) {
            const dbItem = await uow.inventory.getItemById(item.itemId, context);
            if (dbItem) {
              dbItem.currentStock = Number(((dbItem.currentStock || 0) + item.quantity).toFixed(4));
              await uow.inventory.saveItem(dbItem, context);
            }
          }
          if (po.supplierId) {
            const supplier = await uow.suppliers.findById(po.supplierId, context);
            if (supplier) {
              supplier.balance = Number(((supplier.balance || 0) + po.totalAmount).toFixed(4));
              await uow.suppliers.save(supplier, context);
            }
          }
          return result.data.purchaseOrder;
        }

        const receivedPO: PurchaseOrder = {
          ...po,
          status: "Received",
          workflowStatus: "Posted"
        };
        await uow.purchases.save(receivedPO, context);
        return receivedPO;
      }, context);
    }

    const po = await this.purchaseRepo.findById(dto.purchaseOrderId, context);
    if (!po) {
      throw AppError.notFound("Purchase order", dto.purchaseOrderId);
    }

    if (po.status === "Received" || po.workflowStatus === "Posted") {
      throw AppError.conflict(`Purchase order '${dto.purchaseOrderId}' is already received.`);
    }

    const batches = await this.inventoryRepo.getBatches({ context });
    const costLayers = await this.inventoryRepo.getCostLayers({ context });
    const movements = await this.inventoryRepo.getMovements({ context });

    const journalEntries = await this.journalEntryRepo.getAll({ context });
    const fiscalPeriods = await this.fiscalPeriodRepo.getAll({ context });


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

