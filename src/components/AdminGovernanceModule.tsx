import React, { useState, useEffect, useMemo } from "react";
import { useAppState } from "../context/StateContext";
import { UserRole, Currency, AccountType } from "../types";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import StatusBadge from "./common/StatusBadge";
import {
  ShieldCheck, Lock, Unlock, Database, Users, Activity, CheckCircle2,
  AlertTriangle, RefreshCw, Play, Building2, Warehouse as WarehouseIcon,
  Calendar, KeyRound, Hash, FileText, HardDriveDownload, Plus, Save,
  Search, Download, Trash2, UserCheck, RotateCcw, Layers
} from "lucide-react";

const KpiCard: React.FC<{
  title: string;
  titleEn?: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  language?: "ar" | "en";
}> = ({ title, value, subtitle, icon: Icon }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-start justify-between gap-3">
    <div className="space-y-1">
      <span className="text-[11px] font-bold text-slate-500 block">{title}</span>
      <div className="text-lg font-black text-slate-900 font-mono">{value}</div>
      {subtitle && <span className="text-[10px] font-semibold text-teal-700 block">{subtitle}</span>}
    </div>
    <div className="p-2.5 rounded-xl bg-slate-900 text-amber-400 shrink-0">
      <Icon className="w-5 h-5" />
    </div>
  </div>
);

type AdminTab =
  | "admin_companies"
  | "admin_branches"
  | "admin_fiscal_years"
  | "admin_fiscal_periods"
  | "admin_users"
  | "admin_roles"
  | "admin_numbering"
  | "admin_audit_log"
  | "admin_backup"
  | "admin_sync_status";

interface Props {
  initialTab?: AdminTab;
  language?: "ar" | "en";
}

const ALL_ROLES: UserRole[] = [
  "Admin",
  "Owner",
  "Accountant",
  "Warehouse Manager",
  "Production Manager",
  "Cashier",
  "POS Operator",
  "Sales",
  "Purchasing",
  "Auditor",
  "Viewer"
];

const ALL_ACTIONS = [
  { id: "view", labelAr: "عرض (View)" },
  { id: "create", labelAr: "إنشاء (Create)" },
  { id: "edit", labelAr: "تعديل (Edit)" },
  { id: "approve", labelAr: "اعتماد (Approve)" },
  { id: "post", labelAr: "ترحيل مالي (Post)" },
  { id: "cancel", labelAr: "إلغاء/عكس (Cancel)" },
  { id: "delete", labelAr: "حذف (Delete)" },
  { id: "configure", labelAr: "تهيئة النظام (Configure)" }
];

const MODULE_GROUPS = [
  { id: "overview", labelAr: "لوحة القيادة" },
  { id: "accounting", labelAr: "المحاسبة والأستاذ العام" },
  { id: "zatca", labelAr: "الفوترة الإلكترونية ZATCA" },
  { id: "sales", labelAr: "المبيعات والفواتير" },
  { id: "sales_quotations", labelAr: "عروض الأسعار" },
  { id: "sales_orders", labelAr: "أوامر البيع" },
  { id: "sales_returns", labelAr: "مرتجعات المبيعات (381)" },
  { id: "customers", labelAr: "العملاء" },
  { id: "customer_ledger", labelAr: "دفتر حسابات العملاء" },
  { id: "purchases", labelAr: "المشتريات والتوريد" },
  { id: "purchase_requests", labelAr: "طلبات الشراء" },
  { id: "purchase_returns", labelAr: "مرتجعات المشتريات (383)" },
  { id: "suppliers", labelAr: "الموردون" },
  { id: "inventory", labelAr: "المخزون والمستودعات" },
  { id: "stock_transfers", labelAr: "مناقلات المخزون" },
  { id: "stock_adjustments", labelAr: "تسويات الجرد" },
  { id: "production", labelAr: "الإنتاج والتصنيع" },
  { id: "roastery", labelAr: "قسم التحميص" },
  { id: "grinding", labelAr: "قسم الطحن" },
  { id: "pos", labelAr: "نقاط البيع POS" },
  { id: "cashbox", labelAr: "الخزينة والصندوق" },
  { id: "fixed_assets", labelAr: "الأصول الثابتة والإهلاك" },
  { id: "hr_employees", labelAr: "الموارد البشرية" },
  { id: "hr_payroll", labelAr: "مسيرات الرواتب" },
  { id: "crm_leads", labelAr: "إدارة علاقات العملاء CRM" },
  { id: "reports", labelAr: "التقارير المالية" },
  { id: "admin_fiscal_periods", labelAr: "قفل الفترات المالية" },
  { id: "admin_audit_log", labelAr: "سجل التدقيق والرقابة" }
];

