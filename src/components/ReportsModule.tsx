import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { 
  FileText, Flame, Layers2, Truck, Landmark, ShieldCheck, Printer, ArrowDownCircle, ArrowUpCircle, TrendingUp, DollarSign, Award, Percent
} from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface ReportsModuleProps {
  language?: "ar" | "en";
}

export default function ReportsModule({ language = "ar" }: ReportsModuleProps) {
  const isAr = language === "ar";
  const { 
    customers, suppliers, salesInvoices, purchaseOrders, roastingJobs, grindingJobs, roasteryExpenses, grindingExpenses, cashboxTransactions 
  } = useAppState();

  const [activeReport, setActiveReport] = useState<"unified" | "roastery" | "grinding" | "wholesale" | "balance_sheet">("unified");

  // --- 1. CALCULATIONS FOR UNIFIED REPORT ---
  const totalWholesaleSales = salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalRetailSales = cashboxTransactions
    .filter(t => t.type === "receipt" && t.category === "مبيعات")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCompanyRevenue = totalWholesaleSales + totalRetailSales;

  // Raw Materials cost (Simulated from purchase orders)
  const totalRawPurchases = purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);
  const estimatedEndingInventory = totalRawPurchases * 0.45; // Standard 45% remaining stock
  const estimatedCOGS = totalRawPurchases - estimatedEndingInventory;

  // Operating Expenses (Separated by department)
  const directRoasteryExpenses = roasteryExpenses.reduce((sum, e) => sum + e.amount, 0);
  const directGrindingExpenses = grindingExpenses.reduce((sum, e) => sum + e.amount, 0);
  
  // Indirect General Overhead Expenses
  const indirectOverheadExpenses = cashboxTransactions
    .filter(t => t.type === "expense" && t.category !== "تحميص" && t.category !== "طحن")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalAllExpenses = estimatedCOGS + directRoasteryExpenses + directGrindingExpenses + indirectOverheadExpenses;
  const companyNetProfit = totalCompanyRevenue - totalAllExpenses;

  // --- 2. CALCULATIONS FOR ROASTERY REPORT ---
  const totalRoastedKg = roastingJobs.reduce((sum, j) => sum + (j.roastedQty || 0), 0);
  const totalGreenBeansUsedKg = roastingJobs.reduce((sum, j) => sum + (j.greenQty || 0), 0);
  const roasteryFuelExpenses = roasteryExpenses.filter(e => e.type === "شراء وقود غاز").reduce((sum, e) => sum + e.amount, 0);
  const roasteryLaborExpenses = roasteryExpenses.filter(e => e.type === "أجور عمال تشغيل").reduce((sum, e) => sum + e.amount, 0);
  const roasteryMaintenance = roasteryExpenses.filter(e => e.type === "صيانة دورية لمحمص").reduce((sum, e) => sum + e.amount, 0);

  const lossRatio = totalGreenBeansUsedKg > 0 
    ? (((totalGreenBeansUsedKg - totalRoastedKg) / totalGreenBeansUsedKg) * 100).toFixed(1)
    : "16.2";

  const roastingCostPerKg = totalRoastedKg > 0
    ? ((totalRoastedKg * 25 + directRoasteryExpenses) / totalRoastedKg).toFixed(2)
    : "29.50";

  // --- 3. CALCULATIONS FOR GRINDING REPORT ---
  const totalGroundKg = grindingJobs.reduce((sum, j) => sum + (j.groundQty || 0), 0);
  const grindingPower = grindingExpenses.filter(e => e.type === "استهلاك طاقة كهربائية").reduce((sum, e) => sum + e.amount, 0);
  const grindingLabor = grindingExpenses.filter(e => e.type === "أجور عمال تشغيل").reduce((sum, e) => sum + e.amount, 0);
  const grindingBlades = grindingExpenses.filter(e => e.type === "صيانة شفرات طحن").reduce((sum, e) => sum + e.amount, 0);

  const grindingCostPerKg = totalGroundKg > 0
    ? (directGrindingExpenses / totalGroundKg).toFixed(2)
    : "3.20";

  // --- 4. CALCULATIONS FOR WHOLESALE ---
  const wholesaleRevenue = totalWholesaleSales;
  const wholesaleCOGS = wholesaleRevenue * 0.55; // 55% average cost
  const wholesaleProfit = wholesaleRevenue - wholesaleCOGS;
  const wholesaleMarginPct = wholesaleRevenue > 0 ? ((wholesaleProfit / wholesaleRevenue) * 100).toFixed(1) : "45.0";

  // --- 5. BALANCE SHEET & TAXES ---
  const accountsReceivable = customers.reduce((sum, c) => sum + (c.balance || 0), 0);
  const totalReceipts = cashboxTransactions.filter(t => t.type === "receipt").reduce((sum, t) => sum + t.amount, 0);
  const totalPaymentsAndExpenses = cashboxTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
  const totalDirectCash = 125000 + totalReceipts - totalPaymentsAndExpenses;
  const currentTotalAssets = totalDirectCash + accountsReceivable + estimatedEndingInventory;
  const estimatedEquity = currentTotalAssets; // Simplification asset=equity

  // ZATCA 15% VAT filing estimates
  const outputVatDue = totalCompanyRevenue * 0.15;
  const inputVatClaimed = totalRawPurchases * 0.15;
  const netVatPayable = Math.max(0, outputVatDue - inputVatClaimed);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-xs uppercase font-bold text-amber-600 tracking-wider font-mono">
            {isAr ? "الحسابات الختامية المستقلة وتحليل الأرباح" : "INDEPENDENT DEPT PROFITABILITY & TAX SHEETS"}
          </span>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <FileText className="w-8 h-8 text-teal-700" />
            {isAr ? "التقارير الحسابية والمالية" : "Accounting Reports"}
          </h1>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-3 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-xl transition flex items-center gap-2 shadow-xs"
        >
          <Printer className="w-5 h-5" />
          <span>{isAr ? "طباعة التقرير الحالي" : "Print Report"}</span>
        </button>
      </div>

      {/* Subnavigation Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-slate-100 p-2 rounded-2xl">
        <button
          onClick={() => setActiveReport("unified")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "unified" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "التقرير المالي الموحد" : "Unified P&L"}
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
          onClick={() => setActiveReport("wholesale")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "wholesale" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "تقرير أرباح الجملة" : "Wholesale Profit"}
        </button>

        <button
          onClick={() => setActiveReport("balance_sheet")}
          className={`py-3 rounded-xl font-bold text-xs transition ${
            activeReport === "balance_sheet" ? "bg-teal-700 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "الميزانية والضريبة" : "Balance & VAT"}
        </button>
      </div>

      {/* Print Frame wrapper */}
      <div id="print-area" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Unified P&L Report Tab */}
        {activeReport === "unified" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900">{isAr ? "قائمة الأرباح والخسائر الموحدة للشركة" : "Unified Company Profit & Loss Statement"}</h2>
              <p className="text-xs text-slate-400 mt-1">{isAr ? "كشف مالي كامل يدمج مبيعات المحمصة وتكاليف التشغيل المستقلة للأقسام لتبيان الربح النهائي." : "Comprehensive profitability statement consolidates roastery, grinding, and B2B wholesale operations."}</p>
            </div>

            {/* Quick KPI stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "إجمالي الإيرادات الموحدة" : "Unified Revenue"}</span>
                <span className="text-base font-black text-slate-900 mt-1">SAR {totalCompanyRevenue.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "إجمالي التكاليف والمصروفات" : "Unified Expenses & COGS"}</span>
                <span className="text-base font-black text-rose-600 mt-1">SAR {totalAllExpenses.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">{isAr ? "صافي الربح الموحد" : "Unified Net Profit"}</span>
                <span className="text-lg font-black text-emerald-700 mt-1">SAR {companyNetProfit.toLocaleString()}</span>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="space-y-3.5 text-xs">
              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">{isAr ? "بنود الإيرادات الموحدة" : "Revenue Ledger"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "مبيعات صالة التوزيع والجملة (B2B)" : "Wholesale Revenues"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {totalWholesaleSales.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "مبيعات صالة المعرض والتجزئة الفورية" : "Retail Sales"}</span>
                  <span className="font-mono font-bold text-slate-900">SAR {totalRetailSales.toLocaleString()}</span>
                </div>
              </div>

              <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 mt-5">{isAr ? "تكاليف التشغيل المباشرة والغير مباشرة" : "Operational Costs Breakdown"}</h3>
              <div className="space-y-2">
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "تكلفة شراء المواد الخام المباشرة المستهلكة (COGS)" : "Raw Green Coffee & Spice COGS"}</span>
                  <span className="font-mono font-bold text-rose-600">SAR {estimatedCOGS.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "تكاليف تشغيل قسم المحمصة المستقلة (وقود، صيانة، عمال)" : "Direct Roastery Overhead Costs"}</span>
                  <span className="font-mono font-bold text-rose-600">SAR {directRoasteryExpenses.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "تكاليف تشغيل قسم الطواحين المستقلة (كهرباء، شفرات، عمال)" : "Direct Grinding Overhead Costs"}</span>
                  <span className="font-mono font-bold text-rose-600">SAR {directGrindingExpenses.toLocaleString()}</span>
                </div>
                <div className="p-3.5 bg-slate-50/60 rounded-xl flex justify-between items-center">
                  <span className="font-bold text-slate-700">{isAr ? "مصروفات إدارية وعمومية ونثرية (إيجارات وصالات ومكاتب)" : "Administrative General Expenses"}</span>
                  <span className="font-mono font-bold text-rose-600">SAR {indirectOverheadExpenses.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Independent Roastery Report Tab */}
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

        {/* Independent Grinding Report Tab */}
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

        {/* Wholesale Profit analysis */}
        {activeReport === "wholesale" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-6 h-6 text-teal-700" />
                {isAr ? "كشف أرباح مبيعات كبار العملاء والجملة" : "Wholesale B2B Gross Margin Statement"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{isAr ? "يحتسب هذا التقرير إجمالي مبيعات الموزعين والسوبرماركت وتكاليفها وهامش المساهمة المباشر للجملة." : "Calculates wholesale direct corporate income, estimated bulk COGS, and delivery drivers logistics."}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي مبيعات الجملة" : "Wholesale B2B Revenue"}</span>
                <span className="text-base font-black font-mono text-teal-700">SAR {wholesaleRevenue.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي الأرباح الإجمالية للجملة" : "Wholesale Gross Profit"}</span>
                <span className="text-base font-black font-mono text-emerald-600">SAR {wholesaleProfit.toLocaleString()}</span>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200">
                <span className="text-[10px] font-bold text-teal-800 block">{isAr ? "نسبة هامش ربحية الجملة" : "Gross Margin %"}</span>
                <span className="text-base font-black font-mono text-teal-700">{wholesaleMarginPct}%</span>
              </div>
            </div>

            <div className="p-4.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-normal">
              <h4 className="font-extrabold text-slate-900 text-xs mb-1">{isAr ? "تقرير توزيع البضائع الميداني" : "Field Delivery Tracking summary"}</h4>
              <p>{isAr ? "يتم توزيع بضائع الجملة آلياً على كبار السوبرماركت (العثيم، التميمي، بن داود) من خلال شاحنات التوزيع الخاصة بنا. يسجل النظام كافة الشاحنات المحملة، وتكلفة الوقود الميدانية مضافة لقسم مبيعات الجملة." : "B2B deliveries to retail clients are fully logged. Invoices automatically update the respective customer ledgers for credit terms."}</p>
            </div>
          </div>
        )}

        {/* Balance Sheet & VAT */}
        {activeReport === "balance_sheet" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Landmark className="w-6 h-6 text-teal-700" />
                {isAr ? "الميزانية العمومية والربط الضريبي" : "Enterprise Balance Sheet & ZATCA Tax report"}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{isAr ? "موقف الأصول النقدية والذمم المدينة، وبيانات الإقرار الضريبي التقديري." : "Live summary of plant financial assets and ZATCA 15% value-added tax declarations."}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start text-xs">
              
              {/* Assets and liabilities */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="font-black text-slate-800 border-b border-slate-200 pb-2">{isAr ? "المركز المالي والأصول" : "Financial Position & Assets"}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "الأصول النقدية السائلة (الصناديق والبنك)" : "Liquid Cash in Hand"}</span>
                    <span className="font-mono font-bold text-slate-900">SAR {totalDirectCash.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "الذمم المدينة المستحقة (ديون العملاء)" : "Accounts Receivables"}</span>
                    <span className="font-mono font-bold text-slate-900">SAR {accountsReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "قيمة المخزون المقدرة في المستودعات" : "Estimated Raw & Finished Inventory"}</span>
                    <span className="font-mono font-bold text-slate-900">SAR {estimatedEndingInventory.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-teal-700">
                    <span>{isAr ? "إجمالي الأصول المقدرة" : "Total Estimated Assets"}</span>
                    <span className="font-mono">SAR {currentTotalAssets.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* VAT estimation card */}
              <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200 space-y-4">
                <h3 className="font-black text-teal-900 border-b border-teal-200 pb-2">{isAr ? "ضريبة القيمة المضافة ZATCA (15%)" : "ZATCA 15% VAT Declaration"}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-teal-700 font-bold">{isAr ? "مخرجات الضريبة (مبيعات الجملة والتجزئة)" : "Output VAT (On Sales)"}</span>
                    <span className="font-mono font-bold text-slate-900">SAR {outputVatDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-teal-700 font-bold">{isAr ? "مدخلات الضريبة المقبولة (المشتريات والتشغيل)" : "Input VAT (On Purchases)"}</span>
                    <span className="font-mono font-bold text-slate-900">SAR {inputVatClaimed.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-teal-200 pt-2 flex justify-between font-black text-teal-900">
                    <span>{isAr ? "صافي الضريبة مستحقة السداد للهيئة" : "Net VAT Payable Due"}</span>
                    <span className="font-mono">SAR {netVatPayable.toLocaleString()}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
