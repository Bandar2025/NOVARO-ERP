import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import { Building2, Calculator, FileBarChart, Play } from "lucide-react";

interface FixedAssetsAgingModuleProps {
  initialTab?: "fixed_assets" | "depreciation" | "customer_aging" | "supplier_aging";
  language?: "ar" | "en";
}

export default function FixedAssetsAgingModule({
  initialTab = "fixed_assets",
  language = "ar"
}: FixedAssetsAgingModuleProps) {
  const isAr = language === "ar";
  const {
    fixedAssets,
    customers,
    suppliers,
    addFixedAsset,
    runDepreciationCycle,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [showAddAsset, setShowAddAsset] = useState(false);

  const [code, setCode] = useState("FA-NEW-004");
  const [nameAr, setNameAr] = useState("");
  const [category, setCategory] = useState<"Machinery" | "Vehicles" | "Buildings" | "IT_Equipment">("Machinery");
  const [acquisitionCost, setAcquisitionCost] = useState<number>(65000);
  const [salvageValue, setSalvageValue] = useState<number>(5000);
  const [usefulLifeYears, setUsefulLifeYears] = useState<number>(8);
  const [location, setLocation] = useState("صالة التحميص - الدمام");

  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleCreateAsset = (e: React.FormEvent) => {
    e.preventDefault();
    addFixedAsset({
      code,
      name: nameAr,
      nameAr,
      category,
      purchaseDate: new Date().toISOString().split("T")[0],
      acquisitionCost,
      salvageValue,
      usefulLifeYears,
      location
    });
    setShowAddAsset(false);
    addToast({ type: "success", message: "تم تسجيل الأصل الثابت بنجاح في سجل الأصول" });
  };

  const handleRunDepreciation = () => {
    const res = runDepreciationCycle("2026-07");
    if (res.success) {
      addToast({
        type: "success",
        message: `تم احتساب وترحيل قيد إهلاك الأصول الثابتة بقيمة SAR ${res.totalDepreciated?.toLocaleString()} إلى دفتر الأستاذ العام!`,
        messageEn: `Depreciation posted: SAR ${res.totalDepreciated?.toLocaleString()}`
      });
    } else {
      addToast({ type: "warning", message: res.error || "لا توجد أصول قابلة للإهلاك" });
    }
  };

  const assetCols: ColumnDef[] = [
    { key: "code", header: "كود الأصل", headerEn: "Asset Code", render: (v) => <span className="font-mono font-bold text-teal-800">{v}</span> },
    { key: "nameAr", header: "بيان الأصل الثابت", headerEn: "Asset Name" },
    { key: "category", header: "الفئة", headerEn: "Category" },
    { key: "purchaseDate", header: "تاريخ الشراء", headerEn: "Purchase Date" },
    {
      key: "acquisitionCost",
      header: "التكلفة التاريخية",
      headerEn: "Cost",
      render: (v) => <span className="font-mono font-bold">SAR {Number(v).toLocaleString()}</span>
    },
    {
      key: "accumulatedDepreciation",
      header: "مجمع الإهلاك",
      headerEn: "Accum. Dep.",
      render: (v) => <span className="font-mono text-rose-700">SAR {Number(v).toLocaleString()}</span>
    },
    {
      key: "bookValue",
      header: "صافي القيمة الدفترية",
      headerEn: "Net Book Value",
      render: (v) => <span className="font-mono font-black text-emerald-700">SAR {Number(v).toLocaleString()}</span>
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الأصول الثابتة، الإهلاك، وأعمار الذمم"
        titleEn="Fixed Assets, Depreciation & AR/AP Aging"
        description="متابعة سجل الآلات والمحامص، احتساب وترحيل أقساط الإهلاك الدوري، وتحليل أعمار ديون العملاء والموردين."
        descriptionEn="Track factory machinery, run automated depreciation schedules, and analyze customer/supplier aging buckets."
        icon={Building2}
        breadcrumbs={[
          { label: "الأصول الثابتة والائتمان", labelEn: "Fixed Assets & Aging" },
          { label: "السجل المالي للأصول والذمم", labelEn: "Assets & Aging Schedules", active: true }
        ]}
        language={language}
      />

      <GlobalActionBar
        onNew={activeTab === "fixed_assets" ? () => setShowAddAsset(true) : undefined}
        newLabelAr="إضافة أصل ثابت جديد"
        newLabelEn="Add Fixed Asset"
        extraActions={[
          {
            id: "run-dep",
            labelAr: "احتساب وترحيل قيد الإهلاك الشهري",
            labelEn: "Run Monthly Depreciation & Post GL",
            icon: Play,
            variant: "primary",
            onClick: handleRunDepreciation
          }
        ]}
        pageId="accounting"
        language={language}
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: "fixed_assets", ar: "دليل الأصول الثابتة", en: "Fixed Assets Register", icon: Building2 },
          { id: "depreciation", ar: "جداول وحساب الإهلاك", en: "Depreciation Schedule", icon: Calculator },
          { id: "customer_aging", ar: "أعمار ديون العملاء (AR Aging)", en: "Customer Aging", icon: FileBarChart },
          { id: "supplier_aging", ar: "أعمار ذمم الموردين (AP Aging)", en: "Supplier Aging", icon: FileBarChart }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-teal-600" />
              <span>{isAr ? tab.ar : tab.en}</span>
            </button>
          );
        })}
      </div>

      {showAddAsset && activeTab === "fixed_assets" && (
        <form onSubmit={handleCreateAsset} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
            {isAr ? "تسجيل أصل ثابت جديد (آلات ومعدات صناعية)" : "Register New Fixed Asset"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <input
              type="text"
              placeholder="Asset Code *"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
            />
            <input
              type="text"
              placeholder={isAr ? "اسم الأصل بالعربية *" : "Asset Name *"}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              required
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
            >
              <option value="Machinery">Machinery (آلات ومحامص)</option>
              <option value="Vehicles">Vehicles (أسطول النقل)</option>
              <option value="Buildings">Buildings (مباني وتجهيزات)</option>
              <option value="IT_Equipment">IT Equipment (أنظمة وأجهزة)</option>
            </select>
            <input
              type="number"
              placeholder={isAr ? "تكلفة الشراء (ريال)" : "Acquisition Cost"}
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
            />
            <input
              type="number"
              placeholder={isAr ? "قيمة الخردة" : "Salvage Value"}
              value={salvageValue}
              onChange={(e) => setSalvageValue(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
            />
            <input
              type="number"
              placeholder={isAr ? "العمر الإنتاجي (سنوات)" : "Useful Life (Years)"}
              value={usefulLifeYears}
              onChange={(e) => setUsefulLifeYears(Number(e.target.value))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddAsset(false)} className="px-4 py-1.5 border border-slate-300 rounded-lg text-xs font-bold">
              {isAr ? "إلغاء" : "Cancel"}
            </button>
            <button type="submit" className="px-4 py-1.5 bg-teal-700 text-white rounded-lg text-xs font-bold">
              {isAr ? "حفظ الأصل" : "Save Asset"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {(activeTab === "fixed_assets" || activeTab === "depreciation") && (
          <ERPTable data={fixedAssets} columns={assetCols} language={language} />
        )}

        {activeTab === "customer_aging" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {isAr ? "تقرير أعمار الديون للعملاء (Accounts Receivable Aging)" : "Customer AR Aging Schedule"}
            </h3>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-right">{isAr ? "العميل" : "Customer"}</th>
                  <th className="py-2.5 px-3 text-right">0–30 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">31–60 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">61–90 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">+90 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "إجمالي المديونية" : "Total Balance"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {customers.map((c) => {
                  const b0_30 = Math.round(c.balance * 0.65 * 100) / 100;
                  const b31_60 = Math.round(c.balance * 0.25 * 100) / 100;
                  const b61_90 = Math.round((c.balance - b0_30 - b31_60) * 100) / 100;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{isAr ? c.nameAr : c.name}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700">SAR {b0_30.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-700">SAR {b31_60.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-rose-700">SAR {b61_90.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">SAR 0.00</td>
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">SAR {c.balance.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "supplier_aging" && (
          <div className="space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-2">
              {isAr ? "تقرير أعمار ذمم الموردين (Accounts Payable Aging)" : "Supplier AP Aging Schedule"}
            </h3>
            <table className="w-full text-xs">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-right">{isAr ? "المورد" : "Supplier"}</th>
                  <th className="py-2.5 px-3 text-right">0–30 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">31–60 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">61–90 {isAr ? "يوم" : "Days"}</th>
                  <th className="py-2.5 px-3 text-right">{isAr ? "إجمالي الاستحقاق" : "Total Payable"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {suppliers.map((s) => {
                  const b0_30 = Math.round(s.balance * 0.7 * 100) / 100;
                  const b31_60 = Math.round((s.balance - b0_30) * 100) / 100;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{isAr ? s.nameAr : s.name}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-700">SAR {b0_30.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-amber-700">SAR {b31_60.toLocaleString()}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">SAR 0.00</td>
                      <td className="py-2.5 px-3 font-mono font-black text-slate-900">SAR {s.balance.toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
