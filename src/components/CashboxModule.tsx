import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Landmark, ArrowUpRight, ArrowDownLeft, ShieldAlert, Plus, Trash2, CheckCircle, FileText, Sparkles, DollarSign } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface CashboxModuleProps {
  language?: "ar" | "en";
}

export default function CashboxModule({ language = "ar" }: CashboxModuleProps) {
  const isAr = language === "ar";
  const { 
    cashboxTransactions, addCashboxTransaction, deleteCashboxTransaction, addAuditLog, addToast 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"terminal" | "vouchers">("terminal");

  // Vouchers state
  const [txType, setTxType] = useState<"receipt" | "payment" | "expense">("receipt");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("مبيعات");
  const [recipient, setRecipient] = useState("الخزينة الرئيسية");
  const [paymentMethod, setPaymentMethod] = useState("نقدي");

  // Calculations
  const totalReceipts = cashboxTransactions
    .filter(t => t.type === "receipt")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaymentsAndExpenses = cashboxTransactions
    .filter(t => t.type === "payment" || t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Live Safe Cash Balance
  const liveCashboxBalance = 125000 + totalReceipts - totalPaymentsAndExpenses; // Adding initial seed cash balance (125k)

  // Submit Voucher
  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      addToast({
        type: "warning",
        message: "يرجى تعبئة بيانات السند بالكامل وتحديد مبلغ صحيح.",
        messageEn: "Please fill voucher details completely with a valid amount."
      });
      return;
    }

    if ((txType === "payment" || txType === "expense") && amount > liveCashboxBalance) {
      addToast({
        type: "error",
        message: "رصيد الصندوق غير كافٍ لإجراء عملية الصرف الحالية!",
        messageEn: "Insufficient cash box balance for this disbursement!"
      });
      return;
    }

    addCashboxTransaction({
      date: new Date().toISOString().split("T")[0],
      type: txType,
      amount,
      description,
      category,
      recipient,
      paymentMethod
    });

    addAuditLog(
      "حركة صندوق",
      `تسجيل سند (${txType === "receipt" ? "قبض" : txType === "payment" ? "صرف" : "مصروف"}) بقيمة ${amount} ريال - ${description}`
    );

    addToast({
      type: "success",
      message: `تم قيد السند بنجاح بقيمة ${amount.toLocaleString()} ريال!`,
      messageEn: `Voucher successfully posted for SAR ${amount.toLocaleString()}`
    });

    // Reset Form
    setAmount(0);
    setDescription("");
  };

  const logColumns: ColumnDef[] = [
    { key: "id", header: "رقم الحركة", headerEn: "ID" },
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "type", header: "نوع الحركة", headerEn: "Type", render: (val) => (
      <span className={`px-2 py-1 rounded text-xs font-bold ${
        val === "receipt" ? "bg-emerald-100 text-emerald-800" :
        val === "payment" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
      }`}>
        {val === "receipt" ? "سند قبض" :
         val === "payment" ? "سند صرف" : "مصروفات عامة"}
      </span>
    )},
    { key: "category", header: "التصنيف", headerEn: "Category" },
    { key: "recipient", header: "المستلم/الجهة", headerEn: "Recipient/Source" },
    { key: "description", header: "البيان والتفاصيل", headerEn: "Description" },
    { key: "paymentMethod", header: "الوسيلة", headerEn: "Method" },
    { key: "amount", header: "المبلغ (ريال)", headerEn: "Amount", render: (val, row) => (
      <span className={`font-mono font-bold ${row.type === "receipt" ? "text-emerald-600" : "text-rose-600"}`}>
        {row.type === "receipt" ? "+" : "-"} SAR {Number(val).toLocaleString()}
      </span>
    )},
    {
      key: "actions",
      header: "خيارات",
      headerEn: "Actions",
      render: (_, row) => (
        <button
          onClick={() => {
            if (confirm(isAr ? "هل أنت متأكد من حذف هذه الحركة؟" : "Delete transaction?")) {
              deleteCashboxTransaction(row.id);
            }
          }}
          className="p-1 text-slate-400 hover:text-rose-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs uppercase font-bold text-amber-600 tracking-wider font-mono">
          {isAr ? "الخزينة المباشرة وإدارة السيولة النقدية" : "DIRECT CASHBOX & SAFE LIQUIDITY CONTROL"}
        </span>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Landmark className="w-8 h-8 text-teal-700" />
          {isAr ? "إدارة الصندوق والخزينة" : "Cashbox Department"}
        </h1>
      </div>

      {/* Touch friendly navigation */}
      <div className="grid grid-cols-2 gap-3 bg-slate-100 p-2 rounded-2xl">
        <button
          onClick={() => setActiveTab("terminal")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "terminal" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "دفتر حركة الصندوق الفوري" : "Cash Ledger Log"}
        </button>

        <button
          onClick={() => setActiveTab("vouchers")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "vouchers" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "إصدار سند قبض / صرف جديد" : "Issue Receipt/Payment Vouchers"}
        </button>
      </div>

      {/* KPI Overview of Cash Safe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "السيولة المتوفرة بالصندوق" : "Live Cash Box Balance"}</span>
            <span className="text-xl font-black font-mono text-emerald-600">SAR {liveCashboxBalance.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي المقبوضات الجديدة" : "Total Receipts"}</span>
            <span className="text-xl font-black font-mono text-slate-800">SAR {totalReceipts.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي المدفوعات والمصروفات" : "Total Payments"}</span>
            <span className="text-xl font-black font-mono text-rose-600">SAR {totalPaymentsAndExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Cashbox Log */}
      {activeTab === "terminal" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
            {isAr ? "حركات الصندوق والخزينة الجارية" : "Live Cashbox Transaction Ledger"}
          </h3>
          <ERPTable
            data={cashboxTransactions}
            columns={logColumns}
            language={language}
          />
        </div>
      )}

      {/* Voucher Invoicing Maker */}
      {activeTab === "vouchers" && (
        <form onSubmit={handleVoucherSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-700" />
              {isAr ? "تحرير وإصدار سند جديد" : "Issue Cash Box Voucher"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr ? "قم بتقييد حركات القبض أو الصرف أو المصاريف العامة التي تتم يدوياً داخل صالة المحمصة." : "Process standard cash receipts, supplier payments, or miscellaneous expenses directly."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "نوع السند المالي *" : "Voucher Type *"}</label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 font-bold"
                required
              >
                <option value="receipt">سند قبض (توريد نقود للصندوق)</option>
                <option value="payment">سند صرف (إخراج نقود للبنك/الغير)</option>
                <option value="expense">سند مصروفات (مشتريات نثرية ومصروفات)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "المبلغ (ريال) *" : "Voucher Amount (SAR) *"}</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 150"
                value={amount || ""}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full p-3 rounded-lg border border-slate-200 font-mono font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-700"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "تصنيف العملية" : "Classification Category"}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50"
              >
                <option value="مبيعات">إيرادات ومبيعات</option>
                <option value="تحصيل عملاء">دفعة من عميل</option>
                <option value="سداد موردين">دفعة لمورد</option>
                <option value="مصروفات نثرية">مصاريف نثرية وضيافة</option>
                <option value="صيانة وتشغيل">قطع صيانة تشغيلية</option>
                <option value="رواتب وأجور">رواتب عمال دورية</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "المستلم / الجهة المستفيدة" : "Payee / Source"}</label>
              <input
                type="text"
                placeholder="مثال: شركة الراجحي للغاز، كاشير الصالة"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            <label className="font-bold text-slate-500 block">{isAr ? "بيان تفاصيل العملية بالكامل *" : "Full Voucher Description *"}</label>
            <textarea
              placeholder="اكتب تفاصيل الفاتورة أو المرجع..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50 h-20 resize-none"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-4.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition text-sm flex items-center justify-center gap-2 shadow-xs"
          >
            <CheckCircle className="w-5 h-5" />
            <span>{isAr ? "ترحيل السند وتحديث الصندوق" : "Post Voucher"}</span>
          </button>
        </form>
      )}
    </div>
  );
}
