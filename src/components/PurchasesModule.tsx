import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { PurchaseOrderItem } from "../types";
import { Plus, Check, Trash2, Printer, Truck, Calendar, Sparkles } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface PurchasesModuleProps {
  language?: "ar" | "en";
}

export default function PurchasesModule({ language = "ar" }: PurchasesModuleProps) {
  const isAr = language === "ar";
  const { suppliers, purchaseOrders, items, addPurchaseOrder, receivePurchaseOrder, addToast } = useAppState();

  // State
  const [showNewPO, setShowNewPO] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [poItems, setPoItems] = useState<Omit<PurchaseOrderItem, "total">[]>([
    { itemId: "", itemName: "", quantity: 0, price: 0 }
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected PO for Actions
  const [selectedPO, setSelectedPO] = useState<any | null>(null);

  // Columns definition for ERPTable
  const columns: ColumnDef[] = [
    { key: "id", header: "رقم طلب الشراء", headerEn: "PO Reference" },
    { key: "date", header: "تاريخ الطلب", headerEn: "Issue Date", type: "date" },
    { key: "supplierName", header: "المورد", headerEn: "Vendor / Supplier" },
    { 
      key: "totalAmount", 
      header: "المجموع (ريال)", 
      headerEn: "Total (SAR)",
      render: (val: any) => <span className="font-bold font-mono text-slate-800">SAR {Number(val).toLocaleString()}</span>
    },
    { 
      key: "status", 
      header: "حالة الشحنة", 
      headerEn: "Cargo Status",
      type: "select",
      options: [
        { value: "Draft", label: isAr ? "تحت التوريد" : "In Transit / Draft" },
        { value: "Received", label: isAr ? "مستلم ومخزن" : "Received" }
      ],
      render: (val: any) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
          val === "Received" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-amber-50 text-amber-700 border-amber-200"
        }`}>
          {val === "Received" ? (isAr ? "مستلم ومفروز" : "Received") : (isAr ? "تحت التوريد" : "Draft / Transit")}
        </span>
      )
    }
  ];

  const handleItemChange = (index: number, field: keyof Omit<PurchaseOrderItem, "total">, value: any) => {
    const updated = [...poItems];
    if (field === "itemId") {
      const dbItem = items.find(i => i.id === value);
      updated[index].itemId = value;
      updated[index].itemName = dbItem ? (isAr ? dbItem.nameAr : dbItem.name) : "";
      updated[index].price = dbItem ? dbItem.cost : 0;
    } else if (field === "quantity" || field === "price") {
      updated[index][field] = parseFloat(value) || 0;
    }
    setPoItems(updated);
  };

  const addRow = () => {
    setPoItems([...poItems, { itemId: "", itemName: "", quantity: 0, price: 0 }]);
  };

  const removeRow = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedSupplierId) {
      setErrorMessage(isAr ? "يرجى تحديد مورد المواد الخام أولاً" : "Please select supplier first");
      return;
    }

    const invalidRow = poItems.some(i => !i.itemId || i.quantity <= 0 || i.price <= 0);
    if (invalidRow) {
      setErrorMessage(isAr ? "يرجى التحقق من صحة الكميات وأسعار شراء البنود" : "All rows must have valid item, quantity, and cost");
      return;
    }

    const targetSupplier = suppliers.find(s => s.id === selectedSupplierId);
    const finalItems = poItems.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = finalItems.reduce((acc, i) => acc + i.total, 0);

    addPurchaseOrder({
      supplierId: selectedSupplierId,
      supplierName: targetSupplier ? (isAr ? targetSupplier.nameAr : targetSupplier.name) : "",
      date: new Date().toISOString().split("T")[0],
      status: "Draft",
      items: finalItems,
      totalAmount
    });

    setShowNewPO(false);
    setPoItems([{ itemId: "", itemName: "", quantity: 0, price: 0 }]);
    setSelectedSupplierId("");

    addToast({
      type: "success",
      message: "تم إنشاء مسودة أمر الشراء بنجاح وجاري فحص الشحنة في الجمارك",
      messageEn: "Draft purchase order created successfully and pending cargo receipt"
    });
  };

  const handleReceivePO = (poId: string) => {
    const res = receivePurchaseOrder(poId);
    if (res.success) {
      addToast({
        type: "success",
        message: "تم فحص الشحنة واستلام البضاعة وتوزيعها على مستودعات المواد الخام وتعديل الأرصدة تلقائياً",
        messageEn: "Cargo received and allocated to stocks, ledger balances updated"
      });
      // Clear selection
      setSelectedPO(null);
    } else {
      addToast({
        type: "error",
        message: res.error || "فشل استلام الشحنة",
        messageEn: res.error || "Failed to receive cargo"
      });
    }
  };

  // Printable Purchase Order PDF pre-render
  const triggerPrintPO = (po: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = po.items.map((item: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 10px;">${item.itemName}</td>
        <td style="padding: 10px; text-align: center; font-family: monospace;">${item.quantity} كجم</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">SAR ${item.price.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold;">SAR ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join("");

    printWindow.document.write(`
      <html dir="${isAr ? "rtl" : "ltr"}">
        <head>
          <title>أمر شراء رسمي - ${po.id}</title>
          <style>
            body { font-family: 'IBM Plex Sans Arabic', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f766e; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 25px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            .items-table th { background: #1e293b; color: white; padding: 12px; text-align: ${isAr ? "right" : "left"}; }
            .summary-table { float: ${isAr ? "left" : "right"}; width: 300px; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            .summary-table td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
            .footer { margin-top: 150px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body onload="window.print()">
          <table class="header-table">
            <tr>
              <td class="title">NOVARO ERP - نـوفـارو</td>
              <td style="text-align: ${isAr ? "left" : "right"}; font-size: 13px; font-weight: bold;">
                <div>أمر شراء وتوريد مواد أولية</div>
                <div style="color: #64748b; font-size: 11px; margin-top: 3px;">Official Purchase Order</div>
              </td>
            </tr>
          </table>

          <div class="meta-box">
            <table style="width:100%; font-size:13px;">
              <tr>
                <td><strong>رقم أمر الشراء:</strong> ${po.id}</td>
                <td><strong>تاريخ التحرير:</strong> ${po.date}</td>
              </tr>
              <tr>
                <td><strong>المورد المعتمد:</strong> ${po.supplierName}</td>
                <td><strong>حالة التوريد:</strong> ${po.status === "Received" ? "مستلم وتمت التسوية" : "قيد الشحن والتوريد"}</td>
              </tr>
            </table>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>الصنف المطلوب</th>
                <th style="text-align: center; width: 100px;">الكمية</th>
                <th style="text-align: right; width: 120px;">تكلفة الوحدة</th>
                <th style="text-align: right; width: 120px;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr style="font-weight: bold; font-size: 15px; color: #0f766e; background: #f1f5f9;">
              <td style="padding: 10px;">إجمالي تكلفة الشراء</td>
              <td style="text-align: right; padding: 10px; font-family: monospace;">SAR ${po.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>مستودعات مصنع معالجة البن والتوابل - نوفارو للأغذية</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest font-mono">
            {isAr ? "سلسلة الإمداد والمشتريات والجمارك" : "SUPPLY CHAIN, PROCUREMENT & INVENTORY BILLING"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-teal-700" />
            {isAr ? "طلبات ومشتريات المواد الخام" : "Procurement & Purchase Orders (PO)"}
          </h1>
        </div>

        <button
          onClick={() => setShowNewPO(!showNewPO)}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? "إصدار أمر شراء جديد" : "Issue Purchase Order"}</span>
        </button>
      </div>

      {/* New Purchase Order Form */}
      {showNewPO && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base">
              {isAr ? "تحرير طلب شراء وتوريد خارجي" : "Draft Raw Purchase Order"}
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-150 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {isAr ? "سريان أسعار الشراء والخصومات مفعل" : "Pricing Schedule & Freight Rates Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">
                {isAr ? "المورد المعتمد للمواد الخام" : "Certified Raw Supplier"}
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              >
                <option value="">{isAr ? "-- اختر المورد --" : "-- Choose Vendor --"}</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>
                    {isAr ? s.nameAr : s.name} ({s.address})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Allocation of items */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-500 uppercase block">
              {isAr ? "تفاصيل البضاعة المطلوبة" : "Cargo Allocation Line items"}
            </label>

            {poItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <select
                    value={item.itemId}
                    onChange={(e) => handleItemChange(idx, "itemId", e.target.value)}
                    className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                    required
                  >
                    <option value="">{isAr ? "-- اختر مادة خام --" : "-- Select Raw Material --"}</option>
                    {items.filter(i => i.price === 0).map(i => (
                      <option key={i.id} value={i.id}>
                        [{i.sku}] {isAr ? i.nameAr : i.name} (تكلفة معيارية: {i.cost} ر.س)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-32 space-y-1">
                  <input
                    type="number"
                    placeholder={isAr ? "الوزن (كجم)" : "Weight (kg)"}
                    value={item.quantity || ""}
                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                    className="w-full text-xs p-2 rounded border border-slate-200 bg-white text-center font-mono"
                    min="1"
                    required
                  />
                </div>

                <div className="w-36 space-y-1">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder={isAr ? "التكلفة (ريال)" : "Cost (SAR)"}
                      value={item.price || ""}
                      onChange={(e) => handleItemChange(idx, "price", e.target.value)}
                      className="w-full text-xs p-2 rounded border border-slate-200 bg-white text-center font-mono"
                      step="0.01"
                      required
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-bold">ر.س</span>
                  </div>
                </div>

                <div className="w-28 text-center text-xs font-mono font-bold text-slate-600 bg-slate-100 p-2 rounded">
                  {Number(item.quantity * item.price).toLocaleString()} ر.س
                </div>

                {poItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg transition"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "إضافة بند توريد" : "Add procurement item"}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowNewPO(false);
                setPoItems([{ itemId: "", itemName: "", quantity: 0, price: 0 }]);
                setSelectedSupplierId("");
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
            >
              {isAr ? "إلغاء التحرير" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition shadow-xs"
            >
              {isAr ? "حفظ كمسودة أمر شراء" : "Draft Purchase Order"}
            </button>
          </div>
        </form>
      )}

      {/* Purchase Orders List */}
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4.5 h-4.5 text-teal-600" />
            <span className="font-bold text-slate-700">
              {isAr ? "نظام التدقيق الجمركي واستلام الشحنات الفوري نشط" : "Procurement lot audit and quick receipts enabled"}
            </span>
          </div>
        </div>

        <ERPTable
          data={purchaseOrders}
          columns={columns}
          searchKeys={["id", "supplierName"]}
          searchPlaceholder={isAr ? "ابحث برقم أمر الشراء أو المورد..." : "Search purchase orders..."}
          language={language}
          title={isAr ? "أوامر الشراء والتوريد" : "Purchase Orders & Procurement"}
          exportFileName="purchase_orders_report"
          onRowClick={(row) => setSelectedPO(row)}
          quickActions={
            selectedPO && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => triggerPrintPO(selectedPO)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-100 transition flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? "طباعة تفويض الشراء" : "Print PO"}</span>
                </button>
                {selectedPO.status === "Draft" && (
                  <button
                    onClick={() => handleReceivePO(selectedPO.id)}
                    className="px-3 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>{isAr ? "تفريع الشحنة بالمخازن" : "Receive Cargo"}</span>
                  </button>
                )}
              </div>
            )
          }
        />
      </div>
    </div>
  );
}
