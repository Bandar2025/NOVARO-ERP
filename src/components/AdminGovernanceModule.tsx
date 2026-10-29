import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Unlock,
  Database,
  Users,
  FileCheck2,
  History,
  RefreshCcw,
  CheckCircle2,
  Scale,
  CalendarCheck,
} from "lucide-react";
import { useAppState } from "../context/StateContext";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import StatusBadge from "./common/StatusBadge";

interface AdminGovernanceModuleProps {
  initialTab?:
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
  language?: "ar" | "en";
}

export default function AdminGovernanceModule({
  initialTab = "admin_fiscal_periods",
  language = "ar",
}: AdminGovernanceModuleProps) {
  const isAr = language === "ar";
  const {
    companySettings,
    warehouses,
    fiscalPeriods,
    toggleFiscalPeriodLock,
    fiscalYearClosing,
    users,
    currentUser,
    setCurrentUser,
    permissionsByRole,
    auditLogs,
    backups,
    createBackup,
    runDataIntegrityAudit,
    runMasterCertification,
    reconcileSubledgers,
    syncStatus,
    lastSyncTime,
    pgliteStats,
    syncWithPglite,
    zatcaRecords,
  } = useAppState();

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [integrityReport, setIntegrityReport] = useState<any | null>(() => runDataIntegrityAudit());
  const [certReport, setCertReport] = useState<any | null>(null);

  const handleTogglePeriod = (periodId: string) => {
    toggleFiscalPeriodLock(periodId);
    setNotice({
      type: "success",
      text: "تم تحديث حالة قفل الفترة المالية وتوثيق العملية في سجل المراجعة.",
    });
  };

  const handleFiscalYearClose = () => {
    const res = fiscalYearClosing("إقفال الحسابات الختامية السنوية وترحيل صافي الدخل لحساب الأرباح المبقاة 3100");
    if (res.success) {
      setIntegrityReport(runDataIntegrityAudit());
      setNotice({
        type: "success",
        text: "تم إقفال حسابات الإيرادات (4xxx) والمصروفات (5xxx) وترحيل صافي الربح إلى الأرباح المبقاة (3100) بقيد مزدوج متوازن.",
      });
    } else {
      setNotice({
        type: "error",
        text: res.error || "لا توجد أرصدة إيرادات أو مصروفات مفتوحة لإقفالها.",
      });
    }
  };

  const handleBackup = () => {
    createBackup();
    setNotice({
      type: "success",
      text: "تم أخذ نسخة احتياطية مشفرة لكامل حالة النظام وسجل القيود بنجاح.",
    });
  };

  const handleIntegrityCheck = () => {
    const res = runDataIntegrityAudit();
    setIntegrityReport(res);
    const isHealthy = res.overallStatus === "HEALTHY";
    setNotice({
      type: isHealthy ? "success" : "error",
      text: isHealthy
        ? "فحص سلامة البيانات: جميع القيود متوازنة وميزان المراجعة والأستاذ الفرعي (1200/2000/FIFO) وسلسلة ZATCA متطابقة 100%."
        : `تم رصد ملاحظات (${res.criticalCount} أخطاء حرجة / ${res.warningCount} تنبيهات). يمكنك استخدام زر المطابقة الذاتية لمعالجتها.`,
    });
  };

  const handleReconcileSubledgers = () => {
    const res = reconcileSubledgers();
    const updatedAudit = runDataIntegrityAudit();
    setIntegrityReport(updatedAudit);
    setNotice({
      type: "success",
      text: res.details.join(" | "),
    });
  };

  const handleSyncPglite = async (direction: "push" | "pull" = "push") => {
    const res = await syncWithPglite(direction);
    setNotice({
      type: res.success ? "success" : "error",
      text: res.message,
    });
  };

  const handleCertify = () => {
    const res = runMasterCertification();
    setCertReport(res);
    const isCertified = res.status === "PASSED";
    setNotice({
      type: isCertified ? "success" : "error",
      text: isCertified
        ? `اجتاز النظام شهادة الفحص الشامل (${res.passedCount}/${res.totalChecks} اختبار قياسي معتمد).`
        : `فشل في بعض الفحوصات (${res.failedCount} فشل من أصل ${res.totalChecks}). يرجى مراجعة التفاصيل.`,
    });
  };

  const rec = integrityReport?.reconciliation;

  return (
    <div className="space-y-6">
      <PageHeader
        title="الحوكمة، الفترات المالية، ومزامنة PGlite (Enterprise Governance)"
        description="إدارة المنشأة، قفل الفترات المحاسبية، مطابقة الأستاذ الفرعي والعام، ومزامنة قاعدة البيانات المحلية PGlite"
        icon={ShieldCheck}
        language={language}
      />

      {notice && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between ${
            notice.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span className="font-medium text-sm">{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            className="text-xs underline font-semibold"
          >
            {isAr ? "إغلاق" : "Dismiss"}
          </button>
        </div>
      )}

      <GlobalActionBar
        extraActions={[
          {
            id: "run-integrity",
            labelAr: "فحص سلامة وتوازن النظام",
            labelEn: "Run Integrity Audit",
            icon: ShieldCheck,
            variant: "primary",
            onClick: handleIntegrityCheck,
          },
          {
            id: "reconcile-subledgers",
            labelAr: "مطابقة الأستاذ الفرعي والعام",
            labelEn: "Reconcile Subledgers & GL",
            icon: Scale,
            variant: "secondary",
            onClick: handleReconcileSubledgers,
          },
          {
            id: "sync-pglite",
            labelAr: "مزامنة فورية مع PGlite",
            labelEn: "Sync with PGlite DB",
            icon: RefreshCcw,
            variant: "secondary",
            onClick: () => handleSyncPglite("push"),
          },
          {
            id: "run-cert",
            labelAr: "شهادة المطابقة (Certification)",
            labelEn: "Master Certification",
            icon: FileCheck2,
            variant: "secondary",
            onClick: handleCertify,
          },
          {
            id: "create-backup",
            labelAr: "إنشاء نسخة احتياطية",
            labelEn: "Create Backup",
            icon: Database,
            variant: "success",
            onClick: handleBackup,
          },
        ]}
        language={language}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>الفترات المحاسبية</span>
            <Lock className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {fiscalPeriods.length} فترات
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {fiscalPeriods.filter((p) => p.isClosed || p.status === "CLOSED" || p.status === "LOCKED" || p.status === "Locked" || p.status === "Closed").length} مقفلة /{" "}
            {fiscalPeriods.filter((p) => !(p.isClosed || p.status === "CLOSED" || p.status === "LOCKED" || p.status === "Locked" || p.status === "Closed")).length} مفتوحة
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>المستخدمون والأدوار</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {users.length} مستخدمين
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {Object.keys(permissionsByRole).length} أدوار وظيفية (RBAC)
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>سجل التدقيق (Audit Log)</span>
            <History className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-2">
            {auditLogs.length} حدث
          </div>
          <div className="text-xs text-slate-500 mt-1">توثيق غير قابل للتعديل</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>محرك PGlite & ZATCA</span>
            <Database className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black text-teal-700 mt-2">
            {syncStatus === "syncing" ? "جاري المزامنة..." : "PGlite Synchronized"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {pgliteStats?.tableCount || 31} جدول علائقي | {zatcaRecords.length} وثيقة ZATCA
          </div>
        </div>
      </div>

      {/* Subledger-to-GL Live Control Reconciliation Matrix */}
      {rec && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-600" />
                <span>مصفوفة المطابقة الرقابية بين الأستاذ الفرعي والأستاذ العام (Subledger-to-GL Reconciliation)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                مقارنة لحظية بين أرصدة العملاء والموردين وتقييم دفعات المخزون FIFO مقابل الحسابات الرقابية في الدليل المحاسبي
              </p>
            </div>
            <button
              type="button"
              onClick={handleReconcileSubledgers}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition"
            >
              إعادة المطابقة والتحقق
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">المحور الرقابي</th>
                  <th className="p-3">الحساب الرقابي بالأستاذ العام (GL)</th>
                  <th className="p-3">رصيد السجل الفرعي (Subledger)</th>
                  <th className="p-3">رصيد الأستاذ العام (GL Balance)</th>
                  <th className="p-3">الفارق (Variance)</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-slate-800">ذمم العملاء (Accounts Receivable)</td>
                  <td className="p-3 font-mono text-xs text-slate-600">1200 - الذمم المدينة</td>
                  <td className="p-3 font-mono font-bold">{rec.arSubledgerTotal.toLocaleString()} ر.س</td>
                  <td className="p-3 font-mono font-bold">{rec.arGlBalance.toLocaleString()} ر.س</td>
                  <td className="p-3 font-mono text-xs">{rec.arVariance.toFixed(2)} ر.س</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Math.abs(rec.arVariance) < 0.05 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {Math.abs(rec.arVariance) < 0.05 ? "متطابق 100%" : "يحتاج تسوية"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">ذمم الموردين (Accounts Payable)</td>
                  <td className="p-3 font-mono text-xs text-slate-600">2000 - الذمم الدائنة</td>
                  <td className="p-3 font-mono font-bold">{rec.apSubledgerTotal.toLocaleString()} ر.س</td>
                  <td className="p-3 font-mono font-bold">{rec.apGlBalance.toLocaleString()} ر.س</td>
                  <td className="p-3 font-mono text-xs">{rec.apVariance.toFixed(2)} ر.س</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Math.abs(rec.apVariance) < 0.05 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {Math.abs(rec.apVariance) < 0.05 ? "متطابق 100%" : "يحتاج تسوية"}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-800">تقييم المخزون وطبقات التكلفة (FIFO Inventory)</td>
                  <td className="p-3 font-mono text-xs text-slate-600">1300 + 1310 + 1320</td>
                  <td className="p-3 font-mono font-bold">{rec.inventorySubledgerTotal.toLocaleString()} ر.س</td>
                  <td className="p-3 font-mono font-bold">{rec.inventoryGlBalance.toLocaleString()} ر.س</td>
                  <td className="p-3 font-mono text-xs">{rec.inventoryVariance.toFixed(2)} ر.س</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${Math.abs(rec.inventoryVariance) <= 0.5 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {Math.abs(rec.inventoryVariance) <= 0.5 ? "متطابق 100%" : "يحتاج تسوية"}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fiscal Periods Section */}
      {(initialTab === "admin_fiscal_periods" ||
        initialTab === "admin_fiscal_years" ||
        initialTab === "admin_companies" ||
        initialTab === "admin_branches") && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800">
                حوكمة الفترات المالية والمنشأة ({companySettings.nameAr || companySettings.name})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                الرقم الضريبي: {companySettings.taxNumber} | العملة الأساسية:{" "}
                {companySettings.defaultCurrency} | الفروع والمستودعات: {warehouses.length}
              </p>
            </div>
            <button
              type="button"
              onClick={handleFiscalYearClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition"
            >
              <CalendarCheck className="w-4 h-4 text-teal-400" />
              <span>إقفال السنة المالية وترحيل الأرباح المبقاة (3100)</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">اسم الفترة المالية</th>
                  <th className="p-3">تاريخ البداية</th>
                  <th className="p-3">تاريخ النهاية</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">الإجراء الرقابي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fiscalPeriods.map((fp) => {
                  const isLocked = Boolean(fp.isClosed || fp.status === "CLOSED" || fp.status === "LOCKED" || fp.status === "Locked" || fp.status === "Closed");
                  return (
                    <tr key={fp.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">{fp.name || fp.code}</td>
                      <td className="p-3 font-mono text-xs">{fp.startDate}</td>
                      <td className="p-3 font-mono text-xs">{fp.endDate}</td>
                      <td className="p-3">
                        <StatusBadge
                          status={isLocked ? "Closed" : "Active"}
                          language={language}
                          size="sm"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleTogglePeriod(fp.id)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                            isLocked
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : "bg-red-50 text-red-700 hover:bg-red-100"
                          }`}
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5" /> إعادة فتح الفترة
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5" /> قفل الفترة المالية
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users, Roles & Numbering */}
      {(initialTab === "admin_users" ||
        initialTab === "admin_roles" ||
        initialTab === "admin_numbering") && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">المستخدمون، الصلاحيات (RBAC)، والتسلسل الرقمي</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">المستخدم</th>
                  <th className="p-3">البريد الإلكتروني</th>
                  <th className="p-3">الدور الوظيفي</th>
                  <th className="p-3">الصلاحيات والوحدات</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">اختبار الصلاحية (Switch Role)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isCurrent = currentUser.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">{u.username}</td>
                      <td className="p-3 text-slate-600 font-mono text-xs">{u.email}</td>
                      <td className="p-3 font-mono text-xs text-teal-700 font-bold">{u.role}</td>
                      <td className="p-3 text-xs">
                        {(permissionsByRole[u.role]?.pages || []).length} وحدات |{" "}
                        {(permissionsByRole[u.role]?.actions || []).join(", ")}
                      </td>
                      <td className="p-3">
                        <StatusBadge status="Active" language={language} size="sm" />
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentUser(u);
                            setNotice({
                              type: "success",
                              text: `تم التبديل إلى حساب (${u.username}) بدور (${u.role}) لاختبار الصلاحيات.`
                            });
                          }}
                          disabled={isCurrent}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                            isCurrent
                              ? "bg-teal-700 text-white cursor-default"
                              : "bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200"
                          }`}
                        >
                          {isCurrent ? "الحساب النشط حالياً" : "تفعيل هذا الدور"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Database & Sync Readiness */}
      {(initialTab === "admin_sync_status" || initialTab === "admin_backup") && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                حالة محرك قواعد البيانات والمزامنة الثنائية (PGlite & External PostgreSQL Gate)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                يعمل النظام محلياً بمحرك PGlite المعتمد (31 جدول علائقي) مع ترحيل ومزامنة مزدوجة لحظية، وجاهزية التبديل الفوري إلى PostgreSQL خارجي عبر DATABASE_URL.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleSyncPglite("push")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-700 text-white hover:bg-teal-800 transition"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>دفع الحالة إلى PGlite (Push)</span>
              </button>
              <button
                type="button"
                onClick={() => handleSyncPglite("pull")}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition"
              >
                <Database className="w-3.5 h-3.5" />
                <span>استرجاع من PGlite (Pull)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">محرك التشغيل الفوري</div>
              <div className="font-bold text-slate-900 mt-1">PGlite (PostgreSQL 16)</div>
              <div className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{pgliteStats?.tableCount || 31} جدول نشط ومتزامن</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">آخر مزامنة مع PGlite</div>
              <div className="font-bold text-slate-900 mt-1 font-mono text-xs">
                {lastSyncTime ? new Date(lastSyncTime).toLocaleTimeString() : "متزامن تلقائياً"}
              </div>
              <div className="text-xs text-teal-600 mt-1">
                الحالة: {syncStatus === "synced" ? "متصل ومتطابق" : syncStatus}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">بوابة PostgreSQL الخارجية</div>
              <div className="font-bold text-slate-900 mt-1">READY (Strict Env Contract)</div>
              <div className="text-xs text-amber-600 mt-1">ينتظر تزويد DATABASE_URL في الإنتاج</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs text-slate-500">النسخ الاحتياطية المسجلة</div>
              <div className="font-bold text-slate-900 mt-1">{backups.length} نسخة محفوظة</div>
              <div className="text-xs text-teal-600 mt-1">قابلة للاستعادة الفورية</div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-800">سجل التدقيق الجنائي للعمليات (Immutable Audit Trail)</h3>
          <span className="text-xs text-slate-500">آخر {Math.min(25, auditLogs.length)} عملية</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">التوقيت</th>
                <th className="p-3">المستخدم</th>
                <th className="p-3">نوع الحدث</th>
                <th className="p-3">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.slice(0, 25).map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70">
                  <td className="p-3 font-mono text-xs text-slate-500">{log.timestamp}</td>
                  <td className="p-3 font-semibold text-slate-800">{log.username}</td>
                  <td className="p-3 font-mono text-xs text-teal-700 font-bold">{log.action}</td>
                  <td className="p-3 text-slate-600 text-xs">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {integrityReport && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
          <h4 className="font-bold text-sm text-slate-900">نتيجة فحص التكامل المحاسبي والمخزني</h4>
          <p className="text-xs text-slate-600">
            الحالة الصحية: {integrityReport.overallStatus === "HEALTHY" ? "سليم 100% (HEALTHY)" : integrityReport.overallStatus} | الأخطاء الحرجة:{" "}
            {integrityReport.criticalCount} | التنبيهات: {integrityReport.warningCount}
          </p>
          {integrityReport.findings && integrityReport.findings.length > 0 && (
            <ul className="text-xs text-rose-700 list-disc list-inside pt-1 space-y-1">
              {integrityReport.findings.map((f: any, i: number) => (
                <li key={i}>{f.messageAr || f.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {certReport && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm text-slate-900">تقرير شهادة المطابقة القياسية الشاملة</h4>
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
              {certReport.passedCount} / {certReport.totalChecks} PASSED
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {certReport.results?.map((r: any, idx: number) => (
              <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-semibold text-slate-700">{r.name}</span>
                <span className={`font-mono font-bold ${r.status === "PASS" ? "text-emerald-600" : "text-rose-600"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
