export const USVI_TIME_ZONE = "America/St_Thomas";

export function getUsviToday(now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: USVI_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

  return `${values.year}-${values.month}-${values.day}`;
}

export function isIsoCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function isBookableStartDate(
  value: string,
  today: string = getUsviToday(),
) {
  return isIsoCalendarDate(value) && isIsoCalendarDate(today) && value >= today;
}

export function isBookableEndDate(startDate: string, endDate: string) {
  return (
    isIsoCalendarDate(startDate) &&
    isIsoCalendarDate(endDate) &&
    endDate > startDate
  );
}

export function addCalendarDays(value: string, days: number) {
  if (!isIsoCalendarDate(value) || !Number.isInteger(days)) return "";

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day + days));

  return [
    parsed.getUTCFullYear().toString().padStart(4, "0"),
    (parsed.getUTCMonth() + 1).toString().padStart(2, "0"),
    parsed.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}
