import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import ZatcaQRModal from "./common/ZatcaQRModal";
import {
  FileText, ReceiptText, Truck, History, Tag, ArrowLeftRight,
  CheckCircle2, Plus, QrCode
} from "lucide-react";

interface SalesLifecycleModuleProps {
  initialTab?: "sales_quotations" | "sales_orders" | "delivery_notes" | "sales_returns" | "price_lists";
  language?: "ar" | "en";
}

export default function SalesLifecycleModule({
  initialTab = "sales_quotations",
  language = "ar"
}: SalesLifecycleModuleProps) {
  const isAr = language === "ar";
  const {
    customers,
    items,
    salesInvoices,
    salesQuotations,
    salesOrders,
    deliveryNotes,
    salesReturns,
    zatcaRecords,
    addSalesQuotation,
    convertQuotationToOrder,
    fulfillSalesOrderToInvoice,
    addSalesReturn,
    updateItem,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showModal, setShowModal] = useState(false);
  const [selectedZatca, setSelectedZatca] = useState<any | null>(null);

  // Quotation / Return form state
  const [customerId, setCustomerId] = useState("");
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(20);
  const [unitPrice, setUnitPrice] = useState<number>(32);
  const [notes, setNotes] = useState("");

  // Sales Return specific state
  const [originalInvoiceId, setOriginalInvoiceId] = useState("");
  const [refundMethod, setRefundMethod] = useState<"CreditAccount" | "Cash" | "Bank">("CreditAccount");

  React.useEffect(() => {
    setActiveTab(initialTab);
    setShowModal(false);
  }, [initialTab]);

  const handleSelectProduct = (id: string) => {
    setItemId(id);
    const found = items.find((i) => i.id === id);
    if (found && found.price > 0) {
      setUnitPrice(found.price);
    }
  };

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId);
    const itm = items.find((i) => i.id === itemId);
    if (!cust || !itm || quantity <= 0) return;

    const subtotal = Math.round(quantity * unitPrice * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    addSalesQuotation({
      customerId: cust.id,
      customerName: isAr ? cust.nameAr : cust.name,
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      items: [
        {
          itemId: itm.id,
          itemName: isAr ? itm.nameAr : itm.name,
          quantity,
          price: unitPrice,
          total: subtotal
        }
      ],
      subtotal,
      taxAmount,
      totalAmount,
      status: "Sent",
      notes
    });

    setShowModal(false);
    addToast({
      type: "success",
      message: "تم إصدار عرض السعر بنجاح",
      messageEn: "Sales Quotation created successfully"
    });
  };

  const handleCreateSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === customerId) || customers[0];
    const itm = items.find((i) => i.id === itemId);
    if (!cust || !itm || quantity <= 0) return;

    const subtotal = Math.round(quantity * unitPrice * 100) / 100;
    const taxAmount = Math.round(subtotal * 0.15 * 100) / 100;
    const totalAmount = Math.round((subtotal + taxAmount) * 100) / 100;

    const res = addSalesReturn({
      originalInvoiceId: originalInvoiceId || (salesInvoices[0]?.id ?? "SI-2026-0001"),
      customerId: cust.id,
      customerName: isAr ? cust.nameAr : cust.name,
      date: new Date().toISOString().split("T")[0],
      reason: notes || "مرتجع بضاعة وإصدار إشعار دائن ضريبي",
      refundMethod,
      items: [
        {
          itemId: itm.id,
          itemName: isAr ? itm.nameAr : itm.name,
          quantity,
          price: unitPrice,
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
        message: "تم إصدار الإشعار الدائن (381) وإعادة الكميات للمستودع وعكس قيد المبيعات والضريبة!",
        messageEn: "Credit Note (381) posted, inventory restored, and GL reversed!"
      });
    }
  };

  const quotationCols: ColumnDef[] = [
    { key: "id", header: "رقم عرض السعر", headerEn: "Quotation ID", render: (v) => <span className="font-mono font-bold text-teal-800">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "validUntil", header: "صالح حتى", headerEn: "Valid Until" },
    { key: "customerName", header: "العميل", headerEn: "Customer" },
    {
      key: "totalAmount",
      header: "الإجمالي شامل الضريبة",
      headerEn: "Total (SAR)",
      render: (v) => <span className="font-mono font-bold">SAR {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    },
    {
      key: "status",
      header: "الحالة",
      headerEn: "Status",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${v === "Converted" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
          {v === "Converted" ? (isAr ? "محول لأمر بيع" : "Converted") : (isAr ? "مرسل للعميل" : "Sent")}
        </span>
      )
    },
    {
      key: "actions",
      header: "الإجراءات",
      headerEn: "Actions",
      render: (_, row) =>
        row.status !== "Converted" ? (
          <button
            type="button"
            onClick={() => {
              const r = convertQuotationToOrder(row.id);
              if (r.success) {
                addToast({
                  type: "success",
                  message: `تم تحويل عرض السعر ${row.id} إلى أمر مبيعات معتمد!`,
                  messageEn: `Converted ${row.id} to Sales Order!`
                });
                setActiveTab("sales_orders");
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{isAr ? "تحويل لأمر بيع" : "Convert to Order"}</span>
          </button>
        ) : (
          <span className="text-xs text-slate-400 font-mono">✓ تم التحويل</span>
        )
    }
  ];

  const orderCols: ColumnDef[] = [
    { key: "id", header: "رقم أمر البيع", headerEn: "Order ID", render: (v) => <span className="font-mono font-bold text-teal-800">{v}</span> },
    { key: "date", header: "تاريخ الأمر", headerEn: "Order Date" },
    { key: "deliveryDate", header: "تاريخ التوريد", headerEn: "Delivery Date" },
    { key: "customerName", header: "العميل", headerEn: "Customer" },
    {
      key: "totalAmount",
      header: "القيمة الإجمالية",
      headerEn: "Total (SAR)",
      render: (v) => <span className="font-mono font-bold">SAR {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    },
    {
      key: "status",
      header: "الحالة",
      headerEn: "Status",
      render: (v) => (
        <span className={`px-2 py-0.5 rounded text-xs font-bold ${v === "Invoiced" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-sky-50 text-sky-700 border border-sky-200"}`}>
          {v === "Invoiced" ? (isAr ? "تم التسليم والفوترة" : "Fulfilled & Invoiced") : (isAr ? "مؤكد - جاهز للشحن" : "Confirmed")}
        </span>
      )
    },
    {
      key: "actions",
      header: "التنفيذ والفوترة",
      headerEn: "Fulfillment",
      render: (_, row) =>
        row.status !== "Invoiced" ? (
          <button
            type="button"
            onClick={() => {
              const r = fulfillSalesOrderToInvoice(row.id, false);
              if (r.success) {
                addToast({
                  type: "success",
                  message: `تم صرف البضاعة من مستودع FIFO وإصدار إذن التسليم والفاتورة الضريبية لأمر البيع ${row.id}!`,
                  messageEn: `Fulfilled Order ${row.id}, issued Delivery Note & Tax Invoice!`
                });
              } else {
                addToast({ type: "error", message: r.error || "خطأ في رصيد المخزون" });
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isAr ? "تسليم وإصدار فاتورة" : "Dispatch & Invoice"}</span>
          </button>
        ) : (
          <span className="text-xs text-emerald-700 font-mono font-bold">✓ مكتمل</span>
        )
    }
  ];

  const deliveryCols: ColumnDef[] = [
    { key: "id", header: "رقم إذن التسليم", headerEn: "Delivery Note ID", render: (v) => <span className="font-mono font-bold text-slate-900">{v}</span> },
    { key: "date", header: "تاريخ الشحن", headerEn: "Dispatch Date" },
    { key: "customerName", header: "العميل المستلم", headerEn: "Customer" },
    { key: "salesOrderId", header: "أمر البيع المرتبط", headerEn: "Sales Order", render: (v) => <span className="font-mono text-xs">{v || "-"}</span> },
    { key: "invoiceId", header: "الفاتورة الضريبية", headerEn: "Tax Invoice", render: (v) => <span className="font-mono text-xs text-teal-700 font-bold">{v || "-"}</span> },
    { key: "driverName", header: "اسم السائق", headerEn: "Driver" },
    { key: "vehiclePlate", header: "لوحة المركبة", headerEn: "Vehicle Plate", render: (v) => <span className="font-mono">{v}</span> }
  ];

  const returnCols: ColumnDef[] = [
    { key: "id", header: "رقم الإشعار الدائن", headerEn: "Credit Note ID", render: (v) => <span className="font-mono font-bold text-rose-700">{v}</span> },
    { key: "originalInvoiceId", header: "الفاتورة الأصلية", headerEn: "Original Invoice", render: (v) => <span className="font-mono">{v}</span> },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "customerName", header: "العميل", headerEn: "Customer" },
    { key: "reason", header: "سبب الإرجاع", headerEn: "Return Reason" },
    {
      key: "totalAmount",
      header: "قيمة المرتجع (مع الضريبة)",
      headerEn: "Credit Total (SAR)",
      render: (v) => <span className="font-mono font-bold text-rose-700">SAR {Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    },
    {
      key: "actions",
      header: "شهادة ZATCA 381",
      headerEn: "ZATCA 381",
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
        title="دورة المبيعات المتكاملة والإشعارات الدائنة"
        titleEn="Full Sales Lifecycle & Credit Notes (381)"
        description="إدارة عروض الأسعار، أوامر البيع، إذونات التسليم اللوجستية، ومرتجعات المبيعات (الإشعارات الدائنة) وقوائم الأسعار."
        descriptionEn="Manage sales quotations, orders, outbound delivery notes, ZATCA credit notes, and multi-tier price lists."
        icon={ReceiptText}
        breadcrumbs={[
          { label: "المبيعات", labelEn: "Sales" },
          { label: "دورة المبيعات والمرتجعات", labelEn: "Sales Pipeline & Returns", active: true }
        ]}
        language={language}
      />

      <GlobalActionBar
        onNew={
          activeTab === "sales_quotations" || activeTab === "sales_returns"
            ? () => setShowModal(true)
            : undefined
        }
        newLabelAr={
          activeTab === "sales_returns" ? "إصدار إشعار دائن (مرتجع مبيعات)" : "إنشاء عرض سعر جديد"
        }
        newLabelEn={activeTab === "sales_returns" ? "New Credit Note" : "New Quotation"}
        pageId="sales"
        language={language}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: "sales_quotations", ar: "عروض الأسعار", en: "Quotations", icon: FileText, count: salesQuotations.length },
          { id: "sales_orders", ar: "أوامر المبيعات", en: "Sales Orders", icon: ReceiptText, count: salesOrders.length },
          { id: "delivery_notes", ar: "إذونات التسليم", en: "Delivery Notes", icon: Truck, count: deliveryNotes.length },
          { id: "sales_returns", ar: "مرتجعات المبيعات (إشعارات دائنة)", en: "Sales Returns (Credit Notes)", icon: History, count: salesReturns.length },
          { id: "price_lists", ar: "قوائم وشرائح الأسعار", en: "Price Lists", icon: Tag, count: items.filter((i) => i.price > 0).length }
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

      {/* Modal Form for Quotation or Sales Return */}
      {showModal && (
        <form
          onSubmit={activeTab === "sales_returns" ? handleCreateSalesReturn : handleCreateQuotation}
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-xs"
        >
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {activeTab === "sales_returns"
              ? isAr
                ? "إصدار إشعار دائن ضريبي (مرتجع مبيعات - كود ZATCA 381)"
                : "Issue Tax Credit Note (Sales Return - ZATCA 381)"
              : isAr
              ? "إصدار عرض سعر جديد للعميل"
              : "Create Customer Sales Quotation"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "العميل *" : "Customer *"}</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                <option value="">{isAr ? "-- اختر العميل --" : "-- Select Customer --"}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.nameAr : c.name}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === "sales_returns" && (
              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  {isAr ? "الفاتورة الأصلية المرتبطة" : "Original Invoice"}
                </label>
                <select
                  value={originalInvoiceId}
                  onChange={(e) => setOriginalInvoiceId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
                >
                  {salesInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.id} - {inv.customerName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "الصنف *" : "Product *"}</label>
              <select
                value={itemId}
                onChange={(e) => handleSelectProduct(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
              >
                <option value="">{isAr ? "-- اختر المنتج --" : "-- Select Product --"}</option>
                {items
                  .filter((i) => i.price > 0)
                  .map((i) => (
                    <option key={i.id} value={i.id}>
                      {isAr ? i.nameAr : i.name} (SAR {i.price})
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
              <label className="font-bold text-slate-600 block mb-1">{isAr ? "سعر الوحدة (ريال) *" : "Unit Price *"}</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
              />
            </div>

            {activeTab === "sales_returns" && (
              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  {isAr ? "طريقة التسوية المالية" : "Refund Method"}
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
                >
                  <option value="CreditAccount">{isAr ? "خصم من مديونية العميل (ذمم)" : "Credit Customer AR"}</option>
                  <option value="Cash">{isAr ? "رد نقدي من الصندوق" : "Cash Refund"}</option>
                  <option value="Bank">{isAr ? "رد عبر الحساب البنكي" : "Bank Refund"}</option>
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="font-bold text-slate-600 block mb-1">
                {activeTab === "sales_returns"
                  ? isAr
                    ? "سبب الإرجاع (مطلوب لهيئة الزكاة) *"
                    : "Reason for Credit Note *"
                  : isAr
                  ? "ملاحظات وشروط التوريد"
                  : "Notes & Terms"}
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required={activeTab === "sales_returns"}
                placeholder={
                  activeTab === "sales_returns"
                    ? isAr
                      ? "مثال: تعديل كميات التوريد أو استرجاع عبوات..."
                      : "e.g. Returned damaged packs..."
                    : ""
                }
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
              {activeTab === "sales_returns"
                ? isAr
                  ? "اعتماد وترحيل الإشعار الدائن"
                  : "Post Credit Note"
                : isAr
                ? "حفظ عرض السعر"
                : "Save Quotation"}
            </button>
          </div>
        </form>
      )}

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {activeTab === "sales_quotations" && (
          <ERPTable data={salesQuotations} columns={quotationCols} language={language} />
        )}
        {activeTab === "sales_orders" && (
          <ERPTable data={salesOrders} columns={orderCols} language={language} />
        )}
        {activeTab === "delivery_notes" && (
          <ERPTable data={deliveryNotes} columns={deliveryCols} language={language} />
        )}
        {activeTab === "sales_returns" && (
          <ERPTable data={salesReturns} columns={returnCols} language={language} />
        )}
        {activeTab === "price_lists" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {isAr ? "قوائم الأسعار المعتمدة (تجزئة / جملة / كبار العملاء)" : "Master Price Lists (Retail / Wholesale / VIP)"}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-right">SKU</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? "الصنف" : "Item"}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? "تكلفة الوحدة" : "Unit Cost"}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? "سعر البيع الأساسي" : "Base Selling Price"}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? "سعر الجملة (-10%)" : "Wholesale Tier (-10%)"}</th>
                    <th className="py-2.5 px-3 text-right">{isAr ? "سعر كبار العملاء (-15%)" : "Key Accounts (-15%)"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items
                    .filter((i) => i.price > 0)
                    .map((itm) => (
                      <tr key={itm.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{itm.sku}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{isAr ? itm.nameAr : itm.name}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">SAR {itm.cost.toFixed(2)}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-teal-800">
                          <input
                            type="number"
                            step="0.5"
                            value={itm.price}
                            onChange={(e) => updateItem(itm.id, { price: Number(e.target.value) })}
                            className="w-24 px-2 py-1 border border-slate-300 rounded font-mono font-bold bg-white"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-700">
                          SAR {(itm.price * 0.9).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                          SAR {(itm.price * 0.85).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
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
