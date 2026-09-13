import React from "react";
import { Search, SlidersHorizontal, RefreshCw, X } from "lucide-react";

interface ActionBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  filteredCount?: number;
  filterComponent?: React.ReactNode;
  rightActions?: React.ReactNode;
  onResetFilters?: () => void;
  isFiltered?: boolean;
  language?: "ar" | "en";
  className?: string;
}

export default function ActionBar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
  totalCount,
  filteredCount,
  filterComponent,
  rightActions,
  onResetFilters,
  isFiltered = false,
  language = "ar",
  className = ""
}: ActionBarProps) {
  const isAr = language === "ar";
  const defaultPlaceholder = isAr ? "🔎 بحث في السجلات..." : "🔎 Search records...";

  return (
    <div
      className={`bg-white border border-slate-250 rounded-xl p-3 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${className}`}
    >
      {/* Left / Leading Region: Search & Filter Controls */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder || defaultPlaceholder}
              className="w-full pr-9 pl-8 py-2 text-xs bg-slate-50 border border-slate-250 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-slate-800 placeholder:text-slate-400 font-medium"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {filterComponent}

        {isFiltered && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="px-2.5 py-2 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1 whitespace-nowrap"
          >
            <X className="w-3 h-3" />
            <span>{isAr ? "مسح التصفية" : "Reset"}</span>
          </button>
        )}
      </div>

      {/* Right / Trailing Region: Record Counts & Contextual Actions */}
      <div className="flex items-center gap-3 justify-between sm:justify-end">
        {totalCount !== undefined && (
          <div className="text-xs text-slate-500 font-mono font-medium whitespace-nowrap">
            {isFiltered && filteredCount !== undefined ? (
              <span>
                {isAr ? "النتائج:" : "Matches:"}{" "}
                <strong className="text-teal-700 font-bold">{filteredCount}</strong>{" "}
                {isAr ? "من أصل" : "of"}{" "}
                <span className="text-slate-700">{totalCount}</span>
              </span>
            ) : (
              <span>
                {isAr ? "إجمالي السجلات:" : "Total Records:"}{" "}
                <strong className="text-slate-800 font-bold">{totalCount}</strong>
              </span>
            )}
          </div>
        )}

        {rightActions && (
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}
