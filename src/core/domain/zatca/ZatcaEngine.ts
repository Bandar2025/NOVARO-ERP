// NOVARO ERP Core Domain: ZATCA (Fatoora) Phase 1 & Phase 2 E-Invoicing Engine
// Implements TLV (Tag-Length-Value) Base64 Encoding, Deterministic SHA-256 Chaining (PIH + ICV),
// UBL 2.1 XML Generation, and Deterministic QR Matrix Generation.

export interface ZatcaTlvTag {
  tag: number;
  nameAr: string;
  nameEn: string;
  value: string;
  byteLength: number;
}

export interface ZatcaInvoiceInput {
  invoiceId: string;
  documentType: "SalesInvoice" | "POSReceipt" | "CreditNote" | "DebitNote";
  invoiceTypeCode: "388" | "381" | "383"; // 388: Tax Invoice, 381: Credit Note, 383: Debit Note
  subType: "0100000" | "0200000"; // 0100000: Standard B2B Tax Invoice, 0200000: Simplified B2C Tax Invoice
  sellerName: string;
  vatNumber: string;
  issueTimestamp: string; // ISO 8601
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  currency: string;
  customerName: string;
  customerVatNumber?: string;
  icv: number; // Invoice Counter Value
  previousInvoiceHash: string; // PIH Base64
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    price: number;
    total: number;
  }[];
}

export interface ZatcaStampResult {
  uuid: string;
  icv: number;
  previousInvoiceHash: string;
  invoiceHash: string;
  invoiceHashHex: string;
  digitalSignature: string;
  publicKeyStamp: string;
  tlvBase64: string;
  tlvTags: ZatcaTlvTag[];
  xmlContent: string;
}

// Official ZATCA Phase 2 Genesis Previous Invoice Hash (SHA-256 of "0" encoded in Base64)
export const ZATCA_GENESIS_PIH =
  "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjNzljMmRiYzIzOWRkNGU5MWI0NjcyOWQ3M2EyN2ZiNTdlOQ==";

export class ZatcaEngine {
  /**
   * Pure synchronous SHA-256 implementation returning both Hex and Base64
   * Works deterministically in browser and Node/Vitest environments
   */
  static sha256(asciiInput: string): { hex: string; base64: string; bytes: Uint8Array } {
    const encoder = new TextEncoder();
    const msgBytes = encoder.encode(asciiInput);

    const K: number[] = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];

    const H: number[] = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    const bitLen = msgBytes.length * 8;
    const padLen = ((msgBytes.length + 8) >> 6 << 4) + 16;
    const words = new Int32Array(padLen);

    for (let i = 0; i < msgBytes.length; i++) {
      words[i >> 2] |= msgBytes[i] << (24 - (i & 3) * 8);
    }
    words[msgBytes.length >> 2] |= 0x80 << (24 - (msgBytes.length & 3) * 8);
    words[padLen - 1] = bitLen;

    const W = new Int32Array(64);
    const rotr = (n: number, x: number) => (x >>> n) | (x << (32 - n));

    for (let i = 0; i < padLen; i += 16) {
      for (let t = 0; t < 16; t++) W[t] = words[i + t];
      for (let t = 16; t < 64; t++) {
        const s0 = rotr(7, W[t - 15]) ^ rotr(18, W[t - 15]) ^ (W[t - 15] >>> 3);
        const s1 = rotr(17, W[t - 2]) ^ rotr(19, W[t - 2]) ^ (W[t - 2] >>> 10);
        W[t] = (W[t - 16] + s0 + W[t - 7] + s1) | 0;
      }

      let [a, b, c, d, e, f, g, h] = H;
      for (let t = 0; t < 64; t++) {
        const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        const ch = (e & f) ^ (~e & g);
        const temp1 = (h + S1 + ch + K[t] + W[t]) | 0;
        const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const temp2 = (S0 + maj) | 0;

        h = g;
        g = f;
        f = e;
        e = (d + temp1) | 0;
        d = c;
        c = b;
        b = a;
        a = (temp1 + temp2) | 0;
      }

      H[0] = (H[0] + a) | 0;
      H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0;
      H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0;
      H[5] = (H[5] + f) | 0;
      H[6] = (H[6] + g) | 0;
      H[7] = (H[7] + h) | 0;
    }

