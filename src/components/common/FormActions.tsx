import React, { useState } from "react";
import { Save, ShieldCheck, RotateCcw, X, CheckCircle2, Loader2, PlusCircle } from "lucide-react";
import PermissionGate from "./PermissionGate";

export interface FormActionsProps {
  pagePermissionKey?: string;
  requiredAction?: string;
  language?: "ar" | "en";
  isDirty?: boolean;
  isSubmitting?: boolean;
  disabled?: boolean;
  disabledReasonAr?: string;
  disabledReasonEn?: string;
  saveDraftLabelAr?: string;
  saveDraftLabelEn?: string;
  saveAndNewLabelAr?: string;
  saveAndNewLabelEn?: string;
  primarySubmitLabelAr?: string;
  primarySubmitLabelEn?: string;
  onSaveDraft?: () => void;
  onSaveAndNew?: () => void;
  onPrimarySubmit?: () => void;
  onValidate?: () => void;
  onReset?: () => void;
  onCancel?: () => void;
  submitButtonType?: "submit" | "button";
  extraLeftActions?: React.ReactNode;
}

export const FormActions: React.FC<FormActionsProps> = ({
  pagePermissionKey = "accounting",
  requiredAction = "create",
  language = "ar",
  isDirty = false,
  isSubmitting = false,
  disabled = false,
  disabledReasonAr,
  disabledReasonEn,
  saveDraftLabelAr = "حفظ كمسودة (Draft)",
  saveDraftLabelEn = "Save as Draft",
  saveAndNewLabelAr = "حفظ وإنشاء جديد",
  saveAndNewLabelEn = "Save & New",
  primarySubmitLabelAr = "حفظ واعتماد المستند",
  primarySubmitLabelEn = "Save & Submit",
  onSaveDraft,
  onSaveAndNew,
  onPrimarySubmit,
  onValidate,
  onReset,
  onCancel,
  submitButtonType = "submit",
  extraLeftActions
}) => {
  const isAr = language === "ar";
  const [confirmReset, setConfirmReset] = useState(false);

  const handleResetClick = () => {
    if (isDirty && !confirmReset) {
      setConfirmReset(true);
      return;
    }
    setConfirmReset(false);
    onReset?.();
  };

  const disabledTooltip = disabled
    ? isAr
      ? disabledReasonAr || "يرجى استكمال الحقول المطلوبة والتأكد من صحة البيانات قبل الحفظ"
      : disabledReasonEn || "Please complete required fields and validate data before saving"
    : undefined;

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-200"
    >
      <div className="flex flex-wrap items-center gap-2">
        {extraLeftActions}

        {onReset && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleResetClick}
            title={isAr ? "إفراغ الحقول الحالية وإعادة ضبط النموذج" : "Reset form fields to initial state"}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
              confirmReset
                ? "border-rose-400 bg-rose-50 text-rose-800"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>
              {confirmReset
                ? isAr
                  ? "تأكيد تفريغ الحقول؟"
                  : "Confirm Clear Form?"
                : isAr
                ? "إعادة تعيين"
                : "Reset Form"}
            </span>
          </button>
        )}

        {onCancel && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onCancel}
            title={isAr ? "إغلاق النموذج دون حفظ التعديلات الحالية" : "Close form without saving"}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>{isAr ? "إلغاء" : "Cancel"}</span>
          </button>
        )}

        {onValidate && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onValidate}
            title={isAr ? "التحقق من صحة الحقول وتوازن القيد والفترة المالية" : "Validate fields, balance and fiscal period"}
            className="px-3.5 py-2 rounded-xl border border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "تحقق من البيانات" : "Validate"}</span>
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {onSaveDraft && (
          <PermissionGate page={pagePermissionKey} action="create" language={language}>
            <button
              type="button"
              disabled={isSubmitting || disabled}
              title={disabledTooltip}
              onClick={onSaveDraft}
              className="px-4 py-2 rounded-xl border border-amber-300 bg-amber-100 hover:bg-amber-200 text-amber-900 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-amber-700" />
              )}
              <span>{isAr ? saveDraftLabelAr : saveDraftLabelEn}</span>
            </button>
          </PermissionGate>
        )}

        {onSaveAndNew && (
          <PermissionGate page={pagePermissionKey} action="create" language={language}>
            <button
              type="button"
              disabled={isSubmitting || disabled}
              title={disabledTooltip}
              onClick={onSaveAndNew}
              className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
              <span>{isAr ? saveAndNewLabelAr : saveAndNewLabelEn}</span>
            </button>
          </PermissionGate>
        )}

        <PermissionGate page={pagePermissionKey} action={requiredAction} language={language}>
          <button
            type={submitButtonType}
            disabled={isSubmitting || disabled}
            title={disabledTooltip}
            onClick={submitButtonType === "button" ? onPrimarySubmit : undefined}
            className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>{isAr ? primarySubmitLabelAr : primarySubmitLabelEn}</span>
          </button>
        </PermissionGate>
      </div>
    </div>
  );
};

export default FormActions;
