import React, { useState } from "react";
import { 
  Search, SlidersHorizontal, RefreshCw, X, Plus, Save, Edit, 
  Trash2, Printer, Download, ArrowRight, ArrowLeft, MoreVertical, 
  CheckCircle2, RotateCcw, Filter
} from "lucide-react";

export interface ActionItem {
  id: string;
  labelAr: string;
  labelEn: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "success" | "ghost";
  disabled?: boolean;
  permissionRequired?: boolean;
}

interface GlobalActionBarProps {
  // Search & Filters
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  totalCount?: number;
  filteredCount?: number;
  filterComponent?: React.ReactNode;
  onResetFilters?: () => void;
  isFiltered?: boolean;

  // Primary & Secondary Actions
  onBack?: () => void;
  backLabelAr?: string;
  backLabelEn?: string;

  onNew?: () => void;
  newLabelAr?: string;
  newLabelEn?: string;
  newDisabled?: boolean;

  onSave?: () => void;
  saveLabelAr?: string;
  saveLabelEn?: string;
  saveDisabled?: boolean;

  onEdit?: () => void;
  editLabelAr?: string;
  editLabelEn?: string;
  editDisabled?: boolean;

  onDelete?: () => void;
  deleteLabelAr?: string;
  deleteLabelEn?: string;
  deleteDisabled?: boolean;
  showDelete?: boolean;

  onRefresh?: () => void;
  onPrint?: () => void;
  onExport?: () => void;

  // Custom extra actions
  extraActions?: ActionItem[];

  language?: "ar" | "en";
  className?: string;
}

