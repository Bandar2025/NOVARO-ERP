import React from "react";
import { FolderOpen, Plus } from "lucide-react";

interface EmptyStateProps {
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actionLabel?: string;
  actionLabelEn?: string;
  onAction?: () => void;
  language?: "ar" | "en";
  className?: string;
}

export default function EmptyState({
  title,
  titleEn,
  description,
  descriptionEn,
  icon: Icon = FolderOpen,
  actionLabel,
  actionLabelEn,
  onAction,
  language = "ar",
  className = ""
}: EmptyStateProps) {
  const isAr = language === "ar";
  const displayTitle = isAr ? title : (titleEn || title);
  const displayDesc = isAr ? description : (descriptionEn || description);
  const displayAction = isAr ? actionLabel : (actionLabelEn || actionLabel);

  return (
    <div
      className={`p-10 text-center flex flex-col items-center justify-center bg-white border border-dashed border-slate-300 rounded-2xl max-w-lg mx-auto my-6 ${className}`}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-4 shadow-2xs">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>

      <h3 className="text-base font-bold text-slate-800 mb-1">
        {displayTitle}
      </h3>

      {displayDesc && (
        <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-5">
          {displayDesc}
        </p>
      )}

      {onAction && displayAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-sm shadow-teal-700/20 transition-all flex items-center gap-1.5 active:scale-98"
        >
          <Plus className="w-4 h-4" />
          <span>{displayAction}</span>
        </button>
      )}
    </div>
  );
}
