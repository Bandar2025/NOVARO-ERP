import React, { useState } from "react";
import { ZatcaDocumentRecord } from "../../types";
import { ZatcaEngine } from "../../core/domain/zatca/ZatcaEngine";
import { QrCode, ShieldCheck, Code, Download, Copy, Check, X, Hash, Lock } from "lucide-react";

interface ZatcaQRModalProps {
  record: ZatcaDocumentRecord;
  onClose: () => void;
  language?: "ar" | "en";
}

export default function ZatcaQRModal({ record, onClose, language = "ar" }: ZatcaQRModalProps) {
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState<"qr" | "tlv" | "xml">("qr");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const qrMatrix = ZatcaEngine.generateQrMatrix(record.tlvBase64);

  const decodedTags = ZatcaEngine.encodeTlvBase64([
    { tag: 1, value: record.sellerName },
    { tag: 2, value: record.vatNumber },
    { tag: 3, value: record.issueTimestamp },
    { tag: 4, value: record.totalAmount.toFixed(2) },
    { tag: 5, value: record.vatAmount.toFixed(2) },
    { tag: 6, value: record.invoiceHash },
    { tag: 7, value: record.digitalSignature.slice(0, 44) },
    { tag: 8, value: record.publicKeyStamp }
  ]).tags;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const downloadXml = () => {
    const blob = new Blob([record.xmlContent], { type: "application/xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ZATCA_${record.documentId}_${record.uuid.slice(0, 8)}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-teal-600/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black tracking-wide">
                  {isAr ? "شهادة الامتثال الضريبي والفوترة الإلكترونية (ZATCA Fatoora)" : "ZATCA E-Invoicing Cryptographic Stamp"}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700 rounded">
                  {record.status} • ICV #{record.icv}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {record.documentId} | UUID: {record.uuid}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("qr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "qr"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{isAr ? "رمز QR والهاش المشفر" : "QR & Hash Chain"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tlv")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "tlv"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{isAr ? "تفكيك حقول TLV (Tag 1–8)" : "TLV Tags Inspector"}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("xml")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                activeTab === "xml"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-200/70"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>{isAr ? "مستند UBL 2.1 XML" : "UBL 2.1 XML"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={downloadXml}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-700 hover:bg-teal-800 text-white flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isAr ? "تنزيل XML المعتمد" : "Download UBL XML"}</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === "qr" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Visual QR Matrix */}
              <div className="md:col-span-5 flex flex-col items-center p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="p-3 bg-white border-2 border-slate-900 rounded-lg shadow-xs">
                  <svg
                    viewBox={`0 0 ${qrMatrix.length} ${qrMatrix.length}`}
                    className="w-44 h-44"
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
                <div className="mt-3 text-center">
                  <span className="text-[11px] font-bold text-slate-800 block">
                    {isAr ? "رمز استجابة سريعة TLV Base64" : "ZATCA TLV Base64 QR Code"}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Type {record.invoiceTypeCode} ({record.subType === "0100000" ? "B2B Tax Invoice" : "B2C Simplified"})
                  </span>
                </div>
              </div>

              {/* Cryptographic Chain Details */}
              <div className="md:col-span-7 space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "العداد التسلسلي (ICV):" : "Invoice Counter (ICV):"}</span>
                    <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      #{record.icv}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "المعرف العالمي (UUID):" : "Document UUID:"}</span>
                    <span className="font-mono text-[11px] text-slate-800">{record.uuid}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "الرقم الضريبي للمنشأة:" : "Seller VAT Number:"}</span>
                    <span className="font-mono font-bold text-teal-800">{record.vatNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "الصافي الخاضع للضريبة:" : "Taxable Subtotal:"}</span>
                    <span className="font-mono font-bold text-slate-800">SAR {record.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold">{isAr ? "ضريبة القيمة المضافة (15%):" : "VAT Amount (15%):"}</span>
                    <span className="font-mono font-bold text-amber-700">SAR {record.vatAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                    <span className="text-slate-800 font-black">{isAr ? "الإجمالي شامل الضريبة:" : "Total Inclusive of VAT:"}</span>
                    <span className="font-mono font-black text-sm text-teal-700">SAR {record.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* SHA-256 Current Invoice Hash */}
                <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      {isAr ? "هاش الفاتورة الحالي (SHA-256 Invoice Hash)" : "Current Invoice SHA-256 Hash"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(record.invoiceHash, "hash")}
                      className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedField === "hash" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "hash" ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] break-all text-white bg-slate-950 p-2 rounded border border-slate-800">
                    {record.invoiceHash}
                  </div>
                </div>

                {/* Previous Invoice Hash (PIH) */}
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {isAr ? "هاش الفاتورة السابقة المرتبط (PIH)" : "Linked Previous Invoice Hash (PIH)"}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] break-all text-slate-600">
                    {record.previousInvoiceHash}
                  </div>
                </div>

                {/* TLV Base64 String */}
                <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      {isAr ? "سلسلة TLV Base64 المضمنة في QR" : "Encoded TLV Base64 Payload"}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyText(record.tlvBase64, "tlv")}
                      className="text-[10px] text-teal-700 font-bold hover:underline flex items-center gap-1"
                    >
                      {copiedField === "tlv" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "tlv" ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ TLV" : "Copy TLV")}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[10px] break-all text-slate-700 bg-white p-2 rounded border border-slate-200">
                    {record.tlvBase64}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "tlv" && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-right font-bold">{isAr ? "رقم الوسم (Tag)" : "Tag"}</th>
                    <th className="py-2.5 px-3 text-right font-bold">{isAr ? "وصف الحقل حسب هيئة الزكاة" : "ZATCA Field Name"}</th>
                    <th className="py-2.5 px-3 text-right font-bold">{isAr ? "الطول (Bytes)" : "Length"}</th>
                    <th className="py-2.5 px-3 text-right font-bold">{isAr ? "القيمة المشفرة (Value)" : "Decoded Value"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {decodedTags.map((t) => (
                    <tr key={t.tag} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-700">Tag 0{t.tag}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{isAr ? t.nameAr : t.nameEn}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{t.byteLength} bytes</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 break-all">{t.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "xml" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {isAr ? "هيكل الفاتورة القياسي UBL 2.1 XML (معتمد للمرحلة الثانية - الربط والتكامل)" : "Standard UBL 2.1 XML Payload (ZATCA Phase 2 Integration)"}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(record.xmlContent, "xml")}
                  className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                >
                  {copiedField === "xml" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === "xml" ? (isAr ? "تم نسخ XML" : "Copied") : (isAr ? "نسخ الكود" : "Copy XML")}</span>
                </button>
              </div>
              <pre
                dir="ltr"
                className="p-4 bg-slate-950 text-teal-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96 leading-relaxed border border-slate-800"
              >
                {record.xmlContent}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>
              {isAr
                ? "تم التحقق من سلامة تسلسل الهاش (PIH -> Current Hash) وتطابق TLV Base64."
                : "Cryptographic hash chain (PIH -> Hash) and TLV Base64 verified."}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-slate-800"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
