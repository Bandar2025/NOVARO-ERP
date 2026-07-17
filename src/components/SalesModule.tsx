import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { SalesInvoiceItem } from "../types";
import { Plus, Check, FileText, ShoppingBag, Trash2, Printer, Percent, ShieldCheck } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

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

  // Selected Invoice for Print preview
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);

  // Filter for Wholesale
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
      render: (val: any) => <span className="font-bold font-mono text-teal-800">SAR {Number(val).toLocaleString()}</span>
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
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
          val === "Paid" 
            ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
            : "bg-rose-50 text-rose-700 border-rose-200"
        }`}>
          {val === "Paid" ? (isAr ? "مدفوع" : "Paid") : (isAr ? "غير مدفوع" : "Unpaid")}
        </span>
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
        message: "تم ترحيل فاتورة المبيعات بالجملة وتحديث الحسابات والأرصدة بنجاح",
        messageEn: "Wholesale sales invoice posted and stock levels updated successfully"
      });
    } else {
      setErrorMessage(res.error || "Invoice creation failed.");
    }
  };

  // Printable Sales Invoice Pre-render popup
  const triggerPrintInvoice = (invoice: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const itemsHtml = invoice.items.map((item: any, idx: number) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold;">${idx + 1}</td>
        <td style="padding: 10px;">${item.itemName}</td>
        <td style="padding: 10px; text-align: center; font-family: monospace;">${item.quantity}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace;">SAR ${item.price.toFixed(2)}</td>
        <td style="padding: 10px; text-align: right; font-family: monospace; font-weight: bold;">SAR ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join("");

    const vatAmount = invoice.totalAmount * 0.15;
    const subtotal = invoice.totalAmount - vatAmount;

    printWindow.document.write(`
      <html dir="${isAr ? "rtl" : "ltr"}">
        <head>
          <title>فاتورة ضريبية - ${invoice.id}</title>
          <style>
            body { font-family: 'IBM Plex Sans Arabic', sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #0f766e; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; font-size: 13px; margin-bottom: 25px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
            .items-table th { background: #0f766e; color: white; padding: 12px; text-align: ${isAr ? "right" : "left"}; }
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
                <div>فاتورة مبيعات ضريبية مبسطة</div>
                <div style="color: #64748b; font-size: 11px; margin-top: 3px;">Tax Simplified Invoice</div>
              </td>
            </tr>
          </table>

          <div class="meta-box">
            <table style="width:100%; font-size:13px;">
              <tr>
                <td><strong>رقم الفاتورة:</strong> ${invoice.id}</td>
                <td><strong>تاريخ الفاتورة:</strong> ${invoice.date}</td>
              </tr>
              <tr>
                <td><strong>العميل:</strong> ${invoice.customerName}</td>
                <td><strong>حالة السداد:</strong> ${invoice.status === "Paid" ? "مدفوع بالكامل" : "آجل (غير مسدد)"}</td>
              </tr>
              <tr>
                <td><strong>الرقم الضريبي للمنشأة:</strong> 310293847500003</td>
                <td><strong>نسبة الضريبة:</strong> 15% (مشمولة)</td>
              </tr>
            </table>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>الصنف / البيان</th>
                <th style="text-align: center; width: 100px;">الكمية</th>
                <th style="text-align: right; width: 120px;">سعر الوحدة</th>
                <th style="text-align: right; width: 120px;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <table class="summary-table">
            <tr>
              <td>المجموع الفرعي (غير شامل الضريبة)</td>
              <td style="text-align: right; font-family: monospace;">SAR ${subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>ضريبة القيمة المضافة (15%)</td>
              <td style="text-align: right; font-family: monospace;">SAR ${vatAmount.toFixed(2)}</td>
            </tr>
            <tr style="font-weight: bold; font-size: 15px; color: #0f766e; background: #f1f5f9;">
              <td style="padding: 10px;">الإجمالي شامل الضريبة</td>
              <td style="text-align: right; padding: 10px; font-family: monospace;">SAR ${invoice.totalAmount.toFixed(2)}</td>
            </tr>
          </table>

          <div style="clear: both;"></div>

          <div class="footer">
            <p>شكراً لتعاملكم معنا | نوفارو للبرمجيات السحابية المتكاملة</p>
            <p style="font-size: 9px; color: #94a3b8; margin-top: 5px;">تم توليد هذا المستند إلكترونياً ولا يتطلب توقيعاً مالم يتم طلب خلاف ذلك</p>
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
            {isAr ? "إدارة المبيعات بالجملة وتوزيع الإنتاج" : "WHOLESALE SALES & DISTRIBUTION LOGISTICS"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-teal-700" />
            {isAr ? "فواتير المبيعات بالجملة" : "Wholesale Sales Invoices"}
          </h1>
        </div>

        <button
          onClick={() => setShowNewInvoice(!showNewInvoice)}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? "إنشاء فاتورة مبيعات" : "New Wholesale Invoice"}</span>
        </button>
      </div>

      {/* Sales Invoice Submission Form */}
      {showNewInvoice && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-5 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base">
              {isAr ? "تحرير فاتورة مبيعات جديدة" : "Post Wholesale Cargo Invoice"}
            </h3>
            <span className="text-xs bg-teal-50 text-teal-700 font-bold px-2.5 py-1 rounded-full border border-teal-150 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? "حسابات القيود التلقائية مفعلة" : "Double-Entry Accounting Active"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">
                {isAr ? "العميل المستلم (بالجملة)" : "Enterprise Wholesale Client"}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              >
                <option value="">{isAr ? "-- اختر العميل --" : "-- Select Customer --"}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {isAr ? c.nameAr : c.name} (رصيد حالي: {c.balance.toLocaleString()} ريال)
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 block">
                {isAr ? "طريقة السداد والتسوية" : "Invoice Term / Payment Terms"}
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              >
                <option value="Paid">{isAr ? "دفع بنكي فوري (كاش/تحويل)" : "Immediate settlement (Paid)"}</option>
                <option value="Unpaid">{isAr ? "شراء آجل على الحساب (ذمم مدينة)" : "On Credit Accounts (Unpaid)"}</option>
              </select>
            </div>
          </div>

          {/* Items Allocation Table */}
          <div className="space-y-3">
            <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
              <label className="text-xs font-bold text-slate-500 uppercase">
                {isAr ? "بنود الفاتورة الضريبية" : "Invoice Items Allocation"}
              </label>
              <span className="text-[10px] text-amber-600 font-bold">
                {isAr ? "⚠️ سيتم خصم الكميات من المخازن تلقائياً ومطابقتها ضريبياً" : "⚠️ Stock will be auto-deducted upon posting"}
              </span>
            </div>

            {invoiceItems.map((item, idx) => (
              <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <select
                    value={item.itemId}
                    onChange={(e) => handleItemChange(idx, "itemId", e.target.value)}
                    className="w-full text-xs p-2 rounded border border-slate-200 bg-white"
                    required
                  >
                    <option value="">{isAr ? "-- اختر الصنف الجاهز --" : "-- Select Product --"}</option>
                    {items.filter(i => i.price > 0).map(i => (
                      <option key={i.id} value={i.id}>
                        [{i.sku}] {isAr ? i.nameAr : i.name} - (المتاح: {i.currentStock} {isAr ? "كجم/كيس" : i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-32 space-y-1">
                  <input
                    type="number"
                    placeholder={isAr ? "الكمية" : "Qty"}
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
                      placeholder={isAr ? "السعر (ريال)" : "Price (SAR)"}
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

                {invoiceItems.length > 1 && (
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
              <span>{isAr ? "إضافة سطر صنف جديد" : "Add item line"}</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold animate-shake">
              {errorMessage}
            </div>
          )}

          <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowNewInvoice(false);
                setInvoiceItems([{ itemId: "", itemName: "", quantity: 0, price: 0 }]);
                setSelectedCustomerId("");
              }}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-semibold text-xs hover:bg-slate-50 transition"
            >
              {isAr ? "إلغاء التحرير" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition shadow-xs"
            >
              {isAr ? "ترحيل الفاتورة وإثباتها" : "Post Sales Invoice"}
            </button>
          </div>
        </form>
      )}

      {/* Sales Invoices List */}
      <div className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 animate-pulse"></span>
            <span className="font-bold text-slate-700">
              {isAr ? "إجمالي الفواتير الصادرة بالجملة:" : "Total Wholesale Invoices Drafted:"}
            </span>
            <span className="font-extrabold text-slate-900 font-mono text-sm">{wholesaleInvoices.length}</span>
          </div>
          
          <div className="flex items-center gap-1 text-slate-500 font-bold">
            <Percent className="w-3.5 h-3.5 text-teal-600" />
            <span>{isAr ? "الضريبة التلقائية: 15% مشمولة" : "Automated VAT: 15% Included"}</span>
          </div>
        </div>

        <ERPTable
          data={wholesaleInvoices}
          columns={columns}
          searchKeys={["id", "customerName"]}
          searchPlaceholder={isAr ? "ابحث برقم الفاتورة أو اسم العميل بالجملة..." : "Search sales invoices..."}
          language={language}
          title={isAr ? "فواتير المبيعات الصادرة" : "Wholesale Sales Invoices"}
          exportFileName="wholesale_sales_invoices"
          onRowClick={(row) => setSelectedInvoice(row)}
          quickActions={
            selectedInvoice && (
              <button
                onClick={() => triggerPrintInvoice(selectedInvoice)}
                className="px-3 py-2 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-dark transition flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isAr ? `طباعة الفاتورة [${selectedInvoice.id}]` : `Print invoice [${selectedInvoice.id}]`}</span>
              </button>
            )
          }
        />
      </div>
    </div>
  );
}
