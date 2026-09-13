// NOVARO ERP Domain Model: Account
import { AccountType } from "../../../types";

export interface DomainAccount {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: AccountType;
  parentId?: string;
  isActive: boolean;
  description?: string;
}

export function isDebitNormal(type: AccountType): boolean {
  return type === AccountType.Asset || type === AccountType.Expense;
}

export function calculateNormalBalance(type: AccountType, debits: number, credits: number): number {
  if (isDebitNormal(type)) {
    return debits - credits;
  }
  return credits - debits;
}
