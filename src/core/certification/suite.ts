// NOVARO ERP Phase 1 Master Certification Suite Runner
import { runAccountingCertification, CertificationCheckResult } from "./accounting.certification";
import { runInventoryCertification } from "./inventory.certification";
import { runCommerceCertification } from "./commerce.certification";

export interface MasterCertificationReport {
  timestamp: string;
  totalChecks: number;
  passedCount: number;
  failedCount: number;
  status: "PASSED" | "FAILED";
  results: CertificationCheckResult[];
  formattedOutput: string;
}

export function runCertificationSuite(): MasterCertificationReport {
  const accountingResults = runAccountingCertification();
  const inventoryResults = runInventoryCertification();
  const commerceResults = runCommerceCertification();

  const allResults = [...accountingResults, ...inventoryResults, ...commerceResults];

  const passedCount = allResults.filter(r => r.status === "PASS").length;
  const failedCount = allResults.filter(r => r.status === "FAIL").length;

  const lines: string[] = [];
  lines.push("===============================================================");
  lines.push("          NOVARO ERP — PHASE 1 CERTIFICATION SUITE             ");
  lines.push("===============================================================");
  
  allResults.forEach(r => {
    const codePadded = r.code.padEnd(30, ".");
    const statusFormatted = r.status === "PASS" ? "PASS" : `FAIL (${r.details || "Unknown error"})`;
    lines.push(`${codePadded} ${statusFormatted}`);
  });

  lines.push("---------------------------------------------------------------");
  lines.push(`TOTAL CHECKS: ${allResults.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  lines.push(`FINAL VERDICT: ${failedCount === 0 ? "CERTIFIED (PHASE 1 READY)" : "REJECTED (INVARIANTS VIOLATED)"}`);
  lines.push("===============================================================");

  return {
    timestamp: new Date().toISOString(),
    totalChecks: allResults.length,
    passedCount,
    failedCount,
    status: failedCount === 0 ? "PASSED" : "FAILED",
    results: allResults,
    formattedOutput: lines.join("\n")
  };
}
