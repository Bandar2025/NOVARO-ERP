import { Supplier } from "../../../types";
import { SupplierRepository } from "../repositories/RepositoryInterfaces";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class SupplierApplicationService {
  constructor(private supplierRepo: SupplierRepository) {}

  async getAll(options?: QueryOptions): Promise<Supplier[]> {
    return this.supplierRepo.getAll(options);
  }

  async getById(id: string, context?: TenantContext): Promise<Supplier> {
    const supplier = await this.supplierRepo.findById(id, context);
    if (!supplier) {
      throw AppError.notFound("Supplier", id);
    }
    return supplier;
  }

  async create(supplier: Supplier, context?: TenantContext): Promise<Supplier> {
    if (!supplier.name || supplier.name.trim() === "") {
      throw AppError.validation("Supplier name is required.");
    }
    const newSupplier: Supplier = {
      ...supplier,
      id: supplier.id || `supp-${Date.now()}`,
      balance: supplier.balance ?? 0
    };
    await this.supplierRepo.save(newSupplier, context);
    return newSupplier;
  }
}
