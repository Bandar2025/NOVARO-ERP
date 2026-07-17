import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Layers2, Plus, Trash2, CheckCircle, Sliders, DollarSign, Calendar } from "lucide-react";
import ERPTable, { ColumnDef } from "./common/ERPTable";

interface GrindingModuleProps {
  language?: "ar" | "en";
}

export default function GrindingModule({ language = "ar" }: GrindingModuleProps) {
  const isAr = language === "ar";
  const { 
    grindingExpenses, addGrindingExpense, deleteGrindingExpense, grindingJobs, addGrindingJob, items, addToast, addAuditLog 
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"production" | "expenses" | "costing">("production");

  // Grinding Job Form State
  const [recipeId, setRecipeId] = useState("");
  const [inputWeight, setInputWeight] = useState<number>(0);
  const [outputWeight, setOutputWeight] = useState<number>(0);
  const [machineId, setMachineId] = useState("Mahlkönig DK27");
  const [fineness, setFineness] = useState("Fine (Turkish)");
  const [operator, setOperator] = useState("أبو صالح");

  // Expense Form State
  const [expType, setExpType] = useState("استهلاك طاقة كهربائية");
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expNotes, setExpNotes] = useState("");

  // Roasted Beans (source for grinding)
  const roastedBeans = items.filter(i => i.category === "RoastedCoffee");

  // Submit Grinding Job
  const handleGrindingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeId || inputWeight <= 0 || outputWeight <= 0) {
      addToast({
        type: "warning",
        message: "الرجاء تعبئة بيانات الطحن بالكامل وبقيم صحيحة.",
        messageEn: "Please fill grinding data completely and correctly."
      });
      return;
    }

    if (outputWeight > inputWeight) {
      addToast({
        type: "error",
        message: "الوزن المطحون الناتج لا يمكن أن يكون أكبر من وزن البن المحمص الخام!",
        messageEn: "Ground output weight cannot exceed roasted input weight!"
      });
      return;
    }

    const matchRoasted = items.find(i => i.id === recipeId);
    if (!matchRoasted) return;

    // Post to context
    const result = addGrindingJob({
      batchId: `BAT-GRD-${Date.now().toString().slice(-4)}`,
      roastedItemId: recipeId,
      roastedItemName: matchRoasted.nameAr,
      roastedQty: inputWeight,
      groundItemId: "item-7", // Ground coffee default
      groundItemName: "بن مطحون",
      groundQty: outputWeight,
      finenessSetting: fineness,
      operator: operator,
      status: "COMPLETED" as any
    });

    if (result.success) {
      addAuditLog(
        "تشغيل الطاحونة",
        `طحن بن محمص ${matchRoasted.nameAr} كمية ${inputWeight} كجم وإنتاج بن مطحون كمية ${outputWeight} كجم بمطحنة ${machineId}.`
      );

      addToast({
        type: "success",
        message: "تم تسجيل تشغيل الطاحونة بنجاح!",
        messageEn: "Grinding run saved successfully!"
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

    addGrindingExpense({
      date: new Date().toISOString().split("T")[0],
      type: expType,
      amount: expAmount,
      notes: expNotes
    });

    addToast({
      type: "success",
      message: "تم تقييد مصروف الطاحونة وإدراجه في كشف حساب القسم بنجاح.",
      messageEn: "Grinding expense saved successfully."
    });

    setExpAmount(0);
    setExpNotes("");
  };

  // Cost sheet calculations
  const totalGroundWeight = grindingJobs.reduce((sum, j) => sum + (j.groundQty || 0), 0);
  const totalGrindingExpenses = grindingExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Simple, direct non-academic Cost Sheet KPIs
  const costPerKgGround = totalGroundWeight > 0
    ? (totalGrindingExpenses / totalGroundWeight).toFixed(2)
    : "3.20";

  // Table Columns
  const productionColumns: ColumnDef[] = [
    { key: "batchId", header: "رقم الوجبة", headerEn: "Lot No" },
    { key: "roastedItemName", header: "البن المحمص المستخدم", headerEn: "Roasted Bean Used" },
    { key: "roastedQty", header: "الوزن المحمص (كغم)", headerEn: "Roasted weight", render: (val) => <span className="font-mono">{val} kg</span> },
    { key: "groundQty", header: "الوزن المطحون (كغم)", headerEn: "Ground weight", render: (val) => <span className="font-mono font-bold text-slate-900">{val} kg</span> },
    { key: "finenessSetting", header: "درجة النعومة", headerEn: "Fineness" },
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
          onClick={() => deleteGrindingExpense(row.id)}
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
          {isAr ? "قسم طحن البن والتوابل الصناعي" : "GRINDING WORKSTATION & MILL CONTROL"}
        </span>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Layers2 className="w-8 h-8 text-indigo-600" />
          {isAr ? "قسم الطاحونة" : "Grinding Department"}
        </h1>
      </div>

      {/* Touch-friendly Navigation */}
      <div className="grid grid-cols-3 gap-3 bg-slate-100 p-2 rounded-2xl">
        <button
          onClick={() => setActiveTab("production")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "production" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "عمليات تشغيل المطاحن" : "Grinding Runs"}
        </button>

        <button
          onClick={() => setActiveTab("expenses")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "expenses" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "مصروفات الطاحونة المستقلة" : "Grinding Expenses"}
        </button>

        <button
          onClick={() => setActiveTab("costing")}
          className={`py-3.5 rounded-xl font-bold text-sm transition ${
            activeTab === "costing" ? "bg-indigo-600 text-white shadow-xs" : "bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {isAr ? "حساب التكاليف والإنتاج" : "Grinding Cost Sheet"}
        </button>
      </div>

      {/* Production Runs Log */}
      {activeTab === "production" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* New Grinding Run */}
          <form onSubmit={handleGrindingSubmit} className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">
              {isAr ? "تسجيل تشغيل طاحونة جديدة" : "Record Grinding Run"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "البن المحمص المراد طحنه *" : "Roasted Coffee Bean *"}</label>
                <select
                  value={recipeId}
                  onChange={(e) => setRecipeId(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-bold"
                  required
                >
                  <option value="">{isAr ? "--- اختر نوع البن المحمص ---" : "--- Select Roasted ---"}</option>
                  {roastedBeans.map(r => (
                    <option key={r.id} value={r.id}>{r.nameAr}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "وزن البن المحمص (كغم) *" : "Roasted weight (kg) *"}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={inputWeight || ""}
                    onChange={(e) => setInputWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "الوزن المطحون الناتج (كغم) *" : "Ground weight (kg) *"}</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 49.8"
                    value={outputWeight || ""}
                    onChange={(e) => setOutputWeight(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded border border-slate-200 font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "المطحنة المستخدمة" : "Grinder Machine"}</label>
                  <select
                    value={machineId}
                    onChange={(e) => setMachineId(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="Mahlkönig DK27">Mahlkönig DK27</option>
                    <option value="Ditting KFA1403">Ditting KFA1403</option>
                    <option value="Bunn G3">Bunn G3</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-500 block">{isAr ? "درجة النعومة" : "Fineness Setting"}</label>
                  <select
                    value={fineness}
                    onChange={(e) => setFineness(e.target.value)}
                    className="w-full p-2 rounded border border-slate-200 text-xs bg-slate-50"
                  >
                    <option value="Fine (Turkish)">ناعم جداً (قهوة تركية / سعودية)</option>
                    <option value="Medium (Espresso)">ناعم (إسبريسو)</option>
                    <option value="Coarse (Filter)">خشن (فلتر / كولد برو)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "المطحن المسؤول" : "Grinding Operator"}</label>
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-xs flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isAr ? "قيد وجبة الطحن بالدفتر" : "Post Grinding Run"}</span>
            </button>
          </form>

          {/* History */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
              {isAr ? "سجل وجبات الطحن السابقة" : "Previous Grinding Runs"}
            </h3>
            <ERPTable
              data={grindingJobs}
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
              {isAr ? "تقييد مصروف طاحونة جديد" : "New Grinding Expense"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "نوع المصروف" : "Expense Type"}</label>
                <select
                  value={expType}
                  onChange={(e) => setExpType(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-bold"
                >
                  <option value="استهلاك طاقة كهربائية">استهلاك طاقة كهربائية</option>
                  <option value="صيانة شفرات طحن">صيانة شفرات وأحجار طحن</option>
                  <option value="تنظيف وحفظ عازل">مستلزمات نظافة وفصل</option>
                  <option value="أجور عمال تشغيل">أجور عمال إنتاج طحن</option>
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
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition text-xs"
            >
              {isAr ? "قيد وإثبات المصروف" : "Record Expense"}
            </button>
          </form>

          {/* Expenses Log */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2 mb-3">
              {isAr ? "دفتر مصروفات الطاحونة" : "Grinding Expense Ledger"}
            </h3>
            <ERPTable
              data={grindingExpenses}
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
            <h3 className="font-extrabold text-slate-800 text-lg">{isAr ? "كشف حساب تكاليف تشغيل الطاحونة المستقل" : "Independent Grinding Cost sheet"}</h3>
            <p className="text-xs text-slate-400 mt-1">{isAr ? "يحتسب هذا الكشف مصروفات الطحن المباشرة المخصصة لقسم طحن البن والتوابل." : "Cost analysis of dedicated power usage and blade maintenance in the grinding department."}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي الوزن المطحون" : "Total Ground Weight"}</span>
              <span className="text-lg font-black font-mono text-slate-900 mt-2">{totalGroundWeight.toLocaleString()} kg</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between">
              <span className="text-xs font-bold text-slate-400 block">{isAr ? "إجمالي مصروفات الطاحونة" : "Grinding Expenses"}</span>
              <span className="text-lg font-black font-mono text-rose-600 mt-2">SAR {totalGrindingExpenses.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5 text-xs text-slate-700 leading-normal">
            <h4 className="font-extrabold text-slate-900 text-sm mb-2">{isAr ? "تكلفة الطحن المضافة لكل كيلو" : "Added Grinding Cost per kg"}</h4>
            <p className="text-lg font-extrabold text-indigo-900 font-mono">SAR {costPerKgGround} / kg</p>
            <p className="mt-1 text-[11px] text-slate-500">{isAr ? "هذا المعدل يمثل تكلفة الطاقة الكهربائية وصيانة الشفرات الموزعة لكل كيلو بن أو توابل يتم طحنه في المصنع." : "Represents active electricity usage and mechanical grinding wheel cost distributed evenly per ground kilogram."}</p>
          </div>
        </div>
      )}
    </div>
  );
}
