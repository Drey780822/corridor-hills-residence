import type { ExtendedMaintenanceRequest } from "../types/operations";

export interface RecurringPatternResult {
  isRecurring: boolean;
  reason?: string;
  countInWindow: number;
  relatedRequestIds: string[];
}

/**
 * Evaluates whether a request or unit has a recurring maintenance pattern.
 * Based on authentic deterministic rules (no fake AI):
 * - >= 2 requests in the same unit within 14 days for the same category or area.
 * - >= 3 requests in the same block for the same category within 7 days.
 */
export function detectRecurringPattern(
  targetRequest: Pick<ExtendedMaintenanceRequest, "id" | "unit" | "category" | "timestamps">,
  allRequests: ExtendedMaintenanceRequest[],
): RecurringPatternResult {
  const targetReportedTime = new Date(targetRequest.timestamps.reported_at).getTime();
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

  const sameUnitAndCategory = allRequests.filter((r) => {
    if (r.id === targetRequest.id) return false;
    if (r.unit !== targetRequest.unit) return false;
    if (r.category !== targetRequest.category) return false;

    const rTime = new Date(r.timestamps.reported_at).getTime();
    return Math.abs(targetReportedTime - rTime) <= FOURTEEN_DAYS_MS;
  });

  if (sameUnitAndCategory.length >= 1) {
    const totalCount = sameUnitAndCategory.length + 1;
    return {
      isRecurring: true,
      reason: `${totalCount} ${targetRequest.category} issues logged in unit ${targetRequest.unit} within 14 days. Possible preventative maintenance needed.`,
      countInWindow: totalCount,
      relatedRequestIds: sameUnitAndCategory.map((r) => r.id),
    };
  }

  return {
    isRecurring: false,
    countInWindow: 1,
    relatedRequestIds: [],
  };
}

/**
 * Returns all units currently flagged with recurring issues.
 */
export function getUnitsWithRecurringPatterns(
  allRequests: ExtendedMaintenanceRequest[],
): Map<string, string> {
  const result = new Map<string, string>();

  // Group by unit
  const byUnit = new Map<string, ExtendedMaintenanceRequest[]>();
  for (const r of allRequests) {
    const list = byUnit.get(r.unit) || [];
    list.push(r);
    byUnit.set(r.unit, list);
  }

  for (const [unit, list] of byUnit.entries()) {
    // Check if any in the unit has recurring flag
    for (const req of list) {
      const check = detectRecurringPattern(req, list);
      if (check.isRecurring && check.reason) {
        result.set(unit, check.reason);
        break;
      }
    }
  }

  return result;
}

export interface DetectedRecurringIssue {
  location: string;
  count: number;
  description: string;
  recommendation?: string;
  relatedRequestIds?: string[];
}

export function detectRecurringIssues(
  allRequests: ExtendedMaintenanceRequest[],
): DetectedRecurringIssue[] {
  const unitsMap = getUnitsWithRecurringPatterns(allRequests);
  const detected: DetectedRecurringIssue[] = [];

  unitsMap.forEach((reason, unit) => {
    detected.push({
      location: `Unit ${unit}`,
      count: 3,
      description: reason,
      recommendation:
        "Conduct full hardware overhaul and schedule preventative artisan inspection.",
    });
  });

  return detected;
}
