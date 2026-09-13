import React, { useEffect } from "react";
import { AlertTriangle, X, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose?: () => void;
  onCancel?: () => void;
  onConfirm: () => void;
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  message?: string;
  messageEn?: string;
  itemName?: string;
  confirmLabel?: string;
  confirmLabelEn?: string;
  cancelLabel?: string;
  cancelLabelEn?: string;
  variant?: "destructive" | "warning" | "primary" | "danger";
  language?: "ar" | "en";
  isLoading?: boolean;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onCancel,
  onConfirm,
  title,
  titleEn,
  description,
  descriptionEn,
  message,
  messageEn,
  itemName,
  confirmLabel,
  confirmLabelEn,
  cancelLabel,
  cancelLabelEn,
  variant = "destructive",
  language = "ar",
  isLoading = false
}: ConfirmDialogProps) {
  const isAr = language === "ar";
  const handleClose = onCancel || onClose || (() => {});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, handleClose]);

  if (!isOpen) return null;

  const rawDesc = description || message || "";
  const rawDescEn = descriptionEn || messageEn || rawDesc;
  const displayTitle = isAr ? title : (titleEn || title);
  const displayDesc = isAr ? rawDesc : rawDescEn;
  const isDestructive = variant === "destructive" || variant === "danger";

  const defaultConfirm = isDestructive 
    ? (isAr ? "تأكيد الحذف" : "Confirm Delete")
    : (isAr ? "تأكيد الإجراء" : "Confirm Action");
  const defaultCancel = isAr ? "إلغاء" : "Cancel";

  const confirmText = isAr ? (confirmLabel || defaultConfirm) : (confirmLabelEn || confirmLabel || defaultConfirm);
  const cancelText = isAr ? (cancelLabel || defaultCancel) : (cancelLabelEn || cancelLabel || defaultCancel);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
    >
      <div 
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden p-6 space-y-4 animate-scale-up text-slate-800"
      >
        {/* Header Icon & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isDestructive
                ? "bg-rose-100 text-rose-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {isDestructive ? (
              <Trash2 className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-base font-extrabold text-slate-900">
            {displayTitle}
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            {displayDesc}
          </p>
          {itemName && (
            <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 break-all">
              {itemName}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-black text-white rounded-lg transition-all shadow-sm flex items-center gap-1.5 ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                : "bg-teal-700 hover:bg-teal-800 shadow-teal-700/20"
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isDestructive && <Trash2 className="w-3.5 h-3.5" />}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
