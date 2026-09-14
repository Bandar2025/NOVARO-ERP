import { eq, and } from "drizzle-orm";
import { db, DbOrTx } from "../client/db";
import { accounts } from "../schema/accounts";
import { AccountRepository, TenantContext, QueryOptions } from "../../../core/application/repositories/RepositoryInterfaces";
import { Account, AccountType } from "../../../types";
import { extractTenantContext } from "./contextUtils";

export class DrizzleAccountRepository implements AccountRepository {
  constructor(private client: DbOrTx = db) {}

  async findById(id: string, context?: TenantContext): Promise<Account | null> {
    const { tenantId, companyId } = extractTenantContext(context);

    const rows = await this.client
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
    const { tenantId, companyId } = extractTenantContext(context);

    const rows = await this.client
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
    const { tenantId, companyId } = extractTenantContext(options);

    const rows = await this.client
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
    const { tenantId, companyId } = extractTenantContext(context);

    await this.client
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
