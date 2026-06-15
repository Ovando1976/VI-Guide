import type { MapPoint } from "../components/maps/IslandMap";

const STORAGE_KEY = "vi-guide-day-plan";

export type DayPlanItem = MapPoint;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function loadDayPlan(): DayPlanItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDayPlan(items: DayPlanItem[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addToDayPlan(item: DayPlanItem) {
  const current = loadDayPlan();
  const exists = current.some((saved) => saved.id === item.id);

  const next = exists
    ? current.map((saved) => (saved.id === item.id ? item : saved))
    : [...current, item];

  saveDayPlan(next);
  return next;
}

export function removeFromDayPlan(id: string) {
  const next = loadDayPlan().filter((item) => item.id !== id);
  saveDayPlan(next);
  return next;
}

export function removePointFromDayPlan(id: string) {
  return removeFromDayPlan(id);
}

export function clearDayPlan() {
  if (!canUseStorage()) return [];

  window.localStorage.removeItem(STORAGE_KEY);
  return [];
}

export function isPointInDayPlan(id: string) {
  return loadDayPlan().some((item) => item.id === id);
}