import React, { useState, useMemo, useRef, useEffect } from "react";
import { 
  Search, SlidersHorizontal, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, 
  ChevronLeft, ChevronRight, Eye, EyeOff, FileSpreadsheet, Printer, RefreshCw, 
  Trash2, Edit, Check, X, MoreVertical, Layers, Download
} from "lucide-react";

export interface ColumnDef {
  key: string;
  header: string;
  headerEn?: string;
  render?: (value: any, row: any) => React.ReactNode;
  editable?: boolean;
  type?: "text" | "number" | "select" | "date";
  options?: { value: any; label: string }[];
  sortable?: boolean;
  width?: string;
}

interface ERPTableProps {
  data: any[];
  columns: ColumnDef[];
  searchKeys?: string[];
  searchPlaceholder?: string;
  onRowClick?: (row: any) => void;
  bulkActions?: { label: string; onClick: (rows: any[]) => void; className?: string; icon?: any }[];
  onInlineSave?: (row: any, updatedField: string, value: any) => void;
  exportFileName?: string;
  language?: "ar" | "en";
  title?: string;
  quickActions?: React.ReactNode;
}

export default function ERPTable({
  data,
  columns,
  searchKeys = [],
  searchPlaceholder = "بحث...",
  onRowClick,
  bulkActions,
  onInlineSave,
  exportFileName = "report",
  language = "ar",
  title = "بيانات النظام",
  quickActions
}: ERPTableProps) {
  const isAr = language === "ar";

  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => columns.map(c => c.key));
  const [showColumnChooser, setShowColumnChooser] = useState(false);
  const [sortKey, setSortKey] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRowIds, setSelectedRowIds] = useState<Record<string, boolean>>({});
  const [editingCell, setEditingCell] = useState<{ rowId: string; colKey: string; val: any } | null>(null);
  const [activeContextMenuRow, setActiveContextMenuRow] = useState<string | null>(null);

  // Column resizing state (simulated via CSS width multipliers)
  const [colWidths, setColWidths] = useState<Record<string, number>>({});

  // Reset pagination on search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Handle Sort
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Advanced Filters toggle
  const handleFilterChange = (key: string, val: string) => {
    setFilters(prev => ({ ...prev, [key]: val }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery("");
  };

  // Filter & Sort data
  const processedData = useMemo(() => {
    let result = [...data];

    // Global Search
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(row => {
        return searchKeys.some(k => {
          const val = row[k];
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Advanced Filters
    Object.entries(filters).forEach(([key, val]) => {
      if (!val) return;
      const filterVal = String(val).toLowerCase();
      result = result.filter(row => {
        const cellVal = row[key];
        if (cellVal === null || cellVal === undefined) return false;
        return String(cellVal).toLowerCase().includes(filterVal);
      });
    });

    // Sorting
    if (sortKey) {
      result.sort((a, b) => {
        let aVal = a[sortKey];
        let bVal = b[sortKey];

        // String conversion if needed
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();

        if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
        if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortKey, sortOrder, searchKeys]);

  // Paginated data
  const totalPages = Math.ceil(processedData.length / rowsPerPage) || 1;
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return processedData.slice(startIndex, startIndex + rowsPerPage);
  }, [processedData, currentPage, rowsPerPage]);

  // Selection handlers
  const toggleSelectRow = (rowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRowIds(prev => ({
      ...prev,
      [rowId]: !prev[rowId]
    }));
  };

  const toggleSelectAll = () => {
    const allOnPageSelected = paginatedData.every(row => selectedRowIds[row.id]);
    const updated: Record<string, boolean> = { ...selectedRowIds };
    
    paginatedData.forEach(row => {
      if (allOnPageSelected) {
        delete updated[row.id];
      } else {
        updated[row.id] = true;
      }
    });

    setSelectedRowIds(updated);
  };

  const selectedRowsList = useMemo(() => {
    return data.filter(row => selectedRowIds[row.id]);
  }, [data, selectedRowIds]);

  // Export to Excel / CSV with BOM
  const exportToExcel = () => {
    let headers = columns.filter(c => visibleColumns.includes(c.key)).map(c => isAr ? c.header : c.headerEn || c.header);
    let rows = processedData.map(row => {
      return columns
        .filter(c => visibleColumns.includes(c.key))
        .map(c => {
          const val = row[c.key];
          if (typeof val === "object" && val !== null) {
            return JSON.stringify(val);
          }
          return val;
        });
    });

    let csvContent = "\uFEFF"; // UTF-8 BOM for Arabic support
    csvContent += headers.join(",") + "\n";
    rows.forEach(rowArray => {
      let row = rowArray.map(val => {
        let text = String(val === undefined || val === null ? "" : val);
        // Escape commas and quotes
        if (text.includes(",") || text.includes('"') || text.includes("\n")) {
          text = '"' + text.replace(/"/g, '""') + '"';
        }
        return text;
      }).join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${exportFileName}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Handler
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const headersHtml = columns
      .filter(c => visibleColumns.includes(c.key))
      .map(c => `<th style="border:1px solid #cbd5e1; padding:8px; background-color:#f1f5f9; text-align:${isAr ? "right" : "left"};">${isAr ? c.header : c.headerEn || c.header}</th>`)
      .join("");

    const rowsHtml = processedData
      .map(row => {
        const cells = columns
          .filter(c => visibleColumns.includes(c.key))
          .map(c => `<td style="border:1px solid #cbd5e1; padding:8px;">${row[c.key] !== undefined && row[c.key] !== null ? row[c.key] : ""}</td>`)
          .join("");
        return `<tr>${cells}</tr>`;
      })
      .join("");

    printWindow.document.write(`
      <html dir="${isAr ? "rtl" : "ltr"}">
        <head>
          <title>${title}</title>
          <style>
            body { font-family: 'IBM Plex Sans Arabic', sans-serif; padding: 20px; color: #1e293b; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            h1 { font-size: 20px; color: #0f766e; margin-bottom: 5px; }
            .meta { font-size: 11px; color: #64748b; margin-bottom: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <h1>${title}</h1>
          <div class="meta">${isAr ? "تاريخ التصدير" : "Export Date"}: ${new Date().toLocaleString()} | ${isAr ? "إجمالي السجلات" : "Total Records"}: ${processedData.length}</div>
          <table>
            <thead><tr>${headersHtml}</tr></thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Inline edit handlers
  const startInlineEdit = (rowId: string, colKey: string, currentVal: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onInlineSave) return;
    setEditingCell({ rowId, colKey, val: currentVal });
  };

  const saveInlineEdit = () => {
    if (editingCell && onInlineSave) {
      const row = data.find(r => r.id === editingCell.rowId);
      if (row) {
        onInlineSave(row, editingCell.colKey, editingCell.val);
      }
    }
    setEditingCell(null);
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden relative">
      
      {/* Header Panel with search, chooser & prints */}
      <div className="p-4 md:p-5 bg-slate-50 border-b border-slate-200 flex flex-col gap-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 ${isAr ? "right-3" : "left-3"}`} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full text-sm py-2 px-3 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-primary ${isAr ? "pr-10" : "pl-10"}`}
            />
          </div>

          {/* Quick Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Quick action slot */}
            {quickActions}

            {/* Refresh */}
            <button 
              onClick={() => { setSearchQuery(""); setFilters({}); }}
              title={isAr ? "تحديث" : "Refresh"}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 transition shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Advanced Filters Toggle */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg border transition flex items-center gap-1.5 shadow-xs ${
                showAdvancedFilters || Object.values(filters).some(Boolean)
                  ? "bg-primary/5 text-primary border-primary/20"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isAr ? "تصفية متقدمة" : "Filters"}</span>
              {Object.values(filters).filter(Boolean).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-primary text-white text-[9px] flex items-center justify-center">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              )}
            </button>

            {/* Column Chooser Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowColumnChooser(!showColumnChooser)}
                className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-100 transition flex items-center gap-1.5 shadow-xs"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isAr ? "الأعمدة" : "Columns"}</span>
              </button>
              
              {showColumnChooser && (
                <div className={`absolute top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-30 p-2 text-xs ${isAr ? "left-0" : "right-0"}`}>
                  <div className="font-bold border-b border-slate-100 pb-1.5 mb-1.5 text-slate-500">
                    {isAr ? "تحديد الأعمدة" : "Toggle Columns"}
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {columns.map(c => (
                      <label key={c.key} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(c.key)}
                          onChange={() => {
                            setVisibleColumns(prev => 
                              prev.includes(c.key) 
                                ? prev.filter(k => k !== c.key)
                                : [...prev, c.key]
                            );
                          }}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <span className="font-medium text-slate-700">{isAr ? c.header : c.headerEn || c.header}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Excel Export */}
            <button
              onClick={exportToExcel}
              className="px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100/70 transition flex items-center gap-1.5 shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "تصدير إكسل" : "Excel"}</span>
            </button>

            {/* Print Report */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 text-xs font-semibold bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/15 transition flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isAr ? "طباعة" : "Print"}</span>
            </button>

          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvancedFilters && (
          <div className="p-3.5 bg-white border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-fade-in">
            {columns.filter(c => c.type).map(c => (
              <div key={c.key} className="space-y-1">
                <label className="font-bold text-slate-500 block">{isAr ? c.header : c.headerEn || c.header}</label>
                {c.type === "select" ? (
                  <select
                    value={filters[c.key] || ""}
                    onChange={(e) => handleFilterChange(c.key, e.target.value)}
                    className="w-full p-1.5 border border-slate-200 rounded bg-slate-50 text-xs focus:ring-1 focus:ring-primary"
                  >
                    <option value="">{isAr ? "الكل" : "All"}</option>
                    {c.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={c.type}
                    value={filters[c.key] || ""}
                    onChange={(e) => handleFilterChange(c.key, e.target.value)}
                    placeholder={`${isAr ? "تصفية بـ" : "Filter by"}...`}
                    className="w-full p-1.5 border border-slate-200 rounded bg-slate-50 text-xs focus:ring-1 focus:ring-primary"
                  />
                )}
              </div>
            ))}
            <div className="sm:col-span-2 md:col-span-4 flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={clearFilters}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-xs font-semibold transition"
              >
                {isAr ? "تصفير الفلاتر" : "Reset"}
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Panel if any row is selected */}
        {selectedRowsList.length > 0 && bulkActions && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between text-xs animate-slide-in">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center font-bold font-mono">
                {selectedRowsList.length}
              </span>
              <span className="font-bold text-amber-800">
                {isAr ? "سجلات محددة لإجراء جماعي" : "Records selected for bulk actions"}
              </span>
            </div>
            <div className="flex gap-2">
              {bulkActions.map((act, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    act.onClick(selectedRowsList);
                    setSelectedRowIds({});
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold shadow-xs flex items-center gap-1 transition ${
                    act.className || "bg-amber-600 text-white hover:bg-amber-700"
                  }`}
                >
                  {act.icon && <act.icon className="w-3.5 h-3.5" />}
                  <span>{act.label}</span>
                </button>
              ))}
              <button
                onClick={() => setSelectedRowIds({})}
                className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 rounded hover:bg-slate-100 transition text-xs font-semibold"
              >
                {isAr ? "إلغاء التحديد" : "Deselect"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Main Table Display */}
      <div className="overflow-x-auto min-h-[250px] relative">
        <table className="w-full text-right text-sm border-collapse">
          
          {/* Sticky Table Header */}
          <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10 shadow-xs">
            <tr>
              {/* Checkbox selector column */}
              <th className="p-3.5 w-12 text-center">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && paginatedData.every(row => selectedRowIds[row.id])}
                  onChange={toggleSelectAll}
                  className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                />
              </th>
              
              {/* Dynamic Columns */}
              {columns.filter(c => visibleColumns.includes(c.key)).map(col => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    style={{ minWidth: colWidths[col.key] || 120 }}
                    className={`p-3.5 cursor-pointer hover:bg-slate-200/60 transition group text-slate-700 relative`}
                  >
                    <div className={`flex items-center gap-1.5 ${isAr ? "justify-start" : "justify-end"}`}>
                      <span className="font-bold select-none">{isAr ? col.header : col.headerEn || col.header}</span>
                      
                      <div className="flex flex-col text-slate-400 group-hover:text-slate-600">
                        {isSorted ? (
                          sortOrder === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-60" />
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}

              {/* Context Action Header column */}
              <th className="p-3.5 w-16 text-center"></th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-150 font-sans">
            {paginatedData.map(row => {
              const isSelected = !!selectedRowIds[row.id];
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected ? "bg-amber-50/40 hover:bg-amber-50/60" : "hover:bg-slate-50/50"
                  }`}
                >
                  {/* Selection Checkbox */}
                  <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => toggleSelectRow(row.id, e as any)}
                      className="rounded text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                  </td>

                  {/* Columns Data */}
                  {columns.filter(c => visibleColumns.includes(c.key)).map(col => {
                    const isEditing = editingCell?.rowId === row.id && editingCell?.colKey === col.key;
                    const cellValue = row[col.key];

                    return (
                      <td
                        key={col.key}
                        className="p-3.5 text-slate-700 relative align-middle"
                        onClick={(e) => {
                          if (col.editable && onInlineSave) {
                            startInlineEdit(row.id, col.key, cellValue, e);
                          }
                        }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            {col.type === "select" ? (
                              <select
                                value={editingCell.val}
                                onChange={(e) => setEditingCell({ ...editingCell, val: e.target.value })}
                                className="p-1 border border-primary bg-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                autoFocus
                              >
                                {col.options?.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={col.type || "text"}
                                value={editingCell.val}
                                onChange={(e) => setEditingCell({ ...editingCell, val: e.target.value })}
                                className="p-1 border border-primary bg-white text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary font-mono w-24"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") saveInlineEdit();
                                  if (e.key === "Escape") cancelInlineEdit();
                                }}
                              />
                            )}
                            <button
                              onClick={saveInlineEdit}
                              className="p-1 bg-primary text-white rounded hover:bg-primary-dark transition"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelInlineEdit}
                              className="p-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span>
                              {col.render ? col.render(cellValue, row) : cellValue !== undefined && cellValue !== null ? String(cellValue) : "—"}
                            </span>
                            {col.editable && onInlineSave && (
                              <Edit className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-primary transition-opacity ml-1 flex-shrink-0" />
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Options contextual dots menu */}
                  <td className="p-3.5 text-center relative" onClick={(e) => e.stopPropagation()}>
                    <div className="relative">
                      <button
                        onClick={() => setActiveContextMenuRow(activeContextMenuRow === row.id ? null : row.id)}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {activeContextMenuRow === row.id && (
                        <div className={`absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-lg z-20 text-xs text-right py-1`}>
                          <button
                            onClick={() => {
                              onRowClick && onRowClick(row);
                              setActiveContextMenuRow(null);
                            }}
                            className="w-full text-right p-2 hover:bg-slate-50 flex items-center justify-between"
                          >
                            <span>{isAr ? "عرض التفاصيل" : "View Details"}</span>
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          {onInlineSave && columns.some(c => c.editable) && (
                            <button
                              onClick={(e) => {
                                const editableCol = columns.find(c => c.editable);
                                if (editableCol) {
                                  startInlineEdit(row.id, editableCol.key, row[editableCol.key], e);
                                }
                                setActiveContextMenuRow(null);
                              }}
                              className="w-full text-right p-2 hover:bg-slate-50 flex items-center justify-between"
                            >
                              <span>{isAr ? "تعديل سريع" : "Quick Edit"}</span>
                              <Edit className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {processedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + 2} className="text-center py-16 text-slate-400 text-xs">
                  {isAr ? "لا توجد سجلات مطابقة للبحث والتصفية" : "No matching records found"}
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      {/* Pagination Controls Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span>
            {isAr ? "عرض" : "Show"}
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="mx-1.5 p-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            {isAr ? "سجلات" : "records"}
          </span>
          <span className="border-r border-slate-200 h-4 hidden sm:block"></span>
          <span>
            {isAr ? `إجمالي السجلات: ${processedData.length}` : `Total records: ${processedData.length}`}
          </span>
        </div>

        {/* Navigation Arrow buttons */}
        <div className="flex items-center justify-center gap-1.5 self-center">
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 transition disabled:opacity-40"
            title={isAr ? "الصفحة الأولى" : "First Page"}
          >
            {isAr ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 transition disabled:opacity-40"
          >
            {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          
          <span className="font-bold text-slate-700 px-2 font-mono">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 transition disabled:opacity-40"
          >
            {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 bg-white border border-slate-200 rounded hover:bg-slate-100 transition disabled:opacity-40"
            title={isAr ? "الصفحة الأخيرة" : "Last Page"}
          >
            {isAr ? <ChevronsLeft className="w-4 h-4" /> : <ChevronsRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

    </div>
  );
}
