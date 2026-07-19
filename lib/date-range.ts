import type { DateRangeKey } from "@/components/date-range-filter";

export function getTimeValue(
  value?: { seconds?: number; nanoseconds?: number } | string
) {
  if (!value) return 0;

  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  if (typeof value === "object" && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  return 0;
}

export function isInDateRange(
  value: { seconds?: number; nanoseconds?: number } | string | undefined,
  range: DateRangeKey
) {
  if (range === "all") return true;

  const time = getTimeValue(value);
  if (!time) return false;

  const now = new Date();
  const date = new Date(time);

  if (range === "today") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  }

  if (range === "week") {
    const start = new Date(now);
    const day = start.getDay();
    const diff = day === 0 ? 6 : day - 1;
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diff);

    return time >= start.getTime();
  }

  if (range === "month") {
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth()
    );
  }

  return true;
}