import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { Item, SalesInvoiceItem, ZatcaDocumentRecord } from "../types";
import { 
  ShoppingCart, Plus, Minus, Trash2, Check, FileText, 
  DollarSign, Tag, Info, UserCheck, RefreshCw, Printer, Landmark, Sparkles, QrCode, Lock, Unlock
} from "lucide-react";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ZatcaQRModal from "./common/ZatcaQRModal";

interface CartItem {
  item: Item;
  quantity: number;
}

interface PosModuleProps {
  language?: "ar" | "en";
}

export default function PosModule({ language = "ar" }: PosModuleProps) {
  const isAr = language === "ar";
  const {
    items,
    addSalesInvoice,
    currentUser,
    addToast,
    posSessions,
    openPOSSession,
    closePOSSession,
    zatcaRecords
  } = useAppState();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cashier] = useState(currentUser?.username || (isAr ? "صالح الكاشير" : "Saleh Cashier"));
  const [selectedZatcaRecord, setSelectedZatcaRecord] = useState<ZatcaDocumentRecord | null>(null);
  const [actualCashCounted, setActualCashCounted] = useState<string>("");
  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);

  const activeSession = posSessions.find(s => s.status === "Open");
  
  // Checkout completion receipt
  const [lastReceipt, setLastReceipt] = useState<{
    invoiceId: string;
    date: string;
    items: { itemName: string; quantity: number; price: number; total: number }[];
    subtotal: number;
    vat: number;
    total: number;
  } | null>(null);

  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Filter finished goods or ground products that have a retail selling price
  const retailItems = items.filter(i => i.price > 0);

  const addToCart = (item: Item) => {
    setLastReceipt(null);
    setCheckoutError(null);
    
    if (item.currentStock <= 0) {
      setCheckoutError(
        isAr 
          ? `عذراً: صنف [${item.sku}] نفذ بالكامل من المخازن حالياً.` 
          : `Cannot add ${item.name}: Product is completely out of stock.`
      );
      return;
    }

    const existing = cart.find(c => c.item.id === item.id);
    if (existing) {
      if (existing.quantity >= item.currentStock) {
        setCheckoutError(
          isAr 
            ? `تجاوز الحد: المتبقي في الرف المادي بالمستودع هو ${item.currentStock} عبوة فقط.` 
            : `Limit reached: Only ${item.currentStock} units available in physical inventory.`
        );
        return;
      }
      setCart(cart.map(c => c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCheckoutError(null);
    const target = cart.find(c => c.item.id === itemId);
    if (!target) return;

    const newQty = target.quantity + delta;
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }

    if (newQty > target.item.currentStock) {
      setCheckoutError(
        isAr 
          ? `عذراً: رصيد المستودع من هذا الصنف لا يكفي. المتبقي: ${target.item.currentStock} فقط.` 
          : `Limit reached: Only ${target.item.currentStock} units in warehouse.`
      );
      return;
    }

    setCart(cart.map(c => c.item.id === itemId ? { ...c, quantity: newQty } : c));
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(c => c.item.id !== itemId));
  };

  const handleCheckout = () => {
    setCheckoutError(null);
    if (cart.length === 0) {
      setCheckoutError(isAr ? "سلة الشراء فارغة حالياً." : "Cannot process checkout: Cart is currently empty.");
      return;
    }

    // Convert to sales invoice format
    const invoiceLines: SalesInvoiceItem[] = cart.map(c => ({
      itemId: c.item.id,
      itemName: isAr ? c.item.nameAr : c.item.name,
      quantity: c.quantity,
      price: c.item.price,
      total: c.quantity * c.item.price
    }));

    const rawSubtotal = invoiceLines.reduce((acc, i) => acc + i.total, 0);
    // Standard Saudi VAT is 15%
    const vatAmount = rawSubtotal * 0.15;
    const finalGrandTotal = rawSubtotal + vatAmount;

    // Post to StateContext
    const res = addSalesInvoice({
      customerId: "cust-1", // Walk-in cash customer
      customerName: isAr ? "عميل نقدي مبيعات عامة" : "Cash Walk-In Client",
      status: "Paid",
      items: invoiceLines,
      totalAmount: finalGrandTotal
    }, "POS");

    if (res.success && res.invoiceId) {
      setLastReceipt({
        invoiceId: res.invoiceId,
        date: new Date().toLocaleTimeString(),
        items: invoiceLines,
        subtotal: rawSubtotal,
        vat: vatAmount,
        total: finalGrandTotal
      });
      setCart([]);
      addToast({
        type: "success",
        message: "تم إصدار تسوية نقطة البيع النقدية وترحيل الضريبة وختم ZATCA تلقائياً",
        messageEn: "POS checkout invoice posted and ZATCA cryptographic stamp generated"
      });
    } else {
      setCheckoutError(res.error || "POS Checkout failed.");
    }
  };

  const printReceipt = () => {
    if (!lastReceipt) return;
    window.print();
  };

  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    const counted = actualCashCounted ? parseFloat(actualCashCounted) : undefined;
    closePOSSession(counted);
    setShowCloseShiftModal(false);
    setActualCashCounted("");
  };

  return (
    <div className="space-y-6" id="novaro-pos">
      <PageHeader
        title="كاشير ونقاط البيع السريعة"
        titleEn="Retail Point of Sale (POS)"
        description="إصدار فواتير نقاط البيع الفورية، إدارة الورديات النقدية، احتساب ضريبة القيمة المضافة، وختم ZATCA المبسط."
        descriptionEn="Instant retail cash checkout, shift reconciliation, automated VAT calculation, and ZATCA simplified tax receipts."
        icon={ShoppingCart}
        breadcrumbs={[
          { label: "المبيعات والعملاء", labelEn: "Sales & CRM" },
          { label: "كاشير نقاط البيع", labelEn: "Retail POS Terminal", active: true }
        ]}
        language={language}
      />

      {/* Global Action Bar */}
      <GlobalActionBar
        onNew={cart.length > 0 ? handleCheckout : undefined}
        newLabelAr="تسوية ودفع السلة"
        newLabelEn="Checkout Cart"
        onPrint={lastReceipt ? printReceipt : undefined}
        totalCount={cart.length}
        extraActions={[
          ...(cart.length > 0
            ? [
                {
                  id: "act-clear-cart",
                  labelAr: "تفريغ السلة",
                  labelEn: "Clear Cart",
                  icon: Trash2,
                  variant: "danger" as const,
                  onClick: () => setCart([])
                }
              ]
            : []),
          ...(activeSession
            ? [
                {
                  id: "act-close-shift",
                  labelAr: `إغلاق وجرد الوردية (${activeSession.id})`,
                  labelEn: `Close POS Shift (${activeSession.id})`,
                  icon: Lock,
                  variant: "secondary" as const,
                  onClick: () => {
                    setActualCashCounted(
                      String(activeSession.startingCash + activeSession.totalCashSales)
                    );
                    setShowCloseShiftModal(true);
                  }
                }
              ]
            : [
                {
                  id: "act-open-shift",
                  labelAr: "فتح وردية صندوق جديدة (1,500 ر.س)",
                  labelEn: "Open POS Shift (1,500 SAR)",
                  icon: Unlock,
                  variant: "success" as const,
                  onClick: () => openPOSSession(1500)
                }
              ])
        ]}
        pageId="pos"
        language={language}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Retail Catalog (Left Column) */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-teal-700" />
              {isAr ? "سجل مبيعات وعرض نقطة التجزئة" : "Retail Checkout POS Catalog"}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? "انقر على أحد المنتجات المعبأة لتنزيلها في سلة البيع المباشر الفوري" : "Pick retail pouch packages to add them to the cash drawer rack."}
            </p>
          </div>
          
          <div className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isAr ? "أمين الصندوق:" : "Cashier:"} <strong>{cashier}</strong></span>
          </div>
        </div>

        {/* Catalog grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {retailItems.map((item) => {
            const outOfStock = item.currentStock <= 0;
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                disabled={outOfStock}
                className={`bg-white p-4.5 rounded-xl border transition text-right flex flex-col justify-between h-44 shadow-xs group ${outOfStock ? "opacity-50 border-slate-200 cursor-not-allowed" : "border-slate-200/80 hover:border-teal-500 hover:shadow-md cursor-pointer"}`}
              >
                <div className="w-full space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-mono font-bold text-slate-400">{item.sku}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${outOfStock ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"}`}>
                      {outOfStock ? (isAr ? "نفذ" : "Sold Out") : (isAr ? `${item.currentStock} بالرف` : `${item.currentStock} in stock`)}
                    </span>
                  </div>
                  
                  <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-snug group-hover:text-teal-700 transition">
                    {isAr ? item.nameAr : item.name}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-bold block">{isAr ? item.name : item.nameAr}</span>
                </div>

                <div className="flex items-end justify-between w-full pt-2 border-t border-slate-100 mt-2">
                  <div className="text-sm font-mono font-extrabold text-slate-900">
                    SAR {item.price.toFixed(2)}
                  </div>
                  <span className="text-[10px] font-extrabold text-teal-700 uppercase group-hover:underline">
                    {isAr ? "+ إضافة للسلة" : "+ Add to Cart"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Checkout Basket & Receipt Drawer (Right Column) */}
      <div className="space-y-6">
        
        {/* Active POS Cart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 flex flex-col justify-between min-h-[450px]">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {isAr ? "سلة مبيعات التجزئة النشطة" : "POS Checkout Cart"}
              </h3>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-150">
                {cart.reduce((acc, c) => acc + c.quantity, 0)} {isAr ? "أصناف" : "Items"}
              </span>
            </div>

            {/* Cart list */}
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 py-3 divide-y divide-slate-100">
              {cart.map((c) => (
                <div key={c.item.id} className="flex items-center justify-between py-2 text-xs">
                  <div className="space-y-0.5 flex-1 pr-3 text-right">
                    <span className="font-bold text-slate-800 line-clamp-1">{isAr ? c.item.nameAr : c.item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">SAR {c.item.price} {isAr ? "للكيس" : "each"}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 border border-slate-200 rounded p-1 bg-slate-50">
                      <button onClick={() => updateCartQty(c.item.id, -1)} className="text-slate-500 hover:text-slate-800">
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-bold text-slate-800 min-w-[15px] text-center">{c.quantity}</span>
                      <button onClick={() => updateCartQty(c.item.id, 1)} className="text-slate-500 hover:text-slate-800">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button onClick={() => removeFromCart(c.item.id)} className="text-rose-500 hover:text-rose-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {cart.length === 0 && !lastReceipt && (
                <div className="text-center py-12 text-slate-400 text-xs">
                  {isAr ? "سلة المبيعات فارغة تماماً. يرجى اختيار المنتجات المعبأة من كتالوج العرض" : "Checkout Cart is empty. Select finished retail products to check out."}
                </div>
              )}
            </div>
          </div>

          {/* Checkout pricing drawer */}
          {cart.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>{isAr ? "المجموع قبل الضريبة" : "Subtotal"}</span>
                  <span className="font-mono">SAR {cart.reduce((acc, c) => acc + (c.quantity * c.item.price), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>{isAr ? "ضريبة القيمة المضافة 15%" : "VAT 15%"}</span>
                  <span className="font-mono">SAR {(cart.reduce((acc, c) => acc + (c.quantity * c.item.price), 0) * 0.15).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm text-slate-900 border-t border-dashed border-slate-200 pt-2">
                  <span>{isAr ? "الإجمالي الشامل للضريبة" : "Total Due"}</span>
                  <span className="font-mono text-teal-700">SAR {(cart.reduce((acc, c) => acc + (c.quantity * c.item.price), 0) * 1.15).toFixed(2)}</span>
                </div>
              </div>

              {checkoutError && <p className="text-[10px] text-rose-600 font-bold leading-normal">{checkoutError}</p>}

              <button
                onClick={handleCheckout}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs rounded-xl shadow-xs tracking-wider uppercase mt-2 transition"
              >
                {isAr ? "إصدار وطباعة فاتورة نقداً" : "Dispatch POS Settlement"}
              </button>
            </div>
          )}
        </div>

        {/* Printable receipt output */}
        {lastReceipt && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 font-mono text-[11px] leading-relaxed relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#000,#000_10px,#fff_10px,#fff_20px)]"></div>
            
            <div className="text-center space-y-1 border-b border-dashed border-slate-200 pb-3">
              <span className="text-xs font-bold block uppercase tracking-widest text-slate-800">نـوفـارو للـمـواد الغـذائيـة</span>
              <span className="text-[9px] text-slate-400 block font-sans">RIYADH, SAUDI ARABIA</span>
              <span className="text-[9px] text-slate-500 block font-bold font-sans">فاتورة ضريبية مبسطة</span>
            </div>

            <div className="space-y-1 text-right">
              <div>رقم الفاتورة: {lastReceipt.invoiceId}</div>
              <div>تاريخ ووقت السداد: {lastReceipt.date}</div>
              <div>أمين الصندوق: {cashier}</div>
              <div>طريقة الدفع: كاش نقدية</div>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 py-2.5 my-2 space-y-1 text-right">
              {lastReceipt.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.itemName} x{i.quantity}</span>
                  <span>SAR {i.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 text-right">
              <div className="flex justify-between">
                <span>المجموع الخاضع:</span>
                <span>SAR {lastReceipt.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>الضريبة 15%:</span>
                <span>SAR {lastReceipt.vat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-xs pt-1.5 border-t border-dotted border-slate-200">
                <span>المبلغ الكلي:</span>
                <span>SAR {lastReceipt.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center border-t border-dashed border-slate-200 pt-3 space-y-2">
              <span className="text-[9px] text-slate-400 block uppercase">نشكركم لزيارتنا!</span>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={printReceipt}
                  className="px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 rounded text-[9px] font-bold text-slate-700 flex items-center gap-1 border border-slate-200 transition"
                >
                  <Printer className="w-3 h-3" />
                  <span>{isAr ? "طباعة الإيصال المالي" : "Print Receipt"}</span>
                </button>
                {zatcaRecords.find(r => r.documentId === lastReceipt.invoiceId) && (
                  <button
                    onClick={() =>
                      setSelectedZatcaRecord(
                        zatcaRecords.find(r => r.documentId === lastReceipt.invoiceId) || null
                      )
                    }
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 rounded text-[9px] font-bold text-teal-700 flex items-center gap-1 border border-teal-200 transition"
                  >
                    <QrCode className="w-3 h-3" />
                    <span>{isAr ? "ختم ZATCA QR" : "ZATCA QR"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Close POS Shift Modal */}
      {showCloseShiftModal && activeSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCloseShift}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-lg font-bold text-slate-900">
              {isAr ? `إغلاق وجرد وردية الصندوق (${activeSession.id})` : `Close POS Shift (${activeSession.id})`}
            </h3>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span>رصيد الافتتاح (العهدة):</span>
                <span className="font-mono font-bold">SAR {activeSession.startingCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>إجمالي المبيعات النقدية بالوردية:</span>
                <span className="font-mono font-bold text-emerald-700">SAR {activeSession.totalCashSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-bold">
                <span>النقد المتوقع بالدرج دفترياً:</span>
                <span className="font-mono text-teal-700">
                  SAR {(activeSession.startingCash + activeSession.totalCashSales).toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                النقد الفعلي المعدود في الدرج (SAR)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={actualCashCounted}
                onChange={(e) => setActualCashCounted(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                سيتم ترحيل قيد تسوية العجز أو الزيادة في الصندوق تلقائياً إن وجد فارق.
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold"
              >
                اعتماد الجرد وإغلاق الوردية
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedZatcaRecord && (
        <ZatcaQRModal
          record={selectedZatcaRecord}
          onClose={() => setSelectedZatcaRecord(null)}
          language={language}
        />
      )}
    </div>
  );
}
