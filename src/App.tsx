import React, { useState } from "react";
import { StateProvider } from "./context/StateContext";
import DashboardOverview from "./components/DashboardOverview";
import AccountingModule from "./components/AccountingModule";
import CustomersModule from "./components/CustomersModule";
import CustomerLedgerModule from "./components/CustomerLedgerModule";
import SuppliersModule from "./components/SuppliersModule";
import PurchasesModule from "./components/PurchasesModule";
import SalesModule from "./components/SalesModule";
import WholesaleModule from "./components/WholesaleModule";
import InventoryModule from "./components/InventoryModule";
import ProductionModule from "./components/ProductionModule";
import RoasteryModule from "./components/RoasteryModule";
import GrindingModule from "./components/GrindingModule";
import PosModule from "./components/PosModule";
import CashboxModule from "./components/CashboxModule";
import ReportsModule from "./components/ReportsModule";
import SettingsModule from "./components/SettingsModule";

import { 
  Layers, BookOpen, Truck, Package, Flame, 
  ShoppingCart, FileText, Info, Menu, X, Coffee, ShieldAlert,
  Users, Layers2, Landmark, Languages
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ActiveSection = 
  | "overview" 
  | "accounting" 
  | "customers" 
  | "customerLedger"
  | "suppliers" 
  | "purchases" 
  | "sales" 
  | "wholesale"
  | "inventory" 
  | "production" 
  | "roastery"
  | "grinding"
  | "pos" 
  | "cashbox"
  | "reports"
  | "settings";

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  const isAr = language === "ar";

  const navigationItems = [
    {
      id: "overview" as ActiveSection,
      label: "Control Dashboard",
      arabic: "لوحة التحكم الرئيسية",
      icon: Layers,
      description: "Live factory telemetry, logs and KPIs.",
      descriptionAr: "القياس عن بعد وحالة المصنع الفورية."
    },
    {
      id: "accounting" as ActiveSection,
      label: "Accounting Ledger",
      arabic: "دفتر الأستاذ والقيود",
      icon: BookOpen,
      description: "General ledger & double-entry voucher builder.",
      descriptionAr: "إدارة شجرة الحسابات والقيود المزدوجة."
    },
    {
      id: "customers" as ActiveSection,
      label: "CRM Customers",
      arabic: "إدارة العملاء والائتمان",
      icon: Users,
      description: "Clients register and custom balances.",
      descriptionAr: "بيانات العملاء والأرصدة المستحقة."
    },
    {
      id: "customerLedger" as ActiveSection,
      label: "Customer Ledger",
      arabic: "سجل حسابات العملاء",
      icon: BookOpen,
      description: "Customer specific transactions.",
      descriptionAr: "معاملات العملاء الخاصة."
    },
    {
      id: "suppliers" as ActiveSection,
      label: "SRM Suppliers",
      arabic: "إدارة الموردين",
      icon: Users,
      description: "Suppliers profile, balances and details.",
      descriptionAr: "عناوين الموردين وتوريد المواد الخام."
    },
    {
      id: "purchases" as ActiveSection,
      label: "Supplier Invoices",
      arabic: "فواتير المشتريات",
      icon: Truck,
      description: "Purchasing orders, raw materials cargo.",
      descriptionAr: "قيد المشتريات وإيداع المواد للمستودعات."
    },
    {
      id: "sales" as ActiveSection,
      label: "Sales Invoices",
      arabic: "فواتير المبيعات",
      icon: ShoppingCart,
      description: "General sales invoices.",
      descriptionAr: "فواتير المبيعات العامة."
    },
    {
      id: "wholesale" as ActiveSection,
      label: "Wholesale Invoices",
      arabic: "مبيعات الجملة",
      icon: ShoppingCart,
      description: "B2B sales dispatching and wholesale trade.",
      descriptionAr: "توزيع مبيعات الجملة وخصم المخزون."
    },
    {
      id: "inventory" as ActiveSection,
      label: "Warehouse Stock",
      arabic: "إدارة المستودعات والوجبات",
      icon: Package,
      description: "Item catalog, FIFO lot batching and barcode studio.",
      descriptionAr: "كتالوج المواد الخام وتتبع FIFO للوجبات."
    },
    {
      id: "production" as ActiveSection,
      label: "Production Floor",
      arabic: "صالة الإنتاج",
      icon: Flame,
      description: "General production monitoring.",
      descriptionAr: "مراقبة الإنتاج العام."
    },
    {
      id: "roastery" as ActiveSection,
      label: "Roastery",
      arabic: "وحدة التحميص",
      icon: Flame,
      description: "Roasting kiln operations.",
      descriptionAr: "عمليات فرن التحميص."
    },
    {
      id: "grinding" as ActiveSection,
      label: "Grinding",
      arabic: "وحدة الطحن",
      icon: Flame,
      description: "Grinding machine operations.",
      descriptionAr: "عمليات آلة الطحن."
    },
    {
      id: "pos" as ActiveSection,
      label: "Retail POS Terminal",
      arabic: "كاشير نقاط البيع",
      icon: ShoppingCart,
      description: "Active checkout register and printer receipts.",
      descriptionAr: "نقطة بيع سريعة، احتساب ضريبة وحفظ الفواتير."
    },
    {
      id: "cashbox" as ActiveSection,
      label: "Cashbox",
      arabic: "صندوق الكاش",
      icon: Landmark,
      description: "Cash transactions and balance.",
      descriptionAr: "معاملات النقد والرصيد."
    },
    {
      id: "reports" as ActiveSection,
      label: "Financial Statements",
      arabic: "التقارير المالية والتحليلية",
      icon: FileText,
      description: "Balance sheet assets ledger and YTD profit margins.",
      descriptionAr: "الميزانية العمومية، وقائمة الدخل والأرباح."
    },
    {
      id: "settings" as ActiveSection,
      label: "Settings",
      arabic: "الإعدادات",
      icon: Layers2,
      description: "System configurations.",
      descriptionAr: "إعدادات النظام."
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return <DashboardOverview language={language} />;
      case "accounting":
        return <AccountingModule language={language} />;
      case "customers":
        return <CustomersModule language={language} />;
      case "customerLedger":
        return <CustomerLedgerModule language={language} />;
      case "suppliers":
        return <SuppliersModule language={language} />;
      case "purchases":
        return <PurchasesModule language={language} />;
      case "sales":
        return <SalesModule language={language} />;
      case "wholesale":
        return <WholesaleModule language={language} />;
      case "inventory":
        return <InventoryModule language={language} />;
      case "production":
        return <ProductionModule language={language} />;
      case "roastery":
        return <RoasteryModule language={language} />;
      case "grinding":
        return <GrindingModule language={language} />;
      case "pos":
        return <PosModule language={language} />;
      case "cashbox":
        return <CashboxModule language={language} />;
      case "reports":
        return <ReportsModule language={language} />;
      case "settings":
        return <SettingsModule language={language} />;
      default:
        return <DashboardOverview language={language} />;
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "ar" ? "en" : "ar"));
  };

  return (
    <StateProvider>
      <div 
        dir={isAr ? "rtl" : "ltr"} 
        className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-teal-500/10 selection:text-teal-900 transition-all duration-300"
      >
        
        {/* Top Audit Banner Warning */}
        <div className="bg-slate-900 text-slate-100 border-b border-slate-800 px-4 py-2 text-center text-xs flex items-center justify-center gap-2">
          <Info className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
          <span className="font-medium">
            {isAr ? (
              <span>
                <strong className="text-amber-300 font-extrabold">الرقابة المالية النشطة:</strong> جميع حركة المستودعات ترحل تلقائياً إلى شجرة الحسابات العامة لضمان ميزان المراجعة والمطابقة الفورية.
              </span>
            ) : (
              <span>
                <strong className="text-amber-300 font-bold">Audit Assurance Active:</strong> All warehouse lots are dynamically linked to double-entry general ledgers via transactional sub-ledgers.
              </span>
            )}
          </span>
        </div>

        {/* Main Framework Layout */}
        <div className="flex-1 flex flex-col md:flex-row">
          
          {/* Sidebar Navigation */}
          <aside className="hidden md:flex md:w-80 flex-col bg-slate-950 border-r border-slate-900 p-6 space-y-6">
            
            {/* Sidebar Brand and Language Switcher */}
            <div className="flex items-center justify-between pb-5 border-b border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-teal-700 rounded-lg flex items-center justify-center text-white font-black text-base shadow-lg shadow-teal-700/20">
                  NV
                </div>
                <div>
                  <h2 className="text-xs font-sans font-black tracking-tight text-white uppercase">
                    {isAr ? "نوفارو ERP" : "Novaro ERP Suite"}
                  </h2>
                  <span className="text-[9px] font-mono text-teal-400 uppercase font-bold tracking-widest block">
                    {isAr ? "إصدار المؤسسات الصناعية" : "Enterprise Edition"}
                  </span>
                </div>
              </div>

              {/* Language Switcher Badge */}
              <button
                onClick={toggleLanguage}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-300 hover:bg-slate-850 hover:text-white transition flex items-center gap-1 text-[10px] font-bold"
              >
                <Languages className="w-3.5 h-3.5" />
                <span>{isAr ? "EN" : "عربي"}</span>
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              {/* Sidebar Links */}
              <nav className="space-y-1">
                <div className="px-3 pb-2 text-[9px] uppercase tracking-widest text-slate-500 font-bold">
                  {isAr ? "محطات العمل والأنشطة" : "Suite Workstations"}
                </div>
                <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                  {navigationItems.map((item) => {
                    const isActive = activeSection === item.id;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveSection(item.id)}
                        className={`w-full text-right px-4 py-2 rounded-lg flex items-start gap-3 transition-all ${
                          isActive
                            ? "text-teal-400 bg-slate-900 font-bold border-r-4 border-teal-500"
                            : "bg-transparent border-transparent hover:text-white hover:bg-slate-900/40 text-slate-400 font-medium"
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-1 flex-shrink-0 ${isActive ? "text-teal-400" : "text-slate-500"}`} />
                        <div className="space-y-0.5 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold text-slate-200">{isAr ? item.arabic : item.label}</span>
                          </div>
                          <p className="text-[9px] text-slate-500 line-clamp-1">{isAr ? item.descriptionAr : item.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Sidebar Information Card */}
              <div className="p-4 bg-slate-900 border border-slate-850 rounded-xl space-y-2 text-right">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider justify-end">
                  <Coffee className="w-3.5 h-3.5 text-amber-500" /> 
                  <span>{isAr ? "التحميص والتوزيع الآلي" : "Roasting Automation"}</span>
                </div>
                <p className="text-[9px] text-slate-500 leading-normal">
                  {isAr 
                    ? "ينسق نظام نوفارو متطلبات الهيئة العامة للغذاء والدواء وتتبع الوجبات FIFO ومطابقة الموازين في التحميص آلياً."
                    : "Novaro orchestrates food safety regulations, lot tracing limits, weight variance margins, and point-of-sale receipt dispatching."
                  }
                </p>
              </div>
            </div>
          </aside>

          {/* Mobile Navigation Header */}
          <header className="md:hidden bg-slate-950 border-b border-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-teal-700 rounded flex items-center justify-center text-white font-bold text-xs">
                NV
              </div>
              <h2 className="text-xs font-sans font-bold uppercase tracking-wider text-white">
                {isAr ? "نوفارو ERP" : "Novaro ERP"}
              </h2>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mobile Language Button */}
              <button
                onClick={toggleLanguage}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300"
              >
                {isAr ? "EN" : "عربي"}
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg bg-slate-900 text-slate-300"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Mobile Drawer Menu */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="md:hidden bg-slate-950 border-b border-slate-900 px-4 py-4 space-y-2 text-right"
              >
                {navigationItems.map((item) => {
                  const isActive = activeSection === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-right p-3 rounded-xl flex items-center gap-3 transition ${
                        isActive
                          ? "bg-slate-900 text-teal-400"
                          : "hover:bg-slate-900/40 text-slate-400"
                      }`}
                    >
                      <Icon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{isAr ? item.arabic : item.label}</div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Module Content View */}
          <main className="flex-1 bg-slate-50 p-6 md:p-8 overflow-y-auto min-h-[500px]">
            <div className="max-w-6xl mx-auto">
              {renderActiveSection()}
            </div>
          </main>

        </div>

        {/* Corporate Footer */}
        <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-[9px] text-slate-400 font-bold font-mono uppercase tracking-widest">
          {isAr 
            ? "نظام نوفارو السحابي المعتمد للمصانع والتحميص © 2026. كافة حقوق العمليات والدفاتر مقيدة ومحمية."
            : "Novaro ERP Suite © 2026. Certified Double-Entry Roasting & Logistics Core. Designed for spice and coffee industrial hubs."
          }
        </footer>

      </div>
    </StateProvider>
  );
}
