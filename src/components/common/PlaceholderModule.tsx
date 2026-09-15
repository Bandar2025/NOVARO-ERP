import React from "react";
import { Clock, ShieldAlert, Sparkles, Layers } from "lucide-react";

interface PlaceholderModuleProps {
  titleAr: string;
  titleEn: string;
  domainAr: string;
  domainEn: string;
  language?: "ar" | "en";
}

export default function PlaceholderModule({
  titleAr,
  titleEn,
  domainAr,
  domainEn,
  language = "ar"
}: PlaceholderModuleProps) {
  const isAr = language === "ar";

  return (
    <div className="space-y-6">
      {/* Enterprise Empty State Card */}
      <div className="bg-white border border-slate-250 rounded-2xl p-8 md:p-12 shadow-xs text-center max-w-3xl mx-auto my-12 space-y-6">
        <div className="w-16 h-16 bg-teal-50 border border-teal-200 text-teal-700 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Layers className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>{isAr ? "مخطط للتنفيذ في المراحل القادمة" : "Planned for Upcoming Roadmap"}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {isAr ? titleAr : titleEn}
          </h2>

          <p className="text-xs md:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? `هذه الوحدة ضمن خارطة طريق NOVARO ERP المتكاملة لقسم (${domainAr}) وسيتم تفعيل دورات العمل والمستندات الخاصة بها في المرحلة المخصصة لها وفق المعايير المحاسبية والمخزنية المعتمدة.`
              : `This module is part of the integrated NOVARO ERP roadmap for (${domainEn}) and its workflows and documents will be activated in its designated phase.`}
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto text-right text-xs text-slate-600 space-y-2">
          <div className="flex items-center justify-between font-bold text-slate-700 border-b border-slate-200 pb-2">
            <span>{isAr ? "حالة النظام:" : "System Status:"}</span>
            <span className="text-teal-700 font-mono">Navigation Placeholder (UI Ready)</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{isAr ? "القطاع الإداري:" : "Domain:"}</span>
            <span className="font-semibold">{isAr ? domainAr : domainEn}</span>
          </div>
          <div className="flex items-center justify-between">
            <span>{isAr ? "البيانات والتشغيل:" : "Data & Operations:"}</span>
            <span className="text-slate-500">{isAr ? "لا توجد بيانات وهمية (Strict No Mock Policy)" : "No Fake Data (Strict No Mock Policy)"}</span>
          </div>
        </div>

        <div className="pt-2">
          <span className="text-[11px] text-slate-400 font-mono">
            {isAr ? "نوفارو ERP — بنية المؤسسات الصناعية المتقدمة" : "Novaro ERP — Advanced Industrial Enterprise Architecture"}
          </span>
        </div>
      </div>
    </div>
  );
}
