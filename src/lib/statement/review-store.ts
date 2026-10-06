import type { MonthSnapshot } from "./engine";

/**
 * Saved months live only in this browser (localStorage), only after the user asks, and hold only
 * monthly totals, category totals and the names of regular payments. Never descriptions, references,
 * account numbers or the statement file.
 */
const KEY = "aqvik.money-review.v1";

export function loadSaved(): MonthSnapshot[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { version?: number; months?: MonthSnapshot[] };
    return data.version === 1 && Array.isArray(data.months) ? data.months : [];
  } catch {
    return [];
  }
}

export function saveSnapshots(months: MonthSnapshot[]): boolean {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ version: 1, months }));
    return true;
  } catch {
    return false;
  }
}

export function clearSaved(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
