import React, { useState } from "react";
import { DocumentWorkflowStatus } from "../../types";
import { useAppState } from "../../context/StateContext";
import PermissionGate from "./PermissionGate";
import AuditActions from "./AuditActions";
import {
  Send,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  RotateCcw,
  Printer,
  Lock
} from "lucide-react";

export interface DocumentActionsProps {
  docType: "journalEntry" | "purchaseOrder" | "salesInvoice" | "inventoryAdjustment" | "stockTransfer";
  docId: string;
  docReference?: string;
  docDate?: string;
  currentStatus: DocumentWorkflowStatus;
  pagePermissionKey?: string;
  language?: "ar" | "en";
  onPrint?: () => void;
  onStatusChanged?: (nextStatus: DocumentWorkflowStatus) => void;
  compact?: boolean;
}

export const DocumentActions: React.FC<DocumentActionsProps> = ({
  docType,
  docId,
  docReference,
  docDate,
  currentStatus,
  pagePermissionKey = "accounting",
  language = "ar",
  onPrint,
  onStatusChanged,
  compact = true
}) => {
  const {
    updateDocumentWorkflowStatus,
    reverseJournalEntry,
    fiscalPeriods,
    addToast
  } = useAppState();
  const isAr = language === "ar";

  const [reasonModal, setReasonModal] = useState<{
    mode: "reject" | "cancel" | "reverse";
    titleAr: string;
    titleEn: string;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  // Check if document date falls inside a locked fiscal period
  const isPeriodLocked = Boolean(
    docDate &&
      fiscalPeriods.some(
        (fp) => fp.isClosed && docDate >= fp.startDate && docDate <= fp.endDate
      )
  );

  const handleTransition = (nextStatus: DocumentWorkflowStatus, reason?: string) => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const res = updateDocumentWorkflowStatus(docType, docId, nextStatus, reason);
      if (res.success) {
        addToast({
          type: "success",
          message: `تم تحديث حالة المستند (${docId}) إلى ${nextStatus}`,
          messageEn: `Document (${docId}) transitioned to ${nextStatus}`
        });
        onStatusChanged?.(nextStatus);
      } else {
        addToast({
          type: "error",
          message: res.error || "تعذر تغيير حالة المستند",
          messageEn: res.error || "Failed to transition document status"
        });
      }
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmReasonAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonModal || !reasonText.trim()) return;

    if (reasonModal.mode === "reverse" && docType === "journalEntry") {
      const revRes = reverseJournalEntry(docId, reasonText.trim());
      if (revRes.success) {
        addToast({
          type: "success",
          message: `تم إصدار القيد العكسي المتوازن بنجاح للمستند (${docId})`,
          messageEn: `Balanced reversal voucher issued for (${docId})`
        });
        onStatusChanged?.("Cancelled");
      } else {
        addToast({
          type: "error",
          message: revRes.error || "فشل إصدار القيد العكسي",
          messageEn: revRes.error || "Reversal failed"
        });
      }
    } else {
      const targetStatus: DocumentWorkflowStatus =
        reasonModal.mode === "reject" ? "Rejected" : "Cancelled";
      handleTransition(targetStatus, reasonText.trim());
    }

    setReasonText("");
    setReasonModal(null);
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      {isPeriodLocked && (
        <span
          title={isAr ? "الفترة المالية مغلقة — لا يمكن الترحيل أو العكس" : "Fiscal Period is Locked"}
          className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold inline-flex items-center gap-1"
        >
          <Lock className="w-3 h-3" />
          <span>{isAr ? "فترة مغلقة" : "Period Locked"}</span>
        </span>
      )}

      {/* 1. DRAFT STATE ACTIONS */}
      {currentStatus === "Draft" && (
        <>
          <PermissionGate page={pagePermissionKey} action="edit" language={language}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleTransition("PendingReview", "Submitted for review")}
              className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>{isAr ? "إرسال للمراجعة" : "Submit Review"}</span>
            </button>
          </PermissionGate>

          <PermissionGate page={pagePermissionKey} action="approve" language={language}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleTransition("Approved", "Direct approval")}
              className="px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-900 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{isAr ? "اعتماد" : "Approve"}</span>
            </button>
          </PermissionGate>

          <PermissionGate page={pagePermissionKey} action="cancel" language={language}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                setReasonModal({
                  mode: "cancel",
                  titleAr: `إلغاء المسودة (#${docId})`,
                  titleEn: `Cancel Draft (#${docId})`
                })
              }
              className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle className="w-3 h-3" />
              {!compact && <span>{isAr ? "إلغاء" : "Cancel"}</span>}
            </button>
          </PermissionGate>
        </>
      )}

      {/* 2. PENDING REVIEW STATE ACTIONS */}
      {currentStatus === "PendingReview" && (
        <>
          <PermissionGate page={pagePermissionKey} action="approve" language={language}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => handleTransition("Approved", "Reviewed and approved")}
              className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{isAr ? "اعتماد المراجعة" : "Approve"}</span>
            </button>
          </PermissionGate>

          <PermissionGate page={pagePermissionKey} action="approve" language={language}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                setReasonModal({
                  mode: "reject",
                  titleAr: `رفض المستند مع ذكر السبب (#${docId})`,
                  titleEn: `Reject Document with Reason (#${docId})`
                })
              }
              className="px-2.5 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle className="w-3 h-3" />
              <span>{isAr ? "رفض" : "Reject"}</span>
            </button>
          </PermissionGate>
        </>
      )}

      {/* 3. APPROVED STATE ACTIONS */}
      {currentStatus === "Approved" && (
        <>
          <PermissionGate page={pagePermissionKey} action="post" language={language}>
            <button
              type="button"
              disabled={isBusy || isPeriodLocked}
              title={
                isPeriodLocked
                  ? isAr
                    ? "الفترة المالية مغلقة — لا يمكن الترحيل"
                    : "Fiscal period is locked"
                  : undefined
              }
              onClick={() => handleTransition("Posted", "Posted to General Ledger")}
              className={`px-3 py-1 rounded-md text-white text-[11px] font-black inline-flex items-center gap-1 shadow-xs transition-colors ${
                isPeriodLocked
                  ? "bg-slate-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500 cursor-pointer"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? "ترحيل للأستاذ العام (Post)" : "Post to GL"}</span>
            </button>
          </PermissionGate>

          <PermissionGate page={pagePermissionKey} action="cancel" language={language}>
            <button
              type="button"
              disabled={isBusy}
              onClick={() =>
                setReasonModal({
                  mode: "reject",
                  titleAr: `إلغاء الاعتماد وإرجاع المستند (#${docId})`,
                  titleEn: `Revoke Approval (#${docId})`
                })
              }
              className="px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <XCircle className="w-3 h-3" />
              <span>{isAr ? "إرجاع" : "Reject"}</span>
            </button>
          </PermissionGate>
        </>
      )}

      {/* 4. POSTED STATE ACTIONS (IMMUTABLE — ONLY PRINT, AUDIT & REVERSAL ALLOWED) */}
      {currentStatus === "Posted" && (
        <>
          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Printer className="w-3 h-3 text-teal-400" />
              <span>{isAr ? "طباعة" : "Print"}</span>
            </button>
          )}

          {docType === "journalEntry" && (
            <PermissionGate page={pagePermissionKey} action="cancel" language={language}>
              <button
                type="button"
                disabled={isBusy || isPeriodLocked}
                onClick={() =>
                  setReasonModal({
                    mode: "reverse",
                    titleAr: `إصدار قيد عكسي متوازن (REV-) للقيد المرحل (#${docId})`,
                    titleEn: `Issue Balanced Reversal Entry (REV-) for (#${docId})`
                  })
                }
                className={`px-2.5 py-1 rounded-md border text-[11px] font-bold inline-flex items-center gap-1 transition-colors ${
                  isPeriodLocked
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 cursor-pointer"
                }`}
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isAr ? "قيد عكسي (REV)" : "Reverse (REV)"}</span>
              </button>
            </PermissionGate>
          )}
        </>
      )}

      {/* 5. REJECTED STATE: ALLOW RE-OPENING TO DRAFT */}
      {currentStatus === "Rejected" && (
        <PermissionGate page={pagePermissionKey} action="edit" language={language}>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleTransition("Draft", "Re-opened rejected document to Draft")}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isAr ? "إعادة لمسودة" : "Re-open Draft"}</span>
          </button>
        </PermissionGate>
      )}

      {/* Audit & Linked JE Inspector */}
      <AuditActions
        documentId={docId}
        documentReference={docReference}
        language={language}
        compact={compact}
      />

      {/* Mandatory Reason Modal for Reject / Cancel / Reverse */}
      {reasonModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setReasonModal(null)}
        >
          <form
            dir={isAr ? "rtl" : "ltr"}
            onSubmit={handleConfirmReasonAction}
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4"
          >
            <h4 className="text-sm font-black text-slate-900">
              {isAr ? reasonModal.titleAr : reasonModal.titleEn}
            </h4>
            <p className="text-xs text-slate-600">
              {isAr
                ? "يتطلب نظام الرقابة الداخلية إدخال سبب واضح ومفصل لتوثيقه في سجل التدقيق غير القابل للتعديل."
                : "Internal audit governance requires a mandatory reason to record in the immutable audit log."}
            </p>
            <textarea
              required
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder={
                isAr
                  ? "اكتب سبب الإلغاء أو الرفض أو القيد العكسي هنا..."
                  : "Enter mandatory reason for audit trail..."
              }
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-teal-600"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {isAr ? "تراجع" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer"
              >
                {isAr ? "تأكيد وتوثيق بالسجل" : "Confirm & Log"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DocumentActions;
