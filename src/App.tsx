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
import ZatcaComplianceModule from "./components/ZatcaComplianceModule";
import SalesLifecycleModule from "./components/SalesLifecycleModule";
import ProcurementLifecycleModule from "./components/ProcurementLifecycleModule";
import TreasuryBanksModule from "./components/TreasuryBanksModule";
import WarehouseOperationsModule from "./components/WarehouseOperationsModule";
import FixedAssetsAgingModule from "./components/FixedAssetsAgingModule";
import EnterpriseOperationsModule from "./components/EnterpriseOperationsModule";
import AdminGovernanceModule from "./components/AdminGovernanceModule";

import AppSidebar, { ActiveSection, DOMAIN_GROUPS } from "./components/common/AppSidebar";
import AppHeader from "./components/common/AppHeader";
import ToastNotification from "./components/common/ToastNotification";
import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck } from "lucide-react";

export default function App() {
  const [activeSection, setActiveSection] = useState<ActiveSection>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<"ar" | "en">("ar");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const isAr = language === "ar";

  const toggleLanguage = () => {
    setLanguage(prev => (prev === "ar" ? "en" : "ar"));
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      // Core Operational Modules
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

      // Treasury & Banking Suite
      case "banks":
      case "bank_transactions":
      case "bank_reconciliation":
        return <TreasuryBanksModule initialTab={activeSection} language={language} />;

      // Sales Lifecycle Suite (Quotations -> Orders -> Delivery Notes -> Credit Notes -> Price Lists)
      case "sales_quotations":
      case "sales_orders":
      case "delivery_notes":
      case "sales_returns":
      case "price_lists":
        return <SalesLifecycleModule initialTab={activeSection} language={language} />;

      // Procurement Lifecycle Suite (PR -> RFQ -> PO -> GRN -> Debit Notes)
      case "purchase_requests":
      case "rfq":
      case "purchase_orders":
      case "goods_receipt":
      case "purchase_returns":
        return <ProcurementLifecycleModule initialTab={activeSection} language={language} />;

      // Warehouse & Inventory Valuation Suite
      case "items":
      case "warehouses":
      case "stock_count":
      case "stock_transfers":
      case "stock_adjustments":
      case "stock_valuation":
        return <WarehouseOperationsModule initialTab={activeSection} language={language} />;

      // Fixed Assets, Depreciation & Aging Suite
      case "fixed_assets":
      case "depreciation":
      case "customer_aging":
      case "supplier_aging":
        return <FixedAssetsAgingModule initialTab={activeSection} language={language} />;

      // ZATCA Phase 1 & Phase 2 E-Invoicing & VAT Suite
      case "zatca":
      case "e_invoicing":
      case "vat_config":
        return <ZatcaComplianceModule initialTab={activeSection} language={language} />;

      // CRM, Projects/Cost Centers & HR/Payroll Suite
      case "crm_leads":
      case "crm_opportunities":
      case "crm_activities":
      case "projects":
      case "cost_centers":
      case "hr_employees":
      case "hr_attendance":
      case "hr_leave":
      case "hr_payroll":
        return <EnterpriseOperationsModule initialTab={activeSection} language={language} />;

      // Enterprise Governance, Fiscal Periods Lock, RBAC, Audit & Database Sync Suite
      case "admin_companies":
      case "admin_branches":
      case "admin_fiscal_years":
      case "admin_fiscal_periods":
      case "admin_users":
      case "admin_roles":
      case "admin_numbering":
      case "admin_audit_log":
      case "admin_backup":
      case "admin_sync_status":
        return <AdminGovernanceModule initialTab={activeSection} language={language} />;

      default:
        return <DashboardOverview language={language} />;
    }
  };

  return (
    <StateProvider>
      <div 
        dir={isAr ? "rtl" : "ltr"} 
        className="h-screen overflow-hidden bg-slate-100/60 font-sans text-slate-800 flex flex-col selection:bg-teal-500/15 selection:text-teal-900 transition-all duration-300"
      >
        {/* Realtime Toast Notifications Container */}
        <ToastNotification language={language} />

        {/* Top Operational Compliance Notice */}
        <div className="shrink-0 bg-slate-950 text-slate-200 border-b border-slate-900 px-4 py-1.5 text-center text-xs flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
          <span className="font-medium text-[11px]">
            {isAr ? (
              <span>
                <strong className="text-teal-400 font-black">الرقابة المحاسبية والمخزنية النشطة:</strong> جميع القيود وحركات الإهلاك وترحيل فواتير المبيعات والمشتريات مقيدة بدفاتر الأستاذ المزدوجة وفق معايير SOCPA / IFRS.
              </span>
            ) : (
              <span>
                <strong className="text-teal-400 font-bold">Audit Assurance Active:</strong> All warehouse lots and sales vouchers are continuously mapped to double-entry general ledgers in compliance with SOCPA / IFRS.
              </span>
            )}
          </span>
        </div>

        {/* Main Application Layout with Global Header and Responsive Navigation */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Unified System Top Header */}
          <AppHeader
            activeSection={activeSection}
            language={language}
            onToggleLanguage={toggleLanguage}
            mobileMenuOpen={mobileMenuOpen}
            onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
          />

          <div className="flex-1 flex min-h-0 overflow-hidden relative">
            {/* Standardized Enterprise Sidebar */}
            <AppSidebar
              activeSection={activeSection}
              onSelectSection={(section) => {
                setActiveSection(section);
                setMobileMenuOpen(false);
              }}
              language={language}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(prev => !prev)}
            />

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
              {mobileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isAr ? 20 : -20 }}
                  className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs md:hidden flex"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div
                    className="w-4/5 max-w-sm bg-slate-950 h-full border-l border-slate-900 p-5 overflow-y-auto overscroll-contain space-y-6"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                      <div className="w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-black text-sm">
                        NV
                      </div>
                      <div>
                        <h2 className="text-sm font-black text-white">نوفارو ERP</h2>
                        <span className="text-[10px] text-teal-400 font-mono">Enterprise Suite</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {DOMAIN_GROUPS.map((group) => {
                        const GroupIcon = group.icon;
                        return (
                          <div key={group.id} className="space-y-1">
                            <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              <GroupIcon className="w-3.5 h-3.5 text-teal-500" />
                              <span>{isAr ? group.titleAr : group.titleEn}</span>
                            </div>
                            <div className="space-y-0.5">
                              {group.items.map((item) => {
                                const ItemIcon = item.icon;
                                const isActive = activeSection === item.id;
                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                      setActiveSection(item.id);
                                      setMobileMenuOpen(false);
                                    }}
                                    className={`w-full text-right px-3 py-2 rounded-lg text-xs font-bold flex items-center justify-between transition-colors ${
                                      isActive
                                        ? "bg-teal-700/20 text-teal-300 border border-teal-600/30"
                                        : "text-slate-400 hover:text-white hover:bg-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ItemIcon className="w-4 h-4" />
                                      <span>{isAr ? item.titleAr : item.titleEn}</span>
                                    </div>
                                    {item.badge ? (
                                      <span className="text-[9px] px-1.5 py-0.5 bg-teal-500/20 text-teal-300 rounded font-mono">
                                        {item.badge}
                                      </span>
                                    ) : item.isPlanned ? (
                                      <span className="text-[8px] px-1.5 py-0.5 bg-slate-900 text-slate-500 rounded">
                                        {isAr ? "مخطط" : "Planned"}
                                      </span>
                                    ) : null}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Central Workstation Content Canvas */}
            <main className="flex-1 h-full min-h-0 min-w-0 bg-slate-50/50 p-4 md:p-7 overflow-y-auto overscroll-contain">
              <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                {renderActiveSection()}
              </div>
            </main>
          </div>
        </div>

        {/* Standard Corporate Footer */}
        <footer className="shrink-0 bg-white border-t border-slate-200/80 px-6 py-2.5 text-center text-[10px] text-slate-500 font-semibold font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isAr ? "نوفارو ERP السحابي - متصل ومزامن لحظياً مع PGlite" : "Novaro ERP Cloud - Connected & Synchronized with PGlite"}</span>
          </div>
          <div>
            {isAr 
              ? "© 2026 نوفارو للتطبيقات الصناعية ومطابقة الغذاء والدواء. جميع السجلات مقيدة محاسبياً."
              : "© 2026 Novaro ERP. Certified Double-Entry Roasting & Logistics Core."
            }
          </div>
        </footer>
      </div>
    </StateProvider>
  );
}
