import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { customers } from "../schema/customers";
import { CustomerRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { Customer } from "../../../types";

const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_COMPANY_ID = "default-company";

export class DrizzleCustomerRepository implements CustomerRepository {
  async findById(id: string, context?: TenantContext): Promise<Customer | null> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.tenantId, tenantId),
          eq(customers.companyId, companyId)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async getAll(options?: QueryOptions): Promise<Customer[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.tenantId, tenantId),
          eq(customers.companyId, companyId)
        )
      );

    return rows.map(r => this.mapToDomain(r));
  }

  async save(customer: Customer, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .insert(customers)
      .values({
        id: customer.id,
        tenantId,
        companyId,
        name: customer.name,
        nameAr: customer.nameAr,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        balance: (customer.balance ?? 0).toFixed(4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: customers.id,
        set: {
          name: customer.name,
          nameAr: customer.nameAr,
          email: customer.email || "",
          phone: customer.phone || "",
          address: customer.address || "",
          balance: (customer.balance ?? 0).toFixed(4),
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .delete(customers)
      .where(
        and(
          eq(customers.id, id),
          eq(customers.tenantId, tenantId),
          eq(customers.companyId, companyId)
        )
      );
  }

  async exists(id: string, context?: TenantContext): Promise<boolean> {
    const c = await this.findById(id, context);
    return c !== null;
  }

  private mapToDomain(row: typeof customers.$inferSelect): Customer {
    return {
      id: row.id,
      name: row.name,
      nameAr: row.nameAr,
      email: row.email || "",
      phone: row.phone || "",
      address: row.address || "",
      balance: parseFloat(row.balance),
    };
  }
}
