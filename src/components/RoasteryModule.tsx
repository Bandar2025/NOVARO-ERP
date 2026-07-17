import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Flame, Plus, Trash2, ShieldAlert, CheckCircle, Coffee, TrendingUp, DollarSign, Calendar, Sliders } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface RoasteryModuleProps {
  language?: "ar" | "en";
}

export default function RoasteryModule({ language = "ar" }: RoasteryModuleProps) {
  const isAr = language === "ar";
  const { 
    roasteryExpenses, addRoasteryExpense, deleteRoasteryExpense, roastingJobs, addRoastingJob, items, addToast, addAuditLog 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"production" | "expenses" | "costing">("production");

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
    { key: "operator", header: "المسؤول", headerEn: "Operator" }
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
          onClick={() => deleteRoasteryExpense(row.id)}
          className="p-1 text-slate-400 hover:text-rose-600"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs uppercase font-bold text-amber-600 tracking-wider font-mono">
          {isAr ? "قسم المحمصة الصناعية المفتوحة" : "ROASTERY WORKSTATION & KILN CONTROL"}
        </span>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Flame className="w-8 h-8 text-amber-600" />
          {isAr ? "قسم المحمصة" : "Roastery Department"}
        </h1>
      </div>

      {/* Touch-friendly Navigation */}
      <div className="grid grid-cols-3 gap-3 bg-slate-100 p-2 rounded-2xl">
        <button
          onClick={() => setActiveTab("production")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "production" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "عمليات تشغيل المحمصة" : "Roasting Jobs"}
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "expenses" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "مصروفات المحمصة المستقلة" : "Roastery Expenses"}
        </button>

        <button
          onClick={() => setActiveTab("costing")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "costing" ? "bg-amber-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "حساب التكاليف والإنتاج" : "Roastery Cost Sheet"}
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
    </div>
  );
}
