import React from "react";
import Breadcrumbs, { BreadcrumbItem } from "./Breadcrumbs";
import { Plus, Printer, Download, RefreshCw } from "lucide-react";

export interface PageAction {
  label: string;
  labelEn?: string;
  onClick: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "primary" | "secondary" | "destructive" | "ghost";
  disabled?: boolean;
  id?: string;
}

interface PageHeaderProps {
  title: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: React.ComponentType<{ className?: string }>;
  breadcrumbs?: BreadcrumbItem[];
  primaryAction?: PageAction;
  secondaryActions?: PageAction[];
  actions?: React.ReactNode;
  onPrint?: () => void;
  onExport?: () => void;
  onRefresh?: () => void;
  badge?: React.ReactNode;
  language?: "ar" | "en";
  className?: string;
}

export default function PageHeader({
  title,
  titleEn,
  description,
  descriptionEn,
  icon: Icon,
  breadcrumbs,
  primaryAction,
  secondaryActions = [],
  actions,
  onPrint,
  onExport,
  onRefresh,
  badge,
  language = "ar",
  className = ""
}: PageHeaderProps) {
  const isAr = language === "ar";
  const displayTitle = isAr ? title : (titleEn || title);
  const displayDescription = isAr ? description : (descriptionEn || description);

  return (
    <header className={`space-y-3 pb-5 border-b border-slate-250 ${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} language={language} />
      )}

      {/* Main Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Title & Description */}
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
              <Icon className="w-5 h-5" />
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {displayTitle}
              </h1>
              {badge}
            </div>
            {displayDescription && (
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
                {displayDescription}
              </p>
            )}
          </div>
        </div>

        {/* Actions Region */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
          {/* Quick Utility Icons */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title={isAr ? "تحديث البيانات" : "Refresh data"}
              className="p-2 rounded-lg border border-slate-250 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              title={isAr ? "طباعة" : "Print"}
              className="p-2 rounded-lg border border-slate-250 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title={isAr ? "تصدير البيانات" : "Export data"}
              className="p-2 rounded-lg border border-slate-250 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* Custom actions slot */}
          {actions}

          {/* Secondary Actions */}
          {secondaryActions.map((act, idx) => {
            const ActIcon = act.icon;
            return (
              <button
                key={idx}
                id={act.id}
                type="button"
                onClick={act.onClick}
                disabled={act.disabled}
                className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {ActIcon && <ActIcon className="w-3.5 h-3.5 text-slate-500" />}
                <span>{isAr ? act.label : (act.labelEn || act.label)}</span>
              </button>
            );
          })}

          {/* Primary Action */}
          {primaryAction && (
            <button
              id={primaryAction.id || "btn-primary-header-action"}
              type="button"
              onClick={primaryAction.onClick}
              disabled={primaryAction.disabled}
              className="px-4 py-2 rounded-lg text-xs font-black text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm shadow-teal-700/20 flex items-center gap-2 active:scale-98"
            >
              {primaryAction.icon ? (
                <primaryAction.icon className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>
                {isAr ? primaryAction.label : (primaryAction.labelEn || primaryAction.label)}
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
