import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { 
  FileText, Flame, Layers2, Landmark, ShieldCheck, Printer, CheckCircle, AlertTriangle, Scale, Calculator
} from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import { TrialBalanceRow } from "../core/application/accounting/AccountingEngine";

interface ReportsModuleProps {
  language?: "ar" | "en";
}

export default function ReportsModule({ language = "ar" }: ReportsModuleProps) {
  const isAr = language === "ar";
  const { 
    roastingJobs, grindingJobs, roasteryExpenses, grindingExpenses,
    getTrialBalance, getIncomeStatement, getBalanceSheet, runMasterCertification, runDataIntegrityAudit
  } = useAppState();

  const [activeReport, setActiveReport] = useState<"unified" | "trial_balance" | "balance_sheet" | "roastery" | "grinding" | "certification">("unified");
  const [certReport, setCertReport] = useState(() => runMasterCertification());
  const [integrityReport, setIntegrityReport] = useState(() => runDataIntegrityAudit());

  // --- STRICT LEDGER-DERIVED FINANCIAL RESULTS (NO HARDCODED ESTIMATIONS) ---
  const incomeStatement = getIncomeStatement();
  const balanceSheet = getBalanceSheet();
  const trialBalance = getTrialBalance();

  // --- 2. CALCULATIONS FOR ROASTERY REPORT ---
  const totalRoastedKg = roastingJobs.reduce((sum, j) => sum + (j.roastedQty || j.outputQuantity || 0), 0);
  const totalGreenBeansUsedKg = roastingJobs.reduce((sum, j) => sum + (j.greenQty || j.inputQuantity || 0), 0);
  const directRoasteryExpenses = roasteryExpenses.reduce((sum, e) => sum + e.amount, 0);
  const roasteryFuelExpenses = roasteryExpenses.filter(e => e.type === "شراء وقود غاز").reduce((sum, e) => sum + e.amount, 0);
  const roasteryLaborExpenses = roasteryExpenses.filter(e => e.type === "أجور عمال تشغيل").reduce((sum, e) => sum + e.amount, 0);
  const roasteryMaintenance = roasteryExpenses.filter(e => e.type === "صيانة دورية لمحمص").reduce((sum, e) => sum + e.amount, 0);

  const lossRatio = totalGreenBeansUsedKg > 0 
    ? (((totalGreenBeansUsedKg - totalRoastedKg) / totalGreenBeansUsedKg) * 100).toFixed(1)
    : "16.2";

  const roastingCostPerKg = totalRoastedKg > 0
    ? ((directRoasteryExpenses) / totalRoastedKg).toFixed(2)
    : "0.00";

  // --- 3. CALCULATIONS FOR GRINDING REPORT ---
  const totalGroundKg = grindingJobs.reduce((sum, j) => sum + (j.groundQty || j.outputQuantity || 0), 0);
  const directGrindingExpenses = grindingExpenses.reduce((sum, e) => sum + e.amount, 0);
  const grindingPower = grindingExpenses.filter(e => e.type === "استهلاك طاقة كهربائية").reduce((sum, e) => sum + e.amount, 0);
  const grindingLabor = grindingExpenses.filter(e => e.type === "أجور عمال تشغيل").reduce((sum, e) => sum + e.amount, 0);
  const grindingBlades = grindingExpenses.filter(e => e.type === "صيانة شفرات طحن").reduce((sum, e) => sum + e.amount, 0);

  const grindingCostPerKg = totalGroundKg > 0
    ? (directGrindingExpenses / totalGroundKg).toFixed(2)
    : "0.00";

  const handlePrint = () => {
    window.print();
  };

  const handleRunAudit = () => {
    setCertReport(runMasterCertification());
    setIntegrityReport(runDataIntegrityAudit());
  };

  const trialBalanceColumns: ColumnDef[] = [
    {
      key: "accountCode",
      header: isAr ? "رمز الحساب" : "Account Code",
      render: (_val, row: TrialBalanceRow) => <span className="font-mono font-bold text-slate-700">{row.accountCode}</span>
    },
    {
      key: "accountName",
      header: isAr ? "اسم الحساب" : "Account Name",
      render: (_val, row: TrialBalanceRow) => (
        <div>
          <div className="font-bold text-slate-900">{isAr ? row.accountNameAr : row.accountName}</div>
          <div className="text-[11px] text-slate-400 font-mono">{row.type}</div>
        </div>
      )
    },
    {
      key: "debitTotal",
      header: isAr ? "مجموع المدين" : "Debit Total",
      render: (_val, row: TrialBalanceRow) => (
        <span className="font-mono text-slate-700">
          {row.debitTotal > 0 ? `SAR ${row.debitTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
        </span>
      )
    },
    {
      key: "creditTotal",
      header: isAr ? "مجموع الدائن" : "Credit Total",
      render: (_val, row: TrialBalanceRow) => (
        <span className="font-mono text-slate-700">
          {row.creditTotal > 0 ? `SAR ${row.creditTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
        </span>
      )
    },
    {
      key: "balanceDebit",
      header: isAr ? "رصيد مدين" : "Balance Debit",
      render: (_val, row: TrialBalanceRow) => (
        <span className={`font-mono font-bold ${row.balanceDebit > 0 ? "text-teal-700" : "text-slate-400"}`}>
          {row.balanceDebit > 0 ? `SAR ${row.balanceDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
        </span>
      )
    },
    {
      key: "balanceCredit",
      header: isAr ? "رصيد دائن" : "Balance Credit",
      render: (_val, row: TrialBalanceRow) => (
        <span className={`font-mono font-bold ${row.balanceCredit > 0 ? "text-indigo-700" : "text-slate-400"}`}>
          {row.balanceCredit > 0 ? `SAR ${row.balanceCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "-"}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-teal-700 tracking-wider font-mono">
            {isAr ? "الحسابات الختامية المعمدة والمصدقة دفتر القيود" : "CERTIFIED AUDITED FINANCIAL STATEMENTS"}
          </span>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-teal-700" />
            {isAr ? "التقارير المحاسبية والمالية" : "Accounting Reports"}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunAudit}
            className="px-4 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs rounded-xl transition flex items-center gap-2 border border-teal-200"
          >
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span>{isAr ? "فحص السلامة المحاسبية" : "Audit Invariants"}</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-3 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs"
          >
            <Printer className="w-5 h-5" />
            <span>{isAr ? "طباعة التقرير" : "Print Report"}</span>
          </button>
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-slate-100 p-2 rounded-2xl">
        <button
          onClick={() => setActiveReport("unified")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "unified" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "قائمة الدخل الموحدة" : "Income Statement"}
        </button>

        <button
          onClick={() => setActiveReport("trial_balance")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "trial_balance" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "ميزان المراجعة" : "Trial Balance"}
        </button>

        <button
          onClick={() => setActiveReport("balance_sheet")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "balance_sheet" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "الميزانية العمومية" : "Balance Sheet"}
        </button>

        <button
          onClick={() => setActiveReport("roastery")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "roastery" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "أرباح قسم المحمصة" : "Roastery Report"}
        </button>

        <button
          onClick={() => setActiveReport("grinding")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "grinding" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "أرباح قسم الطاحونة" : "Grinding Report"}
        </button>

        <button
          onClick={() => setActiveReport("certification")}
          className={`py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 ${
            activeReport === "certification" ? "bg-slate-900 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          {isAr ? "شهادة الاعتماد" : "Certification"}
        </button>
      </div>

      {/* Print Frame wrapper */}
      <div id="print-area" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* 1. Unified P&L Report Tab - Strictly Derived from Accounting Ledger */}
        {activeReport === "unified" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">
                    {isAr ? "قائمة الأرباح والخسائر الموحدة (مستخرجة من دفتر الأستاذ العام)" : "Certified Income Statement (From General Ledger)"}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {isAr 
                      ? "جميع الأرقام مستخرجة بدقة متناهية من قيود اليومية المعمدة والمرحلة بدون نسب تقديرية." 
                      : "Strictly derived from posted double-entry journal vouchers in accordance with standard accounting rules."}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isAr ? "معتمد محاسبياً" : "Ledger Backed"}
                </span>
              </div>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "إجمالي الإيرادات" : "Total Revenue"}</span>
                <span className="text-base font-black text-slate-900 mt-1">
                  SAR {incomeStatement.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "تكلفة البضاعة المباعة (COGS)" : "Cost of Goods Sold"}</span>
                <span className="text-base font-black text-rose-600 mt-1">
                  SAR {incomeStatement.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "مجمل الربح (الهامش)" : "Gross Profit (Margin)"}</span>
                <span className="text-base font-black text-teal-700 mt-1">
                  SAR {incomeStatement.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({incomeStatement.grossMarginPct}%)
                </span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">{isAr ? "صافي الربح التشغيلي" : "Net Income"}</span>
                <span className="text-lg font-black text-emerald-700 mt-1">
                  SAR {incomeStatement.netIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Breakdown by Ledger Line Items */}
            <div className="space-y-4 text-xs">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>{isAr ? "1. الإيرادات التشغيلية (حسابات الإيراد)" : "1. Operating Revenues"}</span>
                  <span className="font-mono font-bold text-slate-900">
                    SAR {incomeStatement.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </h3>
                <div className="space-y-2 mt-3">
                  {incomeStatement.revenues.map(rev => (
                    <div key={rev.accountId} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="font-bold text-slate-700">{isAr ? rev.nameAr : rev.name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        SAR {rev.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {incomeStatement.revenues.length === 0 && (
                    <div className="p-3 text-center text-slate-400 font-medium">
                      {isAr ? "لا توجد حركات إيراد مسجلة حتى الآن." : "No revenue records posted."}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between mt-5">
                  <span>{isAr ? "2. تكلفة المبيعات (حسابات التكلفة)" : "2. Cost of Sales"}</span>
                  <span className="font-mono font-bold text-rose-600">
                    SAR {incomeStatement.totalCOGS.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </h3>
                <div className="space-y-2 mt-3">
                  {incomeStatement.cogs.map(c => (
                    <div key={c.accountId} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="font-bold text-slate-700">{isAr ? c.nameAr : c.name}</span>
                      <span className="font-mono font-bold text-rose-600">
                        SAR {c.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {incomeStatement.cogs.length === 0 && (
                    <div className="p-3 text-center text-slate-400 font-medium">
                      {isAr ? "لا توجد حركات تكلفة مسجلة حتى الآن." : "No cost records posted."}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between mt-5">
                  <span>{isAr ? "3. المصروفات التشغيلية والعمومية" : "3. Operating & Administrative Expenses"}</span>
                  <span className="font-mono font-bold text-rose-600">
                    SAR {incomeStatement.totalOperatingExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </h3>
                <div className="space-y-2 mt-3">
                  {incomeStatement.expenses.map(e => (
                    <div key={e.accountId} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                      <span className="font-bold text-slate-700">{isAr ? e.nameAr : e.name}</span>
                      <span className="font-mono font-bold text-rose-600">
                        SAR {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  {incomeStatement.expenses.length === 0 && (
                    <div className="p-3 text-center text-slate-400 font-medium">
                      {isAr ? "لا توجد مصروفات مسجلة." : "No operating expenses posted."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Trial Balance Tab */}
        {activeReport === "trial_balance" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Scale className="w-6 h-6 text-teal-700" />
                  {isAr ? "ميزان المراجعة بالأرصدة والمجاميع" : "Certified Trial Balance (Debit = Credit)"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr 
                    ? "تطابق إجمالي المدين مع إجمالي الدائن بنسبة انعدام الخطأ الصفرية (Zero-Tolerance Invariant)." 
                    : "Zero-tolerance balance between total debits and credits derived from posted journal entries."}
                </p>
              </div>

              <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                trialBalance.isBalanced ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {trialBalance.isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {trialBalance.isBalanced 
                    ? (isAr ? "الميزان متوازن تماماً (فرق = 0.00)" : "Balanced (Zero Discrepancy)")
                    : (isAr ? `غير متوازن (فرق: ${trialBalance.discrepancy.toFixed(2)})` : `Discrepancy: ${trialBalance.discrepancy.toFixed(2)}`)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "مجموع حركة المدين" : "Total Debits"}</span>
                <span className="text-base font-black font-mono text-slate-900">
                  SAR {trialBalance.totalDebitSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "مجموع حركة الدائن" : "Total Credits"}</span>
                <span className="text-base font-black font-mono text-slate-900">
                  SAR {trialBalance.totalCreditSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي الأرصدة المدينة" : "Total Debit Balances"}</span>
                <span className="text-base font-black font-mono text-teal-700">
                  SAR {trialBalance.totalDebitBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي الأرصدة الدائنة" : "Total Credit Balances"}</span>
                <span className="text-base font-black font-mono text-indigo-700">
                  SAR {trialBalance.totalCreditBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <ERPTable
              data={trialBalance.rows}
              columns={trialBalanceColumns}
              searchPlaceholder={isAr ? "بحث في حسابات ميزان المراجعة..." : "Search trial balance accounts..."}
            />
          </div>
        )}

        {/* 3. Balance Sheet Tab */}
        {activeReport === "balance_sheet" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Landmark className="w-6 h-6 text-teal-700" />
                  {isAr ? "الميزانية العمومية والمركز المالي" : "Certified Balance Sheet"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr ? "معادلة المركز المالي: الأصول = الخصوم + حقوق الملكية + الأرباح المرحلة." : "Assets = Liabilities + Equity + Retained Earnings."}
                </p>
              </div>

              <div className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                balanceSheet.isBalanced ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {balanceSheet.isBalanced ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>
                  {balanceSheet.isBalanced 
                    ? (isAr ? "الميزانية متوازنة تماماً" : "Balanced") 
                    : (isAr ? `فرق الميزانية: ${balanceSheet.discrepancy.toFixed(2)}` : `Discrepancy: ${balanceSheet.discrepancy.toFixed(2)}`)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Assets Column */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-800 text-sm">{isAr ? "الأصول (Assets)" : "Assets"}</h3>
                  <span className="font-mono font-bold text-teal-700">
                    SAR {balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="space-y-2">
                  {balanceSheet.assets.map(a => (
                    <div key={a.accountId} className="flex justify-between items-center py-1">
                      <span className="text-slate-600 font-bold">{isAr ? a.nameAr : a.name}</span>
                      <span className="font-mono font-bold text-slate-900">
                        SAR {a.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-slate-900 text-sm">
                    <span>{isAr ? "مجموع الأصول" : "Total Assets"}</span>
                    <span className="font-mono text-teal-700">
                      SAR {balanceSheet.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liabilities & Equity Column */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-800 text-sm">{isAr ? "الخصوم وحقوق الملكية" : "Liabilities & Equity"}</h3>
                  <span className="font-mono font-bold text-indigo-700">
                    SAR {balanceSheet.totalEquityAndLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-slate-500 mb-2">{isAr ? "الخصوم (Liabilities):" : "Liabilities:"}</h4>
                  <div className="space-y-2">
                    {balanceSheet.liabilities.map(l => (
                      <div key={l.accountId} className="flex justify-between items-center py-1">
                        <span className="text-slate-600 font-medium">{isAr ? l.nameAr : l.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          SAR {l.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    {balanceSheet.liabilities.length === 0 && (
                      <div className="text-slate-400 italic py-1">{isAr ? "لا توجد التزامات قائمة" : "No active liabilities"}</div>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <h4 className="font-bold text-slate-500 mb-2">{isAr ? "حقوق الملكية (Equity):" : "Equity:"}</h4>
                  <div className="space-y-2">
                    {balanceSheet.equity.map(e => (
                      <div key={e.accountId} className="flex justify-between items-center py-1">
                        <span className="text-slate-600 font-medium">{isAr ? e.nameAr : e.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          SAR {e.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center py-1 text-teal-700 font-bold">
                      <span>{isAr ? "الأرباح المرحلة / المحتجزة للفترة" : "Retained Earnings (Net Income)"}</span>
                      <span className="font-mono">
                        SAR {balanceSheet.retainedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between font-black text-slate-900 text-sm">
                  <span>{isAr ? "مجموع الخصوم وحقوق الملكية" : "Total Liabilities & Equity"}</span>
                  <span className="font-mono text-indigo-700">
                    SAR {balanceSheet.totalEquityAndLiabilities.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Independent Roastery Report Tab */}
        {activeReport === "roastery" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Flame className="w-6 h-6 text-amber-600" />
                {isAr ? "كشف تكاليف وأرباح صالة المحمصة المستقل" : "Independent Roastery Yield & Cost Sheet"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{isAr ? "يحتسب هذا التقرير كفاءة صالات التحميص بشكل معزول ومستقل، متضمناً تكاليف العمالة والوقود الإقليمية." : "Isolates roastery expenses, wages, raw bean inventory, and computes standard weight loss during kilns."}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "الوزن الخام الكلي" : "Total Green Beans"}</span>
                <span className="text-base font-black font-mono text-slate-800">{totalGreenBeansUsedKg.toLocaleString()} kg</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "وزن البن المحمص" : "Total Roasted Coffee"}</span>
                <span className="text-base font-black font-mono text-teal-700">{totalRoastedKg.toLocaleString()} kg</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "معدل فاقد الوزن الطبيعي" : "Shrinkage Rate"}</span>
                <span className="text-base font-black font-mono text-amber-600">{lossRatio}%</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "تكلفة الكيلو المباشرة" : "Yield Cost / kg"}</span>
                <span className="text-base font-black font-mono text-slate-900">SAR {roastingCostPerKg}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">{isAr ? "التكاليف المباشرة الموزعة على المحمصة" : "Roastery Direct Cost breakdown"}</h3>
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "أجور عمال تشغيل صالة المحامص" : "Roastmasters dedicated Wages"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {roasteryLaborExpenses.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "مصروفات شراء غاز وقود المحامص" : "Kilns active fuel gas"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {roasteryFuelExpenses.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "مصروفات صيانة دورية وفلاتر للآلات" : "Machine Filters & Maintenance"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {roasteryMaintenance.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-100 pt-2 flex justify-between items-center font-extrabold text-slate-800">
                  <span>{isAr ? "إجمالي مصروفات المحمصة المباشرة" : "Total Direct Roastery Expenses"}</span>
                  <span className="font-mono text-rose-600">SAR {directRoasteryExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. Independent Grinding Report Tab */}
        {activeReport === "grinding" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers2 className="w-6 h-6 text-indigo-600" />
                {isAr ? "كشف تكاليف صالة الطواحين المستقل" : "Independent Grinding Performance Statement"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{isAr ? "يحتسب هذا التقرير تكلفة طحن البن ومستويات الطاقة الكهربائية وصيانة الشفرات الموزعة." : "Isolates grinding wages, electricity power allocation, and blade replacement cycles."}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي الوزن المطحون" : "Total Ground Qty"}</span>
                <span className="text-base font-black font-mono text-slate-800">{totalGroundKg.toLocaleString()} kg</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "تكلفة الطحن المضافة للكيلوغرام" : "Grinding unit Cost / kg"}</span>
                <span className="text-base font-black font-mono text-slate-900">SAR {grindingCostPerKg}</span>
              </div>
              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="text-[10px] font-bold text-indigo-800 block">{isAr ? "مصاريف الصالة المباشرة" : "Direct Overhead Expenses"}</span>
                <span className="text-base font-black font-mono text-indigo-700">SAR {directGrindingExpenses.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">{isAr ? "التكاليف المباشرة الموزعة على المطاحن" : "Grinding Direct Cost breakdown"}</h3>
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "أجور عمال تشغيل صالة الطحن" : "Grinding operators Wages"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {grindingLabor.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "استهلاك صالة الطواحين من الطاقة الكهربائية" : "Power Grid / Electricity"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {grindingPower.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "شفرات وأحجار طحن وأدوات فصل ونظافة" : "Blade replacement & Sanitations"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {grindingBlades.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Certification & Invariants Tab */}
        {activeReport === "certification" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  {isAr ? "شهادة اعتماد وتدقيق النظام (Phase 1 Invariants)" : "Master Certification & System Integrity Report"}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isAr 
                    ? "تقرير الفحص الآلي المستقل لقواعد القيد المزدوج وسلامة المخزون والذمم." 
                    : "Automated test suite asserting accounting & inventory integrity."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-4 py-2 rounded-xl text-xs font-black ${
                  certReport.status === "PASSED" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                }`}>
                  {certReport.status === "PASSED" ? "CERTIFIED (PHASE 1 READY)" : "REJECTED"}
                </span>
              </div>
            </div>

            {/* Diagnostic stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي الفحوصات" : "Total Checks"}</span>
                <span className="text-lg font-black font-mono text-slate-900">{certReport.totalChecks}</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 block">{isAr ? "الفحوصات الناجحة" : "Passed Checks"}</span>
                <span className="text-lg font-black font-mono text-emerald-700">{certReport.passedCount}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "الفحوصات الفاشلة" : "Failed Checks"}</span>
                <span className={`text-lg font-black font-mono ${certReport.failedCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
                  {certReport.failedCount}
                </span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "حالة سلامة البيانات" : "Data Health"}</span>
                <span className="text-sm font-black text-emerald-700 mt-1 block">
                  {integrityReport.overallStatus} ({integrityReport.criticalCount} issues)
                </span>
              </div>
            </div>

            {/* Terminal Log Output */}
            <div className="bg-slate-950 text-slate-200 p-5 rounded-2xl font-mono text-xs overflow-x-auto shadow-inner">
              <div className="text-slate-500 mb-2 border-b border-slate-800 pb-2 flex justify-between">
                <span>CERTIFICATION RUNNER EXECUTION TRACE</span>
                <span>{certReport.timestamp}</span>
              </div>
              <pre className="whitespace-pre-wrap leading-relaxed text-[11px] text-emerald-400">
                {certReport.formattedOutput}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
