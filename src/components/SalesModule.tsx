import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { SalesInvoiceItem } from "../types";
import { Plus, Check, FileText, ShoppingBag, Trash2, Printer, Percent, ShieldCheck, ShoppingCart, Eye, X } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import FormSection from "./common/FormSection";
import FormField from "./common/FormField";
import EmptyState from "./common/EmptyState";
import StatusBadge from "./common/StatusBadge";

interface SalesModuleProps {
  language?: "ar" | "en";
}

export default function SalesModule({ language = "ar" }: SalesModuleProps) {
  const isAr = language === "ar";
  const { customers, salesInvoices, items, addSalesInvoice, addToast } = useAppState();

  // Forms
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<Omit<SalesInvoiceItem, "total">[]>([
    { itemId: "", itemName: "", quantity: 0, price: 0 }
  ]);
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Unpaid">("Paid");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Invoice for Print preview modal
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Filter for Wholesale/General Sales
  const wholesaleInvoices = salesInvoices.filter(si => si.type === "Wholesale");

  // Columns definition for ERPTable
  const columns: ColumnDef[] = [
    { key: "id", header: "رقم الفاتورة", headerEn: "Invoice ID" },
    { key: "date", header: "تاريخ الإصدار", headerEn: "Issue Date", type: "date" },
    { key: "customerName", header: "اسم العميل", headerEn: "Customer Name" },
    { 
      key: "totalAmount", 
      header: "المبلغ الإجمالي (ريال)", 
      headerEn: "Total Amount (SAR)",
      render: (val: any) => (
        <span className="font-bold font-mono text-teal-800">
          SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: "status", 
      header: "حالة السداد", 
      headerEn: "Payment Status",
      type: "select",
      options: [
        { value: "Paid", label: isAr ? "مدفوع فوراً" : "Paid" },
        { value: "Unpaid", label: isAr ? "آجل (ذمم)" : "Unpaid" }
      ],
      render: (val: any) => (
        <StatusBadge status={val} language={language} size="sm" />
      )
    },
    {
      key: "actions",
      header: "الإجراءات",
      headerEn: "Actions",
      sortable: false,
      render: (_: any, row: any) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedInvoice(row)}
            title={isAr ? "معاينة وطباعة الفاتورة" : "Preview & Print Invoice"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{isAr ? "معاينة" : "View"}</span>
          </button>
        </div>
      )
    }
  ];

  const handleItemChange = (index: number, field: keyof Omit<SalesInvoiceItem, "total">, value: any) => {
    const updated = [...invoiceItems];
    if (field === "itemId") {
      const dbItem = items.find(i => i.id === value);
      updated[index].itemId = value;
      updated[index].itemName = dbItem ? (isAr ? dbItem.nameAr : dbItem.name) : "";
      updated[index].price = dbItem ? dbItem.price : 0;
    } else if (field === "quantity" || field === "price") {
      updated[index][field] = parseFloat(value) || 0;
    }
    setInvoiceItems(updated);
  };

  const addRow = () => {
    setInvoiceItems([...invoiceItems, { itemId: "", itemName: "", quantity: 0, price: 0 }]);
  };

  const removeRow = (index: number) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(invoiceItems.filter((_, idx) => idx !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedCustomerId) {
      setErrorMessage(isAr ? "يرجى اختيار العميل أولاً" : "Please select a client first");
      return;
    }

    const invalidRow = invoiceItems.some(i => !i.itemId || i.quantity <= 0 || i.price <= 0);
    if (invalidRow) {
      setErrorMessage(isAr ? "تأكد من اختيار صنف وكمية وسعر صحيح لكل سطر" : "All rows must have valid item, quantity, and price");
      return;
    }

    // Stock check
    for (const item of invoiceItems) {
      const dbItem = items.find(i => i.id === item.itemId);
      if (dbItem && dbItem.currentStock < item.quantity) {
        setErrorMessage(isAr 
          ? `الكمية المطلوبة من [${dbItem.nameAr}] غير متوفرة. المتاح: ${dbItem.currentStock}` 
          : `Requested quantity for [${dbItem.name}] exceeds available stock of ${dbItem.currentStock}`
        );
        return;
      }
    }

    const targetCustomer = customers.find(c => c.id === selectedCustomerId);
    const finalItems = invoiceItems.map(item => ({
      ...item,
      total: item.quantity * item.price
    }));

    const totalAmount = finalItems.reduce((acc, i) => acc + i.total, 0);

    const res = addSalesInvoice({
      customerId: selectedCustomerId,
      customerName: targetCustomer ? (isAr ? targetCustomer.nameAr : targetCustomer.name) : "",
      status: paymentStatus,
      items: finalItems,
      totalAmount
    }, "Wholesale");

    if (res.success) {
      setShowNewInvoice(false);
      setInvoiceItems([{ itemId: "", itemName: "", quantity: 0, price: 0 }]);
      setSelectedCustomerId("");
      addToast({
        type: "success",
        message: "تم حفظ وترحيل فاتورة المبيعات وتحديث أرصدة المخزون والعملاء تلقائياً",
        messageEn: "Sales invoice posted and inventory levels updated successfully"
      });
    } else {
      setErrorMessage(res.error || "Invoice creation failed.");
    }
  };

  const calculatedSubtotal = invoiceItems.reduce((acc, i) => acc + ((i.quantity || 0) * (i.price || 0)), 0);
  const calculatedVat = calculatedSubtotal * 0.15;
  const calculatedTotal = calculatedSubtotal + calculatedVat;

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="فواتير المبيعات العامة والجملة"
        titleEn="Sales & Wholesale Invoices"
        description="إصدار واعتماد فواتير المبيعات الضريبية مع خصم المخزون وترحيل القيود المزدوجة."
        descriptionEn="Issue & audit tax sales invoices with automated inventory depletion & general ledger posting."
        icon={ShoppingCart}
        breadcrumbs={[
          { label: "المبيعات والعملاء", labelEn: "Sales & CRM" },
          { label: "فواتير المبيعات", labelEn: "Sales Invoices", active: true }
        ]}
        language={language}
      />

      {/* Global Action Bar */}
      <GlobalActionBar
        onNew={() => setShowNewInvoice(true)}
        newLabelAr="إنشاء فاتورة جديدة"
        newLabelEn="New Sales Invoice"
        pageId="sales"
        totalCount={salesInvoices.length}
        language={language}
      />

      {/* Invoice Creation Section */}
      {showNewInvoice && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <FormSection
            title={isAr ? "تحرير فاتورة مبيعات جديدة" : "New Sales Invoice Voucher"}
            description={isAr ? "حدد العميل وأضف بنود الأصناف لحساب الإجمالي والضريبة تلقائياً" : "Select client and line items"}
            icon={FileText}
            language={language}
          >
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg mb-4">
                {errorMessage}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <FormField label="العميل المعتمد" labelEn="Certified Client" required language={language}>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                >
                  <option value="">{isAr ? "-- اختر العميل من الدليل --" : "-- Select Customer --"}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {isAr ? c.nameAr : c.name} (الرصيد: SAR {c.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="حالة السداد والتحصيل" labelEn="Payment Terms" required language={language}>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value as "Paid" | "Unpaid")}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                >
                  <option value="Paid">{isAr ? "مدفوع نقداً / شبكة (إيداع فوري)" : "Paid Immediately (Cash/Bank)"}</option>
                  <option value="Unpaid">{isAr ? "آجل (تسجيل على ذمة العميل)" : "On Credit (Accounts Receivable)"}</option>
                </select>
              </FormField>

              <FormField label="تاريخ الفاتورة" labelEn="Invoice Date" required language={language}>
                <input
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono font-medium"
                />
              </FormField>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">
                  {isAr ? "بنود الفاتورة والكميات المطلوبة:" : "Invoice Line Items:"}
                </h4>
                <button
                  type="button"
                  onClick={addRow}
                  className="px-2.5 py-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>{isAr ? "+ إضافة بند" : "+ Add Item"}</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">{isAr ? "الصنف" : "Item SKU"}</th>
                      <th className="p-2.5 w-28">{isAr ? "الكمية" : "Qty"}</th>
                      <th className="p-2.5 w-32">{isAr ? "السعر (SAR)" : "Unit Price"}</th>
                      <th className="p-2.5 w-32">{isAr ? "المجموع" : "Line Total"}</th>
                      <th className="p-2.5 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoiceItems.map((row, index) => (
                      <tr key={index} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <select
                            value={row.itemId}
                            onChange={(e) => handleItemChange(index, "itemId", e.target.value)}
                            className="w-full p-1.5 text-xs bg-white border border-slate-250 rounded-md focus:border-teal-600"
                            required
                          >
                            <option value="">{isAr ? "-- اختر الصنف --" : "-- Select Item --"}</option>
                            {items.map((i) => (
                              <option key={i.id} value={i.id}>
                                {isAr ? i.nameAr : i.name} (المخزون: {i.currentStock} {i.unit})
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
                          >
                          </input>
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
                          >
                          </input>
                        </td>
                        <td className="p-2 font-mono font-bold text-teal-800">
                          SAR {((row.quantity || 0) * (row.price || 0)).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={invoiceItems.length <= 1}
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

            {/* Totals Summary */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-mono space-y-1 text-slate-600">
                <div>{isAr ? "المجموع قبل الضريبة:" : "Subtotal:"} <strong>SAR {calculatedSubtotal.toFixed(2)}</strong></div>
                <div>{isAr ? "ضريبة القيمة المضافة (15%):" : "VAT (15%):"} <strong>SAR {calculatedVat.toFixed(2)}</strong></div>
                <div className="text-sm font-black text-slate-900">{isAr ? "الإجمالي النهائي:" : "Grand Total:"} <strong className="text-teal-700">SAR {calculatedTotal.toFixed(2)}</strong></div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewInvoice(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-lg transition-all text-xs shadow-sm shadow-teal-700/20"
                >
                  {isAr ? "اعتماد وترحيل الفاتورة" : "Post Sales Invoice"}
                </button>
              </div>
            </div>
          </FormSection>
        </form>
      )}

      {/* Invoices List Table */}
      {salesInvoices.length === 0 ? (
        <EmptyState
          title="لا توجد فواتير مبيعات مسجلة"
          titleEn="No Sales Invoices"
          description="ابدأ بإنشاء أول فاتورة مبيعات لاعتماد حركات البيع وخصم المخزون."
          descriptionEn="Create your first sales invoice to track sales revenue and stock depletion."
          icon={ShoppingCart}
          actionLabel="إنشاء فاتورة جديدة"
          actionLabelEn="New Sales Invoice"
          onAction={() => setShowNewInvoice(true)}
          language={language}
        />
      ) : (
        <ERPTable
          data={salesInvoices}
          columns={columns}
          searchKeys={["id", "customerName", "status"]}
          searchPlaceholder={isAr ? "🔎 بحث برقم الفاتورة أو اسم العميل..." : "🔎 Search invoices..."}
          language={language}
          title={isAr ? "سجل فواتير المبيعات" : "Sales Invoices Journal"}
          exportFileName="sales_invoices_ledger"
          onRowClick={(row) => setSelectedInvoice(row)}
        />
      )}

      {/* Invoice Preview Modal */}
      {selectedInvoice && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <h3 className="font-black text-base text-slate-900">
                  {isAr ? `فاتورة ضريبية #${selectedInvoice.id}` : `Tax Invoice #${selectedInvoice.id}`}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{isAr ? "طباعة الفاتورة" : "Print"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">{isAr ? "العميل:" : "Client:"}</span>
                <span className="font-bold text-slate-800 text-sm">{selectedInvoice.customerName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? "التاريخ:" : "Date:"}</span>
                <span className="font-mono font-bold text-slate-800">{selectedInvoice.date}</span>
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? "حالة السداد:" : "Payment Status:"}</span>
                <StatusBadge status={selectedInvoice.status} language={language} size="sm" />
              </div>
              <div>
                <span className="text-slate-400 block">{isAr ? "نوع المبيعات:" : "Invoice Type:"}</span>
                <span className="font-bold text-slate-700">{selectedInvoice.type || "Standard"}</span>
              </div>
            </div>

            {/* Line items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">{isAr ? "الصنف" : "Item"}</th>
                    <th className="p-2.5 text-center">{isAr ? "الكمية" : "Qty"}</th>
                    <th className="p-2.5 text-center">{isAr ? "سعر الوحدة" : "Unit Price"}</th>
                    <th className="p-2.5 text-left font-mono">{isAr ? "المجموع" : "Total"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedInvoice.items?.map((it: any, i: number) => (
                    <tr key={i}>
                      <td className="p-2.5 font-medium text-slate-800">{it.itemName}</td>
                      <td className="p-2.5 text-center font-mono">{it.quantity}</td>
                      <td className="p-2.5 text-center font-mono">SAR {Number(it.price).toFixed(2)}</td>
                      <td className="p-2.5 text-left font-mono font-bold text-teal-800">
                        SAR {Number(it.total).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <div className="text-left font-mono space-y-1">
                <div className="text-sm font-black text-slate-900">
                  {isAr ? "المبلغ الإجمالي:" : "Grand Total:"}{" "}
                  <span className="text-teal-700">SAR {Number(selectedInvoice.totalAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
