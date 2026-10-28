import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { ItemCategory } from "../types";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import {
  Boxes, Warehouse, Calculator, Network, Sliders, FileBarChart,
  CheckCircle2, Plus
} from "lucide-react";

interface WarehouseOperationsModuleProps {
  initialTab?:
    | "items"
    | "warehouses"
    | "stock_count"
    | "stock_transfers"
    | "stock_adjustments"
    | "stock_valuation";
  language?: "ar" | "en";
}

export default function WarehouseOperationsModule({
  initialTab = "items",
  language = "ar"
}: WarehouseOperationsModuleProps) {
  const isAr = language === "ar";
  const {
    items,
    warehouses,
    batches,
    costLayers,
    inventoryAdjustments,
    stockTransfers,
    addItem,
    addWarehouse,
    addInventoryAdjustment,
    addStockTransfer,
    updateDocumentWorkflowStatus,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showForm, setShowForm] = useState(false);

  // Item Form
  const [itemName, setItemName] = useState("");
  const [itemNameAr, setItemNameAr] = useState("");
  const [sku, setSku] = useState("RAW-NEW-01");
  const [category, setCategory] = useState<ItemCategory>(ItemCategory.GreenCoffee);
  const [unit, setUnit] = useState("kg");
  const [cost, setCost] = useState<number>(25);
  const [price, setPrice] = useState<number>(45);

  // Warehouse Form
  const [whName, setWhName] = useState("");
  const [whNameAr, setWhNameAr] = useState("");
  const [whLocation, setWhLocation] = useState("");

  // Transfer Form
  const [fromWh, setFromWh] = useState("wh-1");
  const [toWh, setToWh] = useState("wh-2");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [qty, setQty] = useState<number>(20);
  const [notes, setNotes] = useState("");

  // Adjustment Form
  const [adjType, setAdjType] = useState<"Addition" | "Deduction">("Addition");

  // Physical Count state
  const [countedMap, setCountedMap] = useState<Record<string, number>>({});

  React.useEffect(() => {
    setActiveTab(initialTab);
    setShowForm(false);
  }, [initialTab]);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    addItem({
      name: itemName || itemNameAr,
      nameAr: itemNameAr || itemName,
      sku,
      category,
      unit,
      cost,
      price,
      barcode: `628100${Math.floor(10000 + Math.random() * 90000)}`
    });
    setShowForm(false);
  };

  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    addWarehouse({
      name: whName || whNameAr,
      nameAr: whNameAr || whName,
      location: whLocation
    });
    setShowForm(false);
    addToast({ type: "success", message: "تم إضافة المستودع الجديد بنجاح" });
  };

  const handleCreateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find((i) => i.id === selectedItemId);
    if (!itm || qty <= 0) return;

    addStockTransfer({
      date: new Date().toISOString().split("T")[0],
      fromWarehouseId: fromWh,
      toWarehouseId: toWh,
      itemId: itm.id,
      itemName: isAr ? itm.nameAr : itm.name,
      quantity: qty,
      notes: notes || "تحويل مخزني داخلي بين المستودعات"
    });
    setShowForm(false);
    addToast({ type: "success", message: "تم إنشاء إذن التحويل المخزني، يمكنك اعتماده وترحيله الآن" });
  };

  const handleCreateAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find((i) => i.id === selectedItemId);
    if (!itm || qty <= 0) return;

    addInventoryAdjustment({
      date: new Date().toISOString().split("T")[0],
      warehouseId: fromWh,
      itemId: itm.id,
      itemName: isAr ? itm.nameAr : itm.name,
      type: adjType,
      quantity: qty,
      costPerUnit: itm.cost || 20,
      notes: notes || "تسوية فروقات جرد مخزني"
    });
    setShowForm(false);
    addToast({ type: "success", message: "تم تسجيل مسودة تسوية المخزون، يمكنك اعتمادها لترحيل القيد المحاسبي" });
  };

  const totalInventoryValuation = batches.reduce((sum, b) => sum + b.quantity * b.costPerUnit, 0);

  const itemCols: ColumnDef[] = [
    { key: "sku", header: "رمز SKU", headerEn: "SKU", render: (v) => <span className="font-mono font-bold text-teal-800">{v}</span> },
    { key: "nameAr", header: "اسم الصنف", headerEn: "Item Name" },
    { key: "category", header: "التصنيف", headerEn: "Category" },
    { key: "unit", header: "الوحدة", headerEn: "Unit", render: (v) => <span className="font-mono">{v}</span> },
    { key: "cost", header: "التكلفة المعيارية", headerEn: "Unit Cost", render: (v) => <span className="font-mono">SAR {Number(v).toFixed(2)}</span> },
    { key: "price", header: "سعر البيع", headerEn: "Selling Price", render: (v) => <span className="font-mono font-bold">SAR {Number(v).toFixed(2)}</span> },
    {
      key: "currentStock",
      header: "الرصيد الفعلي (FIFO)",
      headerEn: "Current Stock",
      render: (v, row) => (
        <span className="font-mono font-black text-slate-900">
          {Number(v).toLocaleString()} {row.unit}
        </span>
      )
    }
  ];

  const transferCols: ColumnDef[] = [
    { key: "id", header: "رقم التحويل", headerEn: "Transfer ID", render: (v) => <span className="font-mono font-bold">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "itemName", header: "الصنف", headerEn: "Item" },
    {
      key: "fromWarehouseId",
      header: "من مستودع",
      headerEn: "From Warehouse",
      render: (v) => warehouses.find((w) => w.id === v)?.nameAr || v
    },
    {
      key: "toWarehouseId",
      header: "إلى مستودع",
      headerEn: "To Warehouse",
      render: (v) => warehouses.find((w) => w.id === v)?.nameAr || v
    },
    { key: "quantity", header: "الكمية", headerEn: "Quantity", render: (v) => <span className="font-mono font-bold">{v}</span> },
    { key: "workflowStatus", header: "الحالة", headerEn: "Status" },
    {
      key: "actions",
      header: "اعتماد النقل",
      headerEn: "Approve",
      render: (_, row) =>
        row.workflowStatus !== "Posted" ? (
          <button
            type="button"
            onClick={() => {
              updateDocumentWorkflowStatus("stockTransfer", row.id, "Posted", "Approved warehouse transfer");
              addToast({ type: "success", message: `تم اعتماد وتنفيذ التحويل المخزني ${row.id}!` });
            }}
            className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "اعتماد وتنفيذ" : "Post Transfer"}</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-emerald-700 font-bold">✓ مرحل</span>
        )
    }
  ];

  const adjustmentCols: ColumnDef[] = [
    { key: "id", header: "رقم التسوية", headerEn: "Adjustment ID", render: (v) => <span className="font-mono font-bold">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "itemName", header: "الصنف", headerEn: "Item" },
    {
      key: "type",
      header: "نوع التسوية",
      headerEn: "Type",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${v === "Addition" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
          {v === "Addition" ? (isAr ? "إضافة فائض (+)" : "Addition (+)") : (isAr ? "خصم عجز/تالف (-)" : "Deduction (-)")}
        </span>
      )
    },
    { key: "quantity", header: "الكمية", headerEn: "Qty", render: (v) => <span className="font-mono font-bold">{v}</span> },
    { key: "costPerUnit", header: "تكلفة الوحدة", headerEn: "Unit Cost", render: (v) => <span className="font-mono">SAR {v}</span> },
    { key: "workflowStatus", header: "الحالة", headerEn: "Status" },
    {
      key: "actions",
      header: "اعتماد وترحيل القيد",
      headerEn: "Post GL",
      render: (_, row) =>
        row.workflowStatus !== "Posted" ? (
          <button
            type="button"
            onClick={() => {
              updateDocumentWorkflowStatus("inventoryAdjustment", row.id, "Posted", "Approved adjustment");
              addToast({
                type: "success",
                message: `تم اعتماد التسوية ${row.id} وتحديث المخزون وترحيل القيد المحاسبي المزدوج!`
              });
            }}
            className="px-2.5 py-1 rounded bg-teal-700 text-white text-xs font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "اعتماد وترحيل القيد" : "Approve & Post GL"}</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-emerald-700 font-bold">✓ مرحل للأستاذ</span>
        )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="العمليات المخزنية المتقدمة وتقييم طبقات FIFO"
        titleEn="Warehouse Operations, Physical Count & FIFO Valuation"
        description="إدارة دليل الأصناف، مواقع المستودعات، الجرد الفعلي، التحويلات المخزنية، التسويات المحاسبية، وتقييم طبقات التكلفة."
        descriptionEn="Manage master items, warehouse locations, physical stock counts, inter-warehouse transfers, GL adjustments, and FIFO cost layers."
        icon={Boxes}
        breadcrumbs={[
          { label: "المستودعات والمخزون", labelEn: "Inventory & Warehouses" },
          { label: "العمليات والتقييم المخزني", labelEn: "Warehouse Operations", active: true }
        ]}
        language={language}
      />

      <GlobalActionBar
        onNew={
          ["items", "warehouses", "stock_transfers", "stock_adjustments"].includes(activeTab)
            ? () => setShowForm(true)
            : undefined
        }
        newLabelAr={
          activeTab === "items"
            ? "إضافة صنف جديد"
            : activeTab === "warehouses"
            ? "إضافة مستودع جديد"
            : activeTab === "stock_transfers"
            ? "إنشاء تحويل مخزني"
            : "إنشاء تسوية مخزون"
        }
        newLabelEn="New Record"
        pageId="inventory"
        language={language}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: "items", ar: "دليل الأصناف", en: "Items Master", icon: Boxes },
          { id: "warehouses", ar: "المستودعات والمواقع", en: "Warehouses", icon: Warehouse },
          { id: "stock_count", ar: "الجرد الفعلي للمخزون", en: "Physical Stock Count", icon: Calculator },
          { id: "stock_transfers", ar: "تحويلات المستودعات", en: "Stock Transfers", icon: Network },
          { id: "stock_adjustments", ar: "تسويات المخزون", en: "Stock Adjustments", icon: Sliders },
          { id: "stock_valuation", ar: "تقييم طبقات FIFO", en: "FIFO Stock Valuation", icon: FileBarChart }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

      {/* Forms */}
      {showForm && activeTab === "items" && (
        <form onSubmit={handleCreateItem} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {isAr ? "تسجيل صنف جديد بدليل الأصناف" : "Add New Catalog Item"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <input
              type="text"
              placeholder={isAr ? "اسم الصنف بالعربية *" : "Arabic Name *"}
              value={itemNameAr}
              onChange={(e) => setItemNameAr(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            />
            <input
              type="text"
              placeholder="SKU *"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemCategory)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            >
              {Object.values(ItemCategory).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={isAr ? "الوحدة (kg / pcs / pouch)" : "Unit"}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
            />
            <input
              type="number"
              step="0.01"
              placeholder={isAr ? "التكلفة المعيارية" : "Unit Cost"}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
            />
            <input
              type="number"
              step="0.01"
              placeholder={isAr ? "سعر البيع" : "Selling Price"}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold">
              {isAr ? "حفظ الصنف" : "Save Item"}
            </button>
          </div>
        </form>
      )}

      {showForm && activeTab === "warehouses" && (
        <form onSubmit={handleCreateWarehouse} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {isAr ? "إضافة مستودع أو موقع تخزيني جديد" : "Add New Warehouse Location"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <input
              type="text"
              placeholder={isAr ? "اسم المستودع بالعربية *" : "Warehouse Name (AR) *"}
              value={whNameAr}
              onChange={(e) => setWhNameAr(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            />
            <input
              type="text"
              placeholder={isAr ? "الاسم بالإنجليزية" : "Warehouse Name (EN)"}
              value={whName}
              onChange={(e) => setWhName(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
            />
            <input
              type="text"
              placeholder={isAr ? "العنوان / المنطقة الصناعية *" : "Location *"}
              value={whLocation}
              onChange={(e) => setWhLocation(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold">
              {isAr ? "حفظ المستودع" : "Save Warehouse"}
            </button>
          </div>
        </form>
      )}

      {showForm && (activeTab === "stock_transfers" || activeTab === "stock_adjustments") && (
        <form
          onSubmit={activeTab === "stock_transfers" ? handleCreateTransfer : handleCreateAdjustment}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {activeTab === "stock_transfers"
              ? isAr
                ? "تحرير إذن تحويل مخزني بين المستودعات"
                : "New Inter-Warehouse Stock Transfer"
              : isAr
              ? "تحرير سند تسوية مخزنية (فائض / عجز)"
              : "New Inventory Adjustment"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            >
              <option value="">{isAr ? "-- اختر الصنف --" : "-- Select Item --"}</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {isAr ? i.nameAr : i.name} ({i.currentStock} {i.unit})
                </option>
              ))}
            </select>

            <select
              value={fromWh}
              onChange={(e) => setFromWh(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {isAr ? w.nameAr : w.name}
                </option>
              ))}
            </select>

            {activeTab === "stock_transfers" ? (
              <select
                value={toWh}
                onChange={(e) => setToWh(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {isAr ? `إلى: ${w.nameAr}` : `To: ${w.name}`}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                <option value="Addition">{isAr ? "إضافة فائض جرد (+)" : "Addition (+)"}</option>
                <option value="Deduction">{isAr ? "خصم عجز / هالك (-)" : "Deduction (-)"}</option>
              </select>
            )}

            <input
              type="number"
              min={1}
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold">
              {isAr ? "حفظ المستند" : "Save Document"}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {activeTab === "items" && <ERPTable data={items} columns={itemCols} language={language} />}

        {activeTab === "warehouses" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warehouses.map((wh) => {
              const whBatches = batches.filter((b) => b.warehouseId === wh.id && b.quantity > 0);
              const whVal = whBatches.reduce((s, b) => s + b.quantity * b.costPerUnit, 0);
              return (
                <div key={wh.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900 text-sm">{isAr ? wh.nameAr : wh.name}</span>
                    <span className="font-mono text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      {wh.id}
                    </span>
                  </div>
                  <p className="text-slate-500">{wh.location}</p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? "عدد التشغيلات النشطة:" : "Active Batches:"}</span>
                    <span className="font-mono font-bold">{whBatches.length} Lots</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? "قيمة المخزون بالمستودع:" : "Warehouse Valuation:"}</span>
                    <span className="font-mono font-black text-teal-800">
                      SAR {whVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "stock_count" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {isAr ? "ورقة عمل الجرد الفعلي ومطابقة الأرصدة الدفترية" : "Physical Inventory Count Worksheet"}
            </h3>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-right">SKU</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "الصنف" : "Item"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "الرصيد الدفتري (System)" : "System Qty"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "العدد الفعلي (Physical)" : "Physical Count"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "الفرق (Variance)" : "Variance"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "تسوية تلقائية" : "Reconcile"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((itm) => {
                  const physical = countedMap[itm.id] ?? itm.currentStock;
                  const diff = Math.round((physical - itm.currentStock) * 100) / 100;
                  return (
                    <tr key={itm.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold">{itm.sku}</td>
                      <td className="py-2.5 px-3 font-bold">{isAr ? itm.nameAr : itm.name}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">
                        {itm.currentStock} {itm.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={physical}
                          onChange={(e) => setCountedMap((prev) => ({ ...prev, [itm.id]: Number(e.target.value) }))}
                          className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
                        />
                      </td>
                      <td className={`py-2.5 px-3 font-mono font-bold ${diff === 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {diff > 0 ? `+${diff}` : diff} {itm.unit}
                      </td>
                      <td className="py-2.5 px-3">
                        {diff !== 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              addInventoryAdjustment({
                                date: new Date().toISOString().split("T")[0],
                                warehouseId: "wh-1",
                                itemId: itm.id,
                                itemName: isAr ? itm.nameAr : itm.name,
                                type: diff > 0 ? "Addition" : "Deduction",
                                quantity: Math.abs(diff),
                                costPerUnit: itm.cost || 20,
                                notes: "تسوية جرد فعلي"
                              });
                              setActiveTab("stock_adjustments");
                            }}
                            className="px-2.5 py-1 rounded bg-teal-700 text-white font-bold"
                          >
                            {isAr ? "توليد سند تسوية" : "Create Adjustment"}
                          </button>
                        ) : (
                          <span className="font-mono text-emerald-700">✓ متطابق</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "stock_transfers" && (
          <ERPTable data={stockTransfers} columns={transferCols} language={language} />
        )}

        {activeTab === "stock_adjustments" && (
          <ERPTable data={inventoryAdjustments} columns={adjustmentCols} language={language} />
        )}

        {activeTab === "stock_valuation" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  {isAr ? "تقرير تقييم طبقات التكلفة (FIFO Cost Layers Valuation)" : "FIFO Cost Layers Valuation Report"}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr
                    ? "يتم تقييم كل تشغيلة على حدة وفق تاريخ ورودها وتكلفتها الفعلية."
                    : "Each batch is valued chronologically by actual acquisition/production unit cost."}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-500 block">
                  {isAr ? "إجمالي تقييم المخزون الفعلي:" : "Total FIFO Valuation:"}
                </span>
                <span className="text-lg font-black font-mono text-teal-800">
                  SAR {totalInventoryValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-right">{isAr ? "رقم التشغيلة (Batch)" : "Batch Number"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "الصنف" : "Item"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "المستودع" : "Warehouse"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "تاريخ الورود/الإنتاج" : "Received Date"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "الكمية المتبقية" : "Remaining Qty"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "تكلفة الوحدة" : "Unit Cost"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "إجمالي قيمة الطبقة" : "Layer Value (SAR)"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {batches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-teal-800">{b.batchNumber}</td>
                    <td className="py-2.5 px-3 font-bold">{b.itemName}</td>
                    <td className="py-2.5 px-3">{warehouses.find((w) => w.id === b.warehouseId)?.nameAr || b.warehouseId}</td>
                    <td className="py-2.5 px-3 font-mono">{b.manufactureDate}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">{b.quantity}</td>
                    <td className="py-2.5 px-3 font-mono">SAR {b.costPerUnit.toFixed(2)}</td>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-900">
                      SAR {(b.quantity * b.costPerUnit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
