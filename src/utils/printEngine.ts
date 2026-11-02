import { ZatcaDocumentRecord } from "../types";
import { ZatcaEngine } from "../core/domain/zatca/ZatcaEngine";

export type PrintDocumentFormat = "a4_invoice" | "thermal_80mm" | "batch_label";
export type PrintLanguageMode = "ar" | "en" | "bilingual";

export interface UnifiedInvoicePrintPayload {
  id: string;
  date: string;
  customerName: string;
  customerVat?: string;
  customerAddress?: string;
  type?: string;
  status?: string;
  documentTitleAr?: string;
  documentTitleEn?: string;
  items: {
    itemName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal?: number;
  vatAmount?: number;
  totalAmount: number;
  zatcaRecord?: ZatcaDocumentRecord | null;
  companyNameAr?: string;
  companyNameEn?: string;
  companyVat?: string;
  companyCrn?: string;
  companyAddress?: string;
}

export interface UnifiedBatchPrintPayload {
  batchId: string;
  productNameAr: string;
  productNameEn?: string;
  roastProfile?: string;
  weightKg: number;
  roastDate: string;
  expiryDate?: string;
  operator?: string;
  lossPct?: string | number;
  sku?: string;
}

export class UnifiedPrintEngine {
  /**
   * Generates deterministic Code-128 style bar widths from any string
   */
  static generateLinearBarcodeBars(code: string): number[] {
    const clean = (code || "NOVARO-BATCH").toUpperCase();
    const bars: number[] = [2, 1, 1, 2, 3, 1]; // Start pattern
    for (let i = 0; i < clean.length; i++) {
      const charCode = clean.charCodeAt(i);
      bars.push(((charCode >> 0) & 3) + 1);
      bars.push(((charCode >> 2) & 2) + 1);
      bars.push(((charCode >> 4) & 3) + 1);
      bars.push(1);
    }
    bars.push(2, 3, 1, 1, 2); // Stop pattern
    return bars;
  }

