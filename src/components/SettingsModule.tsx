import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Sliders, Save, Database, RotateCcw } from "lucide-react";
import PageHeader from "./common/PageHeader";
import ConfirmDialog from "./common/ConfirmDialog";
import FormSection from "./common/FormSection";
import FormField from "./common/FormField";

interface SettingsProps {
  language?: "ar" | "en";
}

export default function SettingsModule({ language = "ar" }: SettingsProps) {
  const isAr = language === "ar";
  const { companySettings, setCompanySettings, createBackup, resetToDefault, addToast } = useAppState();

  const [nameAr, setNameAr] = useState(companySettings.nameAr);
  const [taxNumber, setTaxNumber] = useState(companySettings.taxNumber);
  const [address, setAddress] = useState(companySettings.address);
  const [vatRate, setVatRate] = useState(companySettings.taxConfiguration.vatRate * 100);
  const [showResetDialog, setShowResetDialog] = useState(false);

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
      message: "تم حفظ الإعدادات وتحديث بيانات الشركة والفواتير بنجاح.",
      messageEn: "Company settings updated successfully."
    });
  };

  return (
    <div className="space-y-6">
      {/* Standardized Page Header */}
      <PageHeader
        title="الإعدادات العامة وتهيئة المنشأة"
        titleEn="System Preferences & Tax Setup"
        description="ضبط الهوية المؤسسية، بيانات الربط الضريبي (ZATCA)، والنسخ الاحتياطي لقاعدة البيانات."
        descriptionEn="Configure corporate identities, ZATCA tax numbers, VAT rates, and disaster recovery backups."
        icon={Sliders}
        breadcrumbs={[
          { label: "الإعدادات والتدقيق", labelEn: "Settings & System" },
          { label: "الإعدادات العامة", labelEn: "System Preferences", active: true }
        ]}
        language={language}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Company Settings Form */}
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-4">
          <FormSection
            title="بيانات المنشأة والربط مع هيئة الزكاة والضريبة والجمارك"
            titleEn="Corporate Details & Tax Settings"
            description="البيانات التي تظهر على الفواتير الضريبية والإيصالات المبسطة."
            descriptionEn="Information reflected on tax invoices and simplified POS receipts."
            language={language}
          >
            <div className="space-y-4">
              <FormField
                label="الاسم التجاري للمنشأة بالعربية"
                labelEn="Commercial Trade Name (Arabic)"
                required
                language={language}
              >
                <input
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white transition"
                  required
                />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  label="رقم تسجيل ضريبة القيمة المضافة"
                  labelEn="VAT Registration ID"
                  required
                  hint={isAr ? "الرقم الضريبي المكون من 15 خانة" : "15-digit Tax Number"}
                  language={language}
                >
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white transition"
                    required
                  />
                </FormField>

                <FormField
                  label="معدل ضريبة القيمة المضافة (%)"
                  labelEn="Standard VAT Rate (%)"
                  required
                  language={language}
                >
                  <input
                    type="number"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 15)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white transition"
                    required
                  />
                </FormField>
              </div>

              <FormField
                label="العنوان الوطني والمستودع الرئيسي"
                labelEn="National Address & Primary Warehouse"
                required
                language={language}
              >
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-xs text-slate-900 focus:outline-hidden focus:border-teal-500 focus:bg-white transition"
                  required
                />
              </FormField>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs text-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>{isAr ? "حفظ التحديثات" : "Save Settings"}</span>
                </button>
              </div>
            </div>
          </FormSection>
        </form>

        {/* Database backup & Disaster Recovery */}
        <div className="lg:col-span-5 space-y-4">
          <FormSection
            title="الأمان والنسخ الاحتياطي لقاعدة البيانات"
            titleEn="Data Safety & Storage"
            description="حفظ نسخة كاملة من دفاتر الأستاذ والمخزون والعملاء."
            descriptionEn="Export full snapshots of all ledger records, accounts, and inventory."
            language={language}
          >
            <div className="space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed text-xs">
                {isAr 
                  ? "يقوم نظام نوفارو بتسجيل كافة الحركات والقيود في طبقة التخزين المستمر المحلية. ننصح بتصدير نسخة احتياطية بشكل دوري لحفظ السجلات المالية." 
                  : "Novaro ERP records all double-entry logs in continuous storage. We recommend periodic offline JSON backups."}
              </p>

              <button
                type="button"
                onClick={createBackup}
                className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Database className="w-4 h-4 text-teal-400" />
                <span>{isAr ? "إنشاء وتصدير نسخة احتياطية (JSON)" : "Export Backup File"}</span>
              </button>

              <div className="border-t border-slate-200/80 pt-4 mt-4 space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 text-rose-700">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? "إعادة تهيئة النظام للبذور الأولية" : "System Factory Reset"}</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  {isAr 
                    ? "سيقوم هذا الخيار بإعادة تهيئة السجلات إلى قاعدة البيانات الافتراضية المعتمدة ومسح الحركات التجريبية." 
                    : "Wipes local transactions and restores seed baseline data."}
                </p>
                
                <button
                  type="button"
                  onClick={() => setShowResetDialog(true)}
                  className="py-2 px-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold rounded-lg transition text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isAr ? "إعادة ضبط المصنع" : "Reset Database"}</span>
                </button>
              </div>
            </div>
          </FormSection>
        </div>
      </div>

      {/* Confirm Reset Dialog */}
      <ConfirmDialog
        isOpen={showResetDialog}
        title={isAr ? "إعادة تهيئة قاعدة البيانات" : "Reset Database to Factory State"}
        message={isAr ? "هل أنت متأكد تماماً من رغبتك في مسح كافة الحركات الحالية وإعادة تهيئة النظام لقاعدة البيانات الافتراضية؟ لا يمكن التراجع عن هذا الإجراء." : "Are you sure you want to restore initial sample database? All current local records will be reseeded."}
        confirmLabel={isAr ? "تأكيد إعادة التهيئة" : "Confirm Reset"}
        cancelLabel={isAr ? "إلغاء" : "Cancel"}
        variant="danger"
        onConfirm={() => {
          resetToDefault();
          setShowResetDialog(false);
        }}
        onCancel={() => setShowResetDialog(false)}
      />
    </div>
  );
}
