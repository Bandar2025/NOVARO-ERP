import React from "react";
import {
  Calendar,
  Filter,
  RotateCcw,
  RefreshCw,
  Printer,
  FileSpreadsheet,
  Download
} from "lucide-react";

export interface ReportToolbarProps {
  language?: "ar" | "en";
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (val: string) => void;
  onEndDateChange?: (val: string) => void;
  selectedPeriodId?: string;
  periods?: { id: string; name: string; startDate: string; endDate: string }[];
  onPeriodChange?: (periodId: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  searchPlaceholderAr?: string;
  searchPlaceholderEn?: string;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  onPrint?: () => void;
  onExportCsv?: () => void;
  onExportJson?: () => void;
  extraFilters?: React.ReactNode;
}

export const ReportToolbar: React.FC<ReportToolbarProps> = ({
  language = "ar",
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedPeriodId,
  periods = [],
  onPeriodChange,
  searchQuery,
  onSearchChange,
  searchPlaceholderAr = "بحث في بنود التقرير...",
  searchPlaceholderEn = "Search report lines...",
  onResetFilters,
  onRefresh,
  onPrint,
  onExportCsv,
  onExportJson,
  extraFilters
}) => {
  const isAr = language === "ar";

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden"
    >
      {/* Left / Start: Date Range, Fiscal Period & Search Filters */}
      <div className="flex flex-wrap items-center gap-2.5">
        {periods.length > 0 && onPeriodChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-teal-700" />
            <span className="font-bold text-slate-600">{isAr ? "الفترة:" : "Period:"}</span>
            <select
              value={selectedPeriodId || ""}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none"
            >
              <option value="">{isAr ? "كل الفترات المالية" : "All Fiscal Periods"}</option>
              {periods.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.startDate} → {p.endDate})
                </option>
              ))}
            </select>
          </div>
        )}

        {onStartDateChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="font-bold text-slate-500">{isAr ? "من:" : "From:"}</span>
            <input
              type="date"
              value={startDate || ""}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
            />
          </div>
        )}

        {onEndDateChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
            <span className="font-bold text-slate-500">{isAr ? "إلى:" : "To:"}</span>
            <input
              type="date"
              value={endDate || ""}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent font-mono font-bold text-slate-900 focus:outline-none"
            />
          </div>
        )}

        {onSearchChange && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs min-w-[200px]">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery || ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={isAr ? searchPlaceholderAr : searchPlaceholderEn}
              className="bg-transparent w-full text-slate-900 font-semibold focus:outline-none"
            />
          </div>
        )}

        {extraFilters}

        {onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            title={isAr ? "إعادة تعيين الفلاتر" : "Reset Filters"}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isAr ? "مسح الفلاتر" : "Reset"}</span>
          </button>
        )}
      </div>

      {/* Right / End: Refresh, Print, Export CSV / JSON */}
      <div className="flex flex-wrap items-center gap-2">
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-teal-700" />
            <span>{isAr ? "تحديث" : "Refresh"}</span>
          </button>
        )}

        {onExportCsv && (
          <button
            type="button"
            onClick={onExportCsv}
            className="px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{isAr ? "تصدير CSV/Excel" : "Export CSV"}</span>
          </button>
        )}

        {onExportJson && (
          <button
            type="button"
            onClick={onExportJson}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
        )}

        {onPrint && (
          <button
            type="button"
            onClick={onPrint}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? "طباعة التقرير" : "Print Report"}</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ReportToolbar;
