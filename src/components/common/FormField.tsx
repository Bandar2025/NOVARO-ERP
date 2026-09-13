import React from "react";
import { AlertCircle } from "lucide-react";

interface FormFieldProps {
  label: string;
  labelEn?: string;
  required?: boolean;
  error?: string | null;
  helperText?: string;
  helperTextEn?: string;
  hint?: string;
  hintEn?: string;
  children: React.ReactNode;
  language?: "ar" | "en";
  className?: string;
  id?: string;
}

export default function FormField({
  label,
  labelEn,
  required = false,
  error,
  helperText,
  helperTextEn,
  hint,
  hintEn,
  children,
  language = "ar",
  className = "",
  id
}: FormFieldProps) {
  const isAr = language === "ar";
  const effectiveHelper = helperText || hint;
  const effectiveHelperEn = helperTextEn || hintEn;
  const displayLabel = isAr ? label : (labelEn || label);
  const displayHelper = isAr ? effectiveHelper : (effectiveHelperEn || effectiveHelper);

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={id}
        className="block font-bold text-xs text-slate-700 select-none"
      >
        <span>{displayLabel}</span>
        {required && (
          <span className="text-rose-500 font-black mr-1 ml-1" title="مطلوب">*</span>
        )}
      </label>

      <div className="relative">{children}</div>

      {error ? (
        <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </p>
      ) : displayHelper ? (
        <p className="text-[11px] text-slate-400 mt-1">
          {displayHelper}
        </p>
      ) : null}
    </div>
  );
}
