import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  message?: string;
  messageEn?: string;
  language?: "ar" | "en";
  type?: "spinner" | "table-skeleton" | "cards-skeleton";
  rows?: number;
  className?: string;
}

export default function LoadingState({
  message,
  messageEn,
  language = "ar",
  type = "spinner",
  rows = 5,
  className = ""
}: LoadingStateProps) {
  const isAr = language === "ar";
  const defaultMessage = isAr ? "جاري معالجة البيانات..." : "Processing data...";
  const displayMessage = isAr ? (message || defaultMessage) : (messageEn || message || defaultMessage);

  if (type === "table-skeleton") {
    return (
      <div className={`space-y-3 p-4 bg-white border border-slate-200 rounded-xl animate-pulse ${className}`}>
        <div className="h-9 bg-slate-100 rounded-lg w-full mb-4"></div>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-none">
            <div className="h-4 bg-slate-100 rounded-sm w-16"></div>
            <div className="h-4 bg-slate-100 rounded-sm flex-1"></div>
            <div className="h-4 bg-slate-100 rounded-sm w-28"></div>
            <div className="h-4 bg-slate-100 rounded-sm w-20"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards-skeleton") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse ${className}`}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="h-4 bg-slate-100 rounded-sm w-24"></div>
            <div className="h-7 bg-slate-100 rounded-md w-36"></div>
            <div className="h-3 bg-slate-100 rounded-sm w-48"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-teal-700 animate-spin mb-3" />
      <span className="text-xs font-bold text-slate-600 font-mono tracking-wide">
        {displayMessage}
      </span>
    </div>
  );
}
