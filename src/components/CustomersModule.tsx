import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Customer } from "../types";
import { Plus, UserCheck, ShieldAlert, Edit, Trash2, Mail, Phone, MapPin, X, Check, Landmark } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface CustomersModuleProps {
  language?: "ar" | "en";
}

export default function CustomersModule({ language = "ar" }: CustomersModuleProps) {
  const isAr = language === "ar";
  const { customers, addCustomer, updateCustomer, deleteCustomer, addToast } = useAppState();

  // Forms state
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Outstanding Receivables KPI
  const totalReceivables = customers.reduce((acc, c) => acc + c.balance, 0);

  // Table Columns
  const columns: ColumnDef[] = [
    { key: "id", header: "رمز العميل", headerEn: "Customer ID" },
    { key: "nameAr", header: "الاسم التجاري (عربي)", headerEn: "Name (Arabic)", editable: true },
    { key: "name", header: "الاسم بالإنجليزية", headerEn: "Name (English)", editable: true },
    { key: "email", header: "البريد الإلكتروني", headerEn: "Email", editable: true },
    { key: "phone", header: "رقم الجوال", headerEn: "Phone", editable: true },
    { key: "address", header: "العنوان التجاري", headerEn: "Corporate Address", editable: true },
    { 
      key: "balance", 
      header: "الأرصدة المدينة (ريال)", 
      headerEn: "Balance Due (SAR)",
      render: (val: any) => (
        <span className={`font-mono font-bold ${Number(val) > 0 ? "text-rose-600 font-extrabold" : "text-emerald-600"}`}>
          SAR {Number(val).toLocaleString()}
        </span>
      )
    }
  ];

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setName(cust.name);
    setNameAr(cust.nameAr);
    setEmail(cust.email);
    setPhone(cust.phone);
    setAddress(cust.address);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setName("");
    setNameAr("");
    setEmail("");
    setPhone("");
    setAddress("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAr.trim() || !name.trim()) {
      addToast({
        type: "warning",
        message: "يرجى تعبئة الحقول الأساسية لاسم العميل",
        messageEn: "Please fill customer name fields"
      });
      return;
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name,
        nameAr,
        email,
        phone,
        address
      });
    } else {
      addCustomer({
        name,
        nameAr,
        email,
        phone,
        address
      });
    }

    handleCloseForm();
  };

  const handleBulkDelete = (selected: any[]) => {
    selected.forEach(row => {
      deleteCustomer(row.id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest font-mono">
            {isAr ? "إدارة علاقات العملاء والذمم المدينة" : "CUSTOMER RELATIONSHIP & RECEIVABLES CONTROL"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-teal-700" />
            {isAr ? "سجل العملاء المعتمدين" : "Certified Customers Directory"}
          </h1>
        </div>

        <button
          onClick={() => {
            if (showForm) handleCloseForm();
            else setShowForm(true);
          }}
          className="px-4 py-2 bg-primary hover:bg-primary/95 text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? "إضافة عميل جديد" : "Register Customer"}</span>
        </button>
      </div>

      {/* KPI Outstanding widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 rounded-lg text-teal-700">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي الذمم المدينة المستحقة" : "Total Accounts Receivable"}</span>
            <span className="text-xl font-extrabold font-mono text-rose-600">SAR {totalReceivables.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي العملاء النشطين" : "Active Credit Clients"}</span>
            <span className="text-xl font-extrabold font-mono text-slate-900">{customers.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4 md:col-span-1">
          <div className="p-3 bg-amber-50 rounded-lg text-amber-700">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "فترة استحقاق الائتمان" : "Standard Credit Limit"}</span>
            <span className="text-sm font-bold text-slate-700">{isAr ? "30 يوماً من تاريخ التوزيع" : "30 Days Net Terms"}</span>
          </div>
        </div>
      </div>

      {/* Customer Form Drawer / Dialog */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm">
              {editingCustomer 
                ? (isAr ? `تحديث بيانات العميل: ${editingCustomer.nameAr}` : `Edit Customer: ${editingCustomer.name}`)
                : (isAr ? "تسجيل عميل مؤسسة جديد" : "Add Wholesale Corporate Client")
              }
            </h3>
            <button type="button" onClick={handleCloseForm} className="p-1 hover:bg-slate-100 rounded-full transition">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الاسم التجاري (عربي)" : "Corporate Name (Arabic) *"}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: شركة المذاق الفريد المحدودة"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الاسم الرسمي بالإنجليزية" : "Official Name (English) *"}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Unique Taste LLC"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "البريد الإلكتروني للمراسلات" : "Finance Email"}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="finance@client.com"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition pl-8"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "رقم جوال المحاسبة/المنسق" : "Contact Phone"}</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 50 000 0000"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition pl-8"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-500 block">{isAr ? "مقر العميل والتوصيل" : "Delivery Destination Address"}</label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="الرياض، السلي، شارع اسطنبول"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition pl-8"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2 border border-slate-200 rounded-xl bg-white text-slate-600 font-semibold hover:bg-slate-50 transition text-xs"
            >
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition text-xs shadow-xs"
            >
              {editingCustomer ? (isAr ? "تحديث التعديلات" : "Save Changes") : (isAr ? "إضافة عميل" : "Add Customer")}
            </button>
          </div>
        </form>
      )}

      {/* Customers List Table with custom row click */}
      <div className="space-y-4">
        <ERPTable
          data={customers}
          columns={columns}
          searchKeys={["nameAr", "name", "id", "email"]}
          searchPlaceholder={isAr ? "ابحث بالاسم أو البريد الإلكتروني أو الرمز..." : "Search corporate clients..."}
          language={language}
          title={isAr ? "دليل حسابات العملاء" : "Clients Receivable Accounts"}
          exportFileName="corporate_customers_directory"
          onRowClick={(row) => handleOpenEdit(row)}
          onInlineSave={(row, field, value) => {
            updateCustomer(row.id, { [field]: value });
          }}
          bulkActions={[
            {
              label: isAr ? "حذف العملاء المحددين" : "Delete Selected Clients",
              onClick: handleBulkDelete,
              className: "bg-rose-600 text-white hover:bg-rose-700",
              icon: Trash2
            }
          ]}
        />
      </div>
    </div>
  );
}