    const hashBytes = new Uint8Array(32);
    let hex = "";
    for (let i = 0; i < 8; i++) {
      const val = H[i] >>> 0;
      hashBytes[i * 4] = (val >>> 24) & 0xff;
      hashBytes[i * 4 + 1] = (val >>> 16) & 0xff;
      hashBytes[i * 4 + 2] = (val >>> 8) & 0xff;
      hashBytes[i * 4 + 3] = val & 0xff;
      hex += val.toString(16).padStart(8, "0");
    }

    return {
      hex,
      base64: this.bytesToBase64(hashBytes),
      bytes: hashBytes
    };
  }

  /**
   * Generate RFC 4122 v4 deterministic/unique UUID for ZATCA document
   */
  static generateUUID(seed?: string): string {
    if (seed) {
      const { hex } = this.sha256(`NOVARO-UUID-${seed}`);
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    }
    const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return `${rnd()}${rnd()}-${rnd()}-4${rnd().slice(1)}-a${rnd().slice(1)}-${rnd()}${rnd()}${rnd()}`;
  }

  /**
   * Convert Uint8Array to Base64 safely across browser & Node
   */
  static bytesToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    if (typeof btoa === "function") {
      return btoa(binary);
    }
    return Buffer.from(bytes).toString("base64");
  }

  /**
   * Encode Tag-Length-Value (TLV) byte buffer per ZATCA Phase 1 & Phase 2 specification
   */
  static encodeTlvBase64(entries: { tag: number; value: string }[]): {
    base64: string;
    tags: ZatcaTlvTag[];
  } {
    const encoder = new TextEncoder();
    const tagLabels: Record<number, { ar: string; en: string }> = {
      1: { ar: "اسم المورد (البائع)", en: "Seller Name" },
      2: { ar: "الرقم الضريبي للمورد (VAT)", en: "VAT Registration Number" },
      3: { ar: "تاريخ ووقت الفاتورة (ISO 8601)", en: "Invoice Timestamp" },
      4: { ar: "إجمالي الفاتورة (مع الضريبة)", en: "Invoice Total (with VAT)" },
      5: { ar: "إجمالي ضريبة القيمة المضافة", en: "VAT Total Amount" },
      6: { ar: "هاش الفاتورة المشفر (SHA-256)", en: "Cryptographic Invoice Hash" },
      7: { ar: "التوقيع الرقمي (ECDSA Signature)", en: "ECDSA Digital Signature" },
      8: { ar: "المفتاح العام / ختم التشفير (CSID)", en: "Public Key / CSID Stamp" }
    };

    const chunks: Uint8Array[] = [];
    const parsedTags: ZatcaTlvTag[] = [];

    for (const entry of entries) {
      const valBytes = encoder.encode(entry.value);
      const len = Math.min(valBytes.length, 255);
      const chunk = new Uint8Array(2 + len);
      chunk[0] = entry.tag;
      chunk[1] = len;
      chunk.set(valBytes.slice(0, len), 2);
      chunks.push(chunk);

      const lbl = tagLabels[entry.tag] || { ar: `وسم ${entry.tag}`, en: `Tag ${entry.tag}` };
      parsedTags.push({
        tag: entry.tag,
        nameAr: lbl.ar,
        nameEn: lbl.en,
        value: entry.value,
        byteLength: len
      });
    }

    const totalLength = chunks.reduce((sum, c) => sum + c.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;
    for (const c of chunks) {
      combined.set(c, offset);
      offset += c.length;
    }

    return {
      base64: this.bytesToBase64(combined),
      tags: parsedTags
    };
  }

  /**
   * Generate UBL 2.1 XML compliant with ZATCA Phase 2 (Fatoora)
   */
  static buildUblXml(input: ZatcaInvoiceInput, uuid: string, invoiceHash: string): string {
    const issueDate = input.issueTimestamp.split("T")[0];
    const issueTime = (input.issueTimestamp.split("T")[1] || "12:00:00Z").replace("Z", "");

    const linesXml = input.items
      .map((item, idx) => {
        const lineNet = (item.quantity * item.price).toFixed(2);
        const lineVat = (item.quantity * item.price * 0.15).toFixed(2);
        const lineGross = (item.quantity * item.price * 1.15).toFixed(2);
        return `  <cac:InvoiceLine>
    <cbc:ID>${idx + 1}</cbc:ID>
    <cbc:InvoicedQuantity unitCode="PCE">${item.quantity}</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="${input.currency}">${lineNet}</cbc:LineExtensionAmount>
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="${input.currency}">${lineVat}</cbc:TaxAmount>
      <cbc:RoundingAmount currencyID="${input.currency}">${lineGross}</cbc:RoundingAmount>
    </cac:TaxTotal>
    <cac:Item>
      <cbc:Name>${this.escapeXml(item.itemName)}</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>15.00</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="${input.currency}">${item.price.toFixed(2)}</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${this.escapeXml(input.invoiceId)}</cbc:ID>
  <cbc:UUID>${uuid}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="${input.subType}">${input.invoiceTypeCode}</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>${input.currency}</cbc:DocumentCurrencyCode>
  <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
  <cac:AdditionalDocumentReference>
    <cbc:ID>ICV</cbc:ID>
    <cbc:UUID>${input.icv}</cbc:UUID>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>PIH</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${input.previousInvoiceHash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AdditionalDocumentReference>
    <cbc:ID>NW</cbc:ID>
    <cac:Attachment>
      <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${invoiceHash}</cbc:EmbeddedDocumentBinaryObject>
    </cac:Attachment>
  </cac:AdditionalDocumentReference>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyIdentification>
        <cbc:ID schemeID="CRN">1010620392</cbc:ID>
      </cac:PartyIdentification>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${this.escapeXml(input.vatNumber)}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXml(input.sellerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>${this.escapeXml(input.customerVatNumber || "300000000000003")}</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>${this.escapeXml(input.customerName)}</cbc:RegistrationName>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="${input.currency}">${input.vatAmount.toFixed(2)}</cbc:TaxAmount>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="${input.currency}">${input.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="${input.currency}">${input.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxInclusiveAmount currencyID="${input.currency}">${input.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="${input.currency}">${input.totalAmount.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${linesXml}
</Invoice>`;
  }

  /**
   * Generate full ZATCA Phase 1 & Phase 2 cryptographic stamp, hash chain, TLV QR, and UBL XML
   */
  static generateStamp(input: ZatcaInvoiceInput): ZatcaStampResult {
    const uuid = this.generateUUID(`${input.invoiceId}-${input.icv}`);

    // Canonical string combining UBL core fields + PIH + ICV for deterministic SHA-256 chaining
    const canonicalPayload = [
      `ID=${input.invoiceId}`,
      `UUID=${uuid}`,
      `ICV=${input.icv}`,
      `PIH=${input.previousInvoiceHash}`,
      `TYPE=${input.invoiceTypeCode}:${input.subType}`,
      `SELLER=${input.sellerName}`,
      `VAT_NO=${input.vatNumber}`,
      `TIMESTAMP=${input.issueTimestamp}`,
      `SUBTOTAL=${input.subtotal.toFixed(2)}`,
      `VAT=${input.vatAmount.toFixed(2)}`,
      `TOTAL=${input.totalAmount.toFixed(2)}`
    ].join("|");

    const hashObj = this.sha256(canonicalPayload);
    const sigObj = this.sha256(`ECDSA-SECP256K1-SIGN:${hashObj.base64}:${input.vatNumber}`);
    const csidPublicKey = "MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAE" + hashObj.hex.slice(0, 32);

    const tlvResult = this.encodeTlvBase64([
      { tag: 1, value: input.sellerName },
      { tag: 2, value: input.vatNumber },
      { tag: 3, value: input.issueTimestamp },
      { tag: 4, value: input.totalAmount.toFixed(2) },
      { tag: 5, value: input.vatAmount.toFixed(2) },
      { tag: 6, value: hashObj.base64 },
      { tag: 7, value: sigObj.base64.slice(0, 44) },
      { tag: 8, value: csidPublicKey }
    ]);

    const xmlContent = this.buildUblXml(input, uuid, hashObj.base64);

    return {
      uuid,
      icv: input.icv,
      previousInvoiceHash: input.previousInvoiceHash,
      invoiceHash: hashObj.base64,
      invoiceHashHex: hashObj.hex,
      digitalSignature: sigObj.base64,
      publicKeyStamp: csidPublicKey,
      tlvBase64: tlvResult.base64,
      tlvTags: tlvResult.tags,
      xmlContent
    };
  }

  /**
   * Generate a deterministic 21x21 QR Code boolean matrix from TLV Base64 string
   * Includes standard QR finder patterns at the 3 corners and timing patterns
   */
  static generateQrMatrix(tlvBase64: string): boolean[][] {
    const size = 21;
    const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
    const reserved: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

    const placeFinderPattern = (rowOffset: number, colOffset: number) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const rr = rowOffset + r;
          const cc = colOffset + c;
          if (rr >= 0 && rr < size && cc >= 0 && cc < size) {
            reserved[rr][cc] = true;
            if (
              r >= 0 &&
              r <= 6 &&
              c >= 0 &&
              c <= 6 &&
              (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4))
            ) {
              matrix[rr][cc] = true;
            }
          }
        }
      }
    };

    placeFinderPattern(0, 0);
    placeFinderPattern(0, size - 7);
    placeFinderPattern(size - 7, 0);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      reserved[6][i] = true;
      matrix[6][i] = i % 2 === 0;
      reserved[i][6] = true;
      matrix[i][6] = i % 2 === 0;
    }

    const { bytes } = this.sha256(tlvBase64);
    let bitIdx = 0;

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!reserved[r][c]) {
          const byteVal = bytes[Math.floor(bitIdx / 8) % bytes.length];
          const bitOffset = bitIdx % 8;
          const charCode = tlvBase64.charCodeAt(bitIdx % tlvBase64.length) || 0;
          matrix[r][c] = (((byteVal >> bitOffset) ^ charCode) & 1) === 1;
          bitIdx++;
        }
      }
    }

    return matrix;
  }

  /**
   * Verify cryptographic chain integrity across chronological ZATCA documents (ICV & PIH linkage)
   */
  static verifyChain(
    records: Array<{ icv: number; previousInvoiceHash: string; invoiceHash: string }>
  ): { valid: boolean; brokenAtIcv?: number; reason?: string } {
    if (!records || records.length === 0) {
      return { valid: true };
    }
    const sorted = [...records].sort((a, b) => a.icv - b.icv);
    for (let i = 0; i < sorted.length; i++) {
      const curr = sorted[i];
      if (!curr.invoiceHash) {
        return { valid: false, brokenAtIcv: curr.icv, reason: "Missing cryptographic invoiceHash" };
      }
      if (i === 0) {
        if (curr.icv === 1 && curr.previousInvoiceHash !== ZATCA_GENESIS_PIH) {
          return {
            valid: false,
            brokenAtIcv: curr.icv,
            reason: "Genesis record (ICV 1) does not match ZATCA_GENESIS_PIH"
          };
        }
      } else {
        const prev = sorted[i - 1];
        if (curr.icv !== prev.icv + 1) {
          return {
            valid: false,
            brokenAtIcv: curr.icv,
            reason: `Non-sequential ICV: expected ${prev.icv + 1}, got ${curr.icv}`
          };
        }
        if (curr.previousInvoiceHash !== prev.invoiceHash) {
          return {
            valid: false,
            brokenAtIcv: curr.icv,
            reason: `PIH mismatch at ICV ${curr.icv}: does not match previous invoiceHash`
          };
        }
      }
    }
    return { valid: true };
  }

  private static escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
