import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { ShoppingBag, CreditCard, RefreshCw, Clipboard, ArrowRightLeft, User, Search, Plus, Trash2, Printer, CheckCircle, AlertTriangle, ShoppingCart } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";

interface DailySalesProps {
  language?: "ar" | "en";
}

export default function DailySalesModule({ language = "ar" }: DailySalesProps) {
  const isAr = language === "ar";
  const { 
    items, customers, salesInvoices, addSalesInvoice, addCashboxTransaction, addCustomerMovement, 
    updateCustomer, addToast, addAuditLog 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"pos" | "return" | "transfer" | "log">("pos");

  // Cart State for Daily Sales (POS-style)
  const [cart, setCart] = useState<{ itemId: string; nameAr: string; name: string; quantity: number; price: number; sku: string; unit: string }[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [saleType, setSaleType] = useState<"Cash" | "Credit">("Cash");
  const [discount, setDiscount] = useState<number>(0);
  const [searchItemQuery, setSearchItemQuery] = useState("");

  // Returns State
  const [returnInvoiceId, setReturnInvoiceId] = useState("");
  const [returnItemId, setReturnItemId] = useState("");
  const [returnQty, setReturnQty] = useState(0);
  const [returnNotes, setReturnNotes] = useState("");

  // Account Transfer State
  const [transferCustomerId, setTransferCustomerId] = useState("");
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferNotes, setTransferNotes] = useState("");

  // Filter items that can be sold (Retail packages and ground coffee)
  const sellableItems = items.filter(
    item => item.category === "FinishedProduct" || item.category === "GroundCoffee" || item.category === "RoastedCoffee"
  );

  const filteredSellableItems = sellableItems.filter(item =>
    item.nameAr.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchItemQuery.toLowerCase())
  );

  // Cart helper functions
  const addToCart = (item: typeof items[0]) => {
    const existing = cart.find(c => c.itemId === item.id);
    if (existing) {
      setCart(prev => prev.map(c => c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart(prev => [...prev, { 
        itemId: item.id, 
        nameAr: item.nameAr, 
        name: item.name, 
        quantity: 1, 
        price: item.price || 45, 
        sku: item.sku, 
        unit: item.unit 
      }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.itemId !== itemId));
  };

  const updateCartQty = (itemId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(c => c.itemId === itemId ? { ...c, quantity: qty } : c));
  };

  // Calculations
  const subtotal = cart.reduce((sum, c) => sum + (c.price * c.quantity), 0);
  const vatAmount = parseFloat(((subtotal - discount) * 0.15).toFixed(2));
  const total = parseFloat((subtotal - discount + vatAmount).toFixed(2));

  // 1. Submit Daily Sale
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      addToast({
        type: "warning",
        message: "السلة فارغة! الرجاء اختيار منتجات أولاً.",
        messageEn: "The cart is empty! Please select products."
      });
      return;
    }

    if (saleType === "Credit" && !selectedCustomerId) {
      addToast({
        type: "warning",
        message: "يرجى تحديد العميل لإتمام عملية البيع الآجل.",
        messageEn: "Please select a credit customer."
      });
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);

    const invoiceLines = cart.map(c => ({
      itemId: c.itemId,
      itemName: c.name,
      itemNameAr: c.nameAr,
      quantity: c.quantity,
      unitPrice: c.price,
      totalPrice: c.price * c.quantity
    }));

    // Trigger state context save
    const result = addSalesInvoice({
      customerId: selectedCustomerId || "Walk-In Cash Customer",
      customerName: customerObj ? customerObj.nameAr : (isAr ? "عميل نقدي" : "Walk-in Client"),
      subtotal,
      vatAmount,
      discount,
      grandTotal: total,
      paid: saleType === "Cash",
      paymentMethod: saleType === "Cash" ? "Cash" : "Credit",
      items: invoiceLines
    }, "Retail");

    if (result.success) {
      // If Cash: Add directly to Cashbox
      if (saleType === "Cash") {
        addCashboxTransaction({
          date: new Date().toISOString().split("T")[0],
          type: "receipt",
          amount: total,
          description: `مبيعات يومية نقدية فاتورة رقم SI-POS-${Date.now().toString().slice(-4)}`,
          category: "مبيعات التجزئة",
          recipient: "الصندوق الرئيسي",
          paymentMethod: "نقدي"
        });
      }

      // If Credit: Update customer balance & Add movement
      if (saleType === "Credit" && selectedCustomerId && customerObj) {
        // Automatically create debt & update customer balance
        updateCustomer(selectedCustomerId, {
          balance: (customerObj.balance || 0) + total
        });

        // Insert in statement ledger
        addCustomerMovement({
          customerId: selectedCustomerId,
          date: new Date().toISOString().split("T")[0],
          type: "sale",
          amount: total,
          reference: `SI-CREDIT-${Date.now().toString().slice(-4)}`,
          notes: `مبيعات آجلة لـ ${customerObj.nameAr}`
        });

        addAuditLog(
          "بيع آجل",
          `تسجيل دين مالي بقيمة ${total} ريال على العميل ${customerObj.nameAr} وتحديث كشف حسابه آلياً.`
        );
      }

      addToast({
        type: "success",
        message: `تم إصدار الفاتورة بقيمة ${total.toLocaleString()} ريال بنجاح!`,
        messageEn: `Invoice created successfully for SAR ${total.toLocaleString()}`
      });

      // Clear Cart
      setCart([]);
      setSelectedCustomerId("");
      setDiscount(0);
    }
  };

  // 2. Submit Return
  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnItemId || returnQty <= 0) {
      addToast({
        type: "warning",
        message: "الرجاء ملء بيانات المرتجع بالكامل وبشكل صحيح.",
        messageEn: "Please fill return data correctly."
      });
      return;
    }

    const matchedItem = items.find(i => i.id === returnItemId);
    if (!matchedItem) return;

    const returnAmount = (matchedItem.price || 40) * returnQty;

    // Update Cashbox (Outflow of money) or Client Credit
    if (selectedCustomerId) {
      const customerObj = customers.find(c => c.id === selectedCustomerId);
      if (customerObj) {
        updateCustomer(selectedCustomerId, {
          balance: Math.max(0, (customerObj.balance || 0) - returnAmount)
        });
        addCustomerMovement({
          customerId: selectedCustomerId,
          date: new Date().toISOString().split("T")[0],
          type: "return",
          amount: returnAmount,
          reference: `RET-${Date.now().toString().slice(-4)}`,
          notes: `مرتجع مبيعات صنف: ${matchedItem.nameAr}`
        });
      }
    } else {
      addCashboxTransaction({
        date: new Date().toISOString().split("T")[0],
        type: "expense",
        amount: returnAmount,
        description: `مرتجع مبيعات نقدي صنف ${matchedItem.nameAr}`,
        category: "مرتجع مبيعات",
        recipient: "عميل نقدي",
        paymentMethod: "نقدي"
      });
    }

    // Adjust item stock up (return to warehouse)
    // In our simplified logic, state updates of stock are handled by audit logs / adjustments.
    addAuditLog("مرتجع مبيعات", `تم تسجيل مرتجع مبيعات للصنف ${matchedItem.nameAr} كمية ${returnQty} بقيمة ${returnAmount} ريال.`);

    addToast({
      type: "success",
      message: `تم تسجيل مرتجع المبيعات وإرجاع البضاعة للمخزن بقيمة ${returnAmount} ريال.`,
      messageEn: `Sales return recorded for SAR ${returnAmount}`
    });

    // Clear state
    setReturnInvoiceId("");
    setReturnItemId("");
    setReturnQty(0);
    setReturnNotes("");
  };

  // 3. Customer Account Transfer (سداد الديون / تحصيل)
  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferCustomerId || transferAmount <= 0) {
      addToast({
        type: "warning",
        message: "الرجاء تحديد العميل والمبلغ المراد تحويله.",
        messageEn: "Please select customer and correct amount."
      });
      return;
    }

    const customerObj = customers.find(c => c.id === transferCustomerId);
    if (!customerObj) return;

    // Reduce Customer Debt
    updateCustomer(transferCustomerId, {
      balance: Math.max(0, (customerObj.balance || 0) - transferAmount)
    });

    // Register Customer Payment Movement
    addCustomerMovement({
      customerId: transferCustomerId,
      date: new Date().toISOString().split("T")[0],
      type: "payment",
      amount: transferAmount,
      reference: `PMT-${Date.now().toString().slice(-4)}`,
      notes: transferNotes || `سداد جزء من المديونية آلياً`
    });

    // Feed cash directly into Cashbox
    addCashboxTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "receipt",
      amount: transferAmount,
      description: `تحصيل نقدي من حساب العميل: ${customerObj.nameAr}`,
      category: "تحصيل عملاء",
      recipient: "الصندوق الرئيسي",
      paymentMethod: "نقدي"
    });

    addAuditLog(
      "تحصيل وسداد",
      `تم استلام مبلغ ${transferAmount} ريال من العميل ${customerObj.nameAr}. تم خصمه من مديونيته وتوريده للصندوق مباشرة.`
    );

    addToast({
      type: "success",
      message: `تم تحويل مبلغ ${transferAmount.toLocaleString()} ريال إلى حساب العميل وتحديث رصيد دينه آلياً.`,
      messageEn: `Saddled SAR ${transferAmount} into customer account.`
    });

    // Clear State
    setTransferCustomerId("");
    setTransferAmount(0);
    setTransferNotes("");
  };

  // Invoices log columns
  const invoiceColumns: ColumnDef[] = [
    { key: "id", header: "رقم الفاتورة", headerEn: "Invoice No" },
    { key: "customerName", header: "العميل", headerEn: "Customer" },
    { key: "grandTotal", header: "القيمة الإجمالية", headerEn: "Grand Total", render: (val) => <span className="font-mono font-bold text-slate-900">SAR {Number(val).toLocaleString()}</span> },
    { key: "paymentMethod", header: "طريقة الدفع", headerEn: "Type", render: (val) => <span className={`px-2 py-1 rounded text-xs font-bold ${val === "Cash" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{val === "Cash" ? "نقدي" : "آجل"}</span> },
    { key: "paid", header: "الحالة", headerEn: "Status", render: (val) => <span className={`text-xs font-bold ${val ? "text-emerald-600" : "text-rose-600"}`}>{val ? "مدفوعة بالكامل" : "غير مدفوعة (ذمة)"}</span> }
  ];

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="محطة المبيعات اليومية ونقاط البيع"
        titleEn="Daily Retail & Over-the-Counter Sales"
        description="تسجيل فواتير المعرض المباشرة، معالجة المرتجعات، وتوريد التحصيلات للصندوق تلقائياً."
        descriptionEn="Counter POS sales, customer credit settlements, sales returns, and cashbox receipts."
        icon={ShoppingBag}
        breadcrumbs={[
          { label: "المبيعات ونقاط البيع", labelEn: "Sales & POS" },
          { 
            label: activeTab === "pos" ? "نقاط بيع فورية" :
                   activeTab === "return" ? "مرتجع مبيعات" :
                   activeTab === "transfer" ? "تحويل لحساب العميل" : "سجل فواتير اليوم",
            labelEn: activeTab === "pos" ? "POS Terminal" :
                     activeTab === "return" ? "Sales Returns" :
                     activeTab === "transfer" ? "Credit Settlement" : "Today's Logs",
            active: true 
          }
        ]}
        language={language}
      />

      {/* Standardized Secondary Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("pos")}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "pos" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{isAr ? "نقاط بيع فورية" : "POS Sale"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("return")}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "return" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>{isAr ? "مرتجع مبيعات" : "Returns"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transfer")}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "transfer" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>{isAr ? "تحويل لحساب العميل" : "Customer Settle"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("log")}
          className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "log" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clipboard className="w-4 h-4" />
          <span>{isAr ? "سجل فواتير اليوم" : "Today's Logs"}</span>
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === "pos" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Products Grid (Touch Screen Style) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-2">
              <Search className="w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={isAr ? "ابحث عن بن محمص، مطحون، علب..." : "Search items to sell..."}
                value={searchItemQuery}
                onChange={(e) => setSearchItemQuery(e.target.value)}
                className="w-full bg-transparent focus:outline-none text-sm"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredSellableItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white p-4 rounded-xl border border-slate-200 text-right hover:border-teal-600 hover:shadow-md transition duration-200 flex flex-col justify-between h-36 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 left-0 h-1 bg-amber-500/80"></div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block font-bold">{item.sku}</span>
                    <span className="font-extrabold text-sm text-slate-800 line-clamp-2 mt-1">{isAr ? item.nameAr : item.name}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">{item.unit}</span>
                    <span className="font-mono text-xs font-extrabold text-teal-700">SAR {item.price || 45}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Checkout Panel (POS Terminal Box) */}
          <form onSubmit={handleCheckout} className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-base">{isAr ? "فاتورة مبيعات جديدة" : "POS Receipt Builder"}</h3>
              <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-1 rounded-full">{isAr ? "مبيعات الصالة" : "POS"}</span>
            </div>

            {/* Selected Items List */}
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-10 text-slate-400 space-y-2">
                  <ShoppingCart className="w-8 h-8 mx-auto text-slate-300" />
                  <p className="text-xs font-bold">{isAr ? "السلة فارغة حالياً" : "Your cart is empty"}</p>
                </div>
              ) : (
                cart.map(c => (
                  <div key={c.itemId} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-800">{isAr ? c.nameAr : c.name}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">SAR {c.price} / {c.unit}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center bg-white border border-slate-200 rounded-md">
                        <button 
                          type="button" 
                          onClick={() => updateCartQty(c.itemId, c.quantity - 1)}
                          className="px-2 py-1 hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-2 font-mono font-bold text-slate-800">{c.quantity}</span>
                        <button 
                          type="button" 
                          onClick={() => updateCartQty(c.itemId, c.quantity + 1)}
                          className="px-2 py-1 hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removeFromCart(c.itemId)}
                        className="text-rose-600 hover:text-rose-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer & Payment Options */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              {/* Sale Type (Cash vs Credit) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSaleType("Cash")}
                  className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border ${
                    saleType === "Cash" ? "bg-teal-50 border-teal-600 text-teal-800" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>{isAr ? "بيع نقدي" : "Cash Sale"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleType("Credit")}
                  className={`py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border ${
                    saleType === "Credit" ? "bg-amber-50 border-amber-600 text-amber-800" : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>{isAr ? "بيع آجل (ذمة)" : "Credit Sale"}</span>
                </button>
              </div>

              {/* Customer Selector */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 block">
                  {saleType === "Credit" 
                    ? (isAr ? "العميل المدين *" : "Credit Customer *")
                    : (isAr ? "العميل (اختياري)" : "Customer (Optional)")
                  }
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition"
                  required={saleType === "Credit"}
                >
                  <option value="">{isAr ? "--- اختر عميل من الدفتر ---" : "--- Select Customer ---"}</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} {c.balance > 0 ? `(المديونية: SAR ${c.balance.toLocaleString()})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount Selector */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-500 block">{isAr ? "خصم إضافي (ريال)" : "Discount (SAR)"}</label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-xs focus:outline-none focus:ring-1 focus:ring-teal-700 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Calculations and Actions */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-200">
              <div className="flex items-center justify-between text-slate-500">
                <span>{isAr ? "المجموع الفرعي" : "Subtotal"}</span>
                <span className="font-mono font-bold">SAR {subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-rose-600 font-bold">
                  <span>{isAr ? "الخصم" : "Discount"}</span>
                  <span className="font-mono">- SAR {discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-500">
                <span>{isAr ? "ضريبة القيمة المضافة (15%)" : "VAT (15%)"}</span>
                <span className="font-mono font-bold">SAR {vatAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex items-center justify-between text-sm font-black text-slate-900">
                <span>{isAr ? "المجموع الإجمالي" : "Total Due"}</span>
                <span className="font-mono text-teal-700 text-base font-black">SAR {total.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition text-base shadow-lg shadow-teal-700/20 flex items-center justify-center gap-3"
            >
              <Printer className="w-5 h-5" />
              <span>{isAr ? "إصدار وطباعة الفاتورة" : "Print & Process Sale"}</span>
            </button>
          </form>
        </div>
      )}

      {/* Sales Return Tab */}
      {activeTab === "return" && (
        <form onSubmit={handleReturnSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-teal-700" />
              {isAr ? "تسجيل مرتجع مبيعات جديد" : "Process Sales Return"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? "تقوم هذه الحركة بإعادة المنتجات للمخزون تلقائياً وإرجاع المبلغ نقداً أو رصيد لحساب العميل." : "This will restock returned items and handle client balances automatically."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">{isAr ? "رقم الفاتورة الأصلي" : "Original Invoice Number"}</label>
              <input
                type="text"
                placeholder="e.g. SI-POS-1001"
                value={returnInvoiceId}
                onChange={(e) => setReturnInvoiceId(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">{isAr ? "اسم العميل (إذا كان بيع آجل)" : "Credit Customer (if applicable)"}</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
              >
                <option value="">{isAr ? "--- عميل نقدي (لا يخصم من مديونية) ---" : "--- Walk-in Customer ---"}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">{isAr ? "المنتج المرتجع *" : "Returned Item *"}</label>
              <select
                value={returnItemId}
                onChange={(e) => setReturnItemId(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
                required
              >
                <option value="">{isAr ? "--- اختر المنتج ---" : "--- Select Item ---"}</option>
                {sellableItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.nameAr} ({item.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500">{isAr ? "الكمية المرجعة *" : "Returned Quantity *"}</label>
              <input
                type="number"
                min="1"
                value={returnQty}
                onChange={(e) => setReturnQty(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-500">{isAr ? "السبب / ملاحظات" : "Reason / Return Notes"}</label>
            <textarea
              placeholder={isAr ? "اكتب سبب إرجاع المنتج..." : "Return explanation..."}
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700 h-20 resize-none text-xs"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-xs"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isAr ? "تأكيد إرجاع البضاعة وتحديث الحسابات" : "Confirm Return & Restock"}</span>
          </button>
        </form>
      )}

      {/* Customer Account Settle / Debt Transfer */}
      {activeTab === "transfer" && (
        <form onSubmit={handleTransferSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-xl mx-auto space-y-4 animate-fade-in">
          <div className="border-b border-slate-100 pb-3 text-right">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 justify-start">
              <ArrowRightLeft className="w-5 h-5 text-teal-700" />
              {isAr ? "تحويل مالي إلى حساب عميل (تحصيل ديون)" : "Transfer to Customer Credit"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? "عند تحصيل مبالغ نقدية من العملاء، سجلها هنا لتخصم من مديونتهم وتغذي الصندوق مباشرة." : "Settle credit balances directly and record payment in customer statement."}
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "العميل المدين *" : "Customer to Credit *"}</label>
              <select
                value={transferCustomerId}
                onChange={(e) => setTransferCustomerId(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs"
                required
              >
                <option value="">{isAr ? "--- اختر عميل من الدفتر ---" : "--- Select Customer ---"}</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} (المديونية الحالية: SAR {c.balance.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "المبلغ المستلم (ريال) *" : "Received Cash Amount (SAR) *"}</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={transferAmount || ""}
                onChange={(e) => setTransferAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700 font-mono font-bold text-slate-900"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "بيان الحركة / ملاحظات السداد" : "Transaction Notes"}</label>
              <input
                type="text"
                placeholder={isAr ? "مثال: سند قبض رقم 412 - تحصيل دفعة بشيك" : "Payment references..."}
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-4.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition text-base flex items-center justify-center gap-2 shadow-xs"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isAr ? "ترحيل السداد وتنزيل المديونية" : "Post Payment & Reduce Debt"}</span>
          </button>
        </form>
      )}

      {/* Today's logs */}
      {activeTab === "log" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <ERPTable
            data={salesInvoices.filter(inv => inv.customerName !== "B2B Bulk Wholesale Trader")} // Exclude wholesale for this list
            columns={invoiceColumns}
            language={language}
          />
        </div>
      )}
    </div>
  );
}
