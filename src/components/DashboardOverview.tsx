import React from "react";
import { useAppState } from "../context/StateContext";
import { 
  DollarSign, Package, TrendingUp, ShieldAlert, Users, Flame, Layers2, Coffee, AlertTriangle, Truck, Clock, ShoppingBag
} from "lucide-react";

interface DashboardOverviewProps {
  language?: "ar" | "en";
}

export default function DashboardOverview({ language = "ar" }: DashboardOverviewProps) {
  const isAr = language === "ar";
  const { 
    items, customers, salesInvoices, purchaseOrders, roastingJobs, grindingJobs, cashboxTransactions 
  } = useAppState();

  // 1. Calculate Live cashbox balance
  const totalReceipts = cashboxTransactions
    .filter(t => t.type === "receipt")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalPaymentsAndExpenses = cashboxTransactions
    .filter(t => t.type === "payment" || t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const liveCash = 125000 + totalReceipts - totalPaymentsAndExpenses;

  // 2. Outstanding customer debts
  const totalDebts = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  // 3. Today's sales (simulated from sales invoices date, or fallback to total sales)
  const todaySales = salesInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // 4. Today's purchases (from purchase orders)
  const todayPurchases = purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);

  // 5. Low stock alerts
  const lowStockItems = items.filter(item => (item.currentStock || 0) < 200);

  // 6. Roasting & Grinding totals
  const totalRoastedToday = roastingJobs.reduce((sum, job) => sum + (job.roastedQty || 0), 0);
  const totalGroundToday = grindingJobs.reduce((sum, job) => sum + (job.groundQty || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in text-xs" id="novaro-dashboard">
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-800/20 via-transparent to-transparent"></div>
        <div className="space-y-2 z-10 text-right">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500 font-mono flex items-center gap-2 justify-end">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {isAr ? "نظام التشغيل الفوري للمصنع" : "REAL-TIME FACTORY SYSTEMS ACTIVE"}
          </span>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-none text-slate-100">
            {isAr ? "لوحة التحكم والتشغيل الفورية" : "Plant Operations Control Board"}
          </h1>
          <p className="text-slate-400 text-xs font-medium max-w-xl">
            {isAr 
              ? "متابعة مؤشرات مبيعات صالات التجزئة والجملة، وحالة الإنتاج وجداول الفاقد في المحامص والطواحين تلقائياً."
              : "Monitor wholesale distributions, live safe box balances, lot traces, and roaster/grinder yields instantly."
            }
          </p>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/80 px-5 py-4 rounded-2xl flex items-center gap-4 z-10">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
            <Coffee className="w-6 h-6" />
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block">{isAr ? "الحالة التشغيلية" : "Operational Status"}</span>
            <span className="text-base font-black text-emerald-400">{isAr ? "متصل ومستقر" : "Normal Active"}</span>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "مبيعات اليوم الفورية" : "Today's Sales"}</span>
            <span className="text-xl font-black font-mono text-slate-900">SAR {todaySales.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-teal-50 text-teal-700 rounded-2xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Live Cash Safe */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "سيولة الصندوق والخزينة" : "Live Safe Cash"}</span>
            <span className="text-xl font-black font-mono text-emerald-600">SAR {liveCash.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-2xl">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Supplier purchases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "فواتير شراء الموردين" : "Supplier Purchases"}</span>
            <span className="text-xl font-black font-mono text-slate-900">SAR {todayPurchases.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-700 rounded-2xl">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Customer Debts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 hover:shadow-md transition duration-200 flex items-center justify-between">
          <div className="space-y-1.5 text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">{isAr ? "الذمم والديون المستحقة" : "Customer Receivables"}</span>
            <span className="text-xl font-black font-mono text-rose-600">SAR {totalDebts.toLocaleString()}</span>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-700 rounded-2xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Production & Inventory Alert Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Roasting & Grinding Daily Runs */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-sm">{isAr ? "نشاط صالة الإنتاج اليومي" : "Daily Production Weights"}</h3>
            <span className="text-[10px] text-slate-400 font-bold font-mono">LIVE LOT YIELDS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Roasting summary */}
            <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-center gap-4">
              <div className="p-3.5 bg-amber-500/10 text-amber-700 rounded-xl">
                <Flame className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي البن المحمص اليوم" : "Roasted Output Today"}</span>
                <span className="text-lg font-black font-mono text-amber-700">{totalRoastedToday.toLocaleString()} kg</span>
              </div>
            </div>

            {/* Grinding summary */}
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 flex items-center gap-4">
              <div className="p-3.5 bg-indigo-500/10 text-indigo-700 rounded-xl">
                <Layers2 className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">{isAr ? "إجمالي البن المطحون اليوم" : "Ground Output Today"}</span>
                <span className="text-lg font-black font-mono text-indigo-700">{totalGroundToday.toLocaleString()} kg</span>
              </div>
            </div>
          </div>

          {/* Short dynamic list of active items */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 text-xs">{isAr ? "المنتجات الأكثر مبيعاً هذا الأسبوع" : "Top Selling Roaster Products"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">{isAr ? "قهوة نوفارو بالهيل كيس 250 غرام" : "Novaro Cardamom Pouch 250g"}</span>
                <span className="font-mono text-slate-400">142 {isAr ? "علبة" : "packs"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-800">{isAr ? "بن نوفارو إسبريسو كيس 1 كغم" : "Novaro Espresso Bag 1kg"}</span>
                <span className="font-mono text-slate-400">88 {isAr ? "كيس" : "bags"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                {isAr ? "تنبيهات نقص المخزون" : "Low Stock Warnings"}
              </h3>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold">{lowStockItems.length}</span>
            </div>

            <div className="mt-3 space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {lowStockItems.length === 0 ? (
                <p className="text-slate-400 text-center py-10 font-bold">{isAr ? "جميع الأصناف كافية ومستقرة" : "All stocks are sufficient"}</p>
              ) : (
                lowStockItems.slice(0, 3).map(item => (
                  <div key={item.id} className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-between text-[11px]">
                    <div className="space-y-0.5 text-right">
                      <span className="font-extrabold text-slate-800">{item.nameAr}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">SKU: {item.sku}</span>
                    </div>
                    <span className="font-mono font-black text-rose-600 bg-rose-100/55 px-2 py-1 rounded">
                      {item.currentStock || 120} {item.unit}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-slate-600 leading-normal text-[11px] mt-4">
            <span className="font-bold text-amber-900 block mb-0.5">{isAr ? "إدارة التوريدات" : "Replenishment Rules"}</span>
            {isAr 
              ? "يقوم النظام تلقائياً بتوليد تنبيه عند انخفاض الكمية عن 200 وحدة لتسهيل مبيعات الجملة والتصدير."
              : "Reorder indicators trigger automatically when finished products slip under 200 units."
            }
          </div>
        </div>

      </div>
    </div>
  );
}
