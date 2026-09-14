import { eq, and } from "drizzle-orm";
import { db } from "../client/db";
import { documentSequences } from "../schema/documentSequences";
import {
  DocumentSequenceRepository,
  DocumentSequenceParams,
  TenantContext
} from "../../../core/application/repositories/RepositoryInterfaces";
import { extractTenantContext } from "./contextUtils";

export class DrizzleDocumentSequenceRepository implements DocumentSequenceRepository {
  constructor(private client: any = db) {}

  async getNextSequence(params: DocumentSequenceParams, context?: TenantContext): Promise<number> {
    const { tenantId, companyId, branchId: ctxBranchId } = extractTenantContext(context);
    const branchId = params.branchId || ctxBranchId || "main-branch";

    const rows = await this.client
      .select()
      .from(documentSequences)
      .where(
        and(
          eq(documentSequences.tenantId, tenantId),
          eq(documentSequences.companyId, companyId),
          eq(documentSequences.branchId, branchId),
          eq(documentSequences.documentType, params.documentType),
          eq(documentSequences.fiscalYearId, params.fiscalYearId)
        )
      )
      .for("update")
      .limit(1);

    if (rows.length > 0) {
      const nextVal = rows[0].lastSequence + 1;
      await this.client
        .update(documentSequences)
        .set({
          lastSequence: nextVal,
          updatedAt: new Date(),
        })
        .where(eq(documentSequences.id, rows[0].id));
      return nextVal;
    } else {
      const id = `seq-${tenantId}-${companyId}-${branchId}-${params.documentType}-${params.fiscalYearId}`;
      const nextVal = 1;
      await this.client
        .insert(documentSequences)
        .values({
          id,
          tenantId,
          companyId,
          branchId,
          documentType: params.documentType,
          fiscalYearId: params.fiscalYearId,
          lastSequence: nextVal,
          updatedAt: new Date(),
        });
      return nextVal;
    }
  }

  formatDocumentNumber(documentType: string, sequenceNumber: number, fiscalYearStr: string = "2026"): string {
    const padded = sequenceNumber.toString().padStart(6, "0");
    return `${documentType}-${fiscalYearStr}-${padded}`;
  }
}
