import React, { useState } from "react";
import { 
  Layers, BookOpen, ShoppingCart, Truck, Package, Flame, 
  Landmark, Settings, ChevronDown, ChevronRight, ChevronLeft,
  Users, FileText, ChevronFirst, ChevronLast, Sparkles, Coffee,
  Sliders, ShieldCheck, Database, Receipt, Store
} from "lucide-react";

export type ActiveSection = 
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

export interface DomainGroup {
  id: string;
  titleAr: string;
  titleEn: string;
  icon: React.ComponentType<{ className?: string }>;
  items: {
    id: ActiveSection;
    titleAr: string;
    titleEn: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[];
}

export const DOMAIN_GROUPS: DomainGroup[] = [
  {
    id: "dashboard",
    titleAr: "لوحة التحكم والعمليات",
    titleEn: "Dashboard & Operations",
    icon: Layers,
    items: [
      {
        id: "overview",
        titleAr: "لوحة التشغيل والمؤشرات",
        titleEn: "Control Board & Telemetry",
        icon: Layers,
        badge: "Live"
      }
    ]
  },
  {
    id: "accounting_domain",
    titleAr: "المحاسبة والمالية",
    titleEn: "Accounting & Finance",
    icon: BookOpen,
    items: [
      {
        id: "accounting",
        titleAr: "دفتر الأستاذ والقيود",
        titleEn: "General Ledger & Entries",
        icon: BookOpen
      },
      {
        id: "reports",
        titleAr: "القوائم والتقارير المالية",
        titleEn: "Financial Statements",
        icon: FileText
      }
    ]
  },
  {
    id: "sales_domain",
    titleAr: "المبيعات والعملاء",
    titleEn: "Sales & Customers",
    icon: ShoppingCart,
    items: [
      {
        id: "sales",
        titleAr: "فواتير المبيعات",
        titleEn: "Sales Invoices",
        icon: ShoppingCart
      },
      {
        id: "wholesale",
        titleAr: "مبيعات وتوزيع الجملة",
        titleEn: "Wholesale Trade",
        icon: Store
      },
      {
        id: "pos",
        titleAr: "كاشير نقاط البيع",
        titleEn: "Retail POS Terminal",
        icon: Receipt
      },
      {
        id: "customers",
        titleAr: "دليل العملاء",
        titleEn: "Customers Directory",
        icon: Users
      },
      {
        id: "customerLedger",
        titleAr: "سجل حسابات العملاء",
        titleEn: "Customer Subledger",
        icon: BookOpen
      }
    ]
  },
  {
    id: "purchases_domain",
    titleAr: "المشتريات والموردين",
    titleEn: "Purchases & Suppliers",
    icon: Truck,
    items: [
      {
        id: "purchases",
        titleAr: "فواتير المشتريات والشحنات",
        titleEn: "Purchase Invoices",
        icon: Truck
      },
      {
        id: "suppliers",
        titleAr: "دليل الموردين",
        titleEn: "Suppliers Directory",
        icon: Users
      }
    ]
  },
  {
    id: "inventory_domain",
    titleAr: "المستودعات والمخزون",
    titleEn: "Inventory & Warehouses",
    icon: Package,
    items: [
      {
        id: "inventory",
        titleAr: "إدارة المخزون وFIFO",
        titleEn: "Warehouse & FIFO Lots",
        icon: Package
      }
    ]
  },
  {
    id: "manufacturing_domain",
    titleAr: "الإنتاج والتصنيع",
    titleEn: "Manufacturing & Processing",
    icon: Flame,
    items: [
      {
        id: "production",
        titleAr: "صالة الإنتاج والوصفات",
        titleEn: "Production & BOM Recipes",
        icon: Flame
      },
      {
        id: "roastery",
        titleAr: "وحدة التحميص والتكاليف",
        titleEn: "Roastery Operations",
        icon: Coffee
      },
      {
        id: "grinding",
        titleAr: "وحدة الطحن والتكاليف",
        titleEn: "Grinding Operations",
        icon: Sliders
      }
    ]
  },
  {
    id: "treasury_domain",
    titleAr: "الخزينة والنقدية",
    titleEn: "Treasury & Cashbox",
    icon: Landmark,
    items: [
      {
        id: "cashbox",
        titleAr: "محطة الصندوق وسندات النقد",
        titleEn: "Cashbox & Vouchers",
        icon: Landmark
      }
    ]
  },
  {
    id: "settings_domain",
    titleAr: "الإعدادات والتدقيق",
    titleEn: "Settings & System",
    icon: Settings,
    items: [
      {
        id: "settings",
        titleAr: "تهيئة النظام والنسخ الاحتياطي",
        titleEn: "System Settings & Backup",
        icon: Settings
      }
    ]
  }
];

interface AppSidebarProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  language?: "ar" | "en";
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AppSidebar({
  activeSection,
  onSelectSection,
  language = "ar",
  collapsed = false,
  onToggleCollapse
}: AppSidebarProps) {
  const isAr = language === "ar";

  // Track expanded domain groups (all open by default)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    accounting_domain: true,
    sales_domain: true,
    purchases_domain: true,
    inventory_domain: true,
    manufacturing_domain: true,
    treasury_domain: true,
    settings_domain: true
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const CollapseIcon = isAr
    ? (collapsed ? ChevronFirst : ChevronLast)
    : (collapsed ? ChevronLast : ChevronFirst);

  return (
    <aside
      aria-label={isAr ? "شريط التنقل الجانبي" : "Main Navigation Sidebar"}
      className={`hidden md:flex flex-col bg-slate-950 border-r border-slate-900 transition-all duration-300 select-none z-30 ${
        collapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-900 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-teal-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-teal-700/25 flex-shrink-0">
              NV
            </div>
            <div className="overflow-hidden">
              <h2 className="text-xs font-black text-white uppercase tracking-wider truncate">
                {isAr ? "نوفارو ERP" : "Novaro ERP"}
              </h2>
              <span className="text-[10px] font-mono text-teal-400 uppercase font-bold tracking-widest block truncate">
                {isAr ? "نظام المؤسسات الصناعية" : "Enterprise Core"}
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-10 h-10 bg-teal-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-teal-700/25 mx-auto">
            NV
          </div>
        )}

        {onToggleCollapse && !collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isAr ? "طي القائمة" : "Collapse Sidebar"}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <CollapseIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Groups List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {DOMAIN_GROUPS.map((group) => {
          const isExpanded = expandedGroups[group.id];
          const hasActiveItem = group.items.some(it => it.id === activeSection);
          const GroupIcon = group.icon;

          if (collapsed) {
            return (
              <div key={group.id} className="space-y-1">
                {group.items.map((item) => {
                  const isActive = activeSection === item.id;
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectSection(item.id)}
                      title={isAr ? item.titleAr : item.titleEn}
                      className={`w-full h-11 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-teal-700 text-white shadow-md shadow-teal-700/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <ItemIcon className="w-5 h-5" />
                    </button>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              {/* Domain Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  hasActiveItem ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GroupIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                  <span className="truncate">{isAr ? group.titleAr : group.titleEn}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  isAr ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Submodule Items */}
              {isExpanded && (
                <div className="space-y-0.5 pr-2 pl-2">
                  {group.items.map((item) => {
                    const isActive = activeSection === item.id;
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectSection(item.id)}
                        className={`w-full px-3 py-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all ${
                          isActive
                            ? "bg-slate-900 text-teal-400 font-bold border border-slate-800 shadow-xs"
                            : "text-slate-400 hover:text-white hover:bg-slate-900/50"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ItemIcon
                            className={`w-4 h-4 flex-shrink-0 ${
                              isActive ? "text-teal-400" : "text-slate-500"
                            }`}
                          />
                          <span className="truncate">{isAr ? item.titleAr : item.titleEn}</span>
                        </div>
                        {item.badge && (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800 flex-shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info / Toggle */}
      <div className="p-3 border-t border-slate-900">
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isAr ? "توسيع القائمة" : "Expand Sidebar"}
            className="w-full py-2 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg"
          >
            <CollapseIcon className="w-4 h-4" />
          </button>
        ) : (
          <div className="p-3 bg-slate-900/60 border border-slate-850 rounded-xl space-y-1 text-right">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-400 uppercase tracking-wider justify-end">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isAr ? "الرقابة المحاسبية نشطة" : "Audit Invariant Active"}</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              {isAr
                ? "ميزان المراجعة متطابق لحظياً عبر قيود الترحيل التلقائي."
                : "Trial balance equilibrium maintained in real-time."}
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
