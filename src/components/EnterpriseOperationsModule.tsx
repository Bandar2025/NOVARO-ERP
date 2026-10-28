import React, { useState } from "react";
import {
  Users,
  Briefcase,
  Target,
  DollarSign,
  Plus,
  CheckCircle2,
  FolderKanban,
  Award,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { useAppState } from "../context/StateContext";
import { CrmLead, Employee } from "../types";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import StatusBadge from "./common/StatusBadge";

interface EnterpriseOperationsModuleProps {
  initialTab?:
    | "crm_leads"
    | "crm_opportunities"
    | "crm_activities"
    | "projects"
    | "cost_centers"
    | "hr_employees"
    | "hr_attendance"
    | "hr_leave"
    | "hr_payroll";
  language?: "ar" | "en";
}

export default function EnterpriseOperationsModule({
  initialTab = "crm_leads",
  language = "ar",
}: EnterpriseOperationsModuleProps) {
  const isAr = language === "ar";
  const {
    crmLeads,
    costCenters,
    employees,
    payrollRuns,
    addCrmLead,
    updateCrmLeadStage,
    addCostCenter,
    addEmployee,
    processPayrollRun,
    journalEntries,
  } = useAppState();

  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // CRM State
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadCompany, setLeadCompany] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadValue, setLeadValue] = useState("25000");
  const [leadNotes, setLeadNotes] = useState("");

  // Cost Center State
  const [showCCModal, setShowCCModal] = useState(false);
  const [ccCode, setCcCode] = useState("");
  const [ccName, setCcName] = useState("");
  const [ccManager, setCcManager] = useState("");
  const [ccDepartment, setCcDepartment] = useState("الإنتاج والتحميص");
  const [ccBudget, setCcBudget] = useState("150000");

  // HR Employee State
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empCode, setEmpCode] = useState("");
  const [empName, setEmpName] = useState("");
  const [empRole, setEmpRole] = useState("");
  const [empDept, setEmpDept] = useState<Employee["department"]>("Roastery");
  const [empBasic, setEmpBasic] = useState("6000");
  const [empHousing, setEmpHousing] = useState("1500");
  const [empTransport, setEmpTransport] = useState("500");

  // Payroll State
  const [payrollMonth, setPayrollMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank">("Bank");

  const isCrmMode = initialTab.startsWith("crm_");
  const isProjectMode = initialTab === "projects" || initialTab === "cost_centers";
  const isHrMode = initialTab.startsWith("hr_");

  const handleCreateLead = (e: React.FormEvent) => {
    e.preventDefault();
    addCrmLead({
      companyName: leadCompany,
      contactPerson: leadContact,
      phone: leadPhone,
      email: leadEmail,
      expectedValue: Number(leadValue) || 0,
      stage: "New",
      notes: leadNotes,
      assignedTo: "فريق مبيعات الشركات",
      nextFollowUp: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    });
    setNotice({ type: "success", text: "تمت إضافة العميل المحتمل والفرصة البيعية بنجاح." });
    setShowLeadModal(false);
    setLeadCompany("");
    setLeadContact("");
    setLeadPhone("");
    setLeadEmail("");
    setLeadNotes("");
  };

  const handleCreateCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    addCostCenter({
      code: ccCode,
      name: ccName,
      nameAr: ccName,
      manager: ccManager || "إدارة العمليات",
      budgetAllocated: Number(ccBudget) || 0,
      actualSpent: 0,
      department: ccDepartment,
      status: "Active",
    });
    setNotice({ type: "success", text: "تم إنشاء مركز التكلفة والمشروع بنجاح." });
    setShowCCModal(false);
    setCcCode("");
    setCcName("");
    setCcManager("");
  };

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    addEmployee({
      code: empCode,
      name: empName,
      nameAr: empName,
      roleTitle: empRole,
      department: empDept,
      joinDate: new Date().toISOString().split("T")[0],
      basicSalary: Number(empBasic) || 0,
      housingAllowance: Number(empHousing) || 0,
      transportAllowance: Number(empTransport) || 0,
      status: "Active",
    });
    setNotice({ type: "success", text: "تم تسجيل الموظف في سجل الموارد البشرية." });
    setShowEmpModal(false);
    setEmpCode("");
    setEmpName("");
    setEmpRole("");
  };

  const handleRunPayroll = () => {
    const res = processPayrollRun(payrollMonth, paymentMethod);
    if (res.success) {
      setNotice({
        type: "success",
        text: `تم اعتماد وصرف مسير رواتب شهر ${payrollMonth} وترحيل قيد اليومية المزدوج للرواتب والأجور بنجاح.`,
      });
    } else {
      setNotice({ type: "error", text: res.error || "تعذر صرف مسير الرواتب" });
    }
  };

  const pipelineTotal = crmLeads.reduce((s, l) => s + l.expectedValue, 0);
  const wonTotal = crmLeads
    .filter((l) => l.stage === "Won")
    .reduce((s, l) => s + l.expectedValue, 0);

  const totalMonthlyPayroll = employees
    .filter((e) => e.status === "Active")
    .reduce(
      (s, e) => s + e.basicSalary + e.housingAllowance + e.transportAllowance,
      0
    );

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          isCrmMode
            ? "إدارة علاقات العملاء والفرص البيعية (CRM)"
            : isProjectMode
            ? "المشاريع ومراكز التكلفة (Projects & Cost Centers)"
            : "الموارد البشرية ومسيرات الرواتب (HR & Payroll)"
        }
        description={
          isCrmMode
            ? "متابعة العملاء المحتملين، مراحل التفاوض، وتحويل الفرص البيعية إلى عقود"
            : isProjectMode
            ? "الرقابة على الموازنات التقديرية والتكاليف الفعلية لكل فرع أو خط إنتاج"
            : "إدارة شؤون الموظفين، البدلات، الحضور، واعتماد مسير الرواتب مع القيد المحاسبي الآلي"
        }
        icon={isCrmMode ? Target : isProjectMode ? FolderKanban : Users}
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

      {isCrmMode && (
        <>
          <GlobalActionBar
            onNew={() => setShowLeadModal(true)}
            newLabelAr="إضافة عميل محتمل / فرصة بيعية"
            newLabelEn="Add Sales Lead"
            totalCount={crmLeads.length}
            language={language}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>إجمالي الفرص البيعية</span>
                <Target className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">
                {pipelineTotal.toLocaleString()} ر.س
              </div>
              <div className="text-xs text-slate-500 mt-1">{crmLeads.length} فرصة مسجلة</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>الفرص المكتسبة (Won)</span>
                <Award className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 mt-2">
                {wonTotal.toLocaleString()} ر.س
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {crmLeads.filter((l) => l.stage === "Won").length} عقود مغلقة
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>قيد التفاوض والعروض</span>
                <TrendingUp className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-700 mt-2">
                {
                  crmLeads.filter(
                    (l) =>
                      l.stage === "Proposal" ||
                      l.stage === "Qualified" ||
                      l.stage === "Negotiation"
                  ).length
                }
              </div>
              <div className="text-xs text-slate-500 mt-1">فرص نشطة عالية الاحتمال</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">سجل العملاء المحتملين ومراحل المبيعات</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">المنشأة / العميل</th>
                    <th className="p-3">مسؤول التواصل</th>
                    <th className="p-3">الجوال / البريد</th>
                    <th className="p-3">القيمة المتوقعة</th>
                    <th className="p-3">المرحلة</th>
                    <th className="p-3">ملاحظات المتابعة</th>
                    <th className="p-3">تحديث المرحلة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {crmLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-50/70">
                      <td className="p-3 font-bold text-slate-900">{lead.companyName}</td>
                      <td className="p-3 text-slate-700">{lead.contactPerson}</td>
                      <td className="p-3 text-xs text-slate-500">
                        <div>{lead.phone}</div>
                        <div>{lead.email}</div>
                      </td>
                      <td className="p-3 font-semibold text-teal-700 font-mono">
                        {lead.expectedValue.toLocaleString()} ر.س
                      </td>
                      <td className="p-3">
                        <StatusBadge
                          status={lead.stage === "Won" ? "Completed" : "InProgress"}
                          language={language}
                          size="sm"
                        />
                      </td>
                      <td className="p-3 text-slate-600 text-xs">{lead.notes}</td>
                      <td className="p-3">
                        <select
                          value={lead.stage}
                          onChange={(e) =>
                            updateCrmLeadStage(
                              lead.id,
                              e.target.value as CrmLead["stage"]
                            )
                          }
                          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white"
                        >
                          <option value="New">جديد (New)</option>
                          <option value="Qualified">مؤهل (Qualified)</option>
                          <option value="Proposal">عرض سعر (Proposal)</option>
                          <option value="Negotiation">تفاوض (Negotiation)</option>
                          <option value="Won">مكتسب (Won)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isProjectMode && (
        <>
          <GlobalActionBar
            onNew={() => setShowCCModal(true)}
            newLabelAr="إضافة مركز تكلفة / مشروع"
            newLabelEn="Add Cost Center"
            totalCount={costCenters.length}
            language={language}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>إجمالي الموازنات المعتمدة</span>
                <FolderKanban className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">
                {costCenters.reduce((s, c) => s + c.budgetAllocated, 0).toLocaleString()} ر.س
              </div>
              <div className="text-xs text-slate-500 mt-1">{costCenters.length} مراكز تكلفة نشطة</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>الإنفاق الفعلي المتراكم</span>
                <DollarSign className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-700 mt-2">
                {costCenters.reduce((s, c) => s + c.actualSpent, 0).toLocaleString()} ر.س
              </div>
              <div className="text-xs text-slate-500 mt-1">مرتبط بقيود التشغيل والمصروفات</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>الرصيد المتبقي من الموازنة</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 mt-2">
                {costCenters
                  .reduce((s, c) => s + (c.budgetAllocated - c.actualSpent), 0)
                  .toLocaleString()}{" "}
                ر.س
              </div>
              <div className="text-xs text-slate-500 mt-1">ضمن السقف الائتماني للمشاريع</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">مراكز التكلفة والمشاريع التشغيلية</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الكود</th>
                    <th className="p-3">اسم مركز التكلفة / المشروع</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">المدير المسؤول</th>
                    <th className="p-3">الموازنة المعتمدة</th>
                    <th className="p-3">التكلفة الفعلية</th>
                    <th className="p-3">نسبة الاستهلاك</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {costCenters.map((cc) => {
                    const ratio =
                      cc.budgetAllocated > 0
                        ? Math.round((cc.actualSpent / cc.budgetAllocated) * 100)
                        : 0;
                    return (
                      <tr key={cc.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono text-xs font-bold text-teal-700">{cc.code}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {isAr ? cc.nameAr : cc.name}
                        </td>
                        <td className="p-3 text-slate-600 text-xs">{cc.department}</td>
                        <td className="p-3 text-slate-600">{cc.manager}</td>
                        <td className="p-3 font-semibold font-mono">
                          {cc.budgetAllocated.toLocaleString()} ر.س
                        </td>
                        <td className="p-3 font-semibold text-amber-700 font-mono">
                          {cc.actualSpent.toLocaleString()} ر.س
                        </td>
                        <td className="p-3">
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${
                                ratio > 90
                                  ? "bg-red-500"
                                  : ratio > 70
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${Math.min(100, ratio)}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{ratio}%</span>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={cc.status} language={language} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {isHrMode && (
        <>
          <GlobalActionBar
            onNew={() => setShowEmpModal(true)}
            newLabelAr="إضافة موظف جديد"
            newLabelEn="Add Employee"
            totalCount={employees.length}
            extraActions={[
              {
                id: "run-payroll",
                labelAr: `اعتماد وصرف رواتب (${payrollMonth})`,
                labelEn: `Process Payroll (${payrollMonth})`,
                icon: DollarSign,
                variant: "success",
                onClick: handleRunPayroll,
              },
            ]}
            language={language}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>إجمالي القوى العاملة</span>
                <Users className="w-4 h-4 text-teal-600" />
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">
                {employees.filter((e) => e.status === "Active").length} موظف
              </div>
              <div className="text-xs text-slate-500 mt-1">على رأس العمل</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>كتلة الرواتب والبدلات الشهرية</span>
                <Briefcase className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 mt-2">
                {totalMonthlyPayroll.toLocaleString()} ر.س
              </div>
              <div className="text-xs text-slate-500 mt-1">شامل الأساسي والسكن والنقل</div>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span>مسيرات الرواتب المرحلة</span>
                <Calendar className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xl font-black text-amber-700 mt-2">
                {payrollRuns.length} مسير
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {journalEntries.filter((j) => j.description.includes("رواتب") || j.description.includes("Payroll")).length} قيد يومية مرحل
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-700">شهر المسير:</label>
              <input
                type="month"
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(e.target.value)}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono"
              />
              <label className="text-xs font-bold text-slate-700 mr-2">طريقة الصرف:</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as "Cash" | "Bank")}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs bg-white"
              >
                <option value="Bank">تحويل بنكي (مدد / WPS)</option>
                <option value="Cash">صرف نقدي من الخزينة</option>
              </select>
            </div>
            <div className="text-xs text-slate-500">
              عند اعتماد المسير يتم إنشاء قيد محاسبي آلي: من حـ/ الرواتب والأجور إلى حـ/ البنك أو الصندوق.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800">سجل الموظفين والهيكل الوظيفي</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">الرقم الوظيفي</th>
                    <th className="p-3">الاسم</th>
                    <th className="p-3">المسمى الوظيفي</th>
                    <th className="p-3">القسم</th>
                    <th className="p-3">الراتب الأساسي</th>
                    <th className="p-3">بدل السكن</th>
                    <th className="p-3">بدل النقل</th>
                    <th className="p-3">إجمالي المستحق</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.map((emp) => {
                    const net =
                      emp.basicSalary + emp.housingAllowance + emp.transportAllowance;
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-mono text-xs font-bold text-teal-700">{emp.code}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {isAr ? emp.nameAr : emp.name}
                        </td>
                        <td className="p-3 text-slate-700">{emp.roleTitle}</td>
                        <td className="p-3 text-slate-600 text-xs">{emp.department}</td>
                        <td className="p-3 font-mono">{emp.basicSalary.toLocaleString()} ر.س</td>
                        <td className="p-3 font-mono">{emp.housingAllowance.toLocaleString()} ر.س</td>
                        <td className="p-3 font-mono">{emp.transportAllowance.toLocaleString()} ر.س</td>
                        <td className="p-3 font-bold text-emerald-700 font-mono">
                          {net.toLocaleString()} ر.س
                        </td>
                        <td className="p-3">
                          <StatusBadge status={emp.status} language={language} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {payrollRuns.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">سجل مسيرات الرواتب المعتمدة</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">الشهر</th>
                      <th className="p-3">تاريخ الصرف</th>
                      <th className="p-3">عدد الموظفين</th>
                      <th className="p-3">إجمالي الأساسي</th>
                      <th className="p-3">إجمالي البدلات</th>
                      <th className="p-3">صافي المسير المصروف</th>
                      <th className="p-3">طريقة الدفع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payrollRuns.map((pr) => (
                      <tr key={pr.id} className="hover:bg-slate-50/70">
                        <td className="p-3 font-bold text-teal-700 font-mono">{pr.periodMonth}</td>
                        <td className="p-3 text-slate-600 font-mono">{pr.runDate}</td>
                        <td className="p-3 font-mono">{pr.employeeCount}</td>
                        <td className="p-3 font-mono">{pr.totalBasic.toLocaleString()} ر.س</td>
                        <td className="p-3 font-mono">{pr.totalAllowances.toLocaleString()} ر.س</td>
                        <td className="p-3 font-bold text-emerald-700 font-mono">
                          {pr.netPayable.toLocaleString()} ر.س
                        </td>
                        <td className="p-3">
                          {pr.paymentMethod === "Bank" ? "تحويل بنكي" : "نقدي"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal: New Lead */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateLead}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900">إضافة فرصة بيعية / عميل محتمل</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">اسم المنشأة</label>
              <input
                required
                value={leadCompany}
                onChange={(e) => setLeadCompany(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">الشخص المسؤول</label>
              <input
                required
                value={leadContact}
                onChange={(e) => setLeadContact(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">رقم الجوال</label>
                <input
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">القيمة المتوقعة (ر.س)</label>
                <input
                  type="number"
                  value={leadValue}
                  onChange={(e) => setLeadValue(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">ملاحظات</label>
              <input
                value={leadNotes}
                onChange={(e) => setLeadNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLeadModal(false)}
                className="px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 text-white rounded-xl text-sm font-semibold"
              >
                حفظ الفرصة
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Cost Center */}
      {showCCModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateCostCenter}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900">تعريف مركز تكلفة / مشروع جديد</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">كود المركز</label>
                <input
                  required
                  placeholder="CC-400"
                  value={ccCode}
                  onChange={(e) => setCcCode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الموازنة (ر.س)</label>
                <input
                  type="number"
                  required
                  value={ccBudget}
                  onChange={(e) => setCcBudget(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">اسم مركز التكلفة</label>
              <input
                required
                value={ccName}
                onChange={(e) => setCcName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المدير المسؤول</label>
              <input
                value={ccManager}
                onChange={(e) => setCcManager(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCCModal(false)}
                className="px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 text-white rounded-xl text-sm font-semibold"
              >
                حفظ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: New Employee */}
      {showEmpModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateEmployee}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900">إضافة موظف جديد</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الرقم الوظيفي</label>
                <input
                  required
                  placeholder="EMP-105"
                  value={empCode}
                  onChange={(e) => setEmpCode(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">القسم</label>
                <select
                  value={empDept}
                  onChange={(e) => setEmpDept(e.target.value as Employee["department"])}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
                >
                  <option value="Roastery">التحميص (Roastery)</option>
                  <option value="Grinding">الطحن (Grinding)</option>
                  <option value="Packaging">التعبئة (Packaging)</option>
                  <option value="Sales">المبيعات (Sales)</option>
                  <option value="Accounting">المحاسبة (Accounting)</option>
                  <option value="Management">الإدارة (Management)</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">اسم الموظف</label>
              <input
                required
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">المسمى الوظيفي</label>
              <input
                required
                value={empRole}
                onChange={(e) => setEmpRole(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">الأساسي</label>
                <input
                  type="number"
                  value={empBasic}
                  onChange={(e) => setEmpBasic(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">السكن</label>
                <input
                  type="number"
                  value={empHousing}
                  onChange={(e) => setEmpHousing(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">النقل</label>
                <input
                  type="number"
                  value={empTransport}
                  onChange={(e) => setEmpTransport(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-2 py-1.5 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmpModal(false)}
                className="px-4 py-2 text-sm text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 text-white rounded-xl text-sm font-semibold"
              >
                حفظ الموظف
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
