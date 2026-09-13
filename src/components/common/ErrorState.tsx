import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  errorCode?: string;
  onRetry?: () => void;
  language?: "ar" | "en";
  className?: string;
}

export default function ErrorState({
  title,
  titleEn,
  message,
  messageEn,
  errorCode,
  onRetry,
  language = "ar",
  className = ""
}: ErrorStateProps) {
  const isAr = language === "ar";
  const defaultTitle = isAr ? "تعذر إتمام العملية" : "Operation Failed";
  const displayTitle = isAr ? (title || defaultTitle) : (titleEn || title || defaultTitle);
  const displayMessage = isAr ? message : (messageEn || message);

  return (
    <div
      role="alert"
      className={`p-6 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-rose-900 my-4 shadow-2xs ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-extrabold text-sm text-rose-950">{displayTitle}</h4>
            {errorCode && (
              <span className="font-mono text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-sm font-bold">
                {errorCode}
              </span>
            )}
          </div>
          <p className="text-xs text-rose-800 leading-relaxed max-w-xl">
            {displayMessage}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 text-xs font-bold bg-white text-rose-800 hover:bg-rose-100 border border-rose-300 rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{isAr ? "إعادة المحاولة" : "Retry"}</span>
        </button>
      )}
    </div>
  );
}
