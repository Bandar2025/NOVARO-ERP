import { TenantContext, QueryOptions } from "../../../core/application/repositories/TenantContext";
import { AppError } from "../../../core/application/errors/ApiError";

export interface ResolvedTenantContext {
  tenantId: string;
  companyId: string;
  branchId?: string;
}

/**
 * Enforces strict Tenant/Company scoping for repository operations.
 * Throws an explicit AppError if tenantId or companyId is missing.
 * Prevents any silent default tenant or company fallback.
 */
export function extractTenantContext(contextOrOptions?: TenantContext | QueryOptions): ResolvedTenantContext {
  let ctx: TenantContext | undefined;

  if (contextOrOptions) {
    if ("context" in contextOrOptions && contextOrOptions.context) {
      ctx = contextOrOptions.context;
    } else if ("tenantId" in contextOrOptions || "companyId" in contextOrOptions) {
      ctx = contextOrOptions as TenantContext;
    }
  }

  const tenantId = ctx?.tenantId;
  const companyId = ctx?.companyId;

  if (!tenantId || !companyId) {
    throw AppError.validation(
      "TenantContext containing both tenantId and companyId is required for repository operations."
    );
  }

  return {
    tenantId,
    companyId,
    branchId: ctx?.branchId,
  };
}