export default function AdminGovernanceModule({ initialTab = "admin_sync_status", language = "ar" }: Props) {
  const isAr = language === "ar";
  const {
    accounts,
    companySettings,
    setCompanySettings,
    postingConfig,
    setPostingConfig,
    warehouses,
    addWarehouse,
    updateWarehouse,
    batches,
    fiscalPeriods,
    toggleFiscalPeriodLock,
    addFiscalPeriod,
    fiscalYearClosing,
    users,
    currentUser,
    setCurrentUser,
    addUser,
    updateUser,
    deleteUser,
    permissionsByRole,
    updateRolePermissions,
    numberingSequences,
    updateNumberingSequence,
    auditLogs,
    backups,
    createBackup,
    downloadBackup,
    resetToDefault,
    runDataIntegrityAudit,
    runMasterCertification,
    reconcileSubledgers,
    syncStatus,
    lastSyncTime,
    pgliteStats,
    syncWithPglite,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Diagnostics & Sync state
  const [certReport, setCertReport] = useState(() => runMasterCertification());
  const [reconcileMessage, setReconcileMessage] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  const integrity = runDataIntegrityAudit();

  // 1. Company Settings Local Form State
  const [compForm, setCompForm] = useState(companySettings);
  const [postForm, setPostForm] = useState(postingConfig);

  useEffect(() => {
    setCompForm(companySettings);
  }, [companySettings]);

  useEffect(() => {
    setPostForm(postingConfig);
  }, [postingConfig]);

  // 2. Branches / Warehouses Form State
  const [newWhNameAr, setNewWhNameAr] = useState("");
  const [newWhName, setNewWhName] = useState("");
  const [newWhLocation, setNewWhLocation] = useState("");
  const [editingWhId, setEditingWhId] = useState<string | null>(null);

  // 3. Fiscal Year Closing State
  const [closingMemo, setClosingMemo] = useState("إقفال الحسابات الختامية للسنة المالية 2026 وترحيل صافي الأرباح لحساب الأرباح المبقاة 3100");
  const [closingResultMsg, setClosingResultMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 4. New Fiscal Period Form State
  const [fpCode, setFpCode] = useState("");
  const [fpName, setFpName] = useState("");
  const [fpStart, setFpStart] = useState("2026-10-01");
  const [fpEnd, setFpEnd] = useState("2026-12-31");

  // 5. Users Form State
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("Accountant");

  // 6. RBAC Role Selector State
  const [selectedRbacRole, setSelectedRbacRole] = useState<UserRole>("Accountant");

  // 8. Audit Log Filter State
  const [auditSearch, setAuditSearch] = useState("");
  const [auditUserFilter, setAuditUserFilter] = useState("ALL");

  // 9. Factory Reset Confirmation State
  const [confirmFactoryReset, setConfirmFactoryReset] = useState(false);

  const navTabs: { id: AdminTab; label: string; icon: React.ComponentType<any> }[] = [
    { id: "admin_companies", label: isAr ? "المنشأة وربط الحسابات" : "Company & GL Config", icon: Building2 },
    { id: "admin_branches", label: isAr ? "الفروع والمستودعات" : "Branches & Warehouses", icon: WarehouseIcon },
    { id: "admin_fiscal_years", label: isAr ? "السنوات المالية والإقفال" : "Fiscal Years", icon: Calendar },
    { id: "admin_fiscal_periods", label: isAr ? "الفترات المحاسبية وقفلها" : "Fiscal Periods", icon: Lock },
    { id: "admin_users", label: isAr ? "المستخدمون والجلسات" : "Users & Sessions", icon: Users },
    { id: "admin_roles", label: isAr ? "الأدوار والصلاحيات RBAC" : "RBAC Matrix", icon: KeyRound },
    { id: "admin_numbering", label: isAr ? "التسلسل الرقمي" : "Numbering Series", icon: Hash },
    { id: "admin_audit_log", label: isAr ? "سجل التدقيق الجنائي" : "Audit Trail", icon: FileText },
    { id: "admin_backup", label: isAr ? "النسخ الاحتياطي" : "Backups & Restore", icon: HardDriveDownload },
    { id: "admin_sync_status", label: isAr ? "المزامنة والاعتماد" : "PGlite Sync & Audit", icon: Database }
  ];

  // Handlers
  const handleSaveCompanyAndPosting = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySettings(compForm);
    setPostingConfig(postForm);
    addToast({
      type: "success",
      message: "تم حفظ إعدادات المنشأة والربط المحاسبي التلقائي بنجاح",
      messageEn: "Company settings and GL posting configuration saved"
    });
  };

  const handleSaveWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhNameAr.trim() || !newWhLocation.trim()) return;
    if (editingWhId) {
      updateWarehouse(editingWhId, {
        nameAr: newWhNameAr,
        name: newWhName || newWhNameAr,
        location: newWhLocation
      });
      setEditingWhId(null);
      addToast({ type: "success", message: "تم تحديث بيانات الفرع/المستودع بنجاح" });
    } else {
      addWarehouse({
        nameAr: newWhNameAr,
        name: newWhName || newWhNameAr,
        location: newWhLocation
      });
      addToast({ type: "success", message: `تم إضافة المستودع الجديد (${newWhNameAr}) بنجاح` });
    }
    setNewWhNameAr("");
    setNewWhName("");
    setNewWhLocation("");
  };

  const handleAddFiscalPeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpCode.trim() || !fpName.trim() || !fpStart || !fpEnd) return;
    addFiscalPeriod({
      code: fpCode.trim().toUpperCase(),
      name: fpName.trim(),
      startDate: fpStart,
      endDate: fpEnd,
      status: "OPEN",
      isClosed: false
    });
    setFpCode("");
    setFpName("");
    addToast({ type: "success", message: `تم إنشاء الفترة المحاسبية (${fpCode}) بنجاح` });
  };

  const handleExecuteYearClose = (e: React.FormEvent) => {
    e.preventDefault();
    const res = fiscalYearClosing(closingMemo);
    if (res.success) {
      setClosingResultMsg({
        type: "success",
        text: "تم إقفال السنة المالية بنجاح وترحيل صافي الدخل إلى حساب الأرباح المبقاة (3100) وتصفير حسابات الإيرادات والمصروفات."
      });
      addToast({ type: "success", message: "تم ترحيل قيد إقفال السنة المالية للأستاذ العام" });
    } else {
      setClosingResultMsg({
        type: "error",
        text: res.error || "تعذر إقفال السنة المالية الحالية."
      });
    }
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserEmail.trim()) return;
    addUser({
      username: newUsername.trim(),
      email: newUserEmail.trim(),
      role: newUserRole
    });
    setNewUsername("");
    setNewUserEmail("");
    addToast({ type: "success", message: `تم إنشاء حساب المستخدم (${newUsername}) بنجاح` });
  };

  const handleToggleRoleAction = (actionId: string) => {
    const current = permissionsByRole[selectedRbacRole] || { pages: [], actions: [] };
    const exists = current.actions.includes(actionId);
    const nextActions = exists
      ? current.actions.filter(a => a !== actionId)
      : [...current.actions, actionId];
    updateRolePermissions(selectedRbacRole, current.pages, nextActions);
  };

  const handleToggleRolePage = (pageId: string) => {
    const current = permissionsByRole[selectedRbacRole] || { pages: [], actions: [] };
    const exists = current.pages.includes(pageId);
    const nextPages = exists
      ? current.pages.filter(p => p !== pageId)
      : [...current.pages, pageId];
    updateRolePermissions(selectedRbacRole, nextPages, current.actions);
  };

  const handleExportAuditCsv = () => {
    const headers = ["ID", "Timestamp", "User", "Action", "Details", "OldValue", "NewValue"];
    const rows = filteredAuditLogs.map(l => [
      l.id,
      l.timestamp,
      l.username,
      `"${(l.action || "").replace(/"/g, '""')}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
      `"${(l.oldValue || "").replace(/"/g, '""')}"`,
      `"${(l.newValue || "").replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `novaro_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter(log => {
      const matchesUser = auditUserFilter === "ALL" || log.username === auditUserFilter;
      const q = auditSearch.trim().toLowerCase();
      const matchesQuery =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.username.toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q);
      return matchesUser && matchesQuery;
    });
  }, [auditLogs, auditSearch, auditUserFilter]);

  return (
    <div className="space-y-6" dir={isAr ? "rtl" : "ltr"}>
      <PageHeader
        title="إدارة النظام والحوكمة والرقابة والتدقيق"
        titleEn="System Governance, Security, Fiscal Locks & Master Certification"
        subtitle="إعدادات المنشأة، الفروع، قفل الفترات المالية، مصفوفة الصلاحيات RBAC، التسلسل الرقمي، النسخ الاحتياطي، ومزامنة PGlite"
        subtitleEn="Enterprise Configuration, Fiscal Period Locks, RBAC Matrix, Document Numbering, Audit Log & PGlite Sync"
        language={language}
      />

      <GlobalActionBar
        language={language}
         primaryActions={[
          {
            id: "run-cert",
            label: "تشغيل فحص الاعتماد الشامل (23 اختبار)",
            labelEn: "Run Master Certification",
            icon: Play,
            onClick: () => {
              setCertReport(runMasterCertification());
              setActiveTab("admin_sync_status");
            },
            variant: "primary"
          },
          {
            id: "reconcile-subledgers",
            label: "مطابقة الأستاذ الفرعي مع العام",
            labelEn: "Reconcile Subledgers to GL",
            icon: ShieldCheck,
            onClick: () => {
              const res = reconcileSubledgers();
              setReconcileMessage(res.details.join(" | "));
              setCertReport(runMasterCertification());
            },
            variant: "secondary"
          },
          {
            id: "sync-pglite",
            label: "مزامنة قاعدة PGlite المحلية",
            labelEn: "Sync PGlite DB",
            icon: RefreshCw,
            onClick: async () => {
              const res = await syncWithPglite("push");
              setSyncMessage(res.message);
            },
            variant: "secondary"
          },
          {
            id: "create-backup",
            label: "إنشاء نسخة احتياطية فورية",
            labelEn: "Create Snapshot Backup",
            icon: Database,
            onClick: () => {
              createBackup();
              addToast({ type: "success", message: "تم إنشاء نسخة احتياطية كاملة للنظام بنجاح" });
            },
            variant: "secondary"
          }
        ]}
      />

      {/* Top KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiCard
          title="حالة سلامة الحسابات والمطابقة"
          titleEn="Data Integrity Status"
          value={integrity.overallHealthy ? "متطابق 100%" : "يتطلب مراجعة"}
          subtitle={`${integrity.checks.filter(c => c.passed).length} / ${integrity.checks.length} فحوصات ناجحة`}
          icon={ShieldCheck}
          language={language}
        />
        <KpiCard
          title="شهادة الاعتماد المالي (Master Suite)"
          titleEn="Certification Suite"
          value={`${certReport.passedCount}/${certReport.totalChecks} PASS`}
          subtitle={certReport.status === "PASSED" ? "معتمد للإنتاج" : "يوجد ملاحظات"}
          icon={CheckCircle2}
          language={language}
        />
        <KpiCard
          title="مزامنة PGlite المحلية"
          titleEn="Local PGlite Engine"
          value={syncStatus === "synced" ? "متصل ومتزامن" : syncStatus === "syncing" ? "جاري المزامنة..." : "وضع محلي"}
          subtitle={`${pgliteStats?.tableCount || 31} جدول قياسي | الجلسة: ${currentUser.username}`}
          icon={Database}
          language={language}
        />
        <KpiCard
          title="الفترات المقيدة وسجل الرقابة"
          titleEn="Fiscal Locks & Audit Trail"
          value={`${fiscalPeriods.filter(p => p.isClosed).length}/${fiscalPeriods.length} مقفلة`}
          subtitle={`${auditLogs.length} سجل تدقيق جنائي موثق`}
          icon={Activity}
          language={language}
        />
      </div>

      {/* Sub-Navigation Bar for all 10 Governance Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-1.5">
        {navTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Alert Banners */}
      {(reconcileMessage || syncMessage) && (
        <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold flex items-center justify-between">
          <span>{reconcileMessage || syncMessage}</span>
          <button
            type="button"
            onClick={() => {
              setReconcileMessage(null);
              setSyncMessage(null);
            }}
            className="text-teal-700 hover:underline text-[11px]"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* =====================================================================
          1. ADMIN_COMPANIES: COMPANY PROFILE & AUTOMATIC GL POSTING CONFIG
         ===================================================================== */}
      {activeTab === "admin_companies" && (
        <form onSubmit={handleSaveCompanyAndPosting} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">البيانات القانونية والضريبية للمنشأة (Company & ZATCA Profile)</h3>
                <p className="text-xs text-slate-500">تُستخدم هذه البيانات في ترويسة التقارير والفواتير الضريبية وختم التشفير ZATCA TLV/XML</p>
              </div>
              <StatusBadge status="Active" language={language} size="sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم المنشأة (بالعربية)</label>
                <input
                  type="text"
                  value={compForm.nameAr}
                  onChange={e => setCompForm({ ...compForm, nameAr: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم المنشأة (بالإنجليزية)</label>
                <input
                  type="text"
                  value={compForm.name}
                  onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">الرقم الضريبي الموحد (ZATCA VAT # - 15 رقم)</label>
                <input
                  type="text"
                  value={compForm.taxNumber}
                  onChange={e => setCompForm({ ...compForm, taxNumber: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">رقم السجل التجاري (CRN)</label>
                <input
                  type="text"
                  value={compForm.commercialRegistration}
                  onChange={e => setCompForm({ ...compForm, commercialRegistration: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">العنوان الوطني والمقر الرئيسي</label>
                <input
                  type="text"
                  value={compForm.address}
                  onChange={e => setCompForm({ ...compForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">نسبة الضريبة (VAT)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={compForm.taxConfiguration.vatRate}
                    onChange={e =>
                      setCompForm({
                        ...compForm,
                        taxConfiguration: { vatRate: parseFloat(e.target.value) || 0 }
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono text-center"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">العملة الأساسية</label>
                  <select
                    value={compForm.defaultCurrency}
                    onChange={e => setCompForm({ ...compForm, defaultCurrency: e.target.value as Currency })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                  >
                    <option value={Currency.SAR}>SAR - ريال سعودي</option>
                    <option value={Currency.USD}>USD - دولار أمريكي</option>
                    <option value={Currency.YER}>YER - ريال يمني</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Automatic GL Control Account Mapping */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">توجيه وربط الحسابات الرقابية الآلي (Automated GL Posting Accounts)</h3>
                <p className="text-xs text-slate-500">تحديد الحسابات الافتراضية التي ترحل إليها محركات المبيعات والمشتريات والمخزون والتصنيع آلياً</p>
              </div>
              <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">Double-Entry Integration</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {[
                { key: "cashAccountId", label: "حساب الخزينة النقدية (Cash)" },
                { key: "bankAccountId", label: "حساب البنك الجاري (Bank)" },
                { key: "accountsReceivableAccountId", label: "حساب ذمم العملاء (AR 1200)" },
                { key: "accountsPayableAccountId", label: "حساب ذمم الموردين (AP 2000)" },
                { key: "rawMaterialsInventoryAccountId", label: "مخزون المواد الخام والبن الأخضر (1300)" },
                { key: "wipInventoryAccountId", label: "مخزون تحت التشغيل تحميص/طحن (1320)" },
                { key: "finishedGoodsInventoryAccountId", label: "مخزون الإنتاج التام المعبأ (1310)" },
                { key: "vatInputAccountId", label: "ضريبة القيمة المضافة مدخلات (VAT Input)" },
                { key: "vatOutputAccountId", label: "ضريبة القيمة المضافة مخرجات (VAT Output)" },
                { key: "cogsAccountId", label: "تكلفة البضاعة المباعة (COGS 5000)" },
                { key: "wholesaleRevenueAccountId", label: "إيرادات مبيعات الجملة (4000)" },
                { key: "retailRevenueAccountId", label: "إيرادات مبيعات التجزئة ونقاط البيع (4100)" }
              ].map(field => (
                <div key={field.key} className="space-y-1">
                  <label className="font-bold text-slate-600 block">{field.label}</label>
                  <select
                    value={(postForm as any)[field.key] || ""}
                    onChange={e => setPostForm({ ...postForm, [field.key]: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-semibold"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.code} - {acc.nameAr}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات المنشأة وإعدادات الربط المحاسبي</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          2. ADMIN_BRANCHES: WAREHOUSES & BRANCHES MANAGEMENT
         ===================================================================== */}
      {activeTab === "admin_branches" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleSaveWarehouse} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <WarehouseIcon className="w-4 h-4 text-teal-700" />
              <span>{editingWhId ? "تعديل بيانات الفرع / المستودع" : "إضافة فرع أو مستودع جديد"}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم المستودع / الفرع (بالعربية)</label>
                <input
                  type="text"
                  placeholder="مثال: مستودع البن الأخضر المركزي - جدة"
                  value={newWhNameAr}
                  onChange={e => setNewWhNameAr(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">الاسم بالإنجليزية</label>
                <input
                  type="text"
                  placeholder="e.g. Jeddah Green Bean Hub"
                  value={newWhName}
                  onChange={e => setNewWhName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">الموقع الجغرافي / المدينة</label>
                <input
                  type="text"
                  placeholder="مثال: الرياض - المنطقة الصناعية الثانية"
                  value={newWhLocation}
                  onChange={e => setNewWhLocation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>{editingWhId ? "حفظ التعديلات" : "إضافة المستودع"}</span>
              </button>
              {editingWhId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingWhId(null);
                    setNewWhNameAr("");
                    setNewWhName("");
                    setNewWhLocation("");
                  }}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">قائمة الفروع والمستودعات وتقييم المخزون الفعلي (FIFO Valuation)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-right">الكود</th>
                    <th className="p-3 text-right">اسم المستودع / الفرع</th>
                    <th className="p-3 text-right">الموقع</th>
                    <th className="p-3 text-right">عدد الدفعات (Batches)</th>
                    <th className="p-3 text-right">إجمالي الكميات</th>
                    <th className="p-3 text-right">تقييم المخزون (ر.س)</th>
                    <th className="p-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {warehouses.map(w => {
                    const whBatches = batches.filter(b => b.warehouseId === w.id && b.quantity > 0);
                    const totalQty = whBatches.reduce((s, b) => s + b.quantity, 0);
                    const totalVal = whBatches.reduce((s, b) => s + b.quantity * b.costPerUnit, 0);
                    return (
                      <tr key={w.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-700">{w.id}</td>
                        <td className="p-3 font-bold text-slate-900">
                          <div>{w.nameAr}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.name}</div>
                        </td>
                        <td className="p-3 text-slate-600">{w.location}</td>
                        <td className="p-3 font-mono font-bold">{whBatches.length}</td>
                        <td className="p-3 font-mono font-bold text-teal-700">{totalQty.toLocaleString()}</td>
                        <td className="p-3 font-mono font-black text-slate-900">
                          SAR {totalVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingWhId(w.id);
                              setNewWhNameAr(w.nameAr);
                              setNewWhName(w.name);
                              setNewWhLocation(w.location);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                          >
                            تعديل
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. ADMIN_FISCAL_YEARS: FISCAL YEAR-END CLOSING & RETAINED EARNINGS
         ===================================================================== */}
      {activeTab === "admin_fiscal_years" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">إدارة السنوات المالية وإقفال الحسابات الختامية (Fiscal Year-End Closing)</h3>
              <p className="text-xs text-slate-500">ترحيل صافي الربح أو الخسارة السنوية إلى حساب الأرباح المبقاة (3100) وتصفير حسابات قائمة الدخل</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-black">
              السنة المالية الفعالة: FY-2026
            </span>
          </div>

          {(() => {
            const incomeAccs = accounts.filter(a => a.type === AccountType.Income);
            const expenseAccs = accounts.filter(a => a.type === AccountType.Expense);
            const totalIncome = incomeAccs.reduce((s, a) => s + a.balance, 0);
            const totalExpense = expenseAccs.reduce((s, a) => s + a.balance, 0);
            const netProfit = totalIncome - totalExpense;
            const retainedAcc = accounts.find(a => a.id === "acc-3100");

            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <h4 className="text-xs font-black text-slate-800">ملخص أرصدة قائمة الدخل الحالية قبل الإقفال</h4>
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between p-3 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-600">إجمالي أرصدة الإيرادات (Income Accounts):</span>
                      <span className="font-mono font-black text-emerald-700">SAR {totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-white rounded-xl border border-slate-200">
                      <span className="font-bold text-slate-600">إجمالي أرصدة المصروفات والتكاليف (Expense & COGS):</span>
                      <span className="font-mono font-black text-rose-700">SAR {totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between p-3.5 bg-slate-900 text-white rounded-xl">
                      <span className="font-black">صافي الربح / الفائض القابل للترحيل للأرباح المبقاة:</span>
                      <span className="font-mono font-black text-amber-400">SAR {netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between p-3 bg-teal-50 text-teal-900 rounded-xl border border-teal-200">
                      <span className="font-bold">رصيد حساب الأرباح المبقاة الحالي (3100 - Retained Earnings):</span>
                      <span className="font-mono font-black">SAR {(retainedAcc?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleExecuteYearClose} className="p-5 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900">اعتماد وتنفيذ قيد الإقفال السنوي المزدوج</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      يقوم محرك المحاسبة بإنشاء قيد يومية مركب (`YEAR-CLOSE-2026`) يجعل كافة حسابات الإيرادات مدينة بأرصدتها، وكافة حسابات المصروفات دائنة بأرصدتها، ويرحل الفارق الصافي إلى حساب `3100 - الأرباح المبقاة`.
                    </p>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600 block">بيان وملاحظة قيد الإقفال السنوي</label>
                      <textarea
                        rows={3}
                        value={closingMemo}
                        onChange={e => setClosingMemo(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                        required
                      />
                    </div>
                    {closingResultMsg && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold border ${
                          closingResultMsg.type === "success"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {closingResultMsg.text}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-black shadow-xs transition"
                  >
                    تنفيذ وترحيل قيد إقفال السنة المالية (Close Fiscal Year 2026)
                  </button>
                </form>
              </div>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          4. ADMIN_FISCAL_PERIODS: FISCAL PERIOD LOCKING & CREATION
         ===================================================================== */}
      {activeTab === "admin_fiscal_periods" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddFiscalPeriod} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-700" />
              <span>إضافة فترة محاسبية جديدة</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">كود الفترة (Period Code)</label>
                <input
                  type="text"
                  placeholder="مثال: 2026-Q4 أو 2026-M10"
                  value={fpCode}
                  onChange={e => setFpCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم الفترة المحاسبية</label>
                <input
                  type="text"
                  placeholder="مثال: الربع الرابع 2026"
                  value={fpName}
                  onChange={e => setFpName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">تاريخ البداية</label>
                  <input
                    type="date"
                    value={fpStart}
                    onChange={e => setFpStart(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-600 block">تاريخ النهاية</label>
                  <input
                    type="date"
                    value={fpEnd}
                    onChange={e => setFpEnd(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                    required
                  />
                </div>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إدراج الفترة المحاسبية</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">جدول قفل وفتح الفترات المحاسبية (Fiscal Period Lock Shield)</h3>
                <p className="text-xs text-slate-500">عند قفل أي فترة، يمنع النظام ترحيل القيود أو الفواتير أو أوامر التصنيع أو المرتجعات التي تقع ضمن تواريخها</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-right">الكود</th>
                    <th className="p-3 text-right">اسم الفترة</th>
                    <th className="p-3 text-right">من تاريخ</th>
                    <th className="p-3 text-right">إلى تاريخ</th>
                    <th className="p-3 text-right">الحالة</th>
                    <th className="p-3 text-center">التحكم بالحماية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fiscalPeriods.map(fp => (
                    <tr key={fp.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-800">{fp.code}</td>
                      <td className="p-3 font-bold text-slate-900">{fp.name}</td>
                      <td className="p-3 font-mono text-slate-600">{fp.startDate}</td>
                      <td className="p-3 font-mono text-slate-600">{fp.endDate}</td>
                      <td className="p-3">
                        <StatusBadge status={fp.isClosed ? "Closed" : "Active"} language={language} size="sm" />
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleFiscalPeriodLock(fp.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            fp.isClosed
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                              : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                          }`}
                        >
                          {fp.isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          <span>{fp.isClosed ? "إعادة فتح الفترة" : "قفل الفترة ومنع الترحيل"}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. ADMIN_USERS: USER ACCOUNTS & LIVE SESSION ROLE SWITCHER
         ===================================================================== */}
      {activeTab === "admin_users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddUser} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-700" />
              <span>إنشاء حساب مستخدم جديد</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">اسم المستخدم (Username)</label>
                <input
                  type="text"
                  placeholder="مثال: khaled_audit"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">البريد الإلكتروني الوظيفي</label>
                <input
                  type="email"
                  placeholder="khaled@novaro-coffee.sa"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-bold text-slate-600 block">الدور الوظيفي (RBAC Role)</label>
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as UserRole)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                >
                  {ALL_ROLES.map(r => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة المستخدم للنظام</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">حسابات المستخدمين ومحاكاة الجلسات الفورية (Active Session Switcher)</h3>
                <p className="text-xs text-slate-500">يمكنك التبديل الفوري بين المستخدمين لاختبار صلاحيات العرض والاعتماد والترحيل حسب الدور الوظيفي</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-teal-50 text-teal-800 border border-teal-200 text-xs font-bold">
                المستخدم الحالي: {currentUser.username} ({currentUser.role})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-right">المعرف</th>
                    <th className="p-3 text-right">اسم المستخدم</th>
                    <th className="p-3 text-right">البريد الإلكتروني</th>
                    <th className="p-3 text-right">الدور الوظيفي (Role)</th>
                    <th className="p-3 text-center">تبديل الجلسة / إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => {
                    const isCurrent = currentUser.id === u.id;
                    return (
                      <tr key={u.id} className={isCurrent ? "bg-teal-50/40" : "hover:bg-slate-50"}>
                        <td className="p-3 font-mono text-slate-500">{u.id}</td>
                        <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                          <span>{u.username}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full bg-teal-700 text-white text-[10px] font-bold">
                              نشط الآن
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600">{u.email}</td>
                        <td className="p-3">
                          <select
                            value={u.role}
                            onChange={e => updateUser(u.id, { role: e.target.value as UserRole })}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white font-bold text-xs"
                          >
                            {ALL_ROLES.map(r => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentUser(u);
                                  addToast({
                                    type: "info",
                                    message: `تم التبديل إلى جلسة المستخدم: ${u.username} (${u.role})`
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>تفعيل الجلسة</span>
                              </button>
                            )}
                            {!isCurrent && u.role !== "Admin" && (
                              <button
                                type="button"
                                onClick={() => deleteUser(u.id)}
                                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="حذف المستخدم"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          6. ADMIN_ROLES: INTERACTIVE RBAC PERMISSIONS MATRIX
         ===================================================================== */}
      {activeTab === "admin_roles" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">مصفوفة الأدوار والصلاحيات التفاعلية (RBAC Governance Matrix)</h3>
              <p className="text-xs text-slate-500">تخصيص صلاحيات العمليات والوحدات المسموح بها لكل دور وظيفي في النظام</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">اختر الدور الوظيفي للتعديل:</span>
              <select
                value={selectedRbacRole}
                onChange={e => setSelectedRbacRole(e.target.value as UserRole)}
                className="p-2.5 rounded-xl border border-slate-300 bg-slate-50 font-black text-xs text-slate-900"
              >
                {ALL_ROLES.map(r => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const rolePerms = permissionsByRole[selectedRbacRole] || { pages: [], actions: [] };
            const isFullAdmin = selectedRbacRole === "Admin" || selectedRbacRole === "Owner";

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Action Permissions */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black text-slate-900">صلاحيات العمليات (Operational Actions)</h4>
                  <div className="space-y-2">
                    {ALL_ACTIONS.map(act => {
                      const checked = isFullAdmin || rolePerms.actions.includes(act.id);
                      return (
                        <label
                          key={act.id}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-teal-500 transition text-xs"
                        >
                          <span className="font-bold text-slate-800">{act.labelAr}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isFullAdmin}
                            onChange={() => handleToggleRoleAction(act.id)}
                            className="w-4 h-4 accent-teal-700 rounded"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Page / Module Access Permissions */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900">الوحدات والشاشات المصرح بالوصول إليها (Allowed ERP Modules)</h4>
                    <span className="text-[11px] font-mono font-bold text-teal-700">
                      {rolePerms.pages.length} شاشة مفعلة
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {MODULE_GROUPS.map(mod => {
                      const checked = isFullAdmin || rolePerms.pages.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                            checked
                              ? "bg-white border-teal-300 text-slate-900 font-bold"
                              : "bg-slate-100/70 border-slate-200 text-slate-500"
                          }`}
                        >
                          <span className="truncate">{mod.labelAr}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isFullAdmin}
                            onChange={() => handleToggleRolePage(mod.id)}
                            className="w-4 h-4 accent-teal-700 rounded shrink-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =====================================================================
          7. ADMIN_NUMBERING: DOCUMENT NUMBERING SEQUENCES
         ===================================================================== */}
      {activeTab === "admin_numbering" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">إعدادات التسلسل الرقمي للمستندات والقيود (Document Numbering Series)</h3>
              <p className="text-xs text-slate-500">ضبط البادئة (Prefix) وطول الترقيم والعداد التالي لجميع مستندات النظام المحاسبية والتشغيلية</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 text-right">السلسلة / الوحدة</th>
                  <th className="p-3 text-center">البادئة (Prefix)</th>
                  <th className="p-3 text-center">تضمين السنة</th>
                  <th className="p-3 text-center">عدد الخانات (Padding)</th>
                  <th className="p-3 text-center">الرقم التسلسلي التالي</th>
                  <th className="p-3 text-right">نموذج الرقم القادم (Preview)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {numberingSequences.map(seq => (
                  <tr key={seq.id} className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{seq.moduleAr}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{seq.moduleEn}</div>
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="text"
                        value={seq.prefix}
                        onChange={e => updateNumberingSequence(seq.id, { prefix: e.target.value.toUpperCase() })}
                        className="w-24 p-1.5 rounded-lg border border-slate-200 text-center font-mono font-bold bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={seq.includeYear}
                        onChange={e => updateNumberingSequence(seq.id, { includeYear: e.target.checked })}
                        className="w-4 h-4 accent-teal-700"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={3}
                        max={8}
                        value={seq.padding}
                        onChange={e => updateNumberingSequence(seq.id, { padding: parseInt(e.target.value, 10) || 4 })}
                        className="w-16 p-1.5 rounded-lg border border-slate-200 text-center font-mono bg-white"
                      />
                    </td>
                    <td className="p-3 text-center">
                      <input
                        type="number"
                        min={1}
                        value={seq.nextNumber}
                        onChange={e => updateNumberingSequence(seq.id, { nextNumber: parseInt(e.target.value, 10) || 1 })}
                        className="w-24 p-1.5 rounded-lg border border-slate-200 text-center font-mono font-bold bg-white"
                      />
                    </td>
                    <td className="p-3">
                      <span className="px-3 py-1 rounded-lg bg-slate-900 text-amber-400 font-mono font-bold text-xs">
                        {seq.sample}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          8. ADMIN_AUDIT_LOG: FORENSIC AUDIT TRAIL
         ===================================================================== */}
      {activeTab === "admin_audit_log" && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">سجل التدقيق الجنائي والرقابة غير القابل للتعديل (Immutable Audit Trail)</h3>
              <p className="text-xs text-slate-500">توثيق كامل لجميع العمليات المحاسبية والمخزنية وتغييرات الصلاحيات مع القيم السابقةوالجديدة</p>
            </div>
            <button
              type="button"
              onClick={handleExportAuditCsv}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold transition"
            >
              <Download className="w-4 h-4" />
              <span>تصدير سجل الرقابة (CSV)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="ابحث بنوع العملية، رقم القيد، الفاتورة، أو التفاصيل..."
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                className="w-full pr-9 pl-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50"
              />
            </div>
            <div>
              <select
                value={auditUserFilter}
                onChange={e => setAuditUserFilter(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
              >
                <option value="ALL">جميع المستخدمين ({auditLogs.length} حركة)</option>
                {Array.from(new Set(auditLogs.map(l => l.username))).map(uname => (
                  <option key={uname} value={uname}>
                    المستخدم: {uname}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[480px] overflow-y-auto border border-slate-150 rounded-xl">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-right">المعرف</th>
                  <th className="p-3 text-right">التوقيت</th>
                  <th className="p-3 text-right">المستخدم</th>
                  <th className="p-3 text-right">العملية</th>
                  <th className="p-3 text-right">التفاصيل والبيان</th>
                  <th className="p-3 text-right">التغيير (قبل ← بعد)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAuditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-500">{log.id}</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(log.timestamp).toLocaleString("ar-SA")}</td>
                    <td className="p-3 font-bold text-slate-800">{log.username}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{log.details}</td>
                    <td className="p-3 font-mono text-[11px]">
                      {log.oldValue || log.newValue ? (
                        <span className="text-slate-600">
                          {log.oldValue || "—"} → <strong className="text-teal-700">{log.newValue || "—"}</strong>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          9. ADMIN_BACKUP: SNAPSHOT BACKUPS, DOWNLOAD & FACTORY RESET
         ===================================================================== */}
      {activeTab === "admin_backup" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 h-fit">
            <h3 className="text-sm font-black text-slate-900">النسخ الاحتياطي والاستعادة</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              تتضمن النسخة الاحتياطية كافة الحسابات، قيود اليومية، دفعات المخزون وطبقات FIFO، الفواتير، سجلات ZATCA، وإعدادات الحوكمة.
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  createBackup();
                  addToast({ type: "success", message: "تم توليد وحفظ نقطة استعادة جديدة للنظام" });
                }}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <Database className="w-4 h-4" />
                <span>إنشاء نقطة نسخ احتياطي فورية</span>
              </button>

              <button
                type="button"
                onClick={() => downloadBackup()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل ملف قاعدة البيانات الكامل (JSON)</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <h4 className="text-xs font-black text-rose-700">إعادة ضبط المصنع والبيانات التأسيسية (Factory Seed Reset)</h4>
              {!confirmFactoryReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmFactoryReset(true)}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة تهيئة النظام للبيانات الافتراضية</span>
                </button>
              ) : (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                  <p className="text-[11px] text-rose-800 font-bold">هل أنت متأكد؟ سيتم استعادة الأرصدة والبيانات الافتراضية المعتمدة.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetToDefault();
                        setConfirmFactoryReset(false);
                        addToast({ type: "info", message: "تمت استعادة البيانات التأسيسية للنظام بنجاح" });
                      }}
                      className="flex-1 py-1.5 bg-rose-700 text-white rounded-lg text-xs font-black"
                    >
                      تأكيد الاستعادة
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmFactoryReset(false)}
                      className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 rounded-lg text-xs font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">سجل نقاط النسخ الاحتياطي المحفوظة ({backups.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3 text-right">معرف النسخة</th>
                    <th className="p-3 text-right">اسم الملف</th>
                    <th className="p-3 text-right">تاريخ الإنشاء</th>
                    <th className="p-3 text-right">الحجم</th>
                    <th className="p-3 text-center">تحميل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {backups.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{b.id}</td>
                      <td className="p-3 font-mono text-slate-900">{b.filename}</td>
                      <td className="p-3 font-mono text-slate-500">{b.createdAt}</td>
                      <td className="p-3 font-mono font-bold text-teal-700">{b.size}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => downloadBackup(b.id)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px]"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تنزيل JSON</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          10. ADMIN_SYNC_STATUS: PGLITE SYNC, SUBLEDGER RECONCILIATION & CERTIFICATION
         ===================================================================== */}
      {activeTab === "admin_sync_status" && (
        <div className="space-y-6">
          {/* PGlite Bidirectional Sync Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">المزامنة المزدوجة مع محرك قاعدة البيانات المحلية PGlite (PostgreSQL 16 Embedded)</h3>
                <p className="text-xs text-slate-500">
                  حالة الاتصال: <strong>{syncStatus === "synced" ? "متزامن (Synced)" : syncStatus}</strong>
                  {lastSyncTime ? ` | آخر مزامنة: ${new Date(lastSyncTime).toLocaleTimeString("ar-SA")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await syncWithPglite("push");
                    setSyncMessage(res.message);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800 transition flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>ترحيل للقاعدة (Push to PGlite)</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await syncWithPglite("pull");
                    setSyncMessage(res.message);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                >
                  استرجاع من القاعدة (Pull from PGlite)
                </button>
              </div>
            </div>

            {pgliteStats?.counts && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 pt-2">
                {Object.entries(pgliteStats.counts).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                    <div className="text-[10px] font-mono text-slate-500">{k}</div>
                    <div className="text-sm font-black text-slate-900 font-mono">{v}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Subledger-to-GL Control Account Reconciliation Matrix */}
          {integrity.reconciliation && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">مصفوفة مطابقة الأستاذ الفرعي مع الأستاذ العام (Subledger-to-GL Reconciliation)</h3>
                  <p className="text-xs text-slate-500">التحقق المستمر من تطابق أرصدة العملاء والموردين وطبقات المخزون FIFO مع الحسابات الرقابية في ميزان المراجعة</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const res = reconcileSubledgers();
                    setReconcileMessage(res.details.join(" | "));
                    setCertReport(runMasterCertification());
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition"
                >
                  تسوية الفروقات آلياً
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3 text-right">المحرك / الحساب الرقابي</th>
                      <th className="p-3 text-right">رصيد الأستاذ الفرعي (Subledger)</th>
                      <th className="p-3 text-right">رصيد الأستاذ العام (GL Control)</th>
                      <th className="p-3 text-right">الفرق (Variance)</th>
                      <th className="p-3 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-bold">ذمم العملاء المدينة (Accounts Receivable - 1200)</td>
                      <td className="p-3 font-mono">{integrity.reconciliation.arSubledgerTotal.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono">{integrity.reconciliation.arControlBalance.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono font-bold">{integrity.reconciliation.arVariance.toFixed(2)} ر.س</td>
                      <td className="p-3">
                        <StatusBadge status={Math.abs(integrity.reconciliation.arVariance) <= 0.05 ? "Completed" : "Draft"} language={language} size="sm" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">ذمم الموردين الدائنة (Accounts Payable - 2000)</td>
                      <td className="p-3 font-mono">{integrity.reconciliation.apSubledgerTotal.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono">{integrity.reconciliation.apControlBalance.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono font-bold">{integrity.reconciliation.apVariance.toFixed(2)} ر.س</td>
                      <td className="p-3">
                        <StatusBadge status={Math.abs(integrity.reconciliation.apVariance) <= 0.05 ? "Completed" : "Draft"} language={language} size="sm" />
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">تقييم طبقات المخزون (FIFO Layers vs Inventory GL 1300/1310/1320)</td>
                      <td className="p-3 font-mono">{integrity.reconciliation.inventoryFifoTotal.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono">{integrity.reconciliation.inventoryGlBalance.toFixed(2)} ر.س</td>
                      <td className="p-3 font-mono font-bold">{integrity.reconciliation.inventoryVariance.toFixed(2)} ر.س</td>
                      <td className="p-3">
                        <StatusBadge status={Math.abs(integrity.reconciliation.inventoryVariance) <= 1 ? "Completed" : "Draft"} language={language} size="sm" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Master Certification Results */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">نتائج اختبارات الاعتماد المالي والتشغيلي الشامل (Master Certification Suite - {certReport.totalChecks} Automated Checks)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {certReport.results.map(r => (
                <div
                  key={r.code}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                    r.status === "PASS" ? "bg-emerald-50/50 border-emerald-200" : "bg-rose-50 border-rose-200"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      [{r.code}] {r.name}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5">{r.details || "تم اجتياز الفحص الرقابي بنجاح"}</div>
                  </div>
                  <StatusBadge status={r.status === "PASS" ? "Completed" : "Cancelled"} language={language} size="sm" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
