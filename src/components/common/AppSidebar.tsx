import React, { useState } from "react";
import { 
  Layers, BookOpen, ShoppingCart, Truck, Package, Flame, 
  Landmark, Settings, ChevronDown, ChevronRight, ChevronLeft,
  Users, FileText, ChevronFirst, ChevronLast, Sparkles, Coffee,
  Sliders, ShieldCheck, Database, Receipt, Store, Building2,
  Calendar, FileSpreadsheet, Briefcase, FolderKanban, Users2,
  FileCheck, ReceiptText, Tag, Warehouse, Boxes, Calculator,
  QrCode, History, HardDrive, RefreshCcw, Coins, CreditCard,
  Wallet, Percent, BadgePercent, FileBarChart, Kanban, Network,
  UserCog, Key, FileDigit, FileSearch, Layers3, Landmark as BankIcon
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
  | "settings"
  | "banks"
  | "bank_transactions"
  | "bank_reconciliation"
  | "sales_quotations"
  | "sales_orders"
  | "delivery_notes"
  | "sales_returns"
  | "price_lists"
  | "purchase_requests"
  | "rfq"
  | "purchase_orders"
  | "goods_receipt"
  | "purchase_returns"
  | "items"
  | "warehouses"
  | "stock_count"
  | "stock_transfers"
  | "stock_adjustments"
  | "stock_valuation"
  | "fixed_assets"
  | "depreciation"
  | "customer_aging"
  | "supplier_aging"
  | "vat_config"
  | "e_invoicing"
  | "zatca"
  | "crm_leads"
  | "crm_opportunities"
  | "crm_activities"
  | "projects"
  | "cost_centers"
  | "hr_employees"
  | "hr_attendance"
  | "hr_leave"
  | "hr_payroll"
  | "admin_companies"
  | "admin_branches"
  | "admin_fiscal_years"
  | "admin_fiscal_periods"
  | "admin_users"
  | "admin_roles"
  | "admin_numbering"
  | "admin_audit_log"
  | "admin_backup"
  | "admin_sync_status";

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
    isPlanned?: boolean;
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
    id: "treasury_domain",
    titleAr: "الخزينة والبنوك",
    titleEn: "Treasury & Banks",
    icon: Landmark,
    items: [
      {
        id: "cashbox",
        titleAr: "محطة الصندوق وسندات النقد",
        titleEn: "Cashbox & Vouchers",
        icon: Wallet
      },
      {
        id: "banks",
        titleAr: "الحسابات البنكية",
        titleEn: "Bank Accounts",
        icon: BankIcon,
        isPlanned: true
      },
      {
        id: "bank_transactions",
        titleAr: "الحركات البنكية",
        titleEn: "Bank Transactions",
        icon: CreditCard,
        isPlanned: true
      },
      {
        id: "bank_reconciliation",
        titleAr: "المطابقة البنكية",
        titleEn: "Bank Reconciliation",
        icon: FileCheck,
        isPlanned: true
      }
    ]
  },
  {
    id: "sales_domain",
    titleAr: "المبيعات",
    titleEn: "Sales",
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
        id: "sales_quotations",
        titleAr: "عروض الأسعار",
        titleEn: "Sales Quotations",
        icon: FileText,
        isPlanned: true
      },
      {
        id: "sales_orders",
        titleAr: "أوامر المبيعات",
        titleEn: "Sales Orders",
        icon: ReceiptText,
        isPlanned: true
      },
      {
        id: "delivery_notes",
        titleAr: "إذونات التسليم",
        titleEn: "Delivery Notes",
        icon: Truck,
        isPlanned: true
      },
      {
        id: "sales_returns",
        titleAr: "مرتجعات المبيعات",
        titleEn: "Sales Returns",
        icon: History,
        isPlanned: true
      },
      {
        id: "price_lists",
        titleAr: "قوائم الأسعار",
        titleEn: "Price Lists",
        icon: Tag,
        isPlanned: true
      }
    ]
  },
  {
    id: "customers_domain",
    titleAr: "العملاء",
    titleEn: "Customers",
    icon: Users,
    items: [
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
    id: "purchasing_domain",
    titleAr: "المشتريات",
    titleEn: "Purchasing",
    icon: Truck,
    items: [
      {
        id: "purchases",
        titleAr: "فواتير المشتريات والشحنات",
        titleEn: "Purchase Invoices",
        icon: Truck
      },
      {
        id: "purchase_requests",
        titleAr: "طلبات الشراء",
        titleEn: "Purchase Requests",
        icon: FileText,
        isPlanned: true
      },
      {
        id: "rfq",
        titleAr: "عروض أسعار الموردين",
        titleEn: "RFQ (Quotations)",
        icon: FileSearch,
        isPlanned: true
      },
      {
        id: "purchase_orders",
        titleAr: "أوامر الشراء",
        titleEn: "Purchase Orders",
        icon: ReceiptText,
        isPlanned: true
      },
      {
        id: "goods_receipt",
        titleAr: "استلام البضائع",
        titleEn: "Goods Receipt Note",
        icon: Package,
        isPlanned: true
      },
      {
        id: "purchase_returns",
        titleAr: "مرتجعات المشتريات",
        titleEn: "Purchase Returns",
        icon: History,
        isPlanned: true
      }
    ]
  },
  {
    id: "suppliers_domain",
    titleAr: "الموردين",
    titleEn: "Suppliers",
    icon: Users2,
    items: [
      {
        id: "suppliers",
        titleAr: "دليل الموردين",
        titleEn: "Suppliers Directory",
        icon: Users2
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
      },
      {
        id: "items",
        titleAr: "دليل الأصناف",
        titleEn: "Items Master",
        icon: Boxes,
        isPlanned: true
      },
      {
        id: "warehouses",
        titleAr: "المستودعات والمواقع",
        titleEn: "Warehouses & Locations",
        icon: Warehouse,
        isPlanned: true
      },
      {
        id: "stock_count",
        titleAr: "جرد المخزون",
        titleEn: "Stock Count (Physical)",
        icon: Calculator,
        isPlanned: true
      },
      {
        id: "stock_transfers",
        titleAr: "تحويلات المستودعات",
        titleEn: "Stock Transfers",
        icon: Network,
        isPlanned: true
      },
      {
        id: "stock_adjustments",
        titleAr: "تسويات المخزون",
        titleEn: "Stock Adjustments",
        icon: Sliders,
        isPlanned: true
      },
      {
        id: "stock_valuation",
        titleAr: "تقييم المخزون",
        titleEn: "Stock Valuation",
        icon: FileBarChart,
        isPlanned: true
      }
    ]
  },
  {
    id: "manufacturing_domain",
    titleAr: "الإنتاج والتصنيع",
    titleEn: "Manufacturing",
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
    id: "fixed_assets_domain",
    titleAr: "الأصول الثابتة",
    titleEn: "Fixed Assets",
    icon: Building2,
    items: [
      {
        id: "fixed_assets",
        titleAr: "دليل الأصول الثابتة",
        titleEn: "Fixed Assets Directory",
        icon: Building2,
        isPlanned: true
      },
      {
        id: "depreciation",
        titleAr: "حساب وإهلاك الأصول",
        titleEn: "Depreciation Schedules",
        icon: Calculator,
        isPlanned: true
      },
      {
        id: "customer_aging",
        titleAr: "أعمار ديون العملاء",
        titleEn: "Customer Aging Report",
        icon: FileBarChart,
        isPlanned: true
      },
      {
        id: "supplier_aging",
        titleAr: "أعمار ذمم الموردين",
        titleEn: "Supplier Aging Report",
        icon: FileBarChart,
        isPlanned: true
      }
    ]
  },
  {
    id: "tax_domain",
    titleAr: "الضرائب والامتثال",
    titleEn: "Tax & Compliance",
    icon: Percent,
    items: [
      {
        id: "vat_config",
        titleAr: "إعدادات ضريبة القيمة المضافة",
        titleEn: "VAT Configuration",
        icon: Percent,
        isPlanned: true
      },
      {
        id: "e_invoicing",
        titleAr: "الفوترة الإلكترونية",
        titleEn: "E-Invoicing Fatoora",
        icon: QrCode,
        isPlanned: true
      },
      {
        id: "zatca",
        titleAr: "متطلبات هيئة الزكاة (ZATCA)",
        titleEn: "ZATCA Integration Phase 2",
        icon: ShieldCheck,
        isPlanned: true
      }
    ]
  },
  {
    id: "crm_domain",
    titleAr: "إدارة علاقات العملاء (CRM)",
    titleEn: "CRM",
    icon: UserCog,
    items: [
      {
        id: "crm_leads",
        titleAr: "العملاء المحتملون (Leads)",
        titleEn: "Sales Leads",
        icon: Users,
        isPlanned: true
      },
      {
        id: "crm_opportunities",
        titleAr: "الفرص البيعية",
        titleEn: "Opportunities",
        icon: Sparkles,
        isPlanned: true
      },
      {
        id: "crm_activities",
        titleAr: "الأنشطة والمهام",
        titleEn: "Activities & Follow-ups",
        icon: Calendar,
        isPlanned: true
      }
    ]
  },
  {
    id: "projects_domain",
    titleAr: "المشاريع ومراكز التكلفة",
    titleEn: "Projects",
    icon: FolderKanban,
    items: [
      {
        id: "projects",
        titleAr: "إدارة المشاريع",
        titleEn: "Projects Portfolio",
        icon: FolderKanban,
        isPlanned: true
      },
      {
        id: "cost_centers",
        titleAr: "مراكز التكلفة المتقدمة",
        titleEn: "Advanced Cost Centers",
        icon: Kanban,
        isPlanned: true
      }
    ]
  },
  {
    id: "hr_domain",
    titleAr: "الموارد البشرية والرواتب",
    titleEn: "HR & Payroll",
    icon: Users2,
    items: [
      {
        id: "hr_employees",
        titleAr: "سجلات الموظفين",
        titleEn: "Employees Directory",
        icon: Users,
        isPlanned: true
      },
      {
        id: "hr_attendance",
        titleAr: "الحضور والانصراف",
        titleEn: "Attendance & Shifts",
        icon: Calendar,
        isPlanned: true
      },
      {
        id: "hr_leave",
        titleAr: "الإجازات والأذونات",
        titleEn: "Leave Management",
        icon: FileText,
        isPlanned: true
      },
      {
        id: "hr_payroll",
        titleAr: "مسير الرواتب",
        titleEn: "Payroll Processing",
        icon: Coins,
        isPlanned: true
      }
    ]
  },
  {
    id: "admin_domain",
    titleAr: "إدارة النظام والرقابة",
    titleEn: "System Administration",
    icon: Settings,
    items: [
      {
        id: "settings",
        titleAr: "تهيئة النظام العامة",
        titleEn: "General Settings & Company",
        icon: Settings
      },
      {
        id: "admin_companies",
        titleAr: "الشركات والكيانات",
        titleEn: "Companies Master",
        icon: Building2,
        isPlanned: true
      },
      {
        id: "admin_branches",
        titleAr: "الفروع والمستودعات",
        titleEn: "Branches Directory",
        icon: Warehouse,
        isPlanned: true
      },
      {
        id: "admin_fiscal_years",
        titleAr: "السنوات المالية",
        titleEn: "Fiscal Years",
        icon: Calendar,
        isPlanned: true
      },
      {
        id: "admin_fiscal_periods",
        titleAr: "الفترات المحاسبية (إغلاق)",
        titleEn: "Fiscal Periods (Lock)",
        icon: History,
        isPlanned: true
      },
      {
        id: "admin_users",
        titleAr: "مستخدمو النظام",
        titleEn: "System Users",
        icon: Users,
        isPlanned: true
      },
      {
        id: "admin_roles",
        titleAr: "الأدوار والصلاحيات",
        titleEn: "Roles & Permissions",
        icon: Key,
        isPlanned: true
      },
      {
        id: "admin_numbering",
        titleAr: "ترقيم المستندات والتسلسل",
        titleEn: "Document Sequences",
        icon: FileDigit,
        isPlanned: true
      },
      {
        id: "admin_audit_log",
        titleAr: "سجل التدقيق والمراقبة",
        titleEn: "Audit Trail & Logs",
        icon: ShieldCheck,
        isPlanned: true
      },
      {
        id: "admin_backup",
        titleAr: "النسخ الاحتياطي والاستعادة",
        titleEn: "Backup & Restore",
        icon: HardDrive,
        isPlanned: true
      },
      {
        id: "admin_sync_status",
        titleAr: "حالة المزامنة والربط",
        titleEn: "Sync & Queue Status",
        icon: RefreshCcw,
        isPlanned: true
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

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    accounting_domain: true,
    treasury_domain: true,
    sales_domain: true,
    customers_domain: true,
    purchasing_domain: true,
    suppliers_domain: true,
    inventory_domain: true,
    manufacturing_domain: true,
    fixed_assets_domain: false,
    tax_domain: false,
    crm_domain: false,
    projects_domain: false,
    hr_domain: false,
    admin_domain: true
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
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
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
                      className={`w-full h-10 rounded-xl flex items-center justify-center transition-all ${
                        isActive
                          ? "bg-teal-700 text-white shadow-md shadow-teal-700/30"
                          : "text-slate-400 hover:text-white hover:bg-slate-900"
                      }`}
                    >
                      <ItemIcon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            );
          }

          return (
            <div key={group.id} className="space-y-1">
              <button
                type="button"
                onClick={() => toggleGroup(group.id)}
                className={`w-full px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  hasActiveItem ? "text-teal-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <GroupIcon className="w-3.5 h-3.5 flex-shrink-0 opacity-80" />
                  <span className="truncate">{isAr ? group.titleAr : group.titleEn}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />
                ) : (
                  isAr ? <ChevronLeft className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                )}
              </button>

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
                        {item.badge ? (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-950 text-teal-300 border border-teal-800 flex-shrink-0">
                            {item.badge}
                          </span>
                        ) : item.isPlanned ? (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800 flex-shrink-0">
                            {isAr ? "مخطط" : "Planned"}
                          </span>
                        ) : null}
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
