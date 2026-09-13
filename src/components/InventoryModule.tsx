import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { ItemCategory, Currency, DocumentWorkflowStatus } from "../types";
import { 
  Package, Tag, Plus, Barcode, Landmark, ShieldCheck, 
  Trash2, Calendar, MapPin, Eye, X, ArrowLeftRight, Check, AlertTriangle, Play 
} from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import StatusBadge from "./common/StatusBadge";
import ConfirmDialog from "./common/ConfirmDialog";

interface InventoryModuleProps {
  language?: "ar" | "en";
}

export default function InventoryModule({ language = "ar" }: InventoryModuleProps) {
  const isAr = language === "ar";
  const { 
    items, batches, warehouses, addItem, updateItem, deleteItem, 
    inventoryAdjustments, addInventoryAdjustment, stockTransfers, addStockTransfer,
    updateDocumentWorkflowStatus, addToast 
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<
    "catalog" | "lots" | "adjustments" | "transfers" | "barcodes"
  >("catalog");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // Form Fields for Catalog SKU
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.GreenCoffee);
  const [cost, setCost] = useState(0);
  const [price, setPrice] = useState(0);
  const [unit, setUnit] = useState("kg");
  const [selectedBarcodeId, setSelectedBarcodeId] = useState(items[0]?.id || "");

  // Form Fields for Adjustments
  const [adjItemId, setAdjItemId] = useState("");
  const [adjQty, setAdjQty] = useState(0);
  const [adjType, setAdjType] = useState<"Addition" | "Reduction">("Reduction");
  const [adjWarehouseId, setAdjWarehouseId] = useState("wh-1");
  const [adjNotes, setAdjNotes] = useState("");
  const [showAdjForm, setShowAdjForm] = useState(false);

  // Form Fields for Transfers
  const [transItemId, setTransItemId] = useState("");
  const [transQty, setTransQty] = useState(0);
  const [transFromWh, setTransFromWh] = useState("wh-1");
  const [transToWh, setTransToWh] = useState("wh-2");
  const [transNotes, setTransNotes] = useState("");
  const [showTransForm, setShowTransForm] = useState(false);

  const selectedBarcodeItem = items.find(i => i.id === selectedBarcodeId);

  // Columns for Material Index
  const catalogColumns: ColumnDef[] = [
    { key: "sku", header: "رمز الصنف (SKU)", headerEn: "SKU Code" },
    { key: "nameAr", header: "اسم الصنف (عربي)", headerEn: "Description (Arabic)", editable: true },
    { key: "name", header: "الاسم بالإنجليزية", headerEn: "Description (English)", editable: true },
    { 
      key: "category", 
      header: "التصنيف", 
      headerEn: "Category",
      type: "select",
      options: [
        { value: ItemCategory.GreenCoffee, label: isAr ? "بن خام أخضر" : "Raw Green Coffee" },
        { value: ItemCategory.RawSpices, label: isAr ? "توابل خام" : "Raw Spices" },
        { value: ItemCategory.RoastedCoffee, label: isAr ? "بن محمص" : "Roasted Coffee" },
        { value: ItemCategory.ProcessedSpices, label: isAr ? "توابل معالجة" : "Processed Spices" },
        { value: ItemCategory.GroundCoffee, label: isAr ? "بن مطحون" : "Ground Coffee" },
        { value: ItemCategory.PackagingMaterial, label: isAr ? "مواد تغليف" : "Packaging Materials" },
        { value: ItemCategory.FinishedProduct, label: isAr ? "منتج نهائي معبأ" : "Finished Product Box" }
      ],
      render: (val: any) => {
        let label = val;
        if (val === ItemCategory.GreenCoffee) label = isAr ? "بن أخضر خام" : "Raw Green Coffee";
        if (val === ItemCategory.RawSpices) label = isAr ? "توابل خام" : "Raw Spices";
        if (val === ItemCategory.RoastedCoffee) label = isAr ? "بن محمص" : "Roasted Coffee";
        if (val === ItemCategory.ProcessedSpices) label = isAr ? "توابل معالجة" : "Processed Spices";
        if (val === ItemCategory.GroundCoffee) label = isAr ? "بن مطحون" : "Ground Coffee";
        if (val === ItemCategory.PackagingMaterial) label = isAr ? "مواد تغليف" : "Packaging Material";
        if (val === ItemCategory.FinishedProduct) label = isAr ? "منتج نهائي معبأ" : "Finished Product";
        return <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">{label}</span>;
      }
    },
    { 
      key: "cost", 
      header: "التكلفة المعيارية (ريال)", 
      headerEn: "Standard Cost",
      render: (val: any) => <span className="font-mono text-slate-500">SAR {Number(val).toFixed(2)}</span>
    },
    { 
      key: "price", 
      header: "سعر بيع التجزئة (ريال)", 
      headerEn: "Retail Price",
      render: (val: any) => <span className="font-mono text-teal-800 font-bold">{Number(val) > 0 ? `SAR ${Number(val).toFixed(2)}` : "—"}</span>
    },
    { 
      key: "currentStock", 
      header: "الرصيد المتاح", 
      headerEn: "Available Stock",
      render: (val: any, row: any) => (
        <span className={`font-mono font-black text-sm ${Number(val) < 100 ? "text-rose-600 animate-pulse" : "text-slate-800"}`}>
          {Number(val).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase">{row.unit}</span>
        </span>
      )
    }
  ];

  // Columns for FIFO Lot Batches
  const lotColumns: ColumnDef[] = [
    { key: "batchNumber", header: "رقم الوجبة / التشغيلة", headerEn: "Batch Number" },
    { key: "itemName", header: "اسم الصنف المالي", headerEn: "Product Description" },
    { key: "manufactureDate", header: "تاريخ الإنتاج / التوريد", headerEn: "Mfg Date", type: "date" },
    { key: "expiryDate", header: "تاريخ انتهاء الصلاحية", headerEn: "Expiry Date", type: "date" },
    { 
      key: "costPerUnit", 
      header: "تكلفة شراء الوحدة (ريال)", 
      headerEn: "Acquisition Cost",
      render: (val: any) => <span className="font-mono">SAR {Number(val).toFixed(2)}</span>
    },
    { 
      key: "quantity", 
      header: "الكمية المتبقية بالدفعة", 
      headerEn: "Quantity Remaining",
      render: (val: any) => <span className="font-mono font-extrabold text-slate-900">{Number(val).toLocaleString()} كجم</span>
    }
  ];

  const handleOpenEdit = (item: any) => {
    setEditingItem(item);
    setSku(item.sku);
    setName(item.name);
    setNameAr(item.nameAr);
    setCategory(item.category);
    setCost(item.cost);
    setPrice(item.price);
    setUnit(item.unit);
    setShowAddForm(true);
  };

  const handleCloseForm = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setSku("");
    setName("");
    setNameAr("");
    setCategory(ItemCategory.GreenCoffee);
    setCost(0);
    setPrice(0);
    setUnit("kg");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !nameAr.trim() || !name.trim()) {
      addToast({
        type: "warning",
        message: "يرجى إكمال جميع بيانات الحقول الإلزامية",
        messageEn: "Please fill all mandatory fields"
      });
      return;
    }

    if (editingItem) {
      updateItem(editingItem.id, { sku, name, nameAr, category, cost, price, unit });
    } else {
      addItem({
        sku, name, nameAr, category, cost, price, unit,
        barcode: `628${Math.floor(1000000000 + Math.random() * 9000000000)}`
      });
    }
    handleCloseForm();
  };

  const handleBulkDelete = (selected: any[]) => {
    selected.forEach(row => {
      deleteItem(row.id);
    });
  };

  // Adjustments handler
  const handlePostAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjItemId || adjQty <= 0) return;

    const res = addInventoryAdjustment({
      itemId: adjItemId,
      quantity: adjQty,
      type: adjType,
      warehouseId: adjWarehouseId,
      notes: adjNotes || "جرد مستودعات وتسوية يدوية",
      date: new Date().toISOString().split("T")[0]
    });

    if (res.success) {
      setAdjItemId("");
      setAdjQty(0);
      setAdjNotes("");
      setShowAdjForm(false);
      addToast({
        type: "success",
        message: "تم إنشاء قيد تسوية مخزنية بنجاح بانتظار الاعتماد والترحيل",
        messageEn: "Inventory adjustment created in Draft state"
      });
    } else {
      addToast({
        type: "error",
        message: res.error || "خطأ في إنشاء التسوية",
        messageEn: res.error || "Failed"
      });
    }
  };

  // Transfers handler
  const handlePostTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transItemId || transQty <= 0) return;
    if (transFromWh === transToWh) {
      addToast({
        type: "warning",
        message: "عذراً: مستودع المصدر لا يمكن أن يتطابق مع مستودع الوجهة",
        messageEn: "Source and destination warehouses cannot be identical"
      });
      return;
    }

    const res = addStockTransfer({
      itemId: transItemId,
      quantity: transQty,
      fromWarehouseId: transFromWh,
      toWarehouseId: transToWh,
      notes: transNotes || "تحويل خامات أو سلع تامة الصنع بين الأقسام",
      date: new Date().toISOString().split("T")[0]
    });

    if (res.success) {
      setTransItemId("");
      setTransQty(0);
      setTransNotes("");
      setShowTransForm(false);
      addToast({
        type: "success",
        message: "تم طلب أمر تحويل مخزني بنجاح وبانتظار الاعتماد والترحيل",
        messageEn: "Stock transfer requested in Draft state"
      });
    } else {
      addToast({
        type: "error",
        message: res.error || "فشل طلب أمر التحويل",
        messageEn: res.error || "Failed"
      });
    }
  };

  // Workflow executor
  const handleApplyWorkflow = (type: "inventoryAdjustment" | "stockTransfer", docId: string, next: DocumentWorkflowStatus) => {
    const res = updateDocumentWorkflowStatus(type, docId, next, "اعتماد رقابة المخازن والمحاسبة");
    if (res.success) {
      addToast({
        type: "success",
        message: `تم تحديث حالة المستند بنجاح إلى ${next} وتأثيره فورا بالدفاتر`,
        messageEn: `Document status updated to ${next}`
      });
    } else {
      addToast({
        type: "error",
        message: res.error || "فشل تحديث الحالة",
        messageEn: res.error || "Failed"
      });
    }
  };

  const triggerPrintBarcode = () => {
    if (!selectedBarcodeItem) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>ملصق باركود - ${selectedBarcodeItem.sku}</title>
          <style>
            body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px; background: white; text-align: center; }
            .label-card { border: 1.5px solid #000; padding: 15px; border-radius: 8px; width: 280px; }
            .item-title { font-size: 13px; font-weight: bold; margin-bottom: 3px; }
            .item-sku { font-size: 11px; color: #555; font-family: monospace; }
            .bars { display: flex; align-items: flex-end; height: 50px; justify-content: center; gap: 1.5px; border-bottom: 1.5px solid #000; margin: 10px 0; }
            .bar-line { height: 100%; background: #000; }
            .barcode-num { font-size: 11px; font-family: monospace; letter-spacing: 3px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="label-card">
            <div style="font-size: 9px; font-weight: bold; text-transform: uppercase;">نوفارو للمواد الغذائية</div>
            <div class="item-title">${selectedBarcodeItem.nameAr}</div>
            <div class="item-sku">SKU: ${selectedBarcodeItem.sku} | Price: SAR ${selectedBarcodeItem.price}</div>
            <div class="bars">
              ${selectedBarcodeItem.barcode.split("").map((num: string, idx: number) => {
                const width = parseInt(num) % 3 === 0 ? "3px" : parseInt(num) % 2 === 0 ? "2px" : "1px";
                const isWhite = idx % 3 === 0;
                return `<div class="bar-line" style="width: ${width}; background-color: ${isWhite ? "transparent" : "#000"};"></div>`;
              }).join("")}
            </div>
            <div class="barcode-num">${selectedBarcodeItem.barcode}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 text-right">
      
      {/* Standardized Page Header */}
      <PageHeader
        title="إدارة المخازن وسلاسل الإمداد وFIFO"
        titleEn="Warehouse & FIFO Inventory Management"
        description="كتالوج الأصناف، تتبع طبقات FIFO، التسويات الجردية، التحويلات بين المستودعات، وطباعة الباركود."
        descriptionEn="SKU catalog, FIFO valuation layers, inventory adjustments, multi-warehouse transfers, and barcode printing."
        icon={Package}
        breadcrumbs={[
          { label: "المخزون وسلاسل الإمداد", labelEn: "Inventory & Supply" },
          { 
            label: activeSubTab === "catalog" ? "كتالوج الأصناف" :
                   activeSubTab === "lots" ? "وجبات FIFO التتبعية" :
                   activeSubTab === "adjustments" ? "تسويات الجرد" :
                   activeSubTab === "transfers" ? "تحويلات المستودعات" : "استوديو الباركود",
            labelEn: activeSubTab === "catalog" ? "SKU Catalog" :
                     activeSubTab === "lots" ? "FIFO Lots" :
                     activeSubTab === "adjustments" ? "Adjustments" :
                     activeSubTab === "transfers" ? "Transfers" : "Barcodes",
            active: true 
          }
        ]}
        language={language}
        actions={
          <div className="flex items-center gap-2">
            {activeSubTab === "catalog" && (
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? (showAddForm ? "إغلاق النموذج" : "إضافة صنف مخزني") : (showAddForm ? "Close Form" : "Add SKU")}</span>
              </button>
            )}

            {activeSubTab === "adjustments" && (
              <button
                type="button"
                onClick={() => setShowAdjForm(!showAdjForm)}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? (showAdjForm ? "إغلاق النموذج" : "تسوية جردية جديدة") : (showAdjForm ? "Close Form" : "New Adjustment")}</span>
              </button>
            )}

            {activeSubTab === "transfers" && (
              <button
                type="button"
                onClick={() => setShowTransForm(!showTransForm)}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? (showTransForm ? "إغلاق النموذج" : "أمر تحويل مخزني") : (showTransForm ? "Close Form" : "New Transfer")}</span>
              </button>
            )}
          </div>
        }
      />

      {/* Standardized Secondary Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveSubTab("catalog")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "catalog" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "كتالوج المواد" : "Material Index"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("lots")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "lots" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "وجبات FIFO التتبعية" : "FIFO Lot Batches"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("adjustments")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "adjustments" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "تسويات الجرد" : "Stock Adjustments"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("transfers")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "transfers" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "تحويلات المستودعات" : "Warehouse Transfers"}
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab("barcodes")}
          className={`px-3.5 py-2 rounded-lg transition-all ${activeSubTab === "barcodes" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"}`}
        >
          {isAr ? "باركود المنتجات" : "Barcode Studio"}
        </button>
      </div>

      {/* 1. CATALOG FORM VIEW */}
      {showAddForm && activeSubTab === "catalog" && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 animate-fade-in text-right">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <button type="button" onClick={handleCloseForm} className="p-1 hover:bg-slate-100 rounded-full transition text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {editingItem ? (isAr ? `تعديل الصنف: ${editingItem.nameAr}` : `Edit SKU: ${editingItem.name}`) : (isAr ? "تعريف صنف مخزني جديد" : "Define New SKU")}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "رمز الصنف الفريد (SKU) *" : "Unique SKU *"}</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="GRN-ETH-HARAR"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الاسم التجاري بالعربية *" : "Arabic Description *"}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: بن إثيوبي هرر خام"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-right"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الاسم بالإنجليزية *" : "English Description *"}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ethiopia Harar Raw Bean"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "تصنيف مادة المخزن" : "Material Category"}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-right"
                required
              >
                <option value={ItemCategory.GreenCoffee}>{isAr ? "بن خام أخضر" : "Raw Green Coffee"}</option>
                <option value={ItemCategory.RawSpices}>{isAr ? "توابل خام أولية" : "Raw Spices"}</option>
                <option value={ItemCategory.RoastedCoffee}>{isAr ? "حبوب بن محمصة" : "Roasted Coffee"}</option>
                <option value={ItemCategory.ProcessedSpices}>{isAr ? "توابل معالجة" : "Processed Spices"}</option>
                <option value={ItemCategory.GroundCoffee}>{isAr ? "بن مطحون مسبقاً" : "Ground Coffee"}</option>
                <option value={ItemCategory.PackagingMaterial}>{isAr ? "مواد تعبئة وتغليف" : "Packaging Materials"}</option>
                <option value={ItemCategory.FinishedProduct}>{isAr ? "أكياس قهوة جاهزة للبيع" : "Finished Products"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "تكلفة الشراء المعيارية" : "Standard Unit Cost (SAR)"}</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                min="0"
                step="0.01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "سعر البيع النهائي للتجزئة" : "Retail Unit Price (SAR)"}</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-center font-mono"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-950 text-white font-bold rounded-xl text-xs hover:bg-slate-800 shadow-xs"
            >
              {editingItem ? (isAr ? "تحديث الصنف" : "Update") : (isAr ? "حفظ جديد" : "Create") }
            </button>
          </div>
        </form>
      )}

      {/* 2. INVENTORY ADJUSTMENTS FORM VIEW */}
      {showAdjForm && activeSubTab === "adjustments" && (
        <form onSubmit={handlePostAdjustment} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 animate-fade-in text-right text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <button type="button" onClick={() => setShowAdjForm(false)} className="p-1 hover:bg-slate-100 rounded-full transition text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {isAr ? "إنشاء مستند تسوية جردية" : "New Inventory Adjustment"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الصنف المراد تسويته" : "Item SKU *"}</label>
              <select
                value={adjItemId}
                onChange={(e) => setAdjItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                required
              >
                <option value="">{isAr ? "-- اختر الصنف --" : "-- Choose --"}</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>[{i.sku}] {isAr ? i.nameAr : i.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "نوع التسوية" : "Adjustment Type"}</label>
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as any)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                <option value="Reduction">{isAr ? "عجز وجرد (سحب/تقليل)" : "Reduction (Damaged/Shortage)"}</option>
                <option value="Addition">{isAr ? "فائض وجرد (إيداع/زيادة)" : "Addition (Surplus/Audit)"}</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "كمية التسوية الجردية (كجم)" : "Quantity *"}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={adjQty || ""}
                onChange={(e) => setAdjQty(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "المستودع المستهدف" : "Target Warehouse"}</label>
              <select
                value={adjWarehouseId}
                onChange={(e) => setAdjWarehouseId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{isAr ? w.nameAr : w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 block">{isAr ? "المبررات والأسباب التفصيلية للتسوية" : "Reason / Notes"}</label>
            <input
              type="text"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              placeholder={isAr ? "مثال: تلف بضاعة بسبب رطوبة أو تصفية جرد سنوي معتمد..." : "Damaged stock during roasting or general audit findings..."}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-right"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdjForm(false)}
              className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-teal-800 hover:bg-teal-700 text-white font-bold rounded-xl shadow-xs"
            >
              {isAr ? "إصدار مسودة تسوية" : "Create Draft"}
            </button>
          </div>
        </form>
      )}

      {/* 3. STOCK TRANSFERS FORM VIEW */}
      {showTransForm && activeSubTab === "transfers" && (
        <form onSubmit={handlePostTransfer} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 animate-fade-in text-right text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <button type="button" onClick={() => setShowTransForm(false)} className="p-1 hover:bg-slate-100 rounded-full transition text-slate-400">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-slate-800 text-sm">
              {isAr ? "طلب تحويل مخزني بين المستودعات" : "Request stock transfer"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الصنف المراد نقله" : "Product SKU *"}</label>
              <select
                value={transItemId}
                onChange={(e) => setTransItemId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
                required
              >
                <option value="">{isAr ? "-- اختر الصنف --" : "-- Choose --"}</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>[{i.sku}] {isAr ? i.nameAr : i.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "مستودع الشحن المصدر" : "From Warehouse"}</label>
              <select
                value={transFromWh}
                onChange={(e) => setTransFromWh(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{isAr ? w.nameAr : w.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "مستودع الاستلام الوجهة" : "To Warehouse"}</label>
              <select
                value={transToWh}
                onChange={(e) => setTransToWh(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{isAr ? w.nameAr : w.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الكمية المراد شحنها (كجم)" : "Transfer Quantity *"}</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={transQty || ""}
                onChange={(e) => setTransQty(parseFloat(e.target.value) || 0)}
                className="w-full p-2.5 rounded-lg border border-slate-200 text-center font-mono"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-500 block">{isAr ? "ملاحظات التحويل والجهة المستلمة" : "Transfer Memo / Description"}</label>
            <input
              type="text"
              value={transNotes}
              onChange={(e) => setTransNotes(e.target.value)}
              placeholder={isAr ? "مثال: توريد حبوب بن أخضر من المستودع للخزانات أو للمحمص..." : "Transferring green beans for roasting queue..."}
              className="w-full p-2.5 rounded-lg border border-slate-200 text-right"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowTransForm(false)}
              className="px-4 py-2 border border-slate-200 bg-white rounded-xl font-bold"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs"
            >
              {isAr ? "إصدار أمر الشحن" : "Issue Transfer"}
            </button>
          </div>
        </form>
      )}

      {/* 4. CHANNELS TAB CONTENT RENDERING */}
      {activeSubTab === "catalog" && (
        <div className="space-y-4">
          <ERPTable
            data={items}
            columns={catalogColumns}
            searchKeys={["sku", "nameAr", "name"]}
            searchPlaceholder={isAr ? "ابحث برمز SKU، الاسم بالعربية أو بالإنجليزية..." : "Search warehouse SKU items..."}
            language={language}
            title={isAr ? "كتالوج المواد وتكلفة المخازن المعيارية" : "Warehouse Stock Sheets"}
            exportFileName="warehouse_materials_catalog"
            onRowClick={(row) => handleOpenEdit(row)}
            onInlineSave={(row, field, value) => {
              updateItem(row.id, { [field]: value });
            }}
            bulkActions={[
              {
                label: isAr ? "حذف الأصناف المحددة" : "Delete Selected Materials",
                onClick: handleBulkDelete,
                className: "bg-rose-600 text-white hover:bg-rose-700",
                icon: Trash2
              }
            ]}
          />
        </div>
      )}

      {activeSubTab === "lots" && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4.5 h-4.5 text-teal-600" />
              <span className="font-bold text-slate-700">
                {isAr ? "نظام سحب وإخراج FIFO التلقائي نشط ومحمي محاسبياً" : "Automated FIFO dispatch sequence active & ledger locked"}
              </span>
            </div>
            <span className="text-[10px] bg-teal-50 text-teal-700 font-mono font-extrabold px-2 py-0.5 rounded border border-teal-150">
              {isAr ? "مضمون الصلاحية" : "Lot expiry audited"}
            </span>
          </div>

          <ERPTable
            data={batches.filter(b => b.quantity > 0)}
            columns={lotColumns}
            searchKeys={["batchNumber", "itemName"]}
            searchPlaceholder={isAr ? "ابحث برقم الوجبة أو اسم الصنف..." : "Search lot batches..."}
            language={language}
            title={isAr ? "لوائح وجبات تتبع المخازن FIFO" : "FIFO Lot Batches"}
            exportFileName="fifo_lots_tracking"
          />
        </div>
      )}

      {activeSubTab === "adjustments" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "طلبات التسويات الجردية المعتمدة والمعلقة" : "Inventory Adjustments Registry"}</h3>
          
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px]">
                <tr>
                  <th className="p-3 text-center">{isAr ? "تحديث الحالة والترحيل" : "Workflow Control"}</th>
                  <th className="p-3 text-right">{isAr ? "البيان والسبب" : "Adjustment Notes"}</th>
                  <th className="p-3 text-right">{isAr ? "المستودع" : "Warehouse"}</th>
                  <th className="p-3 text-right">{isAr ? "الكمية المضافة/المنقصة" : "Adj Quantity"}</th>
                  <th className="p-3 text-right">{isAr ? "اسم الصنف المالي" : "Item Description"}</th>
                  <th className="p-3 text-center">{isAr ? "حالة المستند" : "Status"}</th>
                  <th className="p-3 text-right">{isAr ? "رمز العملية" : "Ref ID"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {inventoryAdjustments.map((adj) => {
                  const targetItemObj = items.find(i => i.id === adj.itemId);
                  const isPosted = adj.workflowStatus === "Posted";
                  const isDraft = adj.workflowStatus === "Draft";

                  return (
                    <tr key={adj.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {isDraft && (
                            <>
                              <button
                                onClick={() => handleApplyWorkflow("inventoryAdjustment", adj.id, "Approved")}
                                className="px-2 py-1 text-[10px] font-black text-white bg-slate-950 rounded hover:bg-slate-800"
                              >
                                {isAr ? "اعتماد" : "Approve"}
                              </button>
                              <button
                                onClick={() => handleApplyWorkflow("inventoryAdjustment", adj.id, "Cancelled")}
                                className="px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 rounded"
                              >
                                {isAr ? "إلغاء" : "Cancel"}
                              </button>
                            </>
                          )}
                          {adj.workflowStatus === "Approved" && (
                            <button
                              onClick={() => handleApplyWorkflow("inventoryAdjustment", adj.id, "Posted")}
                              className="px-2.5 py-1 text-[10px] font-black text-white bg-teal-800 rounded hover:bg-teal-700 flex items-center gap-1 mx-auto"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isAr ? "ترحيل للدفاتر والمخازن" : "Post to GL & Stock"}</span>
                            </button>
                          )}
                          {isPosted && (
                            <span className="text-slate-400 italic text-[10px] font-bold">{isAr ? "مرحل ومقفل" : "Immutable"}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{adj.notes}</td>
                      <td className="p-3 font-bold text-slate-600">
                        {isAr ? (adj.warehouseId === "wh-1" ? "مستودع الخامات" : "مستودع التعبئة") : adj.warehouseId}
                      </td>
                      <td className={`p-3 font-mono font-black ${adj.type === "Addition" ? "text-emerald-600" : "text-rose-600"}`}>
                        {adj.type === "Addition" ? "+" : "-"}{adj.quantity} {targetItemObj?.unit}
                      </td>
                      <td className="p-3 font-black text-slate-800">
                        {isAr ? targetItemObj?.nameAr : targetItemObj?.name}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                          adj.workflowStatus === "Posted" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                          adj.workflowStatus === "Approved" ? "bg-teal-50 text-teal-700 border border-teal-150" :
                          adj.workflowStatus === "Draft" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {isAr ? (
                            adj.workflowStatus === "Posted" ? "مرحل ومقفل" :
                            adj.workflowStatus === "Approved" ? "معتمد ماليًا" :
                            adj.workflowStatus === "Draft" ? "مسودة تسوية" : "ملغى"
                          ) : adj.workflowStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-400">{adj.id}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "transfers" && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 animate-fade-in">
          <h3 className="font-extrabold text-slate-900 text-sm">{isAr ? "تحويلات المستودعات وأمر شحن الخامات" : "Warehouse Stock Transfers Registry"}</h3>
          
          <div className="overflow-x-auto border border-slate-150 rounded-xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 text-[10px]">
                <tr>
                  <th className="p-3 text-center">{isAr ? "إجراءات الترحيل والتسليم" : "Workflow Control"}</th>
                  <th className="p-3 text-right">{isAr ? "البيان والتعليق" : "Transfer Notes"}</th>
                  <th className="p-3 text-right">{isAr ? "إلى مستودع" : "To Wh"}</th>
                  <th className="p-3 text-right">{isAr ? "من مستودع" : "From Wh"}</th>
                  <th className="p-3 text-right">{isAr ? "الكمية المحولة" : "Quantity"}</th>
                  <th className="p-3 text-right">{isAr ? "اسم الصنف المالي" : "Item Description"}</th>
                  <th className="p-3 text-center">{isAr ? "حالة أمر الشحن" : "Status"}</th>
                  <th className="p-3 text-right">{isAr ? "رمز أمر التحويل" : "Transfer ID"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {stockTransfers.map((trans) => {
                  const targetItemObj = items.find(i => i.id === trans.itemId);
                  const isPosted = trans.workflowStatus === "Posted";
                  const isDraft = trans.workflowStatus === "Draft";

                  return (
                    <tr key={trans.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {isDraft && (
                            <>
                              <button
                                onClick={() => handleApplyWorkflow("stockTransfer", trans.id, "Approved")}
                                className="px-2 py-1 text-[10px] font-black text-white bg-slate-950 rounded hover:bg-slate-800"
                              >
                                {isAr ? "اعتماد" : "Approve"}
                              </button>
                              <button
                                onClick={() => handleApplyWorkflow("stockTransfer", trans.id, "Cancelled")}
                                className="px-2 py-1 text-[10px] font-bold text-rose-600 bg-rose-50 rounded"
                              >
                                {isAr ? "إلغاء" : "Cancel"}
                              </button>
                            </>
                          )}
                          {trans.workflowStatus === "Approved" && (
                            <button
                              onClick={() => handleApplyWorkflow("stockTransfer", trans.id, "Posted")}
                              className="px-2.5 py-1 text-[10px] font-black text-white bg-teal-800 rounded hover:bg-teal-700 flex items-center gap-1 mx-auto"
                            >
                              <Check className="w-3 h-3" />
                              <span>{isAr ? "تنفيذ الشحن والخصم الفوري" : "Dispatch Stock"}</span>
                            </button>
                          )}
                          {isPosted && (
                            <span className="text-slate-400 italic text-[10px] font-bold">{isAr ? "شحن مكتمل ومرحل" : "Dispatched"}</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{trans.notes}</td>
                      <td className="p-3 font-bold text-slate-600">
                        {isAr ? (trans.toWarehouseId === "wh-1" ? "مستودع الخامات" : "مستودع المنتجات") : trans.toWarehouseId}
                      </td>
                      <td className="p-3 font-bold text-slate-600">
                        {isAr ? (trans.fromWarehouseId === "wh-1" ? "مستودع الخامات" : "مستودع المنتجات") : trans.fromWarehouseId}
                      </td>
                      <td className="p-3 font-mono font-black text-slate-800">
                        {trans.quantity} {targetItemObj?.unit}
                      </td>
                      <td className="p-3 font-black text-slate-800">
                        {isAr ? targetItemObj?.nameAr : targetItemObj?.name}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full ${
                          trans.workflowStatus === "Posted" ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                          trans.workflowStatus === "Approved" ? "bg-teal-50 text-teal-700 border border-teal-150" :
                          trans.workflowStatus === "Draft" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {isAr ? (
                            trans.workflowStatus === "Posted" ? "شحن مكتمل" :
                            trans.workflowStatus === "Approved" ? "بانتظار الشحن" :
                            trans.workflowStatus === "Draft" ? "مسودة تحويل" : "ملغى"
                          ) : trans.workflowStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-400">{trans.id}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "barcodes" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in text-xs text-right">
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm">{isAr ? "توليد ملصق الباركود" : "Barcode Generator"}</h3>
            <p className="text-slate-500">
              {isAr ? "اختر صنفاً جاهزاً للبيع لتوليد وتصدير كود EAN-13 الخاص به" : "Pick a retail product pouch to pre-render its scannable barcode label."}
            </p>

            <div className="space-y-1.5 pt-2">
              <label className="font-bold text-slate-500 block">{isAr ? "صنف التجزئة الجاهز" : "Finished Retail Product"}</label>
              <select
                value={selectedBarcodeId}
                onChange={(e) => setSelectedBarcodeId(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-white"
              >
                {items.filter(i => i.price > 0).map(i => (
                  <option key={i.id} value={i.id}>
                    [{i.sku}] {isAr ? i.nameAr : i.name}
                  </option>
                ))}
              </select>
            </div>

            {selectedBarcodeItem && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                <span className="text-[10px] font-mono font-bold text-teal-850 block uppercase">{isAr ? "تفاصيل الصنف" : "SKU Info"}</span>
                <div className="font-bold text-slate-800">{isAr ? selectedBarcodeItem.nameAr : selectedBarcodeItem.name}</div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100 mt-1">
                  <span>Price: SAR {selectedBarcodeItem.price}</span>
                  <span>SKU: {selectedBarcodeItem.sku}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col items-center justify-center space-y-5">
            <h3 className="font-extrabold text-slate-800 text-sm text-center w-full border-b border-slate-150 pb-3">
              {isAr ? "باركود المنتجات النشط بالتكامل الفوري مع الكاشير" : "Interactive EAN-13 Barcode Tag"}
            </h3>

            {selectedBarcodeItem ? (
              <div className="p-6 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center space-y-4 max-w-sm bg-slate-50/50 w-full">
                
                <div className="flex flex-col items-center bg-white p-5 rounded-lg border border-slate-200 shadow-xs w-full">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">NOVARO FOODS</span>
                  
                  <div className="flex items-end h-16 w-56 justify-center gap-[1.5px] px-2 border-b border-slate-800">
                    {selectedBarcodeItem.barcode.split("").map((num, idx) => {
                      const width = parseInt(num) % 3 === 0 ? "w-[4px]" : parseInt(num) % 2 === 0 ? "w-[2px]" : "w-[1px]";
                      const isWhite = idx % 3 === 0;
                      return (
                        <div 
                          key={idx} 
                          className={`h-full ${isWhite ? "bg-transparent" : "bg-slate-900"} ${width}`}
                        ></div>
                      );
                    })}
                  </div>

                  <div className="text-sm font-mono tracking-[4px] mt-2 text-slate-800 font-bold">{selectedBarcodeItem.barcode}</div>
                </div>

                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-slate-700">{isAr ? selectedBarcodeItem.nameAr : selectedBarcodeItem.name}</span>
                  <p className="text-[10px] text-slate-400 leading-normal">
                    {isAr 
                      ? "يتكامل هذا الكود تلقائياً مع نظام الكاشير ونقاط البيع POS. مسح الكود يحمّل السعر المعياري فوراً." 
                      : "Scanning this decodes to pull product metadata and prices instantly during checkout checkout."
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={triggerPrintBarcode}
                  className="px-4 py-1.5 bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition shadow-xs flex items-center gap-1"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>{isAr ? "طباعة ملصق الباركود" : "Print Barcode Tag"}</span>
                </button>

              </div>
            ) : (
              <p className="text-xs text-slate-400">{isAr ? "يرجى اختيار صنف من القائمة الجانبية" : "Please select product item."}</p>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
