import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Customer } from "../types";
import { Users, Mail, Phone, MapPin, Landmark, ShieldAlert, Plus, Trash2, Edit3, Eye } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ConfirmDialog from "./common/ConfirmDialog";
import FormSection from "./common/FormSection";
import FormField from "./common/FormField";
import EmptyState from "./common/EmptyState";
import StatusBadge from "./common/StatusBadge";

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

  // Confirm delete dialog state
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [bulkDeleteRows, setBulkDeleteRows] = useState<any[] | null>(null);

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
      header: "الرصيد المستحق (ريال)", 
      headerEn: "Balance Due (SAR)",
      render: (val: any) => (
        <span className={`font-mono font-bold ${Number(val) > 0 ? "text-rose-600 font-extrabold" : "text-emerald-600"}`}>
          SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: "actions",
      header: "الإجراءات",
      headerEn: "Actions",
      sortable: false,
      render: (_: any, row: Customer) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleOpenEdit(row)}
            title={isAr ? "تعديل بيانات العميل" : "Edit Customer"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-slate-100 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setCustomerToDelete(row)}
            title={isAr ? "حذف العميل" : "Delete Customer"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
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
        message: "يرجى تعبئة اسم العميل باللغتين العربية والإنجليزية",
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
      addToast({
        type: "success",
        message: `تم تحديث بيانات العميل [${nameAr}] بنجاح`,
        messageEn: `Customer [${name}] updated successfully`
      });
    } else {
      addCustomer({
        name,
        nameAr,
        email,
        phone,
        address
      });
      addToast({
        type: "success",
        message: `تم تسجيل العميل الجديد [${nameAr}] وفتح حسابه بدفتر الأستاذ`,
        messageEn: `New customer [${name}] registered successfully`
      });
    }

    handleCloseForm();
  };

  const confirmSingleDelete = () => {
    if (!customerToDelete) return;
    deleteCustomer(customerToDelete.id);
    addToast({
      type: "info",
      message: `تم حذف العميل [${customerToDelete.nameAr}]`,
      messageEn: `Customer [${customerToDelete.name}] deleted`
    });
    setCustomerToDelete(null);
  };

  const confirmBulkDelete = () => {
    if (!bulkDeleteRows) return;
    bulkDeleteRows.forEach(row => deleteCustomer(row.id));
    addToast({
      type: "info",
      message: `تم حذف ${bulkDeleteRows.length} عميل بنجاح`,
      messageEn: `Deleted ${bulkDeleteRows.length} customers successfully`
    });
    setBulkDeleteRows(null);
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="دليل العملاء والحسابات المدينة"
        titleEn="Certified Customers Directory"
        description="إدارة ملفات العملاء التجاريين وشروط الائتمان ومتابعة الأرصدة المستحقة."
        descriptionEn="Manage corporate client profiles, credit terms, and receivable balances."
        icon={Users}
        breadcrumbs={[
          { label: "المبيعات والعملاء", labelEn: "Sales & CRM" },
          { label: "دليل العملاء", labelEn: "Customer Directory", active: true }
        ]}
        language={language}
      />

      {/* Global Action Bar */}
      <GlobalActionBar
        onNew={() => {
          if (showForm) handleCloseForm();
          else setShowForm(true);
        }}
        newLabelAr="إضافة عميل جديد"
        newLabelEn="New Customer"
        totalCount={customers.length}
        language={language}
      />

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-teal-50 border border-teal-150 rounded-xl text-teal-700">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isAr ? "إجمالي الذمم المدينة المستحقة" : "Total Accounts Receivable"}
            </span>
            <span className="text-lg font-black font-mono text-rose-600">
              SAR {totalReceivables.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-600">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isAr ? "إجمالي العملاء النشطين" : "Active Credit Clients"}
            </span>
            <span className="text-lg font-black font-mono text-slate-900">
              {customers.length}
            </span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block">
              {isAr ? "فترة استحقاق الائتمان" : "Standard Credit Limit"}
            </span>
            <span className="text-xs font-bold text-slate-700">
              {isAr ? "30 يوماً من تاريخ الفاتورة" : "30 Days Net Terms"}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Form Modal / Section */}
      {showForm && (
        <form onSubmit={handleSubmit} className="animate-fade-in">
          <FormSection
            title={editingCustomer 
              ? (isAr ? `تعديل بيانات العميل: ${editingCustomer.nameAr}` : `Edit Customer: ${editingCustomer.name}`)
              : (isAr ? "تسجيل عميل جديد" : "Register New Customer")}
            description={isAr ? "أدخل البيانات الرسمية للتواصل والفوترة" : "Enter official contact & billing details"}
            icon={Users}
            language={language}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="الاسم التجاري (عربي)" labelEn="Corporate Name (Arabic)" required language={language}>
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={isAr ? "مثال: شركة المذاق الفريد المحدودة" : "e.g. Unique Taste LLC"}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                />
              </FormField>

              <FormField label="الاسم الرسمي بالإنجليزية" labelEn="Official Name (English)" required language={language}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Unique Taste LLC"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                  required
                />
              </FormField>

              <FormField label="البريد الإلكتروني للفوترة" labelEn="Finance Email" language={language}>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="finance@client.com"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium pr-8"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>

              <FormField label="رقم جوال المحاسبة / التنسيق" labelEn="Contact Phone" language={language}>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+966 50 000 0000"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium pr-8 font-mono"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>

              <div className="md:col-span-2">
                <FormField label="مقر العميل وعنوان التوصيل" labelEn="Delivery Address" language={language}>
                  <div className="relative">
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder={isAr ? "الرياض، السلي، شارع اسطنبول" : "Riyadh, Al-Sulai, Istanbul St."}
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
                {editingCustomer 
                  ? (isAr ? "تحديث بيانات العميل" : "Save Changes") 
                  : (isAr ? "حفظ العميل الجديد" : "Register Customer")}
              </button>
            </div>
          </FormSection>
        </form>
      )}

      {/* Customers List Table */}
      {customers.length === 0 ? (
        <EmptyState
          title="لا يوجد عملاء مسجلون حالياً"
          titleEn="No Customers Registered"
          description="ابدأ بإضافة أول عميل معتمد لربطه بفواتير المبيعات وسجل الذمم المدينة."
          descriptionEn="Start by adding your first certified customer to link with sales invoices."
          icon={Users}
          actionLabel="إضافة عميل جديد"
          actionLabelEn="Add New Customer"
          onAction={() => setShowForm(true)}
          language={language}
        />
      ) : (
        <ERPTable
          data={customers}
          columns={columns}
          searchKeys={["nameAr", "name", "id", "email", "phone"]}
          searchPlaceholder={isAr ? "🔎 بحث بالاسم التجاري أو البريد أو الرمز..." : "🔎 Search corporate clients..."}
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
              onClick: (selected) => setBulkDeleteRows(selected),
              className: "bg-rose-600 text-white hover:bg-rose-700",
              icon: Trash2
            }
          ]}
        />
      )}

      {/* Single Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={confirmSingleDelete}
        title="حذف سجل العميل؟"
        titleEn="Delete Customer Record?"
        description="هل أنت متأكد من رغبتك في حذف هذا العميل؟ لا يمكن التراجع عن هذا الإجراء."
        descriptionEn="Are you sure you want to delete this customer? This action cannot be undone."
        itemName={customerToDelete ? `${customerToDelete.nameAr} (${customerToDelete.id})` : undefined}
        confirmLabel="تأكيد الحذف"
        confirmLabelEn="Delete Customer"
        variant="destructive"
        language={language}
      />

      {/* Bulk Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(bulkDeleteRows && bulkDeleteRows.length > 0)}
        onClose={() => setBulkDeleteRows(null)}
        onConfirm={confirmBulkDelete}
        title="حذف العملاء المحددين؟"
        titleEn="Delete Selected Customers?"
        description={`هل أنت متأكد من رغبتك في حذف ${bulkDeleteRows?.length || 0} عميل نهائياً من النظام؟`}
        descriptionEn={`Are you sure you want to delete ${bulkDeleteRows?.length || 0} customers?`}
        confirmLabel="تأكيد الحذف المتعدد"
        confirmLabelEn="Delete Selected"
        variant="destructive"
        language={language}
      />
    </div>
  );
}
