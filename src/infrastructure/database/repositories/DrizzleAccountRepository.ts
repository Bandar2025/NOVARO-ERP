import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { accounts } from "../schema/accounts";
import { AccountRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { Account, AccountType } from "../../../types";

const DEFAULT_TENANT_ID = "default-tenant";
const DEFAULT_COMPANY_ID = "default-company";

export class DrizzleAccountRepository implements AccountRepository {
  async findById(id: string, context?: TenantContext): Promise<Account | null> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, id),
          eq(accounts.tenantId, tenantId),
          eq(accounts.companyId, companyId)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async findByCode(code: string, context?: TenantContext): Promise<Account | null> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.code, code),
          eq(accounts.tenantId, tenantId),
          eq(accounts.companyId, companyId)
        )
      )
      .limit(1);

    if (rows.length === 0) return null;
    return this.mapToDomain(rows[0]);
  }

  async getAll(options?: QueryOptions): Promise<Account[]> {
    const tenantId = options?.tenantId || DEFAULT_TENANT_ID;
    const companyId = options?.companyId || DEFAULT_COMPANY_ID;

    const rows = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, tenantId),
          eq(accounts.companyId, companyId)
        )
      );

    return rows.map(r => this.mapToDomain(r));
  }

  async save(account: Account, context?: TenantContext): Promise<void> {
    const tenantId = context?.tenantId || DEFAULT_TENANT_ID;
    const companyId = context?.companyId || DEFAULT_COMPANY_ID;

    await db
      .insert(accounts)
      .values({
        id: account.id,
        tenantId,
        companyId,
        code: account.code,
        name: account.name,
        nameAr: account.nameAr,
        type: account.type,
        parentId: account.parent || null,
        balance: (account.balance ?? 0).toFixed(4),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: accounts.id,
        set: {
          code: account.code,
          name: account.name,
          nameAr: account.nameAr,
          type: account.type,
          parentId: account.parent || null,
          balance: (account.balance ?? 0).toFixed(4),
          updatedAt: new Date(),
        },
      });
  }

  async saveBatch(accountsList: Account[], context?: TenantContext): Promise<void> {
    for (const acc of accountsList) {
      await this.save(acc, context);
    }
  }

  async exists(id: string, context?: TenantContext): Promise<boolean> {
    const acc = await this.findById(id, context);
    return acc !== null;
  }

  private mapToDomain(row: typeof accounts.$inferSelect): Account {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      nameAr: row.nameAr,
      type: row.type as AccountType,
      parent: row.parentId || undefined,
      balance: parseFloat(row.balance),
    };
  }
}
