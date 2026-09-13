import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Supplier } from "../types";
import { Truck, Mail, Phone, MapPin, Landmark, ShieldCheck, Plus, Trash2, Edit3, Eye } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import ConfirmDialog from "./common/ConfirmDialog";
import FormSection from "./common/FormSection";
import FormField from "./common/FormField";
import EmptyState from "./common/EmptyState";
import StatusBadge from "./common/StatusBadge";

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

  // Confirm dialog states
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [bulkDeleteRows, setBulkDeleteRows] = useState<any[] | null>(null);

  // Outstanding Payables KPI
  const totalPayables = suppliers.reduce((acc, s) => acc + s.balance, 0);

  // Table Columns
  const columns: ColumnDef[] = [
    { key: "id", header: "رمز المورد", headerEn: "Supplier ID" },
    { key: "nameAr", header: "اسم المورد (عربي)", headerEn: "Name (Arabic)", editable: true },
    { key: "name", header: "الاسم بالإنجليزية", headerEn: "Name (English)", editable: true },
    { key: "email", header: "البريد الإلكتروني", headerEn: "Email", editable: true },
    { key: "phone", header: "رقم الجوال", headerEn: "Phone", editable: true },
    { key: "address", header: "بلد المنشأ / المقر", headerEn: "Origin Country / HQ", editable: true },
    { 
      key: "balance", 
      header: "المستحقات والالتزامات (ريال)", 
      headerEn: "Payables Balance (SAR)",
      render: (val: any) => (
        <span className={`font-mono font-bold ${Number(val) > 0 ? "text-amber-600 font-extrabold" : "text-emerald-600"}`}>
          SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: "actions",
      header: "الإجراءات",
      headerEn: "Actions",
      sortable: false,
      render: (_: any, row: Supplier) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            title={isAr ? "تعديل بيانات المورد" : "Edit Supplier"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSupplierToDelete(row)}
            title={isAr ? "حذف المورد" : "Delete Supplier"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
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
      addToast({
        type: "success",
        message: `تم تحديث بيانات المورد [${nameAr}] بنجاح`,
        messageEn: `Supplier [${name}] updated successfully`
      });
    } else {
      addSupplier({
        name,
        nameAr,
        email,
        phone,
        address
      });
      addToast({
        type: "success",
        message: `تم تسجيل المورد الجديد [${nameAr}] وفتح حسابه بدفتر الأستاذ`,
        messageEn: `New supplier [${name}] registered successfully`
      });
    }

    handleCloseForm();
  };

  const confirmSingleDelete = () => {
    if (!supplierToDelete) return;
    deleteSupplier(supplierToDelete.id);
    addToast({
      type: "info",
      message: `تم حذف المورد [${supplierToDelete.nameAr}]`,
      messageEn: `Supplier [${supplierToDelete.name}] deleted`
    });
    setSupplierToDelete(null);
  };

  const confirmBulkDelete = () => {
    if (!bulkDeleteRows) return;
    bulkDeleteRows.forEach(row => deleteSupplier(row.id));
    addToast({
      type: "info",
      message: `تم حذف ${bulkDeleteRows.length} مورد بنجاح`,
      messageEn: `Deleted ${bulkDeleteRows.length} suppliers successfully`
    });
    setBulkDeleteRows(null);
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="دليل الموردين والذمم الدائنة"
        titleEn="Certified Suppliers & Payables Directory"
        description="إدارة ملفات مصدري وموردي البن الخام والمواد التعبوية ومتابعة الالتزامات المالية."
        descriptionEn="Manage green coffee & packaging suppliers, origin credentials, and accounts payable."
        icon={Truck}
        breadcrumbs={[
          { label: "المشتريات والموردين", labelEn: "Purchases & SRM" },
          { label: "دليل الموردين", labelEn: "Suppliers Directory", active: true }
        ]}
        primaryAction={{
          label: "إضافة مورد جديد",
          labelEn: "New Supplier",
          onClick: () => {
            if (showForm) handleCloseForm();
            else setShowForm(true);
          },
          icon: Plus
        }}
        language={language}
      />

      {/* KPI Payables Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isAr ? "إجمالي الالتزامات والمستحقات" : "Total Accounts Payable"}
            </span>
            <span className="text-lg font-black font-mono text-amber-600">
              SAR {totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isAr ? "إجمالي الموردين المعتمدين" : "Active Certified Suppliers"}
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              {suppliers.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isAr ? "سياسة السداد المعتمدة" : "Payment Terms Policy"}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {isAr ? "اعتماد الدفع بعد مطابقة الشحنة مخزنياً" : "Net 45 Upon FIFO Intake"}
            </span>
          </div>
        </div>
      </div>

      {/* Supplier Form Section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <FormSection
            title={editingSupplier 
              ? (isAr ? `تعديل بيانات المورد: ${editingSupplier.nameAr}` : `Edit Supplier: ${editingSupplier.name}`)
              : (isAr ? "تسجيل مورد تجاري جديد" : "Register New Supplier")}
            description={isAr ? "أدخل البيانات الرسمية للمورد ومقر التوريد" : "Enter official contact & supply origin details"}
            icon={Truck}
            language={language}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="اسم المورد (عربي)" labelEn="Supplier Name (Arabic)" required language={language}>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={isAr ? "مثال: مزارع البن الإثيوبي للاستيراد" : "e.g. Ethiopian Highlands Coffee"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                />
              </FormField>

              <FormField label="اسم المورد بالإنجليزية" labelEn="Supplier Name (English)" required language={language}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ethiopian Highlands Coffee Co."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                />
              </FormField>

              <FormField label="البريد الإلكتروني للطلبات" labelEn="Orders Email" language={language}>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="supply@vendor.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium pr-8"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>

              <FormField label="رقم جوال المنسق التجاري" labelEn="Coordinator Phone" language={language}>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 55 000 0000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium pr-8 font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="بلد المنشأ / العنوان التجاري" labelEn="Origin Country / Address" language={language}>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isAr ? "إثيوبيا، ييرغاتشيفي / الميناء الجاف" : "Ethiopia, Yirgacheffe Origin"}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium pr-8"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </FormField>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-4 py-2 border border-slate-300 rounded-lg bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white font-black rounded-lg transition-all text-xs shadow-sm shadow-teal-700/20"
              >
                {editingSupplier 
                  ? (isAr ? "تحديث بيانات المورد" : "Save Changes") 
                  : (isAr ? "حفظ المورد الجديد" : "Register Supplier")}
              </button>
            </div>
          </FormSection>
        </form>
      )}

      {/* Suppliers Table */}
      {suppliers.length === 0 ? (
        <EmptyState
          title="لا يوجد موردون مسجلون"
          titleEn="No Suppliers Registered"
          description="ابدأ بتسجيل أول مورد لاعتماده في فواتير الشراء وأوامر استلام الشحنات الخام."
          descriptionEn="Register certified raw material suppliers to link with purchase orders."
          icon={Truck}
          actionLabel="إضافة مورد جديد"
          actionLabelEn="Add New Supplier"
          onAction={() => setShowForm(true)}
          language={language}
        />
      ) : (
        <ERPTable
          data={suppliers}
          columns={columns}
          searchKeys={["nameAr", "name", "id", "email", "phone", "address"]}
          searchPlaceholder={isAr ? "🔎 بحث بالاسم التجاري أو البريد أو الرمز..." : "🔎 Search suppliers directory..."}
          language={language}
          title={isAr ? "سجل حسابات الموردين" : "Suppliers Payable Accounts"}
          exportFileName="corporate_suppliers_directory"
          onRowClick={(row) => handleOpenEdit(row)}
          onInlineSave={(row, field, value) => {
            updateSupplier(row.id, { [field]: value });
          }}
          bulkActions={[
            {
              label: isAr ? "حذف الموردين المحددين" : "Delete Selected Suppliers",
              onClick: (selected) => setBulkDeleteRows(selected),
              className: "bg-rose-600 text-white hover:bg-rose-700",
              icon: Trash2
            }
          ]}
        />
      )}

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(supplierToDelete)}
        onClose={() => setSupplierToDelete(null)}
        onConfirm={confirmSingleDelete}
        title="حذف سجل المورد؟"
        titleEn="Delete Supplier Record?"
        description="هل أنت متأكد من رغبتك في حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء."
        descriptionEn="Are you sure you want to delete this supplier? This action cannot be undone."
        itemName={supplierToDelete ? `${supplierToDelete.nameAr} (${supplierToDelete.id})` : undefined}
        confirmLabel="تأكيد الحذف"
        confirmLabelEn="Delete Supplier"
        variant="destructive"
        language={language}
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(bulkDeleteRows && bulkDeleteRows.length > 0)}
        onClose={() => setBulkDeleteRows(null)}
        onConfirm={confirmBulkDelete}
        title="حذف الموردين المحددين؟"
        titleEn="Delete Selected Suppliers?"
        description={`هل أنت متأكد من رغبتك في حذف ${bulkDeleteRows?.length || 0} مورد نهائياً من النظام؟`}
        descriptionEn={`Are you sure you want to delete ${bulkDeleteRows?.length || 0} suppliers?`}
        confirmLabel="تأكيد الحذف المتعدد"
        confirmLabelEn="Delete Selected"
        variant="destructive"
        language={language}
      />
    </div>
  );
}
