import { Customer } from "../../../types";
import { CustomerRepository } from "../repositories/RepositoryInterfaces";
import { AppError } from "../errors/ApiError";
import { TenantContext, QueryOptions } from "../repositories/TenantContext";

export class CustomerApplicationService {
  constructor(private customerRepo: CustomerRepository) {}

  async getAll(options?: QueryOptions): Promise<Customer[]> {
    return this.customerRepo.getAll(options);
  }

  async getById(id: string, context?: TenantContext): Promise<Customer> {
    const customer = await this.customerRepo.findById(id, context);
    if (!customer) {
      throw AppError.notFound("Customer", id);
    }
    return customer;
  }

  async create(customer: Customer, context?: TenantContext): Promise<Customer> {
    if (!customer.name || customer.name.trim() === "") {
      throw AppError.validation("Customer name is required.");
    }
    const newCustomer: Customer = {
      ...customer,
      id: customer.id || `cust-${Date.now()}`,
      balance: customer.balance ?? 0
    };
    await this.customerRepo.save(newCustomer, context);
    return newCustomer;
  }
}
