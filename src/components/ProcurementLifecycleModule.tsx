import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import ZatcaQRModal from "./common/ZatcaQRModal";
import {
  FileText, FileSearch, ReceiptText, Package, History,
  CheckCircle2, ArrowLeftRight, Truck, QrCode
} from "lucide-react";

interface ProcurementLifecycleModuleProps {
  initialTab?: "purchase_requests" | "rfq" | "purchase_orders" | "goods_receipt" | "purchase_returns";
  language?: "ar" | "en";
}

export default function ProcurementLifecycleModule({
  initialTab = "purchase_requests",
  language = "ar"
}: ProcurementLifecycleModuleProps) {
  const isAr = language === "ar";
  const {
    suppliers,
    items,
    purchaseOrders,
    purchaseRequests,
    purchaseReturns,
    zatcaRecords,
    addPurchaseRequest,
    approvePurchaseRequestToPO,
    receivePurchaseOrder,
    addPurchaseReturn,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showModal, setShowModal] = useState(false);
  const [selectedZatca, setSelectedZatca] = useState<any | null>(null);

  // Form states
  const [requesterName, setRequesterName] = useState("مصطفى - مدير التحميص");
  const [department, setDepartment] = useState("Roastery & Production");
  const [supplierId, setSupplierId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(100);
  const [unitCost, setUnitCost] = useState<number>(28);
  const [reason, setReason] = useState("");

  React.useEffect(() => {
    setActiveTab(initialTab);
    setShowModal(false);
  }, [initialTab]);

  const handleSelectItem = (id: string) => {
    setItemId(id);
    const itm = items.find((i) => i.id === id);
    if (itm) setUnitCost(itm.cost || 25);
  };

  const handleCreatePR = (e: React.FormEvent) => {
    e.preventDefault();
    const itm = items.find((i) => i.id === itemId);
    if (!itm || quantity <= 0) return;

    addPurchaseRequest({
      requesterName,
      department,
      date: new Date().toISOString().split("T")[0],
      neededBy: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      items: [
        {
          itemId: itm.id,
          itemName: isAr ? itm.nameAr : itm.name,
          quantity,
          estimatedCost: unitCost
        }
      ],
      totalEstimated: Math.round(quantity * unitCost * 100) / 100,
      status: "Pending",
      notes: reason
    });

    setShowModal(false);
    addToast({
      type: "success",
      message: "تم تسجيل طلب الشراء الداخلي بنجاح",
      messageEn: "Purchase Requisition created successfully"
    });
  };

  const handleCreatePurchaseReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === supplierId) || suppliers[0];
    const itm = items.find((i) => i.id === itemId);
    if (!sup || !itm || quantity <= 0) return;

    const subtotal = Math.round(quantity * unitCost * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const res = addPurchaseReturn({
      originalPoId: purchaseOrders[0]?.id || "PO-2026-0001",
      supplierId: sup.id,
      supplierName: isAr ? sup.nameAr : sup.name,
      date: new Date().toISOString().split("T")[0],
      reason: reason || "إرجاع مواد خام غير مطابقة للمواصفات للمورد",
      items: [
        {
          itemId: itm.id,
          itemName: isAr ? itm.nameAr : itm.name,
          quantity,
          price: unitCost,
          total: subtotal
        }
      ],
      subtotal,
      taxAmount,
      totalAmount
    });

    if (res.success) {
      setShowModal(false);
      addToast({
        type: "success",
        message: "تم إصدار إشعار مدين مرتجع مشتريات (383) وخصم المخزون وتخفيض رصيد المورد!",
        messageEn: "Debit Note (383) posted, stock deducted, and supplier AP reduced!"
      });
    } else {
      addToast({
        type: "error",
        message: res.error || "فشل إرجاع المشتريات"
      });
    }
  };

  const prCols: ColumnDef[] = [
    { key: "id", header: "رقم الطلب", headerEn: "PR ID", render: (v) => <span className="font-mono font-bold text-teal-800">{v}</span> },
    { key: "date", header: "تاريخ الطلب", headerEn: "Date" },
    { key: "neededBy", header: "تاريخ الاحتياج", headerEn: "Needed By" },
    { key: "requesterName", header: "مقدم الطلب", headerEn: "Requester" },
    { key: "department", header: "القسم الطالب", headerEn: "Department" },
    {
      key: "totalEstimated",
      header: "التكلفة التقديرية",
      headerEn: "Estimated Total",
      render: (v) => <span className="font-mono font-bold">SAR {Number(v).toLocaleString()}</span>
    },
    {
      key: "status",
      header: "الحالة",
      headerEn: "Status",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${v === "ConvertedToPO" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          {v === "ConvertedToPO" ? (isAr ? "تم إصدار أمر شراء" : "Converted to PO") : (isAr ? "بانتظار الاعتماد" : "Pending")}
        </span>
      )
    },
    {
      key: "actions",
      header: "الإجراء",
      headerEn: "Action",
      render: (_, row) =>
        row.status !== "ConvertedToPO" ? (
          <button
            type="button"
            onClick={() => {
              const r = approvePurchaseRequestToPO(row.id, suppliers[0]?.id || "sup-1");
              if (r.success) {
                addToast({
                  type: "success",
                  message: `تم اعتماد طلب الشراء ${row.id} وتحويله إلى أمر شراء رسمي!`,
                  messageEn: `Approved PR ${row.id} and generated Purchase Order!`
                });
                setActiveTab("purchase_orders");
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isAr ? "اعتماد وتحويل لأمر شراء" : "Approve to PO"}</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-emerald-700 font-bold">✓ معتمد</span>
        )
    }
  ];

  const poCols: ColumnDef[] = [
    { key: "id", header: "رقم أمر الشراء", headerEn: "PO Number", render: (v) => <span className="font-mono font-bold text-slate-900">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "supplierName", header: "المورد", headerEn: "Supplier" },
    {
      key: "totalAmount",
      header: "القيمة الإجمالية",
      headerEn: "Total (SAR)",
      render: (v) => <span className="font-mono font-bold">SAR {Number(v).toLocaleString()}</span>
    },
    {
      key: "status",
      header: "حالة التوريد",
      headerEn: "Status",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${v === "Received" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          {v === "Received" ? (isAr ? "مستلم بالمستودع (GRN)" : "Received (GRN)") : (isAr ? "قيد الشحن" : "In Transit")}
        </span>
      )
    },
    {
      key: "actions",
      header: "استلام المخزون",
      headerEn: "Goods Receipt",
      render: (_, row) =>
        row.status !== "Received" ? (
          <button
            type="button"
            onClick={() => {
              const r = receivePurchaseOrder(row.id);
              if (r.success) {
                addToast({
                  type: "success",
                  message: `تم فحص واستلام البضاعة لأمر الشراء ${row.id} وإضافتها لطبقات FIFO وترحيل قيد المورد!`,
                  messageEn: `Goods received for ${row.id} into FIFO layers & GL!`
                });
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "إصدار سند استلام (GRN)" : "Receive Goods (GRN)"}</span>
          </button>
        ) : (
          <span className="text-xs font-mono text-emerald-700 font-bold">✓ تم الاستلام</span>
        )
    }
  ];

  const returnCols: ColumnDef[] = [
    { key: "id", header: "رقم الإشعار المدين", headerEn: "Debit Note ID", render: (v) => <span className="font-mono font-bold text-rose-700">{v}</span> },
    { key: "originalPoId", header: "أمر الشراء الأصلي", headerEn: "Original PO", render: (v) => <span className="font-mono">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "supplierName", header: "المورد", headerEn: "Supplier" },
    { key: "reason", header: "السبب", headerEn: "Reason" },
    {
      key: "totalAmount",
      header: "الإجمالي المسترد",
      headerEn: "Total (SAR)",
      render: (v) => <span className="font-mono font-bold text-rose-700">SAR {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    },
    {
      key: "actions",
      header: "شهادة ZATCA 383",
      headerEn: "ZATCA 383",
      render: (_, row) => {
        const zRec = zatcaRecords.find((z) => z.documentId === row.id);
        return zRec ? (
          <button
            type="button"
            onClick={() => setSelectedZatca(zRec)}
            className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs font-bold flex items-center gap-1"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR / XML</span>
          </button>
        ) : null;
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="دورة المشتريات والتوريد والإشعارات المدينة"
        titleEn="Procurement Lifecycle, GRN & Debit Notes (383)"
        description="إدارة طلبات الشراء الداخلية، عروض أسعار الموردين، أوامر الشراء، سندات الاستلام المخزني (GRN)، ومرتجعات المشتريات."
        descriptionEn="Manage purchase requisitions, vendor RFQs, purchase orders, goods receipt notes, and vendor debit notes."
        icon={Truck}
        breadcrumbs={[
          { label: "المشتريات", labelEn: "Purchasing" },
          { label: "دورة التوريد والمرتجعات", labelEn: "Procurement Pipeline", active: true }
        ]}
        language={language}
      />

      <GlobalActionBar
        onNew={
          activeTab === "purchase_requests" || activeTab === "purchase_returns"
            ? () => setShowModal(true)
            : undefined
        }
        newLabelAr={
          activeTab === "purchase_returns"
            ? "إصدار إشعار مدين (مرتجع مشتريات)"
            : "إنشاء طلب شراء داخلي"
        }
        newLabelEn={activeTab === "purchase_returns" ? "New Debit Note" : "New Purchase Request"}
        pageId="purchases"
        language={language}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: "purchase_requests", ar: "طلبات الشراء الداخلية", en: "Purchase Requests", icon: FileText, count: purchaseRequests.length },
          { id: "rfq", ar: "مقارنة عروض الموردين (RFQ)", en: "Vendor RFQs", icon: FileSearch, count: suppliers.length },
          { id: "purchase_orders", ar: "أوامر الشراء", en: "Purchase Orders", icon: ReceiptText, count: purchaseOrders.length },
          { id: "goods_receipt", ar: "سندات استلام البضائع (GRN)", en: "Goods Receipt Notes", icon: Package, count: purchaseOrders.filter((p) => p.status === "Received").length },
          { id: "purchase_returns", ar: "مرتجعات المشتريات (إشعارات مدينة)", en: "Purchase Returns (Debit Notes)", icon: History, count: purchaseReturns.length }
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
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 rounded border border-slate-200">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Modal Form */}
      {showModal && (
        <form
          onSubmit={activeTab === "purchase_returns" ? handleCreatePurchaseReturn : handleCreatePR}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs"
        >
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {activeTab === "purchase_returns"
              ? isAr
                ? "إصدار إشعار مدين للمورد (مرتجع مشتريات - كود ZATCA 383)"
                : "Issue Supplier Debit Note (Purchase Return - ZATCA 383)"
              : isAr
              ? "تحرير طلب احتياج ومواد خام داخلي"
              : "Create Material Purchase Requisition"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            {activeTab === "purchase_returns" ? (
              <div>
                <label className="font-bold text-slate-600 block mb-1">{isAr ? "المورد *" : "Supplier *"}</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
                >
                  <option value="">{isAr ? "-- اختر المورد --" : "-- Select Supplier --"}</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {isAr ? s.nameAr : s.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="font-bold text-slate-600 block mb-1">{isAr ? "مقدم الطلب" : "Requester"}</label>
                <input
                  type="text"
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
                />
              </div>
            )}

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "الصنف الخام / التغليف *" : "Material Item *"}</label>
              <select
                value={itemId}
                onChange={(e) => handleSelectItem(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                <option value="">{isAr ? "-- اختر الصنف --" : "-- Select Material --"}</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {isAr ? i.nameAr : i.name} (المتوفر: {i.currentStock})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "الكمية *" : "Quantity *"}</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "تكلفة الوحدة (ريال) *" : "Unit Cost *"}</label>
              <input
                type="number"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="font-bold text-slate-600 block mb-1">
                {activeTab === "purchase_returns" ? (isAr ? "سبب إرجاع الشحنة للمورد *" : "Return Reason *") : (isAr ? "البيان والملاحظات" : "Notes")}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required={activeTab === "purchase_returns"}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-600"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold"
            >
              {activeTab === "purchase_returns"
                ? isAr
                  ? "اعتماد وترحيل الإشعار المدين"
                  : "Post Debit Note"
                : isAr
                ? "إرسال طلب الشراء"
                : "Submit PR"}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {activeTab === "purchase_requests" && (
          <ERPTable data={purchaseRequests} columns={prCols} language={language} />
        )}
        {activeTab === "purchase_orders" && (
          <ERPTable data={purchaseOrders} columns={poCols} language={language} />
        )}
        {activeTab === "goods_receipt" && (
          <ERPTable
            data={purchaseOrders}
            columns={poCols}
            language={language}
          />
        )}
        {activeTab === "purchase_returns" && (
          <ERPTable data={purchaseReturns} columns={returnCols} language={language} />
        )}
        {activeTab === "rfq" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {isAr ? "مصفوفة مقارنة عروض الموردين المعتمدين (Vendor RFQ Comparison)" : "Approved Vendor RFQ Matrix"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suppliers.map((sup, idx) => (
                <div key={sup.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">{isAr ? sup.nameAr : sup.name}</span>
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-mono text-[10px] font-bold border border-teal-200">
                      Tier {idx + 1} Vendor
                    </span>
                  </div>
                  <p className="text-slate-500 font-mono">{sup.address}</p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? "متوسط مدة التوريد:" : "Lead Time:"}</span>
                    <span className="font-mono font-bold text-slate-800">{5 + idx * 3} Days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isAr ? "الرصيد المستحق للمورد:" : "Current AP Balance:"}</span>
                    <span className="font-mono font-bold text-teal-800">SAR {sup.balance.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedZatca && (
        <ZatcaQRModal
          record={selectedZatca}
          onClose={() => setSelectedZatca(null)}
          language={language}
        />
      )}
    </div>
  );
}
