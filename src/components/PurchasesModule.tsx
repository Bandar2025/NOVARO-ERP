import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { PurchaseOrderItem } from "../types";
import { Plus, Check, Trash2, Printer, Truck, Calendar, Eye, X, PackageCheck } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ConfirmDialog from "./common/ConfirmDialog";
import FormSection from "./common/FormSection";
import FormField from "./common/FormField";
import EmptyState from "./common/EmptyState";
import StatusBadge from "./common/StatusBadge";

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

  // Selected PO for preview
  const [selectedPO, setSelectedPO] = useState<any | null>(null);

  // Confirm receive cargo state
  const [poToReceive, setPoToReceive] = useState<any | null>(null);

  // Columns definition for ERPTable
  const columns: ColumnDef[] = [
    { key: "id", header: "رقم طلب الشراء", headerEn: "PO Reference" },
    { key: "date", header: "تاريخ الطلب", headerEn: "Issue Date", type: "date" },
    { key: "supplierName", header: "المورد", headerEn: "Vendor / Supplier" },
    { 
      key: "totalAmount", 
      header: "المجموع (ريال)", 
      headerEn: "Total (SAR)",
      render: (val: any) => (
        <span className="font-bold font-mono text-slate-800">
          SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: "status", 
      header: "حالة الشحنة", 
      headerEn: "Cargo Status",
      type: "select",
      options: [
        { value: "Draft", label: isAr ? "تحت التوريد" : "In Transit" },
        { value: "Received", label: isAr ? "مستلم ومخزن" : "Received" }
      ],
      render: (val: any) => (
        <StatusBadge status={val === "Received" ? "Received" : "InTransit"} language={language} size="sm" />
      )
    },
    {
      key: "actions",
      header: "الإجراءات",
      headerEn: "Actions",
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedPO(row)}
            title={isAr ? "معاينة أمر الشراء" : "Preview PO"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? "معاينة" : "View"}</span>
          </button>
          {row.status === "Draft" && (
            <button
              type="button"
              onClick={() => setPoToReceive(row)}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              <PackageCheck className="w-3 h-3" />
              <span>{isAr ? "استلام الشحنة" : "Receive"}</span>
            </button>
          )}
        </div>
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
      message: "تم إصدار أمر الشراء بنجاح وجاري فحص الشحنة في الجمارك والميناء",
      messageEn: "Purchase order created successfully and pending cargo receipt"
    });
  };

  const handleConfirmReceive = () => {
    if (!poToReceive) return;
    const res = receivePurchaseOrder(poToReceive.id);
    if (res.success) {
      addToast({
        type: "success",
        message: `تم فحص واستلام الشحنة #${poToReceive.id} وإيداع الكميات لمستودعات المواد الخام FIFO`,
        messageEn: `Cargo #${poToReceive.id} received and allocated to raw inventory`
      });
      setPoToReceive(null);
      setSelectedPO(null);
    } else {
      addToast({
        type: "error",
        message: res.error || "فشل استلام الشحنة",
        messageEn: res.error || "Failed to receive cargo"
      });
    }
  };

  const calculatedTotal = poItems.reduce((acc, i) => acc + ((i.quantity || 0) * (i.price || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="أوامر الشراء واستلام الشحنات"
        titleEn="Purchase Orders & Cargo Intake"
        description="إصدار أوامر التوريد ومتابعة وصول شحنات البن الأخضر ومواد التغليف والتخزين بمستودعات FIFO."
        descriptionEn="Manage supply orders, green coffee cargo tracking, and automated FIFO inventory intake."
        icon={Truck}
        breadcrumbs={[
          { label: "المشتريات والموردين", labelEn: "Purchases & SRM" },
          { label: "أوامر الشراء", labelEn: "Purchase Orders", active: true }
        ]}
        language={language}
      />

      {/* Global Action Bar */}
      <GlobalActionBar
        onNew={() => setShowNewPO(true)}
        newLabelAr="أمر شراء جديد"
        newLabelEn="New Purchase Order"
        pageId="purchases"
        totalCount={purchaseOrders.length}
        language={language}
      />

      {/* PO Creation Section */}
      {showNewPO && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <FormSection
            title={isAr ? "تحرير طلب شراء ومواد خام جديد" : "New Purchase Order Voucher"}
            description={isAr ? "حدد المورد المعتمد وأدخل بنود الشحنة المطلوبة" : "Select vendor and cargo items"}
            icon={Truck}
            language={language}
          >
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg mb-4">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <FormField label="مورد المواد الخام المعتمد" labelEn="Certified Raw Supplier" required language={language}>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                >
                  <option value="">{isAr ? "-- اختر المورد من الدليل --" : "-- Select Supplier --"}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isAr ? s.nameAr : s.name} ({s.address})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="تاريخ طلب التوريد" labelEn="Order Date" required language={language}>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono font-medium"
                />
              </FormField>
            </div>

            {/* Line items table */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  {isAr ? "بنود الشحنة والكميات وتكلفة الشراء:" : "Cargo Items & Unit Cost:"}
                </h4>
                <button
                  type="button"
                  onClick={addRow}
                  className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAr ? "+ إضافة صنف" : "+ Add Item"}</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">{isAr ? "الصنف" : "Item"}</th>
                      <th className="p-2.5 w-28">{isAr ? "الكمية" : "Qty"}</th>
                      <th className="p-2.5 w-32">{isAr ? "سعر التكلفة (SAR)" : "Unit Cost"}</th>
                      <th className="p-2.5 w-32">{isAr ? "المجموع" : "Line Total"}</th>
                      <th className="p-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {poItems.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <select
                            value={row.itemId}
                            onChange={(e) => handleItemChange(index, "itemId", e.target.value)}
                            className="w-full p-1.5 text-xs bg-white border border-slate-250 rounded-md focus:border-teal-600"
                            required
                          >
                            <option value="">{isAr ? "-- اختر الصنف المطلوب --" : "-- Select Item --"}</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {isAr ? i.nameAr : i.name} ({i.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            step="any"
                            value={row.quantity || ""}
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            placeholder="0"
                            className="w-full p-1.5 text-xs bg-white border border-slate-250 rounded-md text-center font-mono"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={row.price || ""}
                            onChange={(e) => handleItemChange(index, "price", e.target.value)}
                            placeholder="0.00"
                            className="w-full p-1.5 text-xs bg-white border border-slate-250 rounded-md text-center font-mono"
                            required
                          />
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-800">
                          SAR {((row.quantity || 0) * (row.price || 0)).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={poItems.length <= 1}
                            className="text-slate-400 hover:text-rose-600 disabled:opacity-30 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Total & Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-mono text-slate-600">
                <span className="font-bold">{isAr ? "إجمالي قيمة أمر الشراء:" : "Total PO Amount:"}</span>{" "}
                <strong className="text-sm font-black text-slate-900 font-mono">
                  SAR {calculatedTotal.toFixed(2)}
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPO(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-lg transition-all text-xs shadow-sm shadow-teal-700/20"
                >
                  {isAr ? "اعتماد وإصدار أمر الشراء" : "Submit Purchase Order"}
                </button>
              </div>
            </div>
          </FormSection>
        </form>
      )}

      {/* PO List Table */}
      {purchaseOrders.length === 0 ? (
        <EmptyState
          title="لا توجد أوامر شراء حالياً"
          titleEn="No Purchase Orders"
          description="ابدأ بإصدار أول أمر شراء لتوريد البن الأخضر والمواد الخام للمستودعات."
          descriptionEn="Create your first purchase order to stock raw coffee materials."
          icon={Truck}
          actionLabel="أمر شراء جديد"
          actionLabelEn="New Purchase Order"
          onAction={() => setShowNewPO(true)}
          language={language}
        />
      ) : (
        <ERPTable
          data={purchaseOrders}
          columns={columns}
          searchKeys={["id", "supplierName", "status"]}
          searchPlaceholder={isAr ? "🔎 بحث برقم الطلب أو اسم المورد..." : "🔎 Search POs..."}
          language={language}
          title={isAr ? "سجل أوامر الشراء والتوريد" : "Purchase Orders Register"}
          exportFileName="purchase_orders_ledger"
          onRowClick={(row) => setSelectedPO(row)}
        />
      )}

      {/* PO Preview Modal */}
      {selectedPO && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-700" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? `أمر شراء وتوريد #${selectedPO.id}` : `Purchase Order #${selectedPO.id}`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? "طباعة" : "Print"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPO(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">{isAr ? "المورد التجاري:" : "Supplier:"}</span>
                <span className="font-bold text-slate-800 text-sm">{selectedPO.supplierName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? "التاريخ:" : "Date:"}</span>
                <span className="font-mono font-bold text-slate-800">{selectedPO.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? "حالة الشحنة:" : "Cargo Status:"}</span>
                <StatusBadge status={selectedPO.status === "Received" ? "Received" : "InTransit"} language={language} size="sm" />
              </div>
            </div>

            {/* Line items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">{isAr ? "الصنف" : "Item"}</th>
                    <th className="p-2.5 text-center">{isAr ? "الكمية" : "Qty"}</th>
                    <th className="p-2.5 text-center">{isAr ? "سعر التكلفة" : "Cost"}</th>
                    <th className="p-2.5 text-left font-mono">{isAr ? "المجموع" : "Total"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPO.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium text-slate-800">{it.itemName}</td>
                      <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                      <td className="p-2.5 text-center font-mono">SAR {Number(it.price).toFixed(2)}</td>
                      <td className="p-2.5 text-left font-mono font-bold text-slate-800">
                        SAR {Number(it.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {selectedPO.status === "Draft" ? (
                <button
                  type="button"
                  onClick={() => {
                    setPoToReceive(selectedPO);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>{isAr ? "فحص واستلام الشحنة مخزنياً" : "Receive Cargo to Stock"}</span>
                </button>
              ) : (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                  {isAr ? "✓ تم استلام هذه الشحنة وإضافتها لطبقات FIFO" : "✓ Received & allocated to FIFO"}
                </span>
              )}

              <div className="text-left font-mono space-y-1">
                <div className="text-sm font-black text-slate-900">
                  {isAr ? "إجمالي أمر الشراء:" : "Total PO Amount:"}{" "}
                  <span className="text-teal-700">SAR {Number(selectedPO.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receive Cargo Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(poToReceive)}
        onClose={() => setPoToReceive(null)}
        onConfirm={handleConfirmReceive}
        title="تأكيد استلام الشحنة وفحص الجودة؟"
        titleEn="Confirm Cargo Receipt?"
        description="سيتم إيداع كميات البضاعة في مستودع المواد الخام وتوليد دُفعات FIFO جديدة تلقائياً."
        descriptionEn="Cargo items will be allocated to raw material warehouses and new FIFO batches created."
        itemName={poToReceive ? `أمر شراء #${poToReceive.id} - ${poToReceive.supplierName}` : undefined}
        confirmLabel="تأكيد الاستلام والتخزين"
        confirmLabelEn="Confirm Receipt"
        variant="primary"
        language={language}
      />
    </div>
  );
}
