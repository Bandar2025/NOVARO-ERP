import React, { useState } from "react";
import { ZatcaDocumentRecord } from "../../types";
import { ZatcaEngine } from "../../core/domain/zatca/ZatcaEngine";
import {
  UnifiedPrintEngine,
  PrintDocumentFormat,
  PrintLanguageMode,
  UnifiedInvoicePrintPayload,
  UnifiedBatchPrintPayload
} from "../../utils/printEngine";
import { Printer, X, FileText, Receipt, ShieldCheck, Globe } from "lucide-react";

export type PrintTemplateMode = PrintDocumentFormat;
export type PrintableInvoiceData = UnifiedInvoicePrintPayload;
export type PrintableBatchLabelData = UnifiedBatchPrintPayload;

interface PrintPreviewModalProps {
  mode: PrintTemplateMode;
  invoiceData?: PrintableInvoiceData | null;
  batchData?: PrintableBatchLabelData | null;
  onClose: () => void;
  language?: "ar" | "en";
}

export default function PrintPreviewModal({
  mode: initialMode,
  invoiceData,
  batchData,
  onClose,
  language = "ar"
}: PrintPreviewModalProps) {
  const [activeMode, setActiveMode] = useState<PrintTemplateMode>(initialMode);
  const [langMode, setLangMode] = useState<PrintLanguageMode>(language === "en" ? "en" : "bilingual");
  const isAr = langMode !== "en";

  const totals = invoiceData
    ? UnifiedPrintEngine.computeInvoiceTotals(invoiceData)
    : { subtotal: 0, vatAmount: 0, totalAmount: 0, tlvPayload: "" };

  const sellerNameAr = invoiceData?.companyNameAr || "شركة محامص وبن نوفارو المحدودة";
  const sellerNameEn = invoiceData?.companyNameEn || "Novaro Coffee & Roastery Co. Ltd";
  const sellerVat = invoiceData?.companyVat || "310123456700003";
  const sellerCrn = invoiceData?.companyCrn || "2050123456";
  const sellerAddress =
    invoiceData?.companyAddress ||
    (isAr
      ? "الدمام - المدينة الصناعية الثانية، المملكة العربية السعودية"
      : "Dammam 2nd Industrial City, Kingdom of Saudi Arabia");

  const qrMatrix = ZatcaEngine.generateQrMatrix(
    activeMode === "batch_label" && batchData
      ? `NOVARO|BATCH:${batchData.batchId}|ITEM:${batchData.productNameAr}|ROAST:${batchData.roastProfile || "Medium"}|DATE:${batchData.roastDate}`
      : totals.tlvPayload
  );

  const barcodeBars = UnifiedPrintEngine.generateLinearBarcodeBars(
    activeMode === "batch_label" && batchData
      ? batchData.batchId
      : invoiceData?.id || "INV-1001"
  );

  const taxIdentity = UnifiedPrintEngine.validateTaxIdentity(invoiceData);

  const handlePrint = () => {
    UnifiedPrintEngine.printFormattedDocument({
      format: activeMode,
      languageMode: langMode,
      invoiceData,
      batchData
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black">
                {isAr ? "استوديو الطباعة الموحد (A4 / 80mm / Barcode)" : "Unified Print & Document Studio"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeMode === "a4_invoice"
                  ? isAr
                    ? "قالب فاتورة ضريبية قياسية A4 متوافق مع المرحلة الثانية ZATCA"
                    : "Standard A4 ZATCA Phase 2 Tax Invoice Template"
                  : activeMode === "thermal_80mm"
                  ? isAr
                    ? "قالب إيصال كاشير حراري 80mm لنقاط البيع السريعة"
                    : "80mm Thermal POS Receipt Template"
                  : isAr
                  ? "ملصق باركود وتتبع دفعة التحميص والإنتاج (100x60mm - ISO Code-128B)"
                  : "Roast Batch & Packaging Barcode Label (100x60mm - ISO Code-128B)"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Language Layout Switcher (Arabic RTL / Bilingual / English LTR) */}
            <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-[11px] font-bold">
              <Globe className="w-3.5 h-3.5 text-teal-400 mx-1.5" />
              <button
                type="button"
                onClick={() => setLangMode("bilingual")}
                className={`px-2.5 py-1 rounded transition-all ${
                  langMode === "bilingual" ? "bg-teal-600 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                ثنائي / Bilingual
              </button>
              <button
                type="button"
                onClick={() => setLangMode("ar")}
                className={`px-2.5 py-1 rounded transition-all ${
                  langMode === "ar" ? "bg-teal-600 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                عربي RTL
              </button>
              <button
                type="button"
                onClick={() => setLangMode("en")}
                className={`px-2.5 py-1 rounded transition-all ${
                  langMode === "en" ? "bg-teal-600 text-white" : "text-slate-300 hover:text-white"
                }`}
              >
                English LTR
              </button>
            </div>

            {/* Format Switcher when invoiceData is present */}
            {invoiceData && (
              <div className="flex items-center bg-slate-800 p-1 rounded-lg border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveMode("a4_invoice")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                    activeMode === "a4_invoice" ? "bg-teal-600 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isAr ? "فاتورة A4" : "A4 Invoice"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveMode("thermal_80mm")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                    activeMode === "thermal_80mm" ? "bg-teal-600 text-white" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>{isAr ? "حراري 80mm" : "80mm Thermal"}</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className={`px-4 py-2 rounded-lg text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer ${
                invoiceData && taxIdentity.isSimulationOrTrial
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              <Printer className="w-4 h-4" />
              <span>
                {invoiceData && taxIdentity.isSimulationOrTrial
                  ? isAr
                    ? "طباعة بختم مسودة تجريبية"
                    : "Print Simulation Draft"
                  : isAr
                  ? "طباعة المستند الرسمي"
                  : "Print Official Document"}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Simulation / Trial Tax Identity Notice Banner */}
        {invoiceData && taxIdentity.isSimulationOrTrial && (
          <div className="bg-amber-50 border-b border-amber-300 px-6 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-900">
            <div className="font-bold">
              ⚠️ {isAr ? taxIdentity.reasonAr : taxIdentity.reasonEn}
            </div>
            <span className="px-2.5 py-0.5 rounded bg-amber-200 text-amber-950 font-black font-mono text-[10px] shrink-0">
              SIMULATION WATERMARK ACTIVE
            </span>
          </div>
        )}

        {/* Printable Canvas Area */}
        <div
          dir={isAr ? "rtl" : "ltr"}
          className="p-6 overflow-y-auto bg-slate-100 flex-1 flex justify-center"
        >
          {/* 1. A4 TAX INVOICE TEMPLATE */}
          {activeMode === "a4_invoice" && invoiceData && (
            <div className="bg-white w-full max-w-3xl p-8 rounded-xl border border-slate-300 shadow-sm space-y-6 text-slate-900">
              {taxIdentity.isSimulationOrTrial && (
                <div className="bg-amber-50 border-2 border-dashed border-amber-500 text-amber-900 px-4 py-2 rounded-xl text-center text-xs font-black">
                  ⚠️ {isAr
                    ? "مسودة تجريبية / محاكاة — غير صالحة للاستخدام الضريبي الرسمي (بيانات المنشأة الضريبية تجريبية)"
                    : "SIMULATION / TRIAL DRAFT — NOT VALID AS AN OFFICIAL ZATCA TAX INVOICE"}
                </div>
              )}
              {/* Top Company & Document Title Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-slate-900 pb-5">
                <div className="space-y-1">
                  <div className="text-lg font-black text-slate-950">
                    {langMode === "en" ? sellerNameEn : sellerNameAr}
                  </div>
                  {langMode !== "en" && (
                    <div className="text-xs font-bold text-slate-500 font-mono">{sellerNameEn}</div>
                  )}
                  <div className="text-xs text-slate-600">{sellerAddress}</div>
                  <div className="text-xs font-mono text-slate-700">
                    {isAr ? "الرقم الضريبي (VAT):" : "VAT Registration:"} <strong>{sellerVat}</strong> |{" "}
                    {isAr ? "س.ت:" : "CRN:"} <strong>{sellerCrn}</strong>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-slate-900 text-white px-5 py-3.5 rounded-xl">
                  <div className="text-base font-black">
                    {langMode === "en"
                      ? invoiceData.documentTitleEn || "TAX INVOICE"
                      : langMode === "bilingual"
                      ? "فاتورة ضريبية / TAX INVOICE"
                      : invoiceData.documentTitleAr || "فاتورة ضريبية"}
                  </div>
                  <div className="text-[11px] font-mono text-teal-400">
                    ZATCA PHASE 2 (FATOORA)
                  </div>
                  <div className="text-xs font-mono font-bold mt-1 text-slate-200">
                    #{invoiceData.id}
                  </div>
                </div>
              </div>

              {/* Invoice Metadata & Customer Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    {langMode === "en"
                      ? "Customer / Buyer Details"
                      : langMode === "bilingual"
                      ? "بيانات العميل / Buyer Details"
                      : "بيانات العميل / المشتري"}
                  </div>
                  <div className="text-sm font-black text-slate-900">{invoiceData.customerName}</div>
                  <div className="text-slate-600 font-mono">
                    {isAr ? "الرقم الضريبي للعميل / Buyer VAT:" : "Buyer VAT:"}{" "}
                    <strong>{invoiceData.customerVat || "300987654300003"}</strong>
                  </div>
                  <div className="text-slate-600">
                    {isAr ? "حالة السداد / Payment:" : "Payment Status:"}{" "}
                    <strong className="text-teal-800">
                      {invoiceData.status === "Paid"
                        ? langMode === "en"
                          ? "Paid (Cash/Bank)"
                          : "مدفوع نقداً / شبكة (Paid)"
                        : langMode === "en"
                        ? "Credit (Receivable)"
                        : "آجل - ذمم عملاء (Credit)"}
                    </strong>
                  </div>
                </div>

                <div className="space-y-1.5 sm:border-slate-200 sm:px-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase">
                    {langMode === "en"
                      ? "Invoice & Cryptographic Metadata"
                      : "بيانات الفاتورة والتشفير (ZATCA Metadata)"}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? "تاريخ الإصدار / Date:" : "Issue Date:"}</span>
                    <span className="font-mono font-bold">{invoiceData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? "العداد التسلسلي / ICV:" : "ICV Counter:"}</span>
                    <span className="font-mono font-bold">
                      #{invoiceData.zatcaRecord?.icv || 1}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isAr ? "نوع المستند / Type:" : "Invoice Type:"}</span>
                    <span className="font-mono font-bold text-teal-800">
                      {invoiceData.zatcaRecord?.invoiceTypeCode || "388"} ({invoiceData.type || "Standard"})
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-900 text-white">
                    <tr>
                      <th className="py-2.5 px-3 text-center font-bold w-10">#</th>
                      <th className={`py-2.5 px-3 font-bold ${isAr ? "text-right" : "text-left"}`}>
                        {langMode === "en"
                          ? "Item Description"
                          : langMode === "bilingual"
                          ? "بيان الصنف / Item Description"
                          : "بيان الصنف / الوصف"}
                      </th>
                      <th className="py-2.5 px-3 text-center font-bold">
                        {langMode === "en" ? "Qty" : "الكمية / Qty"}
                      </th>
                      <th className="py-2.5 px-3 text-center font-bold">
                        {langMode === "en" ? "Unit Price (SAR)" : "سعر الوحدة / Price"}
                      </th>
                      <th className="py-2.5 px-3 text-center font-bold">
                        {langMode === "en" ? "VAT 15%" : "الضريبة 15%"}
                      </th>
                      <th className={`py-2.5 px-3 font-bold ${isAr ? "text-left" : "text-right"}`}>
                        {langMode === "en" ? "Line Total (SAR)" : "الإجمالي / Total"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoiceData.items.map((item, idx) => {
                      const lineNet = item.quantity * item.price;
                      const lineVat = lineNet * 0.15;
                      return (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{item.itemName}</td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="py-2.5 px-3 text-center font-mono">{Number(item.price).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-center font-mono text-amber-700">{lineVat.toFixed(2)}</td>
                          <td className={`py-2.5 px-3 font-mono font-bold text-slate-900 ${isAr ? "text-left" : "text-right"}`}>
                            {Number(item.total).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Bottom QR Code & Financial Totals Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-2">
                {/* ZATCA QR & Cryptographic Stamp */}
                <div className="md:col-span-6 flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="p-2 bg-white border-2 border-slate-900 rounded-lg shrink-0">
                    <svg
                      viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                      className="w-28 h-28"
                      shapeRendering="crispEdges"
                    >
                      {qrMatrix.map((row, rIdx) =>
                        row.map((cell, cIdx) =>
                          cell ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width={1}
                              height={1}
                              fill="#0f172a"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>
                  <div className="space-y-1 text-[10px] overflow-hidden">
                    <div className="flex items-center gap-1 text-emerald-700 font-black text-xs">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr ? "مختوم إلكترونياً (ZATCA Phase 2)" : "ZATCA Phase 2 Cryptographic Stamp"}
                      </span>
                    </div>
                    <div className="font-mono text-slate-600 truncate">
                      UUID: {invoiceData.zatcaRecord?.uuid || "8e600000-4a11-4b22-9c33-novaro2025"}
                    </div>
                    <div className="font-mono text-slate-500 break-all line-clamp-2">
                      SHA256: {invoiceData.zatcaRecord?.invoiceHash || totals.tlvPayload.slice(0, 44)}
                    </div>
                  </div>
                </div>

                {/* Totals Summary Box */}
                <div className="md:col-span-6 bg-slate-900 text-white p-5 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>
                      {langMode === "en"
                        ? "Taxable Subtotal (Excl. VAT):"
                        : "الإجمالي الخاضع للضريبة (Subtotal):"}
                    </span>
                    <span className="font-mono font-bold">SAR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>
                      {langMode === "en"
                        ? "Value Added Tax (15% VAT):"
                        : "ضريبة القيمة المضافة (15% VAT):"}
                    </span>
                    <span className="font-mono font-bold">SAR {totals.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-base font-black border-t border-slate-700 pt-2.5 text-teal-400">
                    <span>
                      {langMode === "en"
                        ? "Grand Total (Incl. VAT):"
                        : "الإجمالي المستحق (Grand Total):"}
                    </span>
                    <span className="font-mono">SAR {totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. 80MM THERMAL POS RECEIPT TEMPLATE */}
          {activeMode === "thermal_80mm" && invoiceData && (
            <div className="bg-white w-[340px] p-5 rounded-xl border border-slate-300 shadow-md font-mono text-xs text-slate-900 space-y-3.5">
              <div className="text-center border-b border-dashed border-slate-300 pb-3 space-y-1">
                <div className="text-sm font-black font-sans">
                  {langMode === "en" ? sellerNameEn : sellerNameAr}
                </div>
                {langMode !== "en" && <div className="text-[10px] text-slate-500">{sellerNameEn}</div>}
                <div className="text-[10px] text-slate-600 font-sans">
                  {isAr ? "الرقم الضريبي / VAT:" : "VAT:"} {sellerVat}
                </div>
                <div className="inline-block px-2.5 py-0.5 bg-slate-900 text-white text-[10px] font-sans font-bold rounded mt-1">
                  {langMode === "en"
                    ? "SIMPLIFIED TAX INVOICE (POS)"
                    : "فاتورة ضريبية مبسطة (POS)"}
                </div>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-2.5">
                <div className="flex justify-between">
                  <span>{isAr ? "رقم الإيصال / Receipt #:" : "Receipt #:"}</span>
                  <span className="font-bold">{invoiceData.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? "التاريخ / Date:" : "Date/Time:"}</span>
                  <span>{invoiceData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? "العميل / Client:" : "Customer:"}</span>
                  <span className="font-sans font-bold">{invoiceData.customerName}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 border-b border-dashed border-slate-300 pb-2.5 text-[11px]">
                <div className="flex justify-between font-bold text-slate-500 border-b border-slate-100 pb-1">
                  <span>{isAr ? "الصنف والكمية / Item" : "Item x Qty"}</span>
                  <span>{isAr ? "الإجمالي / Total" : "Total"}</span>
                </div>
                {invoiceData.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start gap-2">
                    <span className="font-sans font-bold">
                      {item.itemName} <span className="font-mono text-slate-500">x{item.quantity}</span>
                    </span>
                    <span className="font-bold shrink-0">SAR {Number(item.total).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                <div className="flex justify-between">
                  <span>{isAr ? "المجموع قبل الضريبة / Subtotal:" : "Subtotal:"}</span>
                  <span>SAR {totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isAr ? "ضريبة القيمة المضافة 15%:" : "VAT (15%):"}</span>
                  <span>SAR {totals.vatAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 border-t border-dotted border-slate-300">
                  <span className="font-sans">{isAr ? "الإجمالي الشامل / Total:" : "GRAND TOTAL:"}</span>
                  <span>SAR {totals.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* QR & Barcode */}
              <div className="flex flex-col items-center space-y-2 pt-1">
                <div className="p-2 bg-white border border-slate-900 rounded">
                  <svg
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="w-32 h-32"
                    shapeRendering="crispEdges"
                  >
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width={1}
                            height={1}
                            fill="#0f172a"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
                <span className="text-[9px] text-slate-500 font-sans text-center">
                  {isAr
                    ? "متوافق مع الفوترة الإلكترونية ZATCA - نشكركم لزيارتنا"
                    : "ZATCA E-Invoice Compliant - Thank You!"}
                </span>
              </div>
            </div>
          )}

          {/* 3. ROASTERY & PACKAGING BATCH BARCODE LABEL TEMPLATE */}
          {activeMode === "batch_label" && batchData && (
            <div className="bg-white w-full max-w-md p-6 rounded-2xl border-2 border-slate-900 shadow-md space-y-4 text-slate-900">
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-700 block">
                    NOVARO SPECIALTY COFFEE ROASTERY
                  </span>
                  <h4 className="text-base font-black text-slate-950">{batchData.productNameAr}</h4>
                </div>
                <div className="text-left font-mono bg-slate-900 text-white px-3 py-1.5 rounded-lg">
                  <span className="text-[10px] text-amber-400 block">NET WEIGHT</span>
                  <span className="text-sm font-black">{batchData.weightKg} KG</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {isAr ? "رقم دفعة التحميص (Batch Lot):" : "Batch / Lot No:"}
                  </span>
                  <span className="font-mono font-black text-slate-900 text-sm">{batchData.batchId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {isAr ? "درجة التحميص (Roast Profile):" : "Roast Profile:"}
                  </span>
                  <span className="font-bold text-amber-800">{batchData.roastProfile || "Medium Roast"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {isAr ? "تاريخ التحميص والإنتاج:" : "Roast Date:"}
                  </span>
                  <span className="font-mono font-bold text-slate-800">{batchData.roastDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {isAr ? "تاريخ انتهاء الصلاحية:" : "Best Before:"}
                  </span>
                  <span className="font-mono font-bold text-emerald-700">
                    {batchData.expiryDate || "2026-05-15"}
                  </span>
                </div>
              </div>

              {/* Barcode + QR Strip */}
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-200">
                <div className="flex-1 flex flex-col items-center">
                  <svg
                    viewBox={`0 0 ${barcodeBars.reduce((a, b) => a + b, 0)} 40`}
                    className="w-full h-14"
                    preserveAspectRatio="none"
                  >
                    {(() => {
                      let x = 0;
                      return barcodeBars.map((w, idx) => {
                        const rect =
                          idx % 2 === 0 ? (
                            <rect key={idx} x={x} y={0} width={w} height={40} fill="#0f172a" />
                          ) : null;
                        x += w;
                        return rect;
                      });
                    })()}
                  </svg>
                  <span className="font-mono text-xs font-black tracking-widest mt-1 text-slate-800">
                    *{batchData.batchId}*
                  </span>
                </div>

                <div className="p-1.5 bg-white border border-slate-900 rounded shrink-0">
                  <svg
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="w-20 h-20"
                    shapeRendering="crispEdges"
                  >
                    {qrMatrix.map((row, rIdx) =>
                      row.map((cell, cIdx) =>
                        cell ? (
                          <rect
                            key={`${rIdx}-${cIdx}`}
                            x={cIdx}
                            y={rIdx}
                            width={1}
                            height={1}
                            fill="#0f172a"
                          />
                        ) : null
                      )
                    )}
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
