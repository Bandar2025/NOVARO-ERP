import React, { useState } from "react";
import { useAppState } from "../../context/StateContext";
import { History, FileText, X, Download, ShieldCheck, ArrowLeftRight } from "lucide-react";

export interface AuditActionsProps {
  documentId: string;
  documentReference?: string;
  documentTypeLabelAr?: string;
  documentTypeLabelEn?: string;
  language?: "ar" | "en";
  compact?: boolean;
}

export const AuditActions: React.FC<AuditActionsProps> = ({
  documentId,
  documentReference,
  documentTypeLabelAr = "المستند المحاسبي",
  documentTypeLabelEn = "Accounting Document",
  language = "ar",
  compact = true
}) => {
  const { auditLogs, journalEntries } = useAppState();
  const [openModal, setOpenModal] = useState<"audit" | "je" | null>(null);
  const isAr = language === "ar";

  const relatedLogs = auditLogs.filter(
    (log) =>
      log.details.includes(documentId) ||
      (documentReference && log.details.includes(documentReference)) ||
      (log.oldValue && log.oldValue.includes(documentId)) ||
      (log.newValue && log.newValue.includes(documentId))
  );

  const relatedJournalEntries = journalEntries.filter(
    (je) =>
      je.id === documentId ||
      je.reference === documentId ||
      (documentReference && (je.reference === documentReference || je.id === documentReference)) ||
      je.reversalOfId === documentId ||
      (je.notes && je.notes.includes(documentId))
  );

  const handleExportAuditCsv = () => {
    const headers = ["Timestamp", "User", "Action", "Details", "OldState", "NewState", "Reason"];
    const rows = relatedLogs.map((l) => [
      l.timestamp,
      l.username,
      `"${(l.action || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${(l.oldValue || "").replace(/"/g, '""')}"`,
      `"${(l.newValue || "").replace(/"/g, '""')}"`,
      `"${(l.reason || "").replace(/"/g, '""')}"`
    ]);
    const csv = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_trail_${documentId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="inline-flex items-center gap-1">
        {relatedJournalEntries.length > 0 && (
          <button
            type="button"
            onClick={() => setOpenModal("je")}
            title={isAr ? "عرض القيد المحاسبي المرتبط" : "View Linked Journal Entry"}
            className="px-2 py-1 rounded-md border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <FileText className="w-3 h-3" />
            {!compact && <span>{isAr ? "القيد المرتبط" : "Linked JE"}</span>}
            <span className="font-mono text-[10px]">({relatedJournalEntries.length})</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setOpenModal("audit")}
          title={isAr ? "سجل التدقيق والرقابة للمستند" : "Document Audit Trail"}
          className="px-2 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <History className="w-3 h-3 text-slate-500" />
          {!compact && <span>{isAr ? "سجل التدقيق" : "Audit Trail"}</span>}
          <span className="font-mono text-[10px]">({relatedLogs.length})</span>
        </button>
      </div>

      {openModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setOpenModal(null)}
        >
          <div
            dir={isAr ? "rtl" : "ltr"}
            className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {openModal === "je" ? (
                  <ArrowLeftRight className="w-4 h-4 text-teal-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                )}
                <h4 className="text-xs font-black">
                  {openModal === "je"
                    ? isAr
                      ? `القيود اليومية المرتبطة بـ ${documentTypeLabelAr} (#${documentId})`
                      : `Linked Journal Entries for ${documentTypeLabelEn} (#${documentId})`
                    : isAr
                    ? `سجل التدقيق والرقابة لـ ${documentTypeLabelAr} (#${documentId})`
                    : `Audit Trail for ${documentTypeLabelEn} (#${documentId})`}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {openModal === "audit" && relatedLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={handleExportAuditCsv}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpenModal(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto space-y-3 text-xs">
              {openModal === "je" ? (
                relatedJournalEntries.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 font-bold">
                    {isAr ? "لا توجد قيود محاسبية مرتبطة بهذا المستند." : "No linked journal entries found."}
                  </div>
                ) : (
                  relatedJournalEntries.map((je) => (
                    <div key={je.id} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-mono font-black text-slate-900">{je.id}</span>
                          <span className="mx-2 text-slate-400">|</span>
                          <span className="font-mono text-slate-600">{je.date}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {je.workflowStatus || (je.posted ? "Posted" : "Draft")}
                        </span>
                      </div>
                      <p className="text-slate-700 font-semibold">{je.notes}</p>
                      <table className="w-full text-[11px] border-t border-slate-200 pt-2">
                        <thead>
                          <tr className="text-slate-500 border-b border-slate-200">
                            <th className="py-1 text-start">{isAr ? "الحساب" : "Account"}</th>
                            <th className="py-1 text-center">{isAr ? "مدين (Debit)" : "Debit"}</th>
                            <th className="py-1 text-center">{isAr ? "دائن (Credit)" : "Credit"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {je.items.map((line) => (
                            <tr key={line.id} className="border-b border-slate-100">
                              <td className="py-1 font-bold text-slate-800">{line.accountName}</td>
                              <td className="py-1 text-center font-mono text-teal-700">
                                {line.debit > 0 ? line.debit.toFixed(2) : "-"}
                              </td>
                              <td className="py-1 text-center font-mono text-amber-700">
                                {line.credit > 0 ? line.credit.toFixed(2) : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))
                )
              ) : relatedLogs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 font-bold">
                  {isAr ? "لا توجد سجلات تدقيق مسجلة لهذا المستند بعد." : "No audit logs recorded for this document yet."}
                </div>
              ) : (
                relatedLogs.map((log) => (
                  <div key={log.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-black text-slate-900">{log.action}</span>
                      <span className="font-mono text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-700">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
                      <span>
                        {isAr ? "المستخدم:" : "User:"} <strong>{log.username}</strong>
                      </span>
                      {log.oldValue && (
                        <span>
                          {isAr ? "الحالة السابقة:" : "From:"} <strong className="font-mono">{log.oldValue}</strong>
                        </span>
                      )}
                      {log.newValue && (
                        <span>
                          {isAr ? "الحالة الجديدة:" : "To:"} <strong className="font-mono text-teal-700">{log.newValue}</strong>
                        </span>
                      )}
                      {log.reason && (
                        <span className="text-rose-700 font-bold">
                          {isAr ? "السبب:" : "Reason:"} {log.reason}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AuditActions;
