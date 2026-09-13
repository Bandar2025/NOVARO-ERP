// NOVARO ERP Domain Model: Fiscal Period & Period Lock

export type FiscalPeriodStatus = "OPEN" | "CLOSED" | "LOCKED";

export interface FiscalPeriod {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: FiscalPeriodStatus;
  closedAt?: string;
  closedBy?: string;
}

export function isDateInPeriod(dateStr: string, period: FiscalPeriod): boolean {
  const target = new Date(dateStr).getTime();
  const start = new Date(period.startDate).getTime();
  const end = new Date(period.endDate).getTime();
  return target >= start && target <= end;
}

export function assertPeriodAllowsPosting(dateStr: string, periods: FiscalPeriod[]): { allowed: boolean; reason?: string } {
  // If no periods are defined, default to open
  if (!periods || periods.length === 0) {
    return { allowed: true };
  }

  const matchingPeriod = periods.find(p => isDateInPeriod(dateStr, p));
  if (!matchingPeriod) {
    // If outside explicitly defined periods, we allow it with a warning or open state
    return { allowed: true };
  }

  if (matchingPeriod.status === "CLOSED" || matchingPeriod.status === "LOCKED") {
    return {
      allowed: false,
      reason: `Cannot post entry on ${dateStr}. Fiscal period '${matchingPeriod.name}' is ${matchingPeriod.status}.`
    };
  }

  return { allowed: true };
}
