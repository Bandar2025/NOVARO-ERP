import React, { useState } from "react";
import { useAppState } from "../../context/StateContext";
import { 
  Languages, Menu, X, ShieldCheck, UserCheck, Bell, 
  Search, Calendar, Building2, Sparkles 
} from "lucide-react";
import { ActiveSection } from "./AppSidebar";

interface AppHeaderProps {
  activeSection: ActiveSection;
  language: "ar" | "en";
  onToggleLanguage: () => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
}

export default function AppHeader({
  activeSection,
  language,
  onToggleLanguage,
  mobileMenuOpen,
  onToggleMobileMenu
}: AppHeaderProps) {
  const isAr = language === "ar";
  const { currentUser, companySettings } = useAppState();

  const activePeriod = "2026-Q1 (مفتوحة)";
  const activePeriodEn = "2026-Q1 (Open)";

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-2.5 shadow-2xs">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Brand Indicator */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label={isAr ? "القائمة الرئيسية" : "Toggle Menu"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Current Enterprise Brand & Branch Chip */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 border border-slate-200">
              <Building2 className="w-3.5 h-3.5 text-teal-700" />
              <span>{companySettings.nameAr || "محمصة ومصنع نوفارو"}</span>
            </div>

            {/* Fiscal Period Indicator */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? `الفترة: ${activePeriod}` : `Period: ${activePeriodEn}`}</span>
            </div>
          </div>
        </div>

        {/* Right Side: Language Switcher, Audit Badge & User Profile */}
        <div className="flex items-center gap-2.5">
          {/* Audit Assurance Chip */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-lg text-xs font-bold border border-teal-250">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-mono text-[11px]">{isAr ? "ميزان متطابق 100%" : "Balanced 100%"}</span>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={onToggleLanguage}
            title={isAr ? "التبديل إلى الإنجليزية" : "Switch to Arabic"}
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            <Languages className="w-3.5 h-3.5 text-teal-700" />
            <span>{isAr ? "English" : "عربي"}</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-1 pr-2 py-1 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : "NV"}
            </div>
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-800 leading-none">
                {currentUser?.name || (isAr ? "المشرف العام" : "Administrator")}
              </div>
              <span className="text-[10px] text-teal-700 font-medium">
                {currentUser?.role || (isAr ? "إدارة العمليات" : "Operations")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