export default function GlobalActionBar({
  searchQuery = "",
  onSearchChange,
  searchPlaceholder,
  totalCount,
  filteredCount,
  filterComponent,
  onResetFilters,
  isFiltered = false,

  onBack,
  backLabelAr = "رجوع",
  backLabelEn = "Back",

  onNew,
  newLabelAr = "إضافة جديد",
  newLabelEn = "New",
  newDisabled = false,

  onSave,
  saveLabelAr = "حفظ",
  saveLabelEn = "Save",
  saveDisabled = false,

  onEdit,
  editLabelAr = "تعديل",
  editLabelEn = "Edit",
  editDisabled = false,

  onDelete,
  deleteLabelAr = "حذف",
  deleteLabelEn = "Delete",
  deleteDisabled = false,
  showDelete = false,

  onRefresh,
  onPrint,
  onExport,

  extraActions = [],

  language = "ar",
  className = ""
}: GlobalActionBarProps) {
  const isAr = language === "ar";
  const defaultSearchPlaceholder = isAr ? "🔎 بحث متقدم في السجلات..." : "🔎 Advanced record search...";
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const BackIcon = isAr ? ArrowRight : ArrowLeft;

  // Close More Menu on outside click or ESC key
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMoreMenuOpen(false);
      }
    };
    if (moreMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [moreMenuOpen]);

  const hasSecondaryActions = Boolean(onRefresh || onPrint || onExport || extraActions.length > 0);

  return (
    <div
      className={`sticky top-14 z-10 bg-white/95 backdrop-blur-md border border-slate-250 rounded-xl p-3 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${className}`}
    >
      {/* Left / Search & Filter Region */}
      <div className="flex items-center gap-2 flex-1 max-w-xl">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            title={isAr ? backLabelAr : backLabelEn}
            className="px-2.5 py-2 rounded-lg border border-slate-250 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <BackIcon className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">{isAr ? backLabelAr : backLabelEn}</span>
          </button>
        )}

        {onSearchChange && (
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder || defaultSearchPlaceholder}
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
            <span className="hidden sm:inline">{isAr ? "مسح التصفية" : "Reset"}</span>
          </button>
        )}
      </div>

      {/* Right / Record Counts & Contextual Actions */}
      <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
        {totalCount !== undefined && (
          <div className="text-xs text-slate-500 font-mono font-medium whitespace-nowrap hidden sm:block">
            {isFiltered && filteredCount !== undefined ? (
              <span>
                {isAr ? "النتائج:" : "Matches:"}{" "}
                <strong className="text-teal-700 font-bold">{filteredCount}</strong>{" "}
                {isAr ? "من أصل" : "of"}{" "}
                <span className="text-slate-700">{totalCount}</span>
              </span>
            ) : (
              <span>
                {isAr ? "الإجمالي:" : "Total:"}{" "}
                <strong className="text-slate-800 font-bold">{totalCount}</strong>
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              title={isAr ? "تحديث" : "Refresh"}
              className="p-2 rounded-lg border border-slate-250 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {onPrint && (
            <button
              type="button"
              onClick={onPrint}
              title={isAr ? "طباعة" : "Print"}
              className="p-2 rounded-lg border border-slate-250 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}

          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title={isAr ? "تصدير" : "Export"}
              className="p-2 rounded-lg border border-slate-250 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {/* More Dropdown Menu */}
          {hasSecondaryActions && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                title={isAr ? "المزيد من الإجراءات" : "More Actions"}
                className="p-2 rounded-lg border border-slate-250 text-slate-700 bg-white hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-2xs"
              >
                <MoreVertical className="w-4 h-4" />
                <span className="text-xs font-bold hidden sm:inline">{isAr ? "المزيد" : "More"}</span>
              </button>

              {moreMenuOpen && (
                <div className={`absolute ${isAr ? "left-0" : "right-0"} mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-fade-in`}>
                  <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {isAr ? "الإجراءات والعمليات" : "Actions & Operations"}
                  </div>
                  {onRefresh && (
                    <button
                      type="button"
                      onClick={() => { onRefresh(); setMoreMenuOpen(false); }}
                      className="w-full text-right px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? "تحديث البيانات" : "Refresh Data"}</span>
                    </button>
                  )}
                  {onPrint && (
                    <button
                      type="button"
                      onClick={() => { onPrint(); setMoreMenuOpen(false); }}
                      className="w-full text-right px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? "طباعة المستند" : "Print Document"}</span>
                    </button>
                  )}
                  {onExport && (
                    <button
                      type="button"
                      onClick={() => { onExport(); setMoreMenuOpen(false); }}
                      className="w-full text-right px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>{isAr ? "تصدير السجلات" : "Export Records"}</span>
                    </button>
                  )}
                  {extraActions.map((act) => {
                    const ActIcon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => { act.onClick(); setMoreMenuOpen(false); }}
                        disabled={act.disabled}
                        className="w-full text-right px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition-colors disabled:opacity-50"
                      >
                        {ActIcon && <ActIcon className="w-3.5 h-3.5 text-slate-500" />}
                        <span>{isAr ? act.labelAr : act.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              disabled={editDisabled}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Edit className="w-3.5 h-3.5 text-slate-500" />
              <span>{isAr ? editLabelAr : editLabelEn}</span>
            </button>
          )}

          {showDelete && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleteDisabled}
              className="px-3 py-2 rounded-lg text-xs font-bold border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-50 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isAr ? deleteLabelAr : deleteLabelEn}</span>
            </button>
          )}

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={saveDisabled}
              className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isAr ? saveLabelAr : saveLabelEn}</span>
            </button>
          )}

          {onNew && (
            <button
              type="button"
              onClick={onNew}
              disabled={newDisabled}
              className="px-4 py-2 rounded-lg text-xs font-black text-white bg-teal-700 hover:bg-teal-800 disabled:opacity-50 transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? newLabelAr : newLabelEn}</span>
            </button>
          )}

          {/* Extra Actions */}
          {extraActions.map((act) => {
            const ActIcon = act.icon;
            const getVariantClass = () => {
              switch (act.variant) {
                case "primary": return "bg-teal-700 text-white hover:bg-teal-800";
                case "success": return "bg-emerald-600 text-white hover:bg-emerald-700";
                case "danger": return "bg-rose-600 text-white hover:bg-rose-700";
                case "secondary":
                default: return "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50";
              }
            };
            return (
              <button
                key={act.id}
                type="button"
                onClick={act.onClick}
                disabled={act.disabled}
                className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs ${getVariantClass()} ${act.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {ActIcon && <ActIcon className="w-3.5 h-3.5" />}
                <span>{isAr ? act.labelAr : act.labelEn}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
