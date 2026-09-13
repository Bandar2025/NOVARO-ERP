import { Item, Batch } from "../../../types";
import { InventoryRepository } from "../repositories/RepositoryInterfaces";
import { DomainStockMovement } from "../../domain/inventory/StockMovement";
import { CostLayer } from "../../domain/inventory/CostLayer";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class InventoryApplicationService {
  constructor(private inventoryRepo: InventoryRepository) {}

  async getItems(options?: QueryOptions): Promise<Item[]> {
    return this.inventoryRepo.getAllItems(options);
  }

  async getItemById(id: string, context?: TenantContext): Promise<Item> {
    const item = await this.inventoryRepo.getItemById(id, context);
    if (!item) {
      throw AppError.notFound("Inventory item", id);
    }
    return item;
  }

  async getBatches(options?: QueryOptions): Promise<Batch[]> {
    return this.inventoryRepo.getBatches(options);
  }

  async getMovements(options?: QueryOptions): Promise<DomainStockMovement[]> {
    return this.inventoryRepo.getMovements(options);
  }

  async getCostLayers(options?: QueryOptions): Promise<CostLayer[]> {
    return this.inventoryRepo.getCostLayers(options);
  }
}
