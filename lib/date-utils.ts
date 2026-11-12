/**
 * Date utilities for flexible publication date filtering and automated ISO week calculation.
 */

// Helper to compute ISO Week string (e.g. "2026-W46") silently in background for Google Sheets
export function getIsoWeekIdentifier(dateInput: string | Date = new Date()): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(d.getTime())) {
    const fallback = new Date();
    return `${fallback.getFullYear()}-W${getWeekNumber(fallback)}`;
  }
  return `${d.getFullYear()}-W${String(getWeekNumber(d)).padStart(2, "0")}`;
}

function getWeekNumber(d: Date): number {
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

// User-friendly display format (e.g. "Thu, Nov 12, 2026")
export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return "Unscheduled";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Simple short format (e.g. "Nov 12")
export function formatShortDate(dateStr?: string): string {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export type DateFilterPreset =
  | "all"
  | "today"
  | "this-week"
  | "this-month"
  | "next-7-days"
  | "past-30-days"
  | "custom";

export const DATE_PRESET_OPTIONS: { value: DateFilterPreset; label: string }[] = [
  { value: "all", label: "All dates" },
  { value: "today", label: "Today" },
  { value: "this-week", label: "This week" },
  { value: "this-month", label: "This month" },
  { value: "next-7-days", label: "Next 7 days" },
  { value: "past-30-days", label: "Past 30 days" },
  { value: "custom", label: "Custom range" },
];

export function isDateInFilter(
  dateStr?: string,
  preset: DateFilterPreset = "all",
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date()
): boolean {
  if (!dateStr || preset === "all") return true;

  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return true;
  const targetTime = new Date(y, m - 1, d).setHours(0, 0, 0, 0);

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  if (preset === "today") {
    return targetTime === ref.getTime();
  }

  if (preset === "this-week") {
    // Current Monday to Sunday
    const dayOfWeek = (ref.getDay() + 6) % 7; // Monday = 0
    const startOfWeek = new Date(ref);
    startOfWeek.setDate(ref.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    return targetTime >= startOfWeek.getTime() && targetTime <= endOfWeek.getTime();
  }

  if (preset === "this-month") {
    const startOfMonth = new Date(ref.getFullYear(), ref.getMonth(), 1).getTime();
    const endOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59).getTime();
    return targetTime >= startOfMonth && targetTime <= endOfMonth;
  }

  if (preset === "next-7-days") {
    const end = new Date(ref);
    end.setDate(ref.getDate() + 7);
    end.setHours(23, 59, 59, 999);
    return targetTime >= ref.getTime() && targetTime <= end.getTime();
  }

  if (preset === "past-30-days") {
    const start = new Date(ref);
    start.setDate(ref.getDate() - 30);
    return targetTime >= start.getTime() && targetTime <= ref.getTime();
  }

  if (preset === "custom") {
    if (customStart) {
      const [sy, sm, sd] = customStart.split("-").map(Number);
      const startTime = new Date(sy, sm - 1, sd).setHours(0, 0, 0, 0);
      if (targetTime < startTime) return false;
    }
    if (customEnd) {
      const [ey, em, ed] = customEnd.split("-").map(Number);
      const endTime = new Date(ey, em - 1, ed, 23, 59, 59).getTime();
      if (targetTime > endTime) return false;
    }
    return true;
  }

  return true;
}