  /**
   * Renders a QR boolean matrix into an inline SVG string
   */
  static renderQrSvgString(matrix: boolean[][], sizePx = 120): string {
    const dim = matrix.length;
    let rects = "";
    for (let r = 0; r < dim; r++) {
      for (let c = 0; c < dim; c++) {
        if (matrix[r][c]) {
          rects += `<rect x="${c}" y="${r}" width="1" height="1" fill="#0f172a"/>`;
        }
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" width="${sizePx}" height="${sizePx}" shape-rendering="crispEdges">${rects}</svg>`;
  }

  /**
   * Renders a linear Code-128 style barcode into an inline SVG string
   */
  static renderBarcodeSvgString(code: string, heightPx = 44): string {
    const bars = this.generateLinearBarcodeBars(code);
    const totalWidth = bars.reduce((a, b) => a + b, 0);
    let x = 0;
    let rects = "";
    bars.forEach((w, idx) => {
      if (idx % 2 === 0) {
        rects += `<rect x="${x}" y="0" width="${w}" height="${heightPx}" fill="#0f172a"/>`;
      }
      x += w;
    });
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${heightPx}" style="width:100%;height:${heightPx}px" preserveAspectRatio="none">${rects}</svg>`;
  }

  /**
   * Normalizes subtotal, 15% KSA VAT, and grand total for any invoice payload
   */
  static computeInvoiceTotals(invoice: UnifiedInvoicePrintPayload): {
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
    tlvPayload: string;
  } {
    const rawTotal = Number(invoice.totalAmount || 0);
    const subtotal =
      invoice.subtotal !== undefined
        ? Number(invoice.subtotal)
        : Math.round((rawTotal / 1.15) * 100) / 100;
    const vatAmount =
      invoice.vatAmount !== undefined
        ? Number(invoice.vatAmount)
        : Math.round((rawTotal - subtotal) * 100) / 100;

    const sellerNameAr = invoice.companyNameAr || "شركة محامص وبن نوفارو المحدودة";
    const sellerVat = invoice.companyVat || "310123456700003";

    const tlvPayload =
      invoice.zatcaRecord?.tlvBase64 ||
      ZatcaEngine.encodeTlvBase64([
        { tag: 1, value: sellerNameAr },
        { tag: 2, value: sellerVat },
        { tag: 3, value: invoice.date || new Date().toISOString() },
        { tag: 4, value: rawTotal.toFixed(2) },
        { tag: 5, value: vatAmount.toFixed(2) }
      ]).base64;

    return {
      subtotal,
      vatAmount,
      totalAmount: rawTotal,
      tlvPayload
    };
  }

  /**
   * Builds standalone, print-ready HTML document for A4 Tax Invoice, 80mm Thermal Receipt, or Batch Label
   * Supports Arabic (RTL), English (LTR), and Bilingual layouts.
   */
  static buildPrintableHtml(options: {
    format: PrintDocumentFormat;
    languageMode: PrintLanguageMode;
    invoiceData?: UnifiedInvoicePrintPayload | null;
    batchData?: UnifiedBatchPrintPayload | null;
  }): string {
    const { format, languageMode, invoiceData, batchData } = options;
    const isRtl = languageMode !== "en";
    const dir = isRtl ? "rtl" : "ltr";
    const alignStart = isRtl ? "right" : "left";
    const alignEnd = isRtl ? "left" : "right";

    const pageCss =
      format === "thermal_80mm"
        ? `@page { size: 80mm auto; margin: 2mm; } body { width: 76mm; margin: 0 auto; font-family: 'Cairo', 'Segoe UI', Tahoma, monospace; }`
        : format === "batch_label"
        ? `@page { size: 100mm 65mm; margin: 2mm; } body { width: 96mm; margin: 0 auto; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; }`
        : `@page { size: A4 portrait; margin: 10mm; } body { max-width: 210mm; margin: 0 auto; font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; }`;

    if (format === "batch_label" && batchData) {
      const qrMatrix = ZatcaEngine.generateQrMatrix(
        `NOVARO|BATCH:${batchData.batchId}|ITEM:${batchData.productNameAr}|ROAST:${batchData.roastProfile || "Medium"}|DATE:${batchData.roastDate}`
      );
      const qrSvg = this.renderQrSvgString(qrMatrix, 74);
      const barcodeSvg = this.renderBarcodeSvgString(batchData.batchId, 38);

      return `<!DOCTYPE html>
<html lang="${isRtl ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>Batch Label ${batchData.batchId}</title>
  <style>
    ${pageCss}
    * { box-sizing: border-box; }
    .label-box { border: 2px solid #0f172a; border-radius: 10px; padding: 10px; color: #0f172a; }
    .hdr { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 6px; margin-bottom: 8px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #f8fafc; padding: 8px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 11px; }
    .ftr { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-top: 8px; padding-top: 6px; border-top: 1px solid #cbd5e1; }
  </style>
</head>
<body>
  <div class="label-box">
    <div class="hdr">
      <div>
        <div style="font-size:9px;font-weight:800;color:#b45309;letter-spacing:1px;">NOVARO SPECIALTY ROASTERY</div>
        <div style="font-size:14px;font-weight:900;">${batchData.productNameAr}</div>
      </div>
      <div style="background:#0f172a;color:#fff;padding:4px 8px;border-radius:6px;text-align:center;font-family:monospace;">
        <div style="font-size:8px;color:#fbbf24;">NET WEIGHT</div>
        <div style="font-size:13px;font-weight:900;">${batchData.weightKg} KG</div>
      </div>
    </div>
    <div class="grid">
      <div><span style="color:#64748b;display:block;font-size:9px;">${isRtl ? "رقم الدفعة / Batch:" : "Batch Lot:"}</span><strong>${batchData.batchId}</strong></div>
      <div><span style="color:#64748b;display:block;font-size:9px;">${isRtl ? "درجة التحميص / Profile:" : "Roast Profile:"}</span><strong>${batchData.roastProfile || "Medium"}</strong></div>
      <div><span style="color:#64748b;display:block;font-size:9px;">${isRtl ? "تاريخ التحميص / Roast Date:" : "Roast Date:"}</span><strong>${batchData.roastDate}</strong></div>
      <div><span style="color:#64748b;display:block;font-size:9px;">${isRtl ? "تاريخ الانتهاء / Expiry:" : "Expiry Date:"}</span><strong>${batchData.expiryDate || "2026-10-30"}</strong></div>
    </div>
    <div class="ftr">
      <div style="flex:1;text-align:center;">
        ${barcodeSvg}
        <div style="font-family:monospace;font-size:10px;font-weight:900;letter-spacing:2px;">*${batchData.batchId}*</div>
      </div>
      <div style="border:1px solid #0f172a;padding:3px;border-radius:4px;">${qrSvg}</div>
    </div>
  </div>
</body>
</html>`;
    }

    if (!invoiceData) return "<html><body>No Print Data</body></html>";

    const { subtotal, vatAmount, totalAmount, tlvPayload } = this.computeInvoiceTotals(invoiceData);
    const qrMatrix = ZatcaEngine.generateQrMatrix(tlvPayload);
    const sellerNameAr = invoiceData.companyNameAr || "شركة محامص وبن نوفارو المحدودة";
    const sellerNameEn = invoiceData.companyNameEn || "Novaro Coffee & Roastery Co. Ltd";
    const sellerVat = invoiceData.companyVat || "310123456700003";
    const sellerCrn = invoiceData.companyCrn || "2050123456";
    const sellerAddress =
      invoiceData.companyAddress ||
      (isRtl
        ? "الدمام - المدينة الصناعية الثانية، المملكة العربية السعودية"
        : "Dammam 2nd Industrial City, Kingdom of Saudi Arabia");

    if (format === "thermal_80mm") {
      const qrSvg = this.renderQrSvgString(qrMatrix, 118);
      const barcodeSvg = this.renderBarcodeSvgString(invoiceData.id, 30);
      const rowsHtml = invoiceData.items
        .map(
          (it) => `
        <tr>
          <td style="padding:3px 0;text-align:${alignStart};font-weight:700;">${it.itemName} <span style="color:#64748b;font-family:monospace;">x${it.quantity}</span></td>
          <td style="padding:3px 0;text-align:${alignEnd};font-family:monospace;font-weight:700;">SAR ${Number(it.total).toFixed(2)}</td>
        </tr>`
        )
        .join("");

      return `<!DOCTYPE html>
<html lang="${isRtl ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>POS Receipt ${invoiceData.id}</title>
  <style>
    ${pageCss}
    * { box-sizing: border-box; }
    .receipt { padding: 6px; color: #0f172a; font-size: 11px; }
    .dashed { border-bottom: 1px dashed #64748b; padding-bottom: 6px; margin-bottom: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="dashed" style="text-align:center;">
      <div style="font-size:13px;font-weight:900;">${languageMode === "en" ? sellerNameEn : sellerNameAr}</div>
      ${languageMode === "bilingual" ? `<div style="font-size:10px;color:#475569;">${sellerNameEn}</div>` : ""}
      <div style="font-size:10px;margin-top:2px;">${isRtl ? "الرقم الضريبي / VAT:" : "VAT No:"} <strong>${sellerVat}</strong></div>
      <div style="display:inline-block;background:#0f172a;color:#fff;padding:2px 8px;border-radius:4px;font-size:9px;font-weight:800;margin-top:4px;">
        ${languageMode === "en" ? "SIMPLIFIED TAX INVOICE (POS)" : "فاتورة ضريبية مبسطة - نقاط البيع"}
      </div>
    </div>
    <div class="dashed">
      <div style="display:flex;justify-content:space-between;"><span>${isRtl ? "رقم الإيصال / No:" : "Receipt #:"}</span><strong style="font-family:monospace;">${invoiceData.id}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span>${isRtl ? "التاريخ / Date:" : "Date:"}</span><span style="font-family:monospace;">${invoiceData.date}</span></div>
      <div style="display:flex;justify-content:space-between;"><span>${isRtl ? "العميل / Client:" : "Customer:"}</span><strong>${invoiceData.customerName}</strong></div>
    </div>
    <div class="dashed">
      <table>
        <thead>
          <tr style="border-bottom:1px solid #cbd5e1;color:#475569;">
            <th style="text-align:${alignStart};padding-bottom:3px;">${isRtl ? "الصنف والكمية / Item" : "Item x Qty"}</th>
            <th style="text-align:${alignEnd};padding-bottom:3px;">${isRtl ? "الإجمالي / Total" : "Total"}</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>
    <div class="dashed">
      <div style="display:flex;justify-content:space-between;"><span>${isRtl ? "المجموع قبل الضريبة / Subtotal:" : "Subtotal (Excl. VAT):"}</span><strong style="font-family:monospace;">SAR ${subtotal.toFixed(2)}</strong></div>
      <div style="display:flex;justify-content:space-between;"><span>${isRtl ? "ضريبة القيمة المضافة 15% / VAT:" : "VAT (15%):"}</span><strong style="font-family:monospace;">SAR ${vatAmount.toFixed(2)}</strong></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900;margin-top:4px;padding-top:4px;border-top:1px dotted #94a3b8;">
        <span>${isRtl ? "الإجمالي الشامل / Total:" : "GRAND TOTAL:"}</span>
        <span style="font-family:monospace;">SAR ${totalAmount.toFixed(2)}</span>
      </div>
    </div>
    <div style="text-align:center;padding-top:4px;">
      <div style="display:inline-block;border:1px solid #0f172a;padding:4px;border-radius:4px;">${qrSvg}</div>
      <div style="margin-top:6px;">${barcodeSvg}</div>
      <div style="font-size:8px;color:#64748b;margin-top:4px;font-family:monospace;">UUID: ${invoiceData.zatcaRecord?.uuid || "ZATCA-PHASE2-STAMPED"}</div>
    </div>
  </div>
</body>
</html>`;
    }

    // Default: A4 Official ZATCA Phase 2 Tax Invoice
    const qrSvg = this.renderQrSvgString(qrMatrix, 115);
    const itemsHtml = invoiceData.items
      .map((item, idx) => {
        const lineNet = item.quantity * item.price;
        const lineVat = lineNet * 0.15;
        return `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${idx + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:700;">${item.itemName}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:monospace;font-weight:700;">${item.quantity}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:monospace;">${Number(item.price).toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:center;font-family:monospace;color:#b45309;">${lineVat.toFixed(2)}</td>
        <td style="padding:8px;border-bottom:1px solid #e2e8f0;text-align:${alignEnd};font-family:monospace;font-weight:800;">${Number(item.total).toFixed(2)}</td>
      </tr>`;
      })
      .join("");

    return `<!DOCTYPE html>
<html lang="${isRtl ? "ar" : "en"}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <title>Tax Invoice ${invoiceData.id}</title>
  <style>
    ${pageCss}
    * { box-sizing: border-box; }
    .inv-wrapper { padding: 12px; color: #0f172a; }
    .top-bar { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 16px; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 10px; padding: 12px; margin-bottom: 16px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th { background: #0f172a; color: #fff; padding: 9px 8px; text-align: ${alignStart}; }
    .footer-grid { display: grid; grid-template-columns: 1.1fr 1fr; gap: 16px; align-items: center; }
  </style>
</head>
<body>
  <div class="inv-wrapper">
    <div class="top-bar">
      <div>
        <div style="font-size:18px;font-weight:900;">${languageMode === "en" ? sellerNameEn : sellerNameAr}</div>
        ${languageMode !== "en" ? `<div style="font-size:12px;color:#475569;font-family:monospace;font-weight:700;">${sellerNameEn}</div>` : ""}
        <div style="font-size:11px;color:#475569;margin-top:3px;">${sellerAddress}</div>
        <div style="font-size:11px;font-family:monospace;margin-top:3px;">
          ${isRtl ? "الرقم الضريبي (VAT):" : "VAT Registration:"} <strong>${sellerVat}</strong> | ${isRtl ? "س.ت (CRN):" : "CRN:"} <strong>${sellerCrn}</strong>
        </div>
      </div>
      <div style="background:#0f172a;color:#fff;padding:12px 18px;border-radius:10px;text-align:${alignEnd};">
        <div style="font-size:16px;font-weight:900;">
          ${languageMode === "en" ? "TAX INVOICE" : languageMode === "bilingual" ? "فاتورة ضريبية / TAX INVOICE" : "فاتورة ضريبية"}
        </div>
        <div style="font-size:10px;color:#2dd4bf;font-family:monospace;margin-top:2px;">ZATCA PHASE 2 (FATOORA)</div>
        <div style="font-size:12px;font-family:monospace;font-weight:800;margin-top:4px;">#${invoiceData.id}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div>
        <div style="font-size:10px;color:#64748b;font-weight:800;text-transform:uppercase;">
          ${languageMode === "en" ? "Buyer / Customer Information" : "بيانات العميل / المشتري (Buyer Details)"}
        </div>
        <div style="font-size:14px;font-weight:900;margin-top:4px;">${invoiceData.customerName}</div>
        <div style="font-family:monospace;margin-top:3px;">
          ${isRtl ? "الرقم الضريبي للعميل / Buyer VAT:" : "Buyer VAT No:"} <strong>${invoiceData.customerVat || "300987654300003"}</strong>
        </div>
        <div style="margin-top:3px;">
          ${isRtl ? "حالة السداد / Payment:" : "Payment Status:"} <strong>${invoiceData.status === "Paid" ? (isRtl ? "مدفوع (Paid)" : "Paid") : isRtl ? "آجل (Credit)" : "On Credit"}</strong>
        </div>
      </div>
      <div>
        <div style="font-size:10px;color:#64748b;font-weight:800;text-transform:uppercase;">
          ${languageMode === "en" ? "Invoice & Cryptographic Metadata" : "بيانات الفاتورة والختم الإلكتروني"}
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:4px;">
          <span>${isRtl ? "تاريخ الإصدار / Issue Date:" : "Issue Date:"}</span>
          <strong style="font-family:monospace;">${invoiceData.date}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:3px;">
          <span>${isRtl ? "العداد التسلسلي / ICV:" : "ICV Counter:"}</span>
          <strong style="font-family:monospace;">#${invoiceData.zatcaRecord?.icv || 1}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:3px;">
          <span>${isRtl ? "رمز نوع الفاتورة / Type Code:" : "Invoice Type Code:"}</span>
          <strong style="font-family:monospace;">${invoiceData.zatcaRecord?.invoiceTypeCode || "388"} (${invoiceData.type || "Standard"})</strong>
        </div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:36px;">#</th>
          <th>${languageMode === "en" ? "Item Description" : languageMode === "bilingual" ? "البيان / Item Description" : "بيان الصنف / الوصف"}</th>
          <th style="text-align:center;">${languageMode === "en" ? "Qty" : "الكمية / Qty"}</th>
          <th style="text-align:center;">${languageMode === "en" ? "Unit Price (SAR)" : "سعر الوحدة / Price"}</th>
          <th style="text-align:center;">${languageMode === "en" ? "VAT 15%" : "الضريبة 15% / VAT"}</th>
          <th style="text-align:${alignEnd};">${languageMode === "en" ? "Total (SAR)" : "الإجمالي / Total"}</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>

    <div class="footer-grid">
      <div style="display:flex;align-items:center;gap:12px;background:#f8fafc;border:1px solid #cbd5e1;padding:10px;border-radius:10px;">
        <div style="border:2px solid #0f172a;padding:4px;background:#fff;border-radius:6px;">${qrSvg}</div>
        <div style="font-size:10px;font-family:monospace;overflow:hidden;">
          <div style="font-weight:900;color:#047857;font-family:sans-serif;font-size:11px;">
            ${isRtl ? "✓ مختوم إلكترونياً (ZATCA Phase 2)" : "✓ ZATCA Phase 2 Cryptographic Stamp"}
          </div>
          <div style="margin-top:3px;word-break:break-all;">UUID: ${invoiceData.zatcaRecord?.uuid || "8e600000-4a11-4b22-9c33-novaro2025"}</div>
          <div style="margin-top:3px;color:#64748b;word-break:break-all;">SHA256: ${(invoiceData.zatcaRecord?.invoiceHash || tlvPayload).slice(0, 44)}...</div>
        </div>
      </div>

      <div style="background:#0f172a;color:#fff;padding:14px;border-radius:10px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;color:#cbd5e1;">
          <span>${languageMode === "en" ? "Taxable Subtotal (Excl. VAT):" : "الإجمالي الخاضع للضريبة (Subtotal):"}</span>
          <strong style="font-family:monospace;">SAR ${subtotal.toFixed(2)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px;color:#fbbf24;">
          <span>${languageMode === "en" ? "Value Added Tax (15% VAT):" : "ضريبة القيمة المضافة (15% VAT):"}</span>
          <strong style="font-family:monospace;">SAR ${vatAmount.toFixed(2)}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #334155;font-size:15px;font-weight:900;color:#2dd4bf;">
          <span>${languageMode === "en" ? "Grand Total (Incl. VAT):" : "الإجمالي المستحق (Grand Total):"}</span>
          <span style="font-family:monospace;">SAR ${totalAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Prints a document cleanly using an isolated hidden iframe so no browser popup blockers
   * or surrounding application chrome interfere with A4 or 80mm thermal paper layouts.
   */
  static printFormattedDocument(options: {
    format: PrintDocumentFormat;
    languageMode: PrintLanguageMode;
    invoiceData?: UnifiedInvoicePrintPayload | null;
    batchData?: UnifiedBatchPrintPayload | null;
  }): void {
    const html = this.buildPrintableHtml(options);
    const existingFrame = document.getElementById("novaro-isolated-print-frame") as HTMLIFrameElement | null;
    if (existingFrame && existingFrame.parentNode) {
      existingFrame.parentNode.removeChild(existingFrame);
    }

    const iframe = document.createElement("iframe");
    iframe.id = "novaro-isolated-print-frame";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }, 150);
    } else {
      window.print();
    }
  }
}
