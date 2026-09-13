import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Users, FileText, Landmark, ShieldAlert, ArrowDownCircle, ArrowUpCircle, Printer, Plus, Trash2, Edit3, X, Search, DollarSign, Receipt } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import ConfirmDialog from "./common/ConfirmDialog";
import FormSection from "./common/FormSection";
import FormField from "./common/FormField";
import EmptyState from "./common/EmptyState";
import StatusBadge from "./common/StatusBadge";

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

  // Collection receipt form state
  const [showCollectForm, setShowCollectForm] = useState(false);
  const [collectAmount, setCollectAmount] = useState<number>(0);
  const [collectNotes, setCollectNotes] = useState("");

  // Confirm delete state
  const [customerToDelete, setCustomerToDelete] = useState<any | null>(null);

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
        name: nameAr,
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
        message: "يرجى كتابة مبلغ سداد صحيح أكبر من الصفر.",
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
      message: `تم إيداع الدفعة بقيمة ${collectAmount.toLocaleString()} ريال بنجاح وتنزيل المديونية وترحيل الصندوق.`,
      messageEn: `Collected SAR ${collectAmount} from customer.`
    });

    setCollectAmount(0);
    setCollectNotes("");
    setShowCollectForm(false);
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;
    deleteCustomer(customerToDelete.id);
    addToast({
      type: "info",
      message: `تم حذف العميل [${customerToDelete.nameAr}]`,
      messageEn: `Customer [${customerToDelete.name}] deleted`
    });
    setCustomerToDelete(null);
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
          SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: "actions",
      header: "خيارات العمليات",
      headerEn: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            title={isAr ? "تعديل بيانات العميل" : "Edit Customer"}
            className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCustomerToDelete(row)}
            title={isAr ? "حذف العميل" : "Delete Customer"}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

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
          {row.type === "sale" ? "+" : "-"} SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ) 
    }
  ];

  const clientMovements = customerMovements.filter(mov => mov.customerId === selectedCustomerId);
  const selectedCustomerObj = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="دفتر مديونيات وكشوفات العملاء"
        titleEn="Customer Accounts & Debts Subledger"
        description="كشوفات حساب تفصيلية، تحصيل المديونيات النقدية والآجلة، وتتبع حركات الفواتير."
        descriptionEn="Detailed customer statements, cash collections, receivable movements, and ledger reconciliation."
        icon={Landmark}
        breadcrumbs={[
          { label: "المبيعات والعملاء", labelEn: "Sales & CRM" },
          { label: "سجل حسابات العملاء", labelEn: "Customer Subledger", active: true }
        ]}
        primaryAction={{
          label: "تسجيل سند تحصيل",
          labelEn: "Record Collection",
          onClick: () => setShowCollectForm(true),
          icon: DollarSign
        }}
        secondaryActions={[
          {
            label: "إضافة عميل جديد",
            labelEn: "New Customer",
            onClick: () => {
              handleCloseForm();
              setShowForm(true);
            },
            icon: Plus
          }
        ]}
        language={language}
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700">
            <ArrowDownCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{isAr ? "إجمالي الديون المستحقة" : "Total Receivables"}</span>
            <span className="text-lg font-black font-mono text-rose-600">SAR {totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{isAr ? "العملاء المدينون" : "Indebted Clients"}</span>
            <span className="text-lg font-black font-mono text-slate-900">{indebtedCount} {isAr ? "عميل" : "clients"}</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">{isAr ? "حركات الذمم المسجلة" : "Total Ledger Entries"}</span>
            <span className="text-lg font-black font-mono text-slate-900">{customerMovements.length}</span>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "directory"
              ? "bg-teal-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {isAr ? "دليل حسابات العملاء" : "Clients Directory"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("statement")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "statement"
              ? "bg-teal-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {isAr ? "كشف حساب تفصيلي" : "Detailed Statement"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("debts")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "debts"
              ? "bg-teal-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {isAr ? "تقرير الديون والتحصيل" : "Outstanding Debts"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("movements")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === "movements"
              ? "bg-teal-700 text-white shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          {isAr ? "سجل كافة الحركات" : "All Movements Log"}
        </button>
      </div>

      {/* Collection Form Modal / Section */}
      {showCollectForm && (
        <form onSubmit={handleCollectSubmit} className="animate-fade-in">
          <FormSection
            title={isAr ? "تسجيل سند قبض وتحصيل مالي" : "Record Customer Payment Receipt"}
            description={isAr ? "إيداع دفعة نقدية وتنزيل رصيد مديونية العميل فوراً وترحيل الصندوق" : "Direct debt deduction"}
            icon={DollarSign}
            language={language}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="العميل المدين" labelEn="Indebted Client" required language={language}>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                >
                  <option value="">{isAr ? "-- اختر العميل --" : "-- Select Customer --"}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} (المديونية: SAR {c.balance?.toLocaleString() || 0})
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="المبلغ المحصل (ريال)" labelEn="Receipt Amount (SAR)" required language={language}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={collectAmount || ""}
                  onChange={(e) => setCollectAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono font-bold text-emerald-700"
                  required
                />
              </FormField>

              <FormField label="بيان السند / ملاحظات" labelEn="Receipt Notes" language={language}>
                <input
                  type="text"
                  value={collectNotes}
                  onChange={(e) => setCollectNotes(e.target.value)}
                  placeholder={isAr ? "تحصيل دفعة نقدية بموجب إيصال" : "Cash collection receipt"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCollectForm(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg transition-all text-xs shadow-sm shadow-emerald-600/20"
              >
                {isAr ? "حفظ سند القبض وتنزيل الرصيد" : "Save Receipt & Deduct"}
              </button>
            </div>
          </FormSection>
        </form>
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <form onSubmit={handleCustomerSubmit} className="animate-fade-in">
          <FormSection
            title={editingCustomer ? (isAr ? "تعديل العميل" : "Edit Customer") : (isAr ? "تسجيل عميل جديد" : "New Customer")}
            icon={Users}
            language={language}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="اسم العميل" labelEn="Customer Name" required language={language}>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={isAr ? "اسم العميل التجاري" : "Customer Name"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-medium"
                  required
                />
              </FormField>
              <FormField label="رقم الجوال" labelEn="Phone" language={language}>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 000 0000"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white font-mono"
                />
              </FormField>
              <FormField label="البريد الإلكتروني" labelEn="Email" language={language}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="finance@client.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </FormField>
              <FormField label="العنوان" labelEn="Address" language={language}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="الرياض، السلي"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white"
                />
              </FormField>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 text-xs"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-lg text-xs"
              >
                {editingCustomer ? (isAr ? "حفظ التعديل" : "Save") : (isAr ? "إضافة العميل" : "Add")}
              </button>
            </div>
          </FormSection>
        </form>
      )}

      {/* TAB 1: DIRECTORY */}
      {activeTab === "directory" && (
        <ERPTable
          data={customers}
          columns={directoryColumns}
          searchKeys={["nameAr", "phone", "email", "id"]}
          searchPlaceholder={isAr ? "🔎 بحث بالاسم أو الجوال..." : "🔎 Search customers..."}
          language={language}
          title={isAr ? "قائمة العملاء وأرصدة الديون" : "Customers Accounts List"}
        />
      )}

      {/* TAB 2: STATEMENT */}
      {activeTab === "statement" && (
        <div className="bg-white rounded-2xl border border-slate-250 p-6 space-y-6 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="w-full sm:w-80">
              <label className="text-xs font-bold text-slate-600 block mb-1">
                {isAr ? "اختر العميل لعرض كشف الحساب:" : "Select Client Statement:"}
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameAr} (الرصيد: SAR {c.balance?.toLocaleString() || 0})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{isAr ? "طباعة كشف الحساب" : "Print Statement"}</span>
            </button>
          </div>

          {selectedCustomerObj && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900">{selectedCustomerObj.nameAr}</h3>
                <span className="text-xs text-slate-500 font-mono">ID: {selectedCustomerObj.id} | {selectedCustomerObj.phone}</span>
              </div>
              <div className="text-left">
                <span className="text-xs text-slate-400 block">{isAr ? "صافي الرصيد الحالي" : "Net Balance"}</span>
                <span className="text-xl font-black font-mono text-rose-600">
                  SAR {selectedCustomerObj.balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                </span>
              </div>
            </div>
          )}

          {clientMovements.length === 0 ? (
            <EmptyState
              title="لا توجد حركات مالية مسجلة لهذا العميل"
              titleEn="No Transactions Found"
              description="لم يتم تسجيل أي فواتير بيع أو سندات تحصيل على هذا الحساب حتى الآن."
              descriptionEn="No transactions have been recorded for this customer yet."
              icon={FileText}
              language={language}
            />
          ) : (
            <ERPTable
              data={clientMovements}
              columns={movementColumns}
              searchKeys={["reference", "notes", "type"]}
              language={language}
              title={isAr ? "الحركات والقيود المالية المباشرة" : "Client Direct Movements"}
            />
          )}
        </div>
      )}

      {/* TAB 3: DEBTS ONLY */}
      {activeTab === "debts" && (
        <ERPTable
          data={customers.filter(c => (c.balance || 0) > 0)}
          columns={directoryColumns}
          searchKeys={["nameAr", "phone"]}
          language={language}
          title={isAr ? "العملاء الذين عليهم مديونيات مستحقة فقط" : "Indebted Clients Only"}
        />
      )}

      {/* TAB 4: ALL MOVEMENTS */}
      {activeTab === "movements" && (
        <ERPTable
          data={customerMovements}
          columns={movementColumns}
          searchKeys={["reference", "notes", "type", "customerId"]}
          language={language}
          title={isAr ? "سجل جميع حركات ذمم العملاء" : "All Client Movements"}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={confirmDelete}
        title="حذف سجل العميل؟"
        titleEn="Delete Customer Record?"
        description="هل أنت متأكد من رغبتك في حذف هذا العميل وسجل ذمته؟"
        descriptionEn="Are you sure you want to delete this customer record?"
        itemName={customerToDelete?.nameAr}
        confirmLabel="تأكيد الحذف"
        confirmLabelEn="Delete"
        variant="destructive"
        language={language}
      />
    </div>
  );
}
