import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Coffee, ShieldAlert, CheckCircle, Sliders, DollarSign, Calendar, Save, Trash2, Database } from "lucide-react";

interface SettingsProps {
  language?: "ar" | "en";
}

export default function SettingsModule({ language = "ar" }: SettingsProps) {
  const isAr = language === "ar";
  const { companySettings, setCompanySettings, createBackup, backups, resetToDefault, addToast } = useAppState();

  const [nameAr, setNameAr] = useState(companySettings.nameAr);
  const [taxNumber, setTaxNumber] = useState(companySettings.taxNumber);
  const [address, setAddress] = useState(companySettings.address);
  const [vatRate, setVatRate] = useState(companySettings.taxConfiguration.vatRate * 100);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setCompanySettings(prev => ({
      ...prev,
      nameAr,
      taxNumber,
      address,
      taxConfiguration: {
        vatRate: vatRate / 100
      }
    }));

    addToast({
      type: "success",
      message: "تم حفظ الإعدادات بنجاح تالٍ للشركة والمستندات.",
      messageEn: "Company settings updated successfully."
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="border-b border-slate-200 pb-5">
        <span className="text-xs uppercase font-bold text-amber-600 tracking-wider font-mono">
          {isAr ? "إعدادات المصنع المتقدمة والربط الضريبي" : "SYSTEM SETTINGS & ENTERPRISE PREFERENCES"}
        </span>
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Sliders className="w-8 h-8 text-teal-700" />
          {isAr ? "الإعدادات العامة" : "Settings Department"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Company Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">{isAr ? "بيانات المنشأة والربط مع هيئة الزكاة والضريبة والجمارك" : "Corporate Details & Tax Settings"}</h3>
          
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-500 block">{isAr ? "الاسم التجاري للمحمصة بالعربية" : "Roastery Brand (Arabic)"}</label>
              <input
                type="text"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "رقم تسجيل ضريبة القيمة المضافة" : "VAT Tax ID"}</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-500 block">{isAr ? "معدل ضريبة القيمة المضافة (%)" : "VAT Rate (%)"}</label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value) || 15)}
                  className="w-full p-2.5 rounded border border-slate-200 bg-slate-50 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-500 block">{isAr ? "العنوان الوطني والمستودع الرئيسي" : "National Address & Corporate HQ"}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded border border-slate-200 bg-slate-50"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{isAr ? "حفظ التحديثات" : "Save Settings"}</span>
          </button>
        </form>

        {/* Database backup */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4 text-xs text-slate-700">
          <h3 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-2">{isAr ? "الأمان والنسخ الاحتياطي" : "Data Safety & Storage"}</h3>
          
          <p className="leading-relaxed">
            {isAr ? "يقوم النظام تلقائياً بتخزين قاعدة بيانات نوفارو ودفاتر العمليات داخل متصفحكم المحلي بشكل آمن ومشفر. ننصح بحفظ نسخة احتياطية بشكل دوري." : "Your database is securely saved locally. We highly recommend issuing standard offline backups regularly."}
          </p>

          <button
            type="button"
            onClick={createBackup}
            className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
          >
            <Database className="w-4 h-4" />
            <span>{isAr ? "إنشاء نسخة احتياطية جديدة" : "Export Backup File"}</span>
          </button>

          <div className="border-t border-slate-100 pt-3 mt-4 space-y-2">
            <h4 className="font-extrabold text-slate-900">{isAr ? "إعادة تهيئة النظام" : "System Reset"}</h4>
            <p className="text-[11px] text-slate-500">{isAr ? "سيقوم هذا الخيار بمسح كافة حركات الصناديق والمبيعات التي تم إضافتها وإعادة المصنع لحالة التهيئة الأولية للبذور المعتمدة." : "Will wipe all recorded sales, expenses, and cash entries and reseed database."}</p>
            
            <button
              type="button"
              onClick={() => {
                if (confirm(isAr ? "هل أنت متأكد من مسح كافة العمليات الحالية وإعادة تشغيل النظام للبذور المعتمدة؟" : "Reset system?")) {
                  resetToDefault();
                }
              }}
              className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg transition text-[11px]"
            >
              {isAr ? "مسح قاعدة البيانات وإعادة التهيئة" : "Reset Database"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
