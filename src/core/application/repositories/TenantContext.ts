// Multi-tenant and branch context specification for future scalability (Phase 2B / PostgreSQL)
export interface TenantContext {
  tenantId?: string;
  companyId?: string;
  branchId?: string;
}

export interface QueryOptions {
  context?: TenantContext;
  limit?: number;
  offset?: number;
  search?: string;
  forUpdate?: boolean;
  itemId?: string;
}
