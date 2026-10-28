// NOVARO ERP Domain Model: Fiscal Period & Period Lock

export type FiscalPeriodStatus = "OPEN" | "CLOSED" | "LOCKED" | "Open" | "Closed" | "Locked";

export interface FiscalPeriod {
  id: string;
  name: string;
  code?: string;
  fiscalYear?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  status: FiscalPeriodStatus;
  isClosed?: boolean;
  closedAt?: string;
  closedBy?: string;
}

export function isDateInPeriod(dateStr: string, period: FiscalPeriod): boolean {
  const target = new Date(dateStr).getTime();
  const start = new Date(period.startDate).getTime();
  const end = new Date(period.endDate).getTime();
  return target >= start && target <= end;
}

export function isPeriodLocked(period: FiscalPeriod): boolean {
  const normalized = (period.status || "").toUpperCase();
  return Boolean(period.isClosed) || normalized === "CLOSED" || normalized === "LOCKED";
}

export function assertPeriodAllowsPosting(dateStr: string, periods: FiscalPeriod[]): { allowed: boolean; reason?: string } {
  // If no periods are defined, default to open
  if (!periods || periods.length === 0) {
    return { allowed: true };
  }

  const matchingPeriod = periods.find(p => isDateInPeriod(dateStr, p));
  if (!matchingPeriod) {
    // If outside explicitly defined periods, we allow it with open state
    return { allowed: true };
  }

  if (isPeriodLocked(matchingPeriod)) {
    const label = matchingPeriod.name || matchingPeriod.code || matchingPeriod.id;
    const statusText = (matchingPeriod.status || "CLOSED").toUpperCase();
    return {
      allowed: false,
      reason: `Cannot post entry on ${dateStr}. Fiscal period '${label}' is ${statusText} (قفل الفترة المحاسبية مفعل).`
    };
  }

  return { allowed: true };
}

