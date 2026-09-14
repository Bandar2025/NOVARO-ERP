import { eq, and, sql } from "drizzle-orm";
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
    const id = `seq-${tenantId}-${companyId}-${branchId}-${params.documentType}-${params.fiscalYearId}`;

    const inserted = await this.client
      .insert(documentSequences)
      .values({
        id,
        tenantId,
        companyId,
        branchId,
        documentType: params.documentType,
        fiscalYearId: params.fiscalYearId,
        lastSequence: 1,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: documentSequences.id,
        set: {
          lastSequence: sql`${documentSequences.lastSequence} + 1`,
          updatedAt: new Date(),
        },
      })
      .returning({ lastSequence: documentSequences.lastSequence });

    return Number(inserted[0].lastSequence);
  }

  formatDocumentNumber(documentType: string, sequenceNumber: number, fiscalYearStr: string = "2026"): string {
    const padded = sequenceNumber.toString().padStart(6, "0");
    return `${documentType}-${fiscalYearStr}-${padded}`;
  }
}
