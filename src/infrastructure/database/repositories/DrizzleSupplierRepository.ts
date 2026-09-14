import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { suppliers } from "../schema/suppliers";
import { SupplierRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { Supplier } from "../../../types";
import { extractTenantContext } from "./contextUtils";

export class DrizzleSupplierRepository implements SupplierRepository {
  constructor(private client: DbOrTx = db) {}

  async findById(id: string, context?: TenantContext): Promise<Supplier | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const rows = await this.client
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.tenantId, tenantId),
          eq(suppliers.companyId, companyId)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async getAll(options?: QueryOptions): Promise<Supplier[]> {
    const { tenantId, companyId } = extractTenantContext(options);

    const rows = await this.client
      .select()
      .from(suppliers)
      .where(
        and(
          eq(suppliers.tenantId, tenantId),
          eq(suppliers.companyId, companyId)
        )
      );

    return rows.map(r => this.mapToDomain(r));
  }

  async save(supplier: Supplier, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await this.client
      .insert(suppliers)
      .values({
        id: supplier.id,
        tenantId,
        companyId,
        name: supplier.name,
        nameAr: supplier.nameAr,
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        balance: (supplier.balance ?? 0).toFixed(4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: suppliers.id,
        set: {
          name: supplier.name,
          nameAr: supplier.nameAr,
          email: supplier.email || "",
          phone: supplier.phone || "",
          address: supplier.address || "",
          balance: (supplier.balance ?? 0).toFixed(4),
          updatedAt: new Date(),
        },
      });
  }

  async delete(id: string, context?: TenantContext): Promise<void> {
    const { tenantId, companyId } = extractTenantContext(context);

    await this.client
      .delete(suppliers)
      .where(
        and(
          eq(suppliers.id, id),
          eq(suppliers.tenantId, tenantId),
          eq(suppliers.companyId, companyId)
        )
      );
  }

  async exists(id: string, context?: TenantContext): Promise<boolean> {
    const s = await this.findById(id, context);
    return s !== null;
  }

  private mapToDomain(row: typeof suppliers.$inferSelect): Supplier {
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
