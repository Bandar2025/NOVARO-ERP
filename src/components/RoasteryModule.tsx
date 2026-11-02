import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Flame, Plus, Trash2, ShieldAlert, CheckCircle, Coffee, TrendingUp, DollarSign, Calendar, Sliders, Printer, Calculator, AlertTriangle } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ConfirmDialog from "./common/ConfirmDialog";
import PrintPreviewModal, { PrintableBatchLabelData } from "./common/PrintPreviewModal";

interface RoasteryModuleProps {
  language?: "ar" | "en";
}

export default function RoasteryModule({ language = "ar" }: RoasteryModuleProps) {
  const isAr = language === "ar";
  const { 
    roasteryExpenses, addRoasteryExpense, deleteRoasteryExpense, roastingJobs, addRoastingJob, items, addToast, addAuditLog 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"production" | "expenses" | "costing" | "simulator">("production");
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const [selectedBatchLabel, setSelectedBatchLabel] = useState<PrintableBatchLabelData | null>(null);

  // Blend & Roast Margin Simulator State
  const [simGreenCostPerKg, setSimGreenCostPerKg] = useState<number>(28);
  const [simWeightLossPct, setSimWeightLossPct] = useState<number>(16);
  const [simGasAndLaborPerKg, setSimGasAndLaborPerKg] = useState<number>(3.5);
  const [simPackagingCostPerKg, setSimPackagingCostPerKg] = useState<number>(4.2);
  const [simWholesaleMarginPct, setSimWholesaleMarginPct] = useState<number>(28);
  const [simCafeMarginPct, setSimCafeMarginPct] = useState<number>(42);
  const [simRetailMarginPct, setSimRetailMarginPct] = useState<number>(55);

  // Roasting Job Form State
  const [recipeId, setRecipeId] = useState("");
  const [inputWeight, setInputWeight] = useState<number>(0);
  const [outputWeight, setOutputWeight] = useState<number>(0);
  const [machineId, setMachineId] = useState("Probat G120");
  const [roastDegree, setRoastDegree] = useState("Medium");
  const [operator, setOperator] = useState("أبو فهد");

  // Expense Form State
  const [expType, setExpType] = useState("شراء وقود غاز");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expNotes, setExpNotes] = useState("");

  // Filter green beans and roasted beans
  const greenBeans = items.filter(i => i.category === "GreenCoffee");
  const roastedBeans = items.filter(i => i.category === "RoastedCoffee");

  // Submit Roasting Job
  const handleRoastingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeId || inputWeight <= 0 || outputWeight <= 0) {
      addToast({
        type: "warning",
        message: "الرجاء تعبئة بيانات التحميص بالكامل وبقيم صحيحة.",
        messageEn: "Please fill roasting data completely and correctly."
      });
      return;
    }

    if (outputWeight > inputWeight) {
      addToast({
        type: "error",
        message: "الوزن المحمص الناتج لا يمكن أن يكون أكبر من وزن البن الأخضر الخام!",
        messageEn: "Roasted output weight cannot exceed green input weight!"
      });
      return;
    }

    const matchGreen = items.find(i => i.id === recipeId);
    if (!matchGreen) return;

    // Weight loss pct calculation
    const lossPct = parseFloat((((inputWeight - outputWeight) / inputWeight) * 100).toFixed(1));

    // Post to context
    const result = addRoastingJob({
      batchId: `BAT-RST-${Date.now().toString().slice(-4)}`,
      greenItemId: recipeId,
      greenItemName: matchGreen.nameAr,
      greenQty: inputWeight,
      roastedItemId: "item-5", // Ethiopian Roasted beans default
      roastedItemName: "بن محمص وسط",
      roastedQty: outputWeight,
      roastProfile: roastDegree,
      kilnTemperature: 215,
      durationMinutes: 14,
      operator: operator,
      status: "COMPLETED" as any
    });

    if (result.success) {
      addAuditLog(
        "تشغيل محمصة",
        `تحميص وجبة بن أخضر ${matchGreen.nameAr} كمية ${inputWeight} كجم وإنتاج بن محمص كمية ${outputWeight} كجم بنسبة فقد ${lossPct}%.`
      );

      addToast({
        type: "success",
        message: `تم قيد وجبة التحميص بنجاح! نسبة الفقد في الوزن: ${lossPct}%`,
        messageEn: `Roasting job saved! Weight loss ratio: ${lossPct}%`
      });

      // Clear Form
      setRecipeId("");
      setInputWeight(0);
      setOutputWeight(0);
    }
  };

  // Submit Expense
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0 || !expNotes.trim()) {
      addToast({
        type: "warning",
        message: "الرجاء تحديد مبلغ ووصف المصروف.",
        messageEn: "Please write correct expense amount and notes."
      });
      return;
    }

    addRoasteryExpense({
      date: new Date().toISOString().split("T")[0],
      type: expType,
      amount: expAmount,
      notes: expNotes
    });

    addToast({
      type: "success",
      message: "تم تقييد مصروف المحمصة وإدراجه في كشف حساب القسم بنجاح.",
      messageEn: "Roastery expense saved successfully."
    });

    setExpAmount(0);
    setExpNotes("");
  };

  // Cost sheet calculations
  const totalRoastedWeight = roastingJobs.reduce((sum, j) => sum + (j.roastedQty || 0), 0);
  const totalGreenUsed = roastingJobs.reduce((sum, j) => sum + (j.greenQty || 0), 0);
  const totalRoastExpenses = roasteryExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Simple, direct non-academic Cost Sheet KPIs
  const avgLossWeightPct = totalGreenUsed > 0 
    ? (((totalGreenUsed - totalRoastedWeight) / totalGreenUsed) * 100).toFixed(1)
    : "16.0";

  const costPerKgRoasted = totalRoastedWeight > 0
    ? ((totalGreenUsed * 25 + totalRoastExpenses) / totalRoastedWeight).toFixed(2)
    : "29.80";

  // Table Columns
  const productionColumns: ColumnDef[] = [
    { key: "batchId", header: "رقم الوجبة", headerEn: "Lot No" },
    { key: "greenItemName", header: "البن الأخضر المستخدم", headerEn: "Green Bean Used" },
    { key: "greenQty", header: "الوزن الخام (كغم)", headerEn: "Raw weight", render: (val) => <span className="font-mono">{val} kg</span> },
    { key: "roastedQty", header: "الوزن المحمص (كغم)", headerEn: "Roasted weight", render: (val) => <span className="font-mono font-bold text-slate-900">{val} kg</span> },
    { 
      key: "lossPct", 
      header: "نسبة الفقد", 
      headerEn: "Loss %", 
      render: (_, row) => {
        const loss = (((row.greenQty - row.roastedQty) / row.greenQty) * 100).toFixed(1);
        return <span className="font-mono text-amber-600 font-bold">{loss}%</span>;
      }
    },
    { key: "roastProfile", header: "درجة التحميص", headerEn: "Profile" },
    { key: "operator", header: "المسؤول", headerEn: "Operator" },
    {
      key: "printLabel",
      header: "ملصق الباركود",
      headerEn: "Batch Label",
      sortable: false,
      render: (_, row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedBatchLabel({
              batchId: row.batchId || row.id || "BAT-RST-101",
              productNameAr: row.roastedItemName || row.greenItemName || "بن نوفارو محمص",
              roastProfile: row.roastProfile || "Medium",
              weightKg: row.roastedQty || 50,
              roastDate: row.date || new Date().toISOString().split("T")[0],
              expiryDate: "2026-10-30",
              operator: row.operator || "أبو فهد"
            });
          }}
          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-amber-700 text-white text-[11px] font-bold flex items-center gap-1 transition-colors"
        >
          <Printer className="w-3 h-3" />
          <span>{isAr ? "ملصق الدفعة" : "Print Label"}</span>
        </button>
      )
    }
  ];

  const expenseColumns: ColumnDef[] = [
    { key: "date", header: "التاريخ", headerEn: "Date" },
    { key: "type", header: "نوع المصروف", headerEn: "Type" },
    { key: "notes", header: "الوصف / التفاصيل", headerEn: "Description" },
    { key: "amount", header: "المبلغ (ريال)", headerEn: "Amount", render: (val) => <span className="font-mono font-bold text-rose-600">SAR {Number(val).toLocaleString()}</span> },
    {
      key: "actions",
      header: "خيارات",
      headerEn: "Actions",
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setDeleteExpenseId(row.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
          title={isAr ? "حذف المصروف" : "Delete Expense"}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="قسم المحمصة الصناعية ومعالجة البن"
        titleEn="Roastery Kiln Operations & Costing"
        description="تسجيل وجبات تحميص البن، إدارة مصروفات الوقود والتشغيل المباشرة، وحساب تكلفة الكيلو والفاقد."
        descriptionEn="Record roasting batches, manage direct fuel/labor expenses, and calculate shrinkage and unit cost per kg."
        icon={Flame}
        breadcrumbs={[
          { label: "الإنتاج والتصنيع", labelEn: "Manufacturing" },
          { 
            label: activeTab === "production" ? "عمليات تشغيل المحمصة" :
                   activeTab === "expenses" ? "مصروفات المحمصة" : "حساب التكاليف والإنتاج",
            labelEn: activeTab === "production" ? "Roasting Jobs" :
                     activeTab === "expenses" ? "Roastery Expenses" : "Cost Sheet",
            active: true 
          }
        ]}
        language={language}
      />

      {/* Global Action Bar */}
      <GlobalActionBar
        onNew={() => {
          if (activeTab !== "production") setActiveTab("production");
        }}
        newLabelAr="تسجيل وجبة تحميص"
        newLabelEn="New Roasting Batch"
        totalCount={roastingJobs.length}
        pageId="roastery"
        language={language}
      />

      {/* Standardized Secondary Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab("production")}
          className={`px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "production" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isAr ? "عمليات تشغيل المحمصة" : "Roasting Jobs"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className={`px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "expenses" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isAr ? "مصروفات المحمصة المستقلة" : "Roastery Expenses"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("costing")}
          className={`px-3.5 py-2 rounded-lg transition-all ${
            activeTab === "costing" ? "bg-white text-slate-900 shadow-xs border border-slate-200/60" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {isAr ? "حساب التكاليف والإنتاج" : "Roastery Cost Sheet"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("simulator")}
          className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
            activeTab === "simulator" ? "bg-white text-amber-800 shadow-xs border border-amber-300" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calculator className="w-3.5 h-3.5 text-amber-600" />
          <span>{isAr ? "محاكي تسعير الخلطات والتنبؤ بالمخزون" : "Margin Simulator & Predictive BI"}</span>
        </button>
      </div>

      {/* Production Runs Log */}
      {activeTab === "production" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* New Roasting Run */}
          <form onSubmit={handleRoastingSubmit} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
              {isAr ? "تسجيل تشغيل وجبة تحميص جديدة" : "Record Roasting Run"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "البن الأخضر الخام *" : "Green Coffee Bean *"}</label>
                <select
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-bold"
                  required
                >
                  <option value="">{isAr ? "--- اختر نوع البن الخام ---" : "--- Select Bean ---"}</option>
                  {greenBeans.map(g => (
                    <option key={g.id} value={g.id}>{g.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "وزن البن الأخضر (كغم) *" : "Green weight (kg) *"}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 60"
                    value={inputWeight || ""}
                    onChange={(e) => setInputWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "الوزن المحمص الناتج (كغم) *" : "Roasted weight (kg) *"}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={outputWeight || ""}
                    onChange={(e) => setOutputWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "المحمصة المستخدمة" : "Roaster Machine"}</label>
                  <select
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="Probat G120">Probat G120</option>
                    <option value="Diedrich IR-12">Diedrich IR-12</option>
                    <option value="Loring S35 Kestrel">Loring S35</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "درجة التحميص" : "Roast Profile"}</label>
                  <select
                    value={roastDegree}
                    onChange={(e) => setRoastDegree(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="Light">تحميص فاتح (سعودي)</option>
                    <option value="Medium">تحميص وسط (أمريكي/فلتر)</option>
                    <option value="Dark">تحميص غامق (إسبريسو)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "المحمص المسؤول" : "Roastmaster Operator"}</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="w-full p-2 rounded border border-slate-200 text-xs bg-slate-50"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isAr ? "قيد وجبة التحميص بالدفتر" : "Post Roasting Run"}</span>
            </button>
          </form>

          {/* History */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
              {isAr ? "سجل وجبات التحميص السابقة" : "Previous Roasting Runs"}
            </h3>
            <ERPTable
              data={roastingJobs}
              columns={productionColumns}
              language={language}
            />
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === "expenses" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* New Expense */}
          <form onSubmit={handleExpenseSubmit} className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
              {isAr ? "تقييد مصروف محمصة جديد" : "New Roastery Expense"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "نوع المصروف" : "Expense Type"}</label>
                <select
                  value={expType}
                  onChange={(e) => setExpType(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="شراء وقود غاز">وقود غاز المحامص</option>
                  <option value="صيانة دورية لمحمص">صيانة وآلات ومحامص</option>
                  <option value="شفرات تنظيف وعوادم">فلاتر وعوادم تهوية</option>
                  <option value="أجور عمال تشغيل">أجور عمال إنتاج تحميص</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "قيمة المصروف (ريال) *" : "Expense Amount (SAR) *"}</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={expAmount || ""}
                  onChange={(e) => setExpAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded border border-slate-200 font-mono font-bold text-rose-600"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "الوصف والتفاصيل *" : "Description *"}</label>
                <input
                  type="text"
                  placeholder="وصف الفاتورة أو رقم سند الصرف"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition text-xs"
            >
              {isAr ? "قيد وإثبات المصروف" : "Record Expense"}
            </button>
          </form>

          {/* Expenses Log */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
              {isAr ? "دفتر مصروفات المحمصة" : "Roastery Expense Ledger"}
            </h3>
            <ERPTable
              data={roasteryExpenses}
              columns={expenseColumns}
              language={language}
            />
          </div>
        </div>
      )}

      {/* Costing Tab */}
      {activeTab === "costing" && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-800 text-lg">{isAr ? "كشف حساب تكاليف تشغيل المحمصة المستقل" : "Independent Roastery Cost sheet"}</h3>
            <p className="text-xs text-slate-400 mt-1">{isAr ? "يحتسب هذا الكشف تكاليف البن الأخضر الإجمالي والمصروفات المباشرة ليحدد تكلفة الكيلو المحمص الحقيقية." : "Cost analysis of green beans and direct processing expenses to compute roasted coffee unit costs."}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي البن الأخضر المستخدم" : "Total Green Bean Inflow"}</span>
              <span className="text-lg font-black font-mono text-slate-900 mt-2">{totalGreenUsed.toLocaleString()} kg</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي بن محمص منتج" : "Total Roasted Coffee"}</span>
              <span className="text-lg font-black font-mono text-teal-700 mt-2">{totalRoastedWeight.toLocaleString()} kg</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي مصروفات المحمصة المستقلة" : "Direct Roastery Expenses"}</span>
              <span className="text-lg font-black font-mono text-rose-600 mt-2">SAR {totalRoastExpenses.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-slate-700 leading-normal">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-2">{isAr ? "تحليل نسبة الفاقد الكيلوغرامي" : "Shrinkage Rate Analysis"}</h4>
              <p>{isAr ? `تصل نسبة الفاقد الطبيعي أثناء التحميص بفعل تطاير الرطوبة والقشور حوالي 15% - 17%. الوجبات المسجلة لديكم تسجل نسبة فاقد إجمالية تبلغ: ${avgLossWeightPct}%.` : `Average standard weight loss is ~16%. Your actual shrinkage rates are at ${avgLossWeightPct}%.`}</p>
            </div>

            <div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-2">{isAr ? "تكلفة الكيلو المحمص الحقيقية (أخضر + تشغيل)" : "Roasted Unit Cost Breakdown"}</h4>
              <p className="text-lg font-extrabold text-amber-900 font-mono">SAR {costPerKgRoasted} / kg</p>
              <p className="mt-1 text-[11px] text-slate-500">{isAr ? "تحتسب هذه القيمة تلقائياً من تكلفة المواد الخام المباشرة مضافاً إليها مصروفات الوقود وأجور التشغيل المخصصة للقسم." : "Includes raw bean value plus active fuel gas and direct wages allocated specifically to roastery."}</p>
            </div>
          </div>
        </div>
      )}

      {/* Simulator & Predictive Analytics Tab */}
      {activeTab === "simulator" && (() => {
        const netYieldFactor = Math.max(0.5, (100 - simWeightLossPct) / 100);
        const effectiveBeanCostPerRoastedKg = simGreenCostPerKg / netYieldFactor;
        const totalNetCostPerKg = effectiveBeanCostPerRoastedKg + simGasAndLaborPerKg + simPackagingCostPerKg;
        const wholesalePrice = totalNetCostPerKg / (1 - simWholesaleMarginPct / 100);
        const cafeB2BPrice = totalNetCostPerKg / (1 - simCafeMarginPct / 100);
        const retailPrice = totalNetCostPerKg / (1 - simRetailMarginPct / 100);
        const dailyGreenBurnRate = Math.max(15, Math.round((totalGreenUsed || 180) / 7));

        return (
          <div className="space-y-6">
            {/* Blend & Roast Margin Simulator */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-600" />
                    {isAr ? "محاكي تكلفة التحميص وتسعير الخلطات (Roast & Blend Margin Simulator)" : "Roast & Blend Pricing Simulator"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr
                      ? "احسب تكلفة الكيلو الصافي بعد الفاقد الحراري والتعبئة وحدد السعر الأمثل للجملة والمقاهي والتجزئة."
                      : "Calculate net roasted cost per kg after moisture weight loss and packaging, and simulate target channel prices."}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 font-mono text-xs font-bold">
                  Yield: {(netYieldFactor * 100).toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-600 block mb-1">
                    {isAr ? "تكلفة كيلو البن الأخضر (SAR)" : "Green Bean Cost / kg (SAR)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={simGreenCostPerKg}
                    onChange={(e) => setSimGreenCostPerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-600 block mb-1">
                    {isAr ? "نسبة الفاقد الحراري بالتحميص (%)" : "Roast Shrinkage / Weight Loss (%)"}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="5"
                    max="30"
                    value={simWeightLossPct}
                    onChange={(e) => setSimWeightLossPct(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm text-amber-700"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-600 block mb-1">
                    {isAr ? "تكلفة الغاز والتشغيل للكيلو (SAR)" : "Direct Gas & Labor / kg (SAR)"}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={simGasAndLaborPerKg}
                    onChange={(e) => setSimGasAndLaborPerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  />
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="font-bold text-slate-600 block mb-1">
                    {isAr ? "تكلفة الأكياس والصمام والملصق (SAR)" : "Bag, Valve & Label / kg (SAR)"}
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={simPackagingCostPerKg}
                    onChange={(e) => setSimPackagingCostPerKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-sm"
                  />
                </div>
              </div>

              {/* Cost Breakdown & Recommended Channel Pricing */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-900 text-white rounded-xl space-y-1">
                  <span className="text-[11px] text-slate-400 font-bold block">
                    {isAr ? "التكلفة الصافية للكيلو المحمص والمعبأ" : "Net Packed Roasted Cost / kg"}
                  </span>
                  <div className="text-2xl font-black font-mono text-amber-400">
                    SAR {totalNetCostPerKg.toFixed(2)}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {isAr ? `منها بن صافي بعد الفقد: SAR ${effectiveBeanCostPerRoastedKg.toFixed(2)}` : `Bean after loss: SAR ${effectiveBeanCostPerRoastedKg.toFixed(2)}`}
                  </span>
                </div>

                <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900">{isAr ? "سعر الجملة المقترح" : "Wholesale Price"}</span>
                    <span className="text-[11px] font-mono font-bold text-teal-700">Margin {simWholesaleMarginPct}%</span>
                  </div>
                  <div className="text-xl font-black font-mono text-teal-800">
                    SAR {wholesalePrice.toFixed(2)} <span className="text-[10px] font-normal">/ kg</span>
                  </div>
                  <div className="text-[11px] text-teal-700 font-mono">
                    {isAr ? `صافي الربح للكيلو: SAR ${(wholesalePrice - totalNetCostPerKg).toFixed(2)}` : `Profit: SAR ${(wholesalePrice - totalNetCostPerKg).toFixed(2)}`}
                  </div>
                </div>

                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900">{isAr ? "سعر المقاهي والفنادق (B2B)" : "Cafes & HoReCa (B2B)"}</span>
                    <span className="text-[11px] font-mono font-bold text-indigo-700">Margin {simCafeMarginPct}%</span>
                  </div>
                  <div className="text-xl font-black font-mono text-indigo-800">
                    SAR {cafeB2BPrice.toFixed(2)} <span className="text-[10px] font-normal">/ kg</span>
                  </div>
                  <div className="text-[11px] text-indigo-700 font-mono">
                    {isAr ? `صافي الربح للكيلو: SAR ${(cafeB2BPrice - totalNetCostPerKg).toFixed(2)}` : `Profit: SAR ${(cafeB2BPrice - totalNetCostPerKg).toFixed(2)}`}
                  </div>
                </div>

                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">{isAr ? "سعر التجزئة والكاشير (POS)" : "Retail & POS Price"}</span>
                    <span className="text-[11px] font-mono font-bold text-emerald-700">Margin {simRetailMarginPct}%</span>
                  </div>
                  <div className="text-xl font-black font-mono text-emerald-800">
                    SAR {retailPrice.toFixed(2)} <span className="text-[10px] font-normal">/ kg</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono">
                    {isAr ? `سعر كيس 250g: SAR ${(retailPrice * 0.27).toFixed(2)}` : `250g Pouch: SAR ${(retailPrice * 0.27).toFixed(2)}`}
                  </div>
                </div>
              </div>
            </div>

            {/* Predictive Green Bean Burn-Rate & Replenishment Table */}
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-700" />
                    {isAr ? "التنبؤ بمعدل استهلاك البن الأخضر وأيام الكفاية (Predictive Burn-Rate)" : "Predictive Green Bean Burn-Rate & Days of Supply"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {isAr
                      ? `معدل السحب اليومي التقديري للمحمصة: ${dailyGreenBurnRate} كجم/يوم بناءً على وجبات التحميص الفعلي.`
                      : `Estimated daily roastery consumption: ${dailyGreenBurnRate} kg/day based on active roasting batches.`}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3 text-right">{isAr ? "صنف البن الأخضر الخام" : "Green Coffee Origin"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "الرصيد الحالي (كجم)" : "Current Stock (kg)"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "معدل السحب اليومي" : "Daily Burn Rate"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "أيام الكفاية المتبقية" : "Days of Supply"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "كمية الشراء المقترحة (30 يوم)" : "Suggested 30d Order"}</th>
                      <th className="py-2.5 px-3 text-center">{isAr ? "حالة التوريد" : "Replenishment Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {greenBeans.map((bean) => {
                      const itemBurn = Math.max(8, Math.round(dailyGreenBurnRate / Math.max(1, greenBeans.length)));
                      const daysRemaining = Math.floor((bean.currentStock || 0) / itemBurn);
                      const suggestedOrder = Math.max(0, itemBurn * 30 - (bean.currentStock || 0));
                      return (
                        <tr key={bean.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-bold text-slate-900">{isAr ? bean.nameAr : bean.name}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{bean.currentStock} kg</td>
                          <td className="py-2.5 px-3 text-center font-mono text-slate-600">{itemBurn} kg/day</td>
                          <td className="py-2.5 px-3 text-center font-mono font-black text-teal-800">
                            {daysRemaining} {isAr ? "يوم" : "days"}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-amber-800">
                            {suggestedOrder > 0 ? `${suggestedOrder} kg` : "—"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                daysRemaining < 14
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {daysRemaining < 14
                                ? isAr
                                  ? "يتطلب طلب شراء مبكر"
                                  : "Reorder Recommended"
                                : isAr
                                ? "مخزون آمن ومستقر"
                                : "Healthy Supply"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Batch Barcode Print Studio Modal */}
      {selectedBatchLabel && (
        <PrintPreviewModal
          mode="batch_label"
          batchData={selectedBatchLabel}
          onClose={() => setSelectedBatchLabel(null)}
          language={language}
        />
      )}

      {/* Delete Expense Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deleteExpenseId}
        title={isAr ? "حذف مصروف المحمصة" : "Delete Roastery Expense"}
        message={isAr ? "هل أنت متأكد من رغبتك في حذف هذا المصروف؟ سيتم تعديل حساب التكاليف المباشرة تلقائياً." : "Are you sure you want to delete this expense? Cost sheets will be updated automatically."}
        confirmLabel={isAr ? "تأكيد الحذف" : "Confirm Delete"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="danger"
        onConfirm={() => {
          if (deleteExpenseId) {
            deleteRoasteryExpense(deleteExpenseId);
            setDeleteExpenseId(null);
          }
        }}
        onCancel={() => setDeleteExpenseId(null)}
      />
    </div>
  );
}
