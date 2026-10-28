import React, { useState } from "react";
import { useAppState } from "../context/StateContext";
import { ZatcaDocumentRecord } from "../types";
import { ZATCA_GENESIS_PIH } from "../core/domain/zatca/ZatcaEngine";
import PageHeader from "./common/PageHeader";
import GlobalActionBar from "./common/GlobalActionBar";
import ERPTable, { ColumnDef } from "./common/ERPTable";
import ZatcaQRModal from "./common/ZatcaQRModal";
import {
  ShieldCheck, QrCode, Percent, CheckCircle2, Lock, Code,
  FileCheck, RefreshCw, Download, Eye, Hash
} from "lucide-react";

interface ZatcaComplianceModuleProps {
  initialTab?: "zatca" | "e_invoicing" | "vat_config";
  language?: "ar" | "en";
}

export default function ZatcaComplianceModule({
  initialTab = "zatca",
  language = "ar"
}: ZatcaComplianceModuleProps) {
  const isAr = language === "ar";
  const {
    zatcaRecords,
    salesInvoices,
    purchaseOrders,
    salesReturns,
    purchaseReturns,
    companySettings,
    setCompanySettings,
    addToast
  } = useAppState();

  const [activeTab, setActiveTab] = useState<"zatca" | "e_invoicing" | "vat_config">(initialTab);
  const [selectedRecord, setSelectedRecord] = useState<ZatcaDocumentRecord | null>(null);
  const [chainVerified, setChainVerified] = useState<boolean | null>(null);

  // Sync tab if sidebar selection changes
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Verify cryptographic hash chain integrity (ICV 1 -> N)
  const verifyCryptographicChain = () => {
    const sorted = [...zatcaRecords].sort((a, b) => a.icv - b.icv);
    let expectedPrevHash = ZATCA_GENESIS_PIH;
    let valid = true;

    for (const rec of sorted) {
      if (rec.previousInvoiceHash !== expectedPrevHash) {
        valid = false;
        break;
      }
      expectedPrevHash = rec.invoiceHash;
    }

    setChainVerified(valid);
    addToast({
      type: valid ? "success" : "error",
      message: valid
        ? `تم التحقق من سلامة سلسلة التشفير (PIH -> SHA-256) لجميع المستندات (${sorted.length} مستندات) بنجاح!`
        : "تحذير: تم رصد عدم تطابق في سلسلة الهاش التراكمية!",
      messageEn: valid
        ? `Cryptographic hash chain verified across all ${sorted.length} ZATCA documents!`
        : "Hash chain mismatch detected!"
    });
  };

  // Calculate VAT Return figures
  const totalSalesTaxable = salesInvoices.reduce(
    (s, inv) => s + (inv.subtotal || inv.totalAmount / 1.15),
    0
  );
  const totalOutputVat = salesInvoices.reduce(
    (s, inv) => s + (inv.taxAmount || inv.totalAmount - inv.totalAmount / 1.15),
    0
  );
  const totalSalesReturnVat = salesReturns.reduce((s, r) => s + r.taxAmount, 0);

  const totalPurchasesTaxable = purchaseOrders
    .filter((p) => p.status === "Received")
    .reduce((s, p) => s + (p.subtotal || p.totalAmount), 0);
  const totalInputVat = purchaseOrders
    .filter((p) => p.status === "Received")
    .reduce((s, p) => s + (p.taxAmount || p.totalAmount * 0.15), 0);
  const totalPurchaseReturnVat = purchaseReturns.reduce((s, r) => s + r.taxAmount, 0);

  const netVatPayable =
    totalOutputVat - totalSalesReturnVat - (totalInputVat - totalPurchaseReturnVat);

  const columns: ColumnDef[] = [
    {
      key: "icv",
      header: "العداد (ICV)",
      headerEn: "ICV",
      render: (val: any) => (
        <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          #{val}
        </span>
      )
    },
    {
      key: "documentId",
      header: "رقم المستند",
      headerEn: "Document ID",
      render: (val: any) => <span className="font-mono font-bold text-teal-800">{val}</span>
    },
    {
      key: "invoiceTypeCode",
      header: "نوع الفاتورة (ZATCA)",
      headerEn: "Type Code",
      render: (val: any, row: ZatcaDocumentRecord) => (
        <span className="font-mono text-xs font-bold text-slate-700">
          {val === "388"
            ? isAr
              ? "388 - فاتورة ضريبية"
              : "388 - Tax Invoice"
            : val === "381"
            ? isAr
              ? "381 - إشعار دائن"
              : "381 - Credit Note"
            : isAr
            ? "383 - إشعار مدين"
            : "383 - Debit Note"}{" "}
          <span className="text-[10px] text-slate-400">({row.subType})</span>
        </span>
      )
    },
    { key: "customerName", header: "العميل / الجهة", headerEn: "Party Name" },
    {
      key: "uuid",
      header: "المعرف العالمي (UUID)",
      headerEn: "UUID",
      render: (val: any) => (
        <span className="font-mono text-[11px] text-slate-500" title={val}>
          {String(val).slice(0, 18)}...
        </span>
      )
    },
    {
      key: "invoiceHash",
      header: "هاش SHA-256",
      headerEn: "SHA-256 Hash",
      render: (val: any) => (
        <span className="font-mono text-[11px] text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
          {String(val).slice(0, 16)}...
        </span>
      )
    },
    {
      key: "totalAmount",
      header: "الإجمالي شامل الضريبة",
      headerEn: "Total (SAR)",
      render: (val: any) => (
        <span className="font-mono font-bold text-slate-900">
          SAR {Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    {
      key: "status",
      header: "حالة فاتورة",
      headerEn: "ZATCA Status",
      render: (val: any) => (
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          {val}
        </span>
      )
    },
    {
      key: "actions",
      header: "QR & XML",
      headerEn: "QR & XML",
      sortable: false,
      render: (_: any, row: ZatcaDocumentRecord) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setSelectedRecord(row)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>{isAr ? "فحص QR / XML" : "Inspect QR / XML"}</span>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="الضرائب والامتثال والفوترة الإلكترونية (ZATCA Fatoora)"
        titleEn="ZATCA Phase 1 & Phase 2 E-Invoicing & VAT Compliance"
        description="إدارة الفوترة الإلكترونية للمرحلتين الأولى والثانية (TLV QR + UBL 2.1 XML + سلسلة الهاش التراكمي SHA-256) والإقرار الضريبي."
        descriptionEn="Manage ZATCA Phase 1 & Phase 2 cryptographic hash chains, TLV Base64 QR codes, UBL 2.1 XML, and 15% KSA VAT returns."
        icon={ShieldCheck}
        breadcrumbs={[
          { label: "الضرائب والامتثال", labelEn: "Tax & Compliance" },
          {
            label:
              activeTab === "zatca"
                ? "متطلبات هيئة الزكاة (المرحلة الثانية)"
                : activeTab === "e_invoicing"
                ? "سجل الفوترة الإلكترونية"
                : "إعدادات وإقرار ضريبة القيمة المضافة",
            labelEn:
              activeTab === "zatca"
                ? "ZATCA Phase 2 Chain"
                : activeTab === "e_invoicing"
                ? "E-Invoicing Fatoora"
                : "VAT Return & Config",
            active: true
          }
        ]}
        language={language}
      />

      <GlobalActionBar
        onRefresh={verifyCryptographicChain}
        extraActions={[
          {
            id: "verify-chain",
            labelAr: "فحص سلامة تسلسل الهاش (PIH)",
            labelEn: "Verify Hash Chain Integrity",
            icon: Lock,
            variant: "primary",
            onClick: verifyCryptographicChain
          }
        ]}
        totalCount={zatcaRecords.length}
        pageId="zatca"
        language={language}
      />

      {/* Sub-navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("zatca")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "zatca"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{isAr ? "سلسلة التشفير والربط (ZATCA Phase 2)" : "Cryptographic Chain (Phase 2)"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("e_invoicing")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "e_invoicing"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <QrCode className="w-4 h-4 text-teal-600" />
          <span>{isAr ? "مستكشف رموز QR وملفات XML" : "QR & UBL 2.1 XML Explorer"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("vat_config")}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            activeTab === "vat_config"
              ? "bg-white text-slate-900 shadow-xs border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Percent className="w-4 h-4 text-teal-600" />
          <span>{isAr ? "الإقرار الضريبي وإعدادات ضريبة 15%" : "KSA 15% VAT Return & Settings"}</span>
        </button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block">
            {isAr ? "إجمالي الفواتير والإشعارات المشفرة" : "Stamped ZATCA Documents"}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-slate-900">{zatcaRecords.length}</span>
            <span className="text-[11px] font-mono font-bold text-teal-700">
              ICV #{zatcaRecords.length > 0 ? Math.max(...zatcaRecords.map((r) => r.icv)) : 0}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block">
            {isAr ? "ضريبة المخرجات المحصلة (15%)" : "Output VAT Collected (15%)"}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-slate-900">
              SAR {(totalOutputVat - totalSalesReturnVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono text-slate-500">Acc 2100</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block">
            {isAr ? "ضريبة المدخلات القابلة للاسترداد" : "Recoverable Input VAT"}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-emerald-700">
              SAR {(totalInputVat - totalPurchaseReturnVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono text-slate-500">Purchases</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 block">
            {isAr ? "صافي الضريبة المستحقة للهيئة" : "Net VAT Payable to ZATCA"}
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-amber-700">
              SAR {netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-700">
              {chainVerified === false ? "CHAIN ALERT" : "VERIFIED"}
            </span>
          </div>
        </div>
      </div>

      {/* Tab 1 & 2: Cryptographic Chain & QR/XML Explorer */}
      {(activeTab === "zatca" || activeTab === "e_invoicing") && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-700" />
                {isAr
                  ? "سجل الفواتير والإشعارات المشفرة (ZATCA Cryptographic Ledger)"
                  : "ZATCA Cryptographic Invoice & Note Ledger"}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAr
                  ? "كل فاتورة مبيعات أو إيصال نقاط بيع أو إشعار دائن/مدين يولد تلقائياً UUID وهاش SHA-256 مرتبطاً بـ PIH السابق."
                  : "Every invoice, POS receipt, and credit/debit note automatically generates a UUID and SHA-256 hash linked to the previous PIH."}
              </p>
            </div>
            <div className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              VAT ID: <strong className="text-slate-900">{companySettings.taxNumber}</strong>
            </div>
          </div>

          <ERPTable
            data={zatcaRecords}
            columns={columns}
            language={language}
            onRowClick={(row) => setSelectedRecord(row)}
          />
        </div>
      )}

      {/* Tab 3: VAT Return & Tax Settings */}
      {activeTab === "vat_config" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* VAT Return Report */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-teal-700" />
              {isAr ? "ملخص الإقرار الضريبي للفترة الجارية (نموذج هيئة الزكاة)" : "Current Period VAT Return Statement"}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {isAr ? "1. إجمالي المبيعات الخاضعة للنسبة الأساسية (15%)" : "1. Standard Rated Sales (15%)"}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  SAR {totalSalesTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {isAr ? "2. ضريبة المخرجات على المبيعات (Output VAT)" : "2. Output VAT on Sales"}
                </span>
                <span className="font-mono font-bold text-amber-700">
                  SAR {totalOutputVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {isAr ? "3. التسويات والإشعارات الدائنة (مرتجعات المبيعات)" : "3. Credit Notes / Sales Returns VAT"}
                </span>
                <span className="font-mono font-bold text-rose-700">
                  - SAR {totalSalesReturnVat.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {isAr ? "4. إجمالي المشتريات الخاضعة للضريبة (المستلمة)" : "4. Standard Rated Purchases"}
                </span>
                <span className="font-mono font-bold text-slate-900">
                  SAR {totalPurchasesTaxable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <span className="font-bold text-slate-700">
                  {isAr ? "5. ضريبة المدخلات القابلة للخصم (Input VAT)" : "5. Deductible Input VAT"}
                </span>
                <span className="font-mono font-bold text-emerald-700">
                  SAR {(totalInputVat - totalPurchaseReturnVat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between mt-3">
                <span className="font-black text-xs">
                  {isAr ? "صافي ضريبة القيمة المضافة المستحقة للسداد:" : "Net VAT Payable:"}
                </span>
                <span className="font-mono font-black text-base text-teal-400">
                  SAR {netVatPayable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Tax Configuration Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-black text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <Percent className="w-4 h-4 text-teal-700" />
              {isAr ? "إعدادات الهوية الضريبية والربط (ZATCA Config)" : "Tax Identity & CSID Configuration"}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  {isAr ? "اسم المنشأة المسجل لدى هيئة الزكاة والضريبة" : "Registered Legal Entity Name"}
                </label>
                <input
                  type="text"
                  value={companySettings.nameAr}
                  onChange={(e) => setCompanySettings((prev) => ({ ...prev, nameAr: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  {isAr ? "الرقم الضريبي المكون من 15 رقماً (يبدأ وينتهي بـ 3)" : "15-Digit KSA VAT Registration Number"}
                </label>
                <input
                  type="text"
                  value={companySettings.taxNumber}
                  onChange={(e) => setCompanySettings((prev) => ({ ...prev, taxNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  {isAr ? "رقم السجل التجاري (CRN)" : "Commercial Registration (CRN)"}
                </label>
                <input
                  type="text"
                  value={companySettings.commercialRegistration}
                  onChange={(e) =>
                    setCompanySettings((prev) => ({ ...prev, commercialRegistration: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 font-mono font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">
                  {isAr ? "هاش التأسيس الأولي (ZATCA Genesis PIH)" : "ZATCA Genesis PIH"}
                </label>
                <div className="p-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono text-[10px] break-all text-slate-600">
                  {ZATCA_GENESIS_PIH}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedRecord && (
        <ZatcaQRModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          language={language}
        />
      )}
    </div>
  );
}
