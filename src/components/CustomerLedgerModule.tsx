import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Users, FileText, Landmark, ShieldAlert, ArrowDownCircle, ArrowUpCircle, Printer, Plus, Trash2, Edit, X, Search, DollarSign } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface CustomerLedgerProps {
  language?: "ar" | "en";
}

export default function CustomerLedgerModule({ language = "ar" }: CustomerLedgerProps) {
  const isAr = language === "ar";
  const { 
    customers, customerMovements, addCustomer, updateCustomer, deleteCustomer, addCustomerMovement, addCashboxTransaction, addToast, addAuditLog 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"directory" | "statement" | "debts" | "movements">("directory");
  
  // Statement Selector
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || "");
  
  // Add Customer Form Modal
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [nameAr, setNameAr] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  // Collection receipt form state (direct collection on this screen!)
  const [showCollectForm, setShowCollectForm] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectNotes, setCollectNotes] = useState("");

  // Statistics
  const totalReceivables = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const indebtedCount = customers.filter(c => (c.balance || 0) > 0).length;

  const handleOpenEdit = (cust: any) => {
    setEditingCustomer(cust);
    setNameAr(cust.nameAr);
    setPhone(cust.phone);
    setEmail(cust.email);
    setAddress(cust.address);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setNameAr("");
    setPhone("");
    setEmail("");
    setAddress("");
  };

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim()) {
      addToast({
        type: "warning",
        message: "الرجاء كتابة اسم العميل.",
        messageEn: "Please fill customer name."
      });
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: nameAr, // Synced to English too for fallback
        nameAr,
        email,
        phone,
        address
      });
      addToast({
        type: "success",
        message: `تم تحديث بيانات العميل: ${nameAr}`,
        messageEn: `Customer updated`
      });
    } else {
      addCustomer({
        name: nameAr,
        nameAr,
        email,
        phone,
        address
      });
      addToast({
        type: "success",
        message: `تم تسجيل العميل الجديد: ${nameAr}`,
        messageEn: `Customer registered successfully`
      });
    }
    handleCloseForm();
  };

  const handleCollectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || collectAmount <= 0) {
      addToast({
        type: "warning",
        message: "يرجى كتابة مبلغ سداد صحيح.",
        messageEn: "Please write a correct receipt amount."
      });
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    if (!customerObj) return;

    // Deduct from debt
    updateCustomer(selectedCustomerId, {
      balance: Math.max(0, (customerObj.balance || 0) - collectAmount)
    });

    // Record statement movement
    addCustomerMovement({
      customerId: selectedCustomerId,
      date: new Date().toISOString().split("T")[0],
      type: "payment",
      amount: collectAmount,
      reference: `COLL-${Date.now().toString().slice(-4)}`,
      notes: collectNotes || `مبلغ محصّل نقداً من العميل`
    });

    // Feed Cashbox
    addCashboxTransaction({
      date: new Date().toISOString().split("T")[0],
      type: "receipt",
      amount: collectAmount,
      description: `تحصيل نقدي - العميل: ${customerObj.nameAr}`,
      category: "تحصيل عملاء",
      recipient: "الصندوق",
      paymentMethod: "نقدي"
    });

    addAuditLog(
      "تحصيل وسند قبض",
      `تم استلام وتحصيل ${collectAmount} ريال من العميل ${customerObj.nameAr}. تم ترحيلها لكشف حسابه والصندوق فوراً.`
    );

    addToast({
      type: "success",
      message: `تم إيداع الدفعة بقيمة ${collectAmount.toLocaleString()} ريال بنجاح وتنزيل المديونية.`,
      messageEn: `Collected SAR ${collectAmount} from customer.`
    });

    setCollectAmount(0);
    setCollectNotes("");
    setShowCollectForm(false);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  // Directories Columns
  const directoryColumns: ColumnDef[] = [
    { key: "id", header: "رمز العميل", headerEn: "ID" },
    { key: "nameAr", header: "الاسم الكامل (بالعربية)", headerEn: "Name" },
    { key: "phone", header: "رقم الجوال", headerEn: "Phone" },
    { key: "address", header: "العنوان التجاري", headerEn: "Address" },
    { 
      key: "balance", 
      header: "المديونية الحالية (ريال)", 
      headerEn: "Balance (SAR)",
      render: (val) => (
        <span className={`font-mono font-bold ${Number(val) > 0 ? "text-rose-600" : "text-emerald-600"}`}>
          SAR {Number(val).toLocaleString()}
        </span>
      )
    },
    {
      key: "actions",
      header: "خيارات العمليات",
      headerEn: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEdit(row)}
            className="p-1 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded transition"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (confirm(isAr ? "هل أنت متأكد من حذف العميل؟" : "Delete customer?")) {
                deleteCustomer(row.id);
              }
            }}
            className="p-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  // Filter movements for selected client
  const clientMovements = customerMovements.filter(mov => mov.customerId === selectedCustomerId);
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  // Movements Column
  const movementColumns: ColumnDef[] = [
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "type", header: "نوع الحركة", headerEn: "Type", render: (val) => (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
        val === "sale" ? "bg-rose-50 text-rose-700 border border-rose-200" :
        val === "payment" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
        val === "return" ? "bg-amber-50 text-amber-700 border border-amber-200" :
        "bg-blue-50 text-blue-700 border border-blue-200"
      }`}>
        {val === "sale" ? "فاتورة بيع" :
         val === "payment" ? "دفعة استلام" :
         val === "return" ? "مرتجع بضاعة" : "تحويل حساب"}
      </span>
    )},
    { key: "reference", header: "رقم المرجع", headerEn: "Ref" },
    { key: "notes", header: "بيان التفاصيل", headerEn: "Details" },
    { 
      key: "amount", 
      header: "المبلغ (ريال)", 
      headerEn: "Amount (SAR)", 
      render: (val, row) => (
        <span className={`font-mono font-bold ${row.type === "sale" ? "text-rose-600" : "text-emerald-600"}`}>
          {row.type === "sale" ? "+" : "-"} SAR {Number(val).toLocaleString()}
        </span>
      ) 
    }
  ];

  return (
    <div className="space-y-6">
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-amber-600 tracking-wider font-mono">
            {isAr ? "الذمم المدينة والدفتر المالي الموحد" : "ACCOUNTS RECEIVABLES & CRM LEDGERS"}
          </span>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Landmark className="w-8 h-8 text-teal-700" />
            {isAr ? "دفتر مديونيات العملاء" : "Customer Accounts Ledger"}
          </h1>
        </div>

        <button
          onClick={() => {
            handleCloseForm();
            setShowForm(true);
          }}
          className="px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-md shadow-teal-700/20"
        >
          <Plus className="w-5 h-5" />
          <span>{isAr ? "تسجيل عميل جديد" : "New Customer"}</span>
        </button>
      </div>

      {/* KPI Overviews */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي الديون المعلقة" : "Total Outstanding Debt"}</span>
            <span className="text-xl font-extrabold font-mono text-rose-600">SAR {totalReceivables.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "عدد العملاء المدينين" : "Indebted Customers"}</span>
            <span className="text-xl font-extrabold font-mono text-slate-900">{indebtedCount} {isAr ? "عملاء" : "clients"}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "متوسط فترة السداد" : "Avg Collection Period"}</span>
            <span className="text-sm font-bold text-slate-700">{isAr ? "24 يوماً (ممتاز)" : "24 Days (Excellent)"}</span>
          </div>
        </div>
      </div>

      {/* Touch-Friendly Subnavigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-100 p-2 rounded-2xl">
        <button
          onClick={() => setActiveTab("directory")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "directory" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "سجل العملاء" : "Directory"}
        </button>

        <button
          onClick={() => setActiveTab("statement")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "statement" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "كشف حساب تفصيلي" : "Detailed Statement"}
        </button>

        <button
          onClick={() => setActiveTab("debts")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "debts" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "كشف الديون المتأخرة" : "Outstanding Debts"}
        </button>

        <button
          onClick={() => setActiveTab("movements")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "movements" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "سجل الحركات العام" : "General Logs"}
        </button>
      </div>

      {/* Forms and Popups */}
      {showForm && (
        <form onSubmit={handleCustomerSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-md space-y-4 max-w-lg mx-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm">
              {editingCustomer ? (isAr ? `تحديث العميل: ${editingCustomer.nameAr}` : "Edit Customer") : (isAr ? "إضافة عميل جديد" : "New Customer")}
            </h3>
            <button type="button" onClick={handleCloseForm} className="p-1 hover:bg-slate-100 rounded-full">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-500">{isAr ? "اسم العميل الكامل *" : "Customer Name *"}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="اسم العميل أو اسم المحل"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">{isAr ? "رقم الجوال" : "Phone"}</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05xxxxxx"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">{isAr ? "البريد الإلكتروني" : "Email"}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="info@customer.sa"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-500">{isAr ? "العنوان التجاري" : "Corporate Address"}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="المدينة، الحي"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition text-xs"
          >
            {isAr ? "حفظ العميل" : "Save Customer"}
          </button>
        </form>
      )}

      {/* Directory Tab */}
      {activeTab === "directory" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <ERPTable
            data={customers}
            columns={directoryColumns}
            language={language}
          />
        </div>
      )}

      {/* Detailed Statement Tab */}
      {activeTab === "statement" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">{isAr ? "اختر العميل لعرض الكشف:" : "Select Customer:"}</span>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="p-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:outline-none focus:ring-1 focus:ring-teal-700 font-bold"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.nameAr}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCollectForm(!showCollectForm)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <DollarSign className="w-4 h-4" />
                <span>{isAr ? "تسجيل تحصيل / دفعة" : "Collect Payment"}</span>
              </button>

              <button
                onClick={handlePrintStatement}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>{isAr ? "طباعة كشف الحساب" : "Print Statement"}</span>
              </button>
            </div>
          </div>

          {/* Collection dialog overlay inside statement */}
          {showCollectForm && (
            <form onSubmit={handleCollectSubmit} className="bg-slate-50 border border-slate-200 p-5 rounded-xl max-w-md mx-auto space-y-3 animate-fade-in text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="font-extrabold text-slate-800">{isAr ? "سند قبض وتحصيل نقدي" : "Receipt Collection Voucher"}</span>
                <button type="button" onClick={() => setShowCollectForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                <div>
                  <label className="font-bold text-slate-500">{isAr ? "المبلغ المستلم (ريال) *" : "Receipt Amount (SAR) *"}</label>
                  <input
                    type="number"
                    min="1"
                    value={collectAmount || ""}
                    onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500">{isAr ? "البيان / مرجع السند" : "Voucher Description"}</label>
                  <input
                    type="text"
                    placeholder="مثال: تحصيل بشيك بنكي الراجحي"
                    value={collectNotes}
                    onChange={(e) => setCollectNotes(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded"
              >
                {isAr ? "ترحيل التحصيل وتغذية الصندوق" : "Post Receipt"}
              </button>
            </form>
          )}

          {/* Printable Statement Area */}
          <div id="print-area" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between border-b border-slate-100 pb-4 gap-4">
              <div className="text-right">
                <h2 className="text-xl font-black text-slate-800">{isAr ? "كشف حساب عميل معتمد" : "Official Customer Statement"}</h2>
                <p className="text-xs text-slate-400 mt-1">{isAr ? "تتبع حركات الذمم المدينة آلياً" : "Automatic receivables ledger statements."}</p>
              </div>
              <div className="text-left font-mono text-xs text-slate-500 space-y-1">
                <div>{isAr ? `رقم العميل: ${selectedCustomerId}` : `ID: ${selectedCustomerId}`}</div>
                <div>{isAr ? `تاريخ الطباعة: ${new Date().toLocaleDateString()}` : `Printed: ${new Date().toLocaleDateString()}`}</div>
              </div>
            </div>

            {/* Client summary header cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div className="text-right text-xs">
                <div className="font-bold text-slate-400">{isAr ? "اسم العميل التجاري" : "Commercial Customer"}</div>
                <div className="font-black text-slate-800 text-base mt-1">{selectedCustomerObj?.nameAr}</div>
                <div className="text-slate-500 mt-1">{selectedCustomerObj?.phone} | {selectedCustomerObj?.address}</div>
              </div>

              <div className="text-left font-mono text-xs flex flex-col justify-center">
                <div className="font-bold text-slate-400 text-right sm:text-left">{isAr ? "الرصيد المستحق الحالي" : "Current Outstanding Debt"}</div>
                <div className="font-extrabold text-rose-600 text-lg mt-1 text-right sm:text-left">
                  SAR {selectedCustomerObj?.balance?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* Table list of client movements */}
            <ERPTable
              data={clientMovements}
              columns={movementColumns}
              language={language}
            />
          </div>
        </div>
      )}

      {/* Debtors List with Limits */}
      {activeTab === "debts" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <ERPTable
            data={customers.filter(c => (c.balance || 0) > 0)}
            columns={[
              { key: "id", header: "رمز العميل", headerEn: "ID" },
              { key: "nameAr", header: "العميل المدين", headerEn: "Customer" },
              { 
                key: "balance", 
                header: "المديونية (ريال)", 
                headerEn: "Debt", 
                render: (val) => <span className="font-mono font-black text-rose-600">SAR {Number(val).toLocaleString()}</span> 
              },
              { 
                key: "creditLimit", 
                header: "الحد الائتماني المقترح", 
                headerEn: "Limit", 
                render: () => <span className="text-slate-500">SAR 50,000</span> 
              },
              { 
                key: "status", 
                header: "حالة الائتمان", 
                headerEn: "Status", 
                render: (_, row) => (
                  <span className={`text-xs font-bold ${row.balance > 40000 ? "text-rose-600 font-extrabold" : "text-amber-600"}`}>
                    {row.balance > 40000 ? "⚠️ حرج - قارب الحد" : "نشط ومستقر"}
                  </span>
                ) 
              }
            ]}
            language={language}
          />
        </div>
      )}

      {/* Historic Movements of customers */}
      {activeTab === "movements" && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <ERPTable
            data={customerMovements}
            columns={[
              { key: "date", header: "التاريخ", headerEn: "Date" },
              { 
                key: "customerId", 
                header: "العميل", 
                headerEn: "Customer", 
                render: (val) => customers.find(c => c.id === val)?.nameAr || val 
              },
              { key: "type", header: "نوع الحركة", headerEn: "Type" },
              { key: "reference", header: "رقم المرجع", headerEn: "Ref" },
              { key: "notes", header: "تفاصيل العملية", headerEn: "Details" },
              { 
                key: "amount", 
                header: "المبلغ", 
                headerEn: "Amount", 
                render: (val) => <span className="font-mono font-bold">SAR {Number(val).toLocaleString()}</span> 
              }
            ]}
            language={language}
          />
        </div>
      )}
    </div>
  );
}
