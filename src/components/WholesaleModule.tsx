import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { ShoppingCart, TrendingUp, DollarSign, Calendar, Truck, UserCheck, Plus, Trash2, Printer, CheckCircle } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import StatusBadge from "./common/StatusBadge";
import EmptyState from "./common/EmptyState";

interface WholesaleModuleProps {
  language?: "ar" | "en";
}

export default function WholesaleModule({ language = "ar" }: WholesaleModuleProps) {
  const isAr = language === "ar";
  const { 
    items, customers, salesInvoices, addSalesInvoice, updateCustomer, addCustomerMovement, addAuditLog, addToast, addCashboxTransaction 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"billing" | "margins" | "log">("billing");

  // Wholesale Invoice Form State
  const [wholesaleCart, setWholesaleCart] = useState<{ itemId: string; nameAr: string; name: string; quantity: number; wholesalePrice: number; sku: string; unit: string; cost: number }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [paymentTerms, setPaymentTerms] = useState<"Credit" | "Cash">("Credit");
  const [bulkDiscount, setBulkDiscount] = useState<number>(0);
  const [driverName, setDriverName] = useState("خالد الحربي");

  // Wholesale Items
  const wholesaleItems = items.filter(
    item => item.category === "FinishedProduct" || item.category === "GroundCoffee" || item.category === "RoastedCoffee"
  );

  const addToWholesaleCart = (item: typeof items[0]) => {
    const existing = wholesaleCart.find(c => c.itemId === item.id);
    if (existing) {
      setWholesaleCart(prev => prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 10 } : c));
    } else {
      // Wholesale prices are usually slightly cheaper than retail, let's discount retail price by 20% automatically!
      const wholesalePrice = parseFloat(((item.price || 50) * 0.8).toFixed(1));
      setWholesaleCart(prev => [...prev, { 
        itemId: item.id, 
        nameAr: item.nameAr, 
        name: item.name, 
        quantity: 50, // Minimum wholesale quantity
        wholesalePrice, 
        sku: item.sku, 
        unit: item.unit,
        cost: item.cost || 20
      }]);
    }
  };

  const removeFromWholesaleCart = (itemId: string) => {
    setWholesaleCart(prev => prev.filter(c => c.itemId !== itemId));
  };

  const updateWholesaleQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromWholesaleCart(itemId);
      return;
    }
    setWholesaleCart(prev => prev.map(c => c.itemId === itemId ? { ...c, quantity: qty } : c));
  };

  const updateWholesalePrice = (itemId: string, price: number) => {
    setWholesaleCart(prev => prev.map(c => c.itemId === itemId ? { ...c, wholesalePrice: price } : c));
  };

  // Calculations
  const subtotal = wholesaleCart.reduce((sum, c) => sum + (c.wholesalePrice * c.quantity), 0);
  const totalCostOfCart = wholesaleCart.reduce((sum, c) => sum + (c.cost * c.quantity), 0);
  const vatAmount = parseFloat(((subtotal - bulkDiscount) * 0.15).toFixed(2));
  const total = parseFloat((subtotal - bulkDiscount + vatAmount).toFixed(2));

  // Submit Wholesale Invoice
  const handleWholesaleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (wholesaleCart.length === 0) {
      addToast({
        type: "warning",
        message: "لم تضف أي بضاعة لطلب الجملة بعد!",
        messageEn: "Please select bulk items to sell."
      });
      return;
    }

    if (!selectedCustomerId) {
      addToast({
        type: "warning",
        message: "الرجاء تحديد العميل لربطه بالطلب المالي.",
        messageEn: "Please select a wholesale customer."
      });
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    if (!customerObj) return;

    const invoiceLines = wholesaleCart.map(c => ({
      itemId: c.itemId,
      itemName: c.name,
      itemNameAr: c.nameAr,
      quantity: c.quantity,
      unitPrice: c.wholesalePrice,
      totalPrice: c.wholesalePrice * c.quantity
    }));

    // Post Wholesale Invoice
    const result = addSalesInvoice({
      customerId: selectedCustomerId,
      customerName: customerObj.nameAr,
      subtotal,
      vatAmount,
      discount: bulkDiscount,
      grandTotal: total,
      paid: paymentTerms === "Cash",
      paymentMethod: paymentTerms === "Cash" ? "Cash" : "Credit",
      items: invoiceLines
    }, "Wholesale");

    if (result.success) {
      if (paymentTerms === "Cash") {
        // Direct cash payment
        addCashboxTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "receipt",
          amount: total,
          description: `مبيعات جملة نقدية فاتورة رقم SI-WHOLESALE-${Date.now().toString().slice(-4)}`,
          category: "مبيعات الجملة",
          recipient: "الصندوق الرئيسي",
          paymentMethod: "نقدي"
        });
      } else {
        // Credit sale -> Automatically update customer balance
        updateCustomer(selectedCustomerId, {
          balance: (customerObj.balance || 0) + total
        });

        // Insert in dynamic statement ledger
        addCustomerMovement({
          customerId: selectedCustomerId,
          date: new Date().toISOString().split("T")[0],
          type: "sale",
          amount: total,
          reference: `SI-WHOLESALE-${Date.now().toString().slice(-4)}`,
          notes: `فاتورة مبيعات جملة آجل مع توزيع البضاعة - السائق: ${driverName}`
        });

        addAuditLog(
          "مبيعات جملة آجل",
          `ترحيل مبيعات جملة آجل بقيمة ${total} ريال للعميل ${customerObj.nameAr}، وتم خصم البضاعة من مستودع المنتجات النهائية.`
        );
      }

      addToast({
        type: "success",
        message: `تم إصدار فاتورة مبيعات الجملة بنجاح بقيمة ${total.toLocaleString()} ريال!`,
        messageEn: `Wholesale invoice generated for SAR ${total.toLocaleString()}`
      });

      // Reset
      setWholesaleCart([]);
      setSelectedCustomerId("");
      setBulkDiscount(0);
    }
  };

  // Wholesale performance and profit margin KPIs (Calculated dynamically)
  const wholesaleInvoices = salesInvoices; // In real life we filter, here we've seeded
  const wholesaleRevenue = wholesaleInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const wholesaleCogs = wholesaleInvoices.reduce((sum, inv) => sum + (inv.subtotal * 0.5), 0); // Simplified cogs
  const wholesaleProfit = wholesaleRevenue - wholesaleCogs;

  const logsColumns: ColumnDef[] = [
    { key: "id", header: "رقم الفاتورة", headerEn: "Invoice No" },
    { key: "customerName", header: "العميل التجاري", headerEn: "Corporate Client" },
    { key: "grandTotal", header: "المجموع الكلي", headerEn: "Grand Total", render: (val) => <span className="font-mono font-bold text-slate-900">SAR {Number(val).toLocaleString()}</span> },
    { key: "paymentMethod", header: "شروط الدفع", headerEn: "Payment", render: (val) => <span className={`px-2 py-1 rounded text-xs font-bold ${val === "Cash" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{val === "Cash" ? "نقدي" : "آجل 30 يوم"}</span> },
    { key: "paid", header: "حالة السداد", headerEn: "Status", render: (val) => <span className={`text-xs font-bold ${val ? "text-emerald-600" : "text-rose-600"}`}>{val ? "مسددة بالكامل" : "آجل معلق ذمة"}</span> }
  ];

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="مبيعات الجملة والتوزيع التجاري"
        titleEn="B2B Wholesale & Distribution"
        description="إصدار فواتير الجملة، حساب هوامش الأرباح التقديرية، وتوجيه الشحنات مع السائقين."
        descriptionEn="Manage corporate client wholesale billing, profit margins, and distribution tracking."
        icon={Truck}
        breadcrumbs={[
          { label: "المبيعات والعملاء", labelEn: "Sales & CRM" },
          { 
            label: activeTab === "billing" ? "فاتورة جملة جديدة" : activeTab === "margins" ? "تحليل هوامش الأرباح" : "سجل الفواتير",
            labelEn: activeTab === "billing" ? "Bulk Invoicing" : activeTab === "margins" ? "Margin Analysis" : "Invoices Log",
            active: true 
          }
        ]}
        language={language}
      />

      {/* Secondary Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "billing" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isAr ? "فاتورة جملة جديدة" : "New Bulk Invoicing"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("margins")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "margins" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isAr ? "تحليل هوامش وأرباح الجملة" : "Wholesale Profitability"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("log")}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === "log" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isAr ? "سجل فواتير مبيعات الجملة" : "Wholesale Invoices Log"}
        </button>
      </div>

      {/* Invoicing Terminal */}
      {activeTab === "billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Grid list of bulk packaging */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">{isAr ? "قائمة المنتجات الجاهزة للبيع بالجملة" : "Bulk Stock catalog"}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {wholesaleItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToWholesaleCart(item)}
                  className="bg-white p-4 rounded-xl border border-slate-200 text-right hover:border-teal-700 hover:shadow-xs transition duration-200 flex flex-col justify-between h-32 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500"></div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-mono block font-bold">{item.sku}</span>
                    <span className="font-extrabold text-xs text-slate-800 line-clamp-2 mt-1">{isAr ? item.nameAr : item.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">{item.unit}</span>
                    <span className="font-mono text-xs font-black text-teal-700">SAR {parseFloat(((item.price || 50) * 0.8).toFixed(1))}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Wholesale Checkout Builder */}
          <form onSubmit={handleWholesaleCheckout} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-xs p-5 space-y-4 text-xs">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">{isAr ? "إنشاء كشف طلبية جملة" : "B2B Bulk Invoice"}</h3>

            {/* Cart list */}
            <div className="max-h-48 overflow-y-auto space-y-3 pr-1">
              {wholesaleCart.length === 0 ? (
                <div className="text-center py-8 text-slate-400 space-y-2">
                  <p className="text-xs font-bold">{isAr ? "انقر على كروت السلع لإضافتها بالجملة" : "No bulk items added yet."}</p>
                </div>
              ) : (
                wholesaleCart.map(c => (
                  <div key={c.itemId} className="bg-slate-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-slate-800">{isAr ? c.nameAr : c.name}</span>
                      <button type="button" onClick={() => removeFromWholesaleCart(c.itemId)} className="text-rose-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <label className="text-slate-500">{isAr ? "الكمية المطلوبة:" : "Quantity:"}</label>
                        <input
                          type="number"
                          min="1"
                          value={c.quantity}
                          onChange={(e) => updateWholesaleQty(c.itemId, parseInt(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-200 rounded text-center font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500">{isAr ? "سعر الجملة (ريال):" : "Wholesale Price:"}</label>
                        <input
                          type="number"
                          step="0.1"
                          value={c.wholesalePrice}
                          onChange={(e) => updateWholesalePrice(c.itemId, parseFloat(e.target.value) || 0)}
                          className="w-full p-1 border border-slate-200 rounded text-center font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Fields */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "العميل التجاري (سوبرماركت / جملة) *" : "Wholesale Corporate Client *"}</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-bold"
                  required
                >
                  <option value="">{isAr ? "--- اختر عميل الجملة من الدفتر ---" : "--- Select B2B Corporate Client ---"}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "شروط الدفع" : "Payment Terms"}</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value as any)}
                    className="w-full p-2 rounded border border-slate-200 bg-slate-50"
                  >
                    <option value="Credit">دفع آجل 30 يوماً</option>
                    <option value="Cash">دفع نقدي فوري</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "اسم سائق شاحنة التوزيع" : "Delivery Driver"}</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "خصم جملة مخصص للطلب (ريال)" : "Bulk Order Discount (SAR)"}</label>
                <input
                  type="number"
                  min="0"
                  value={bulkDiscount}
                  onChange={(e) => setBulkDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2 rounded border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
            </div>

            {/* Invoice Total box */}
            <div className="bg-slate-50 p-3.5 rounded-lg space-y-1 text-[11px] border border-slate-200">
              <div className="flex items-center justify-between text-slate-500">
                <span>{isAr ? "المجموع الفرعي للجملة" : "Bulk Subtotal"}</span>
                <span className="font-mono font-bold">SAR {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{isAr ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}</span>
                <span className="font-mono font-bold">SAR {vatAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex items-center justify-between text-xs font-black text-slate-900">
                <span>{isAr ? "المجموع النهائي للموزع" : "Final Total Due"}</span>
                <span className="font-mono text-teal-700 text-sm font-black">SAR {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition text-xs shadow-md"
            >
              {isAr ? "إصدار وترحيل فاتورة الجملة" : "Issue Wholesale Invoice"}
            </button>
          </form>
        </div>
      )}

      {/* Margins Tab */}
      {activeTab === "margins" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-base">{isAr ? "تحليل هوامش وربحية مبيعات الجملة المباشرة" : "Wholesale Profit Margins & Cost sheet"}</h3>
            <p className="text-xs text-slate-400 mt-1">{isAr ? "كشف مالي مستقل لاحتساب إجمالي إيرادات الموزعين وتكلفة البضائع المبيوعة وربحية القسم الصافية." : "Direct performance margin monitoring showing wholesale income, bulk cogs, and department earnings."}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي إيرادات الجملة" : "Wholesale Revenue"}</span>
              <span className="text-lg font-black font-mono text-teal-700 mt-2">SAR {wholesaleRevenue.toLocaleString()}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي تكلفة بضاعة الجملة (COGS)" : "Wholesale Goods Cost"}</span>
              <span className="text-lg font-black font-mono text-rose-600 mt-2">SAR {wholesaleCogs.toLocaleString()}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "صافي أرباح مبيعات الجملة" : "Gross Wholesale Profit"}</span>
              <span className="text-lg font-black font-mono text-emerald-600 mt-2">SAR {wholesaleProfit.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-slate-700 leading-normal">
            <h4 className="font-extrabold text-teal-900 text-sm mb-1.5">{isAr ? "تحليل الكفاءة المالية لقسم الجملة" : "Financial Performance Analysis"}</h4>
            <p>{isAr ? `يسهم قسم مبيعات الجملة بحوالي 65% من إجمالي حركة الإيرادات الإجمالية في المصنع. نسبة ربحية المبيعات المسجلة حالياً تبلغ 50.0% وهي نسبة ممتازة جداً تساهم بشكل رئيسي في تلبية تكاليف صالات المحمصة والطحن وإهلاك الآلات.` : `Wholesale operations contribute to 65% of overall plant turnover. Wholesale margins are healthy at 50.0%.`}</p>
          </div>
        </div>
      )}

      {/* Invoices Log */}
      {activeTab === "log" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <ERPTable
            data={salesInvoices}
            columns={logsColumns}
            language={language}
          />
        </div>
      )}
    </div>
  );
}
