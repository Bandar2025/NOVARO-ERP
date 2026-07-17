import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Supplier } from "../types";
import { Plus, Truck, Edit, Trash2, Mail, Phone, MapPin, X, Check, Landmark, ShieldCheck } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface SuppliersModuleProps {
  language?: "ar" | "en";
}

export default function SuppliersModule({ language = "ar" }: SuppliersModuleProps) {
  const isAr = language === "ar";
  const { suppliers, addSupplier, updateSupplier, deleteSupplier, addToast } = useAppState();

  // Forms state
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Outstanding Payables KPI
  const totalPayables = suppliers.reduce((acc, s) => acc + s.balance, 0);

  // Table Columns
  const columns: ColumnDef[] = [
    { key: "id", header: "رمز المورد", headerEn: "Supplier ID" },
    { key: "nameAr", header: "اسم المورد (عربي)", headerEn: "Name (Arabic)", editable: true },
    { key: "name", header: "الاسم بالإنجليزية", headerEn: "Name (English)", editable: true },
    { key: "email", header: "البريد الإلكتروني", headerEn: "Email", editable: true },
    { key: "phone", header: "رقم الجوال/الهاتف", headerEn: "Phone", editable: true },
    { key: "address", header: "بلد المنشأ / العنوان", headerEn: "Origin Country / Address", editable: true },
    { 
      key: "balance", 
      header: "الالتزامات المستحقة (ريال)", 
      headerEn: "Accounts Payable (SAR)",
      render: (val: any) => (
        <span className={`font-mono font-bold ${Number(val) > 0 ? "text-amber-600 font-extrabold" : "text-emerald-600"}`}>
          SAR {Number(val).toLocaleString()}
        </span>
      )
    }
  ];

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setNameAr(sup.nameAr);
    setEmail(sup.email);
    setPhone(sup.phone);
    setAddress(sup.address);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
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
        message: "يرجى ملء اسم المورد بالعربية والإنجليزية",
        messageEn: "Please fill supplier name fields"
      });
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, {
        name,
        nameAr,
        email,
        phone,
        address
      });
    } else {
      addSupplier({
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
      deleteSupplier(row.id);
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-slate-400 tracking-widest font-mono">
            {isAr ? "إدارة الموردين وحسابات المشتريات الآجلة" : "SUPPLIER RELATIONSHIP & PAYABLES CORE"}
          </span>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-700" />
            {isAr ? "سجل الموردين المعتمدين" : "Supplier SRM Directory"}
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
          <span>{isAr ? "إضافة مورد جديد" : "Register Supplier"}</span>
        </button>
      </div>

      {/* KPI payables outstanding widget */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-lg text-indigo-700">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي الالتزامات والمستحقات" : "Total Accounts Payable"}</span>
            <span className="text-xl font-extrabold font-mono text-amber-600">SAR {totalPayables.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-slate-50 rounded-lg text-slate-500">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي الموردين المسجلين" : "Active Raw Suppliers"}</span>
            <span className="text-xl font-extrabold font-mono text-slate-900">{suppliers.length}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">{isAr ? "نظام اعتماد الشحنات" : "Certification Status"}</span>
            <span className="text-sm font-bold text-slate-700">{isAr ? "شهادات استيراد سارية" : "Certified Food Grade Import"}</span>
          </div>
        </div>
      </div>

      {/* Supplier Form Drawer / Dialog */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-slate-800 text-sm">
              {editingSupplier 
                ? (isAr ? `تحديث بيانات المورد: ${editingSupplier.nameAr}` : `Edit Supplier: ${editingSupplier.name}`)
                : (isAr ? "تسجيل مورد بن/مواد خام جديد" : "Add Certified Material Supplier")
              }
            </h3>
            <button type="button" onClick={handleCloseForm} className="p-1 hover:bg-slate-100 rounded-full transition">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "اسم المورد (عربي)" : "Supplier Name (Arabic) *"}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                placeholder="مثال: شركة مزارع بن هرر للتجارة"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "الاسم الرسمي بالإنجليزية" : "Supplier Name (English) *"}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Harar Coffee Farms Trading"
                className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "البريد الإلكتروني للمطالبات المالية" : "Supplier Email"}</label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="billing@supplier.com"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition pl-8"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-500 block">{isAr ? "رقم جوال أو هاتف المبيعات" : "Contact Phone"}</label>
              <div className="relative">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+966 11 000 0000"
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition pl-8"
                />
                <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="font-bold text-slate-500 block">{isAr ? "بلد المصدر ومستودع الشحن" : "Origin Country & Port of Dispatch"}</label>
              <div className="relative">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="إثيوبيا، أديس أبابا (مزارع هرر المعتمدة)"
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
              {editingSupplier ? (isAr ? "تحديث التعديلات" : "Save Changes") : (isAr ? "إضافة مورد" : "Register")}
            </button>
          </div>
        </form>
      )}

      {/* Suppliers List Table */}
      <div className="space-y-4">
        <ERPTable
          data={suppliers}
          columns={columns}
          searchKeys={["nameAr", "name", "id", "address"]}
          searchPlaceholder={isAr ? "ابحث بالاسم أو المنشأ أو الرمز..." : "Search raw suppliers..."}
          language={language}
          title={isAr ? "دليل حسابات الموردين" : "Suppliers Payable Accounts"}
          exportFileName="certified_suppliers_directory"
          onRowClick={(row) => handleOpenEdit(row)}
          onInlineSave={(row, field, value) => {
            updateSupplier(row.id, { [field]: value });
          }}
          bulkActions={[
            {
              label: isAr ? "حذف الموردين المحددين" : "Delete Selected Vendors",
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
