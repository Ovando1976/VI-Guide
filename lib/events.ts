import {
  EVENT_CATEGORY_LABELS,
  EVENT_ISLAND_LABELS,
  USVI_EVENTS as CORE_USVI_EVENTS,
  type EventCategory as CoreEventCategory,
  type EventIsland as CoreEventIsland,
  type UsviEvent as CoreUsviEvent,
} from "./events-core";

export type EventIsland = CoreEventIsland;
export type EventCategory = CoreEventCategory;
export type UsviEvent = CoreUsviEvent & {
  /** Exact occurrence dates for non-continuous recurring event series. */
  occurrenceDates?: readonly string[];
};

export { EVENT_CATEGORY_LABELS, EVENT_ISLAND_LABELS };

const RECURRING_EVENT_DATES = {
  "stx-sunday-funday-fort-2026": [
    "2026-08-09",
    "2026-08-23",
    "2026-09-13",
    "2026-09-27",
    "2026-10-11",
    "2026-10-25",
  ],
  "stx-sunset-sounds-loops-2026": [
    "2026-08-09",
    "2026-09-13",
    "2026-10-11",
  ],
} as const satisfies Partial<Record<string, readonly string[]>>;

/**
 * Canonical event catalog.
 *
 * The source snapshot keeps Visit USVI's published series start/end bounds.
 * This layer adds the exact published occurrence dates so the traveler UI does
 * not imply that recurring programs run continuously between those bounds.
 */
export const USVI_EVENTS: readonly UsviEvent[] = CORE_USVI_EVENTS.map((event) => {
  const occurrenceDates = RECURRING_EVENT_DATES[event.id as keyof typeof RECURRING_EVENT_DATES];
  return occurrenceDates ? { ...event, occurrenceDates } : event;
});

export function getEventBySlug(slug: string) {
  return USVI_EVENTS.find((event) => event.slug === slug || event.id === slug);
}

export function getEventNextDate(
  event: UsviEvent,
  today = new Date().toISOString().slice(0, 10),
): string | null {
  if (event.occurrenceDates?.length) {
    return event.occurrenceDates.find((date) => date >= today) ?? null;
  }

  const endDate = event.endDate ?? event.startDate;
  if (endDate < today) return null;

  // Active multi-day events should rank with today's events instead of using
  // an already-past start date. Future one-off/range events keep their start.
  return event.startDate < today ? today : event.startDate;
}

export function getUpcomingEvents(today = new Date().toISOString().slice(0, 10)) {
  return USVI_EVENTS.map((event) => ({
    event,
    nextDate: getEventNextDate(event, today),
  }))
    .filter(
      (entry): entry is { event: UsviEvent; nextDate: string } =>
        entry.nextDate !== null,
    )
    .sort(
      (left, right) =>
        left.nextDate.localeCompare(right.nextDate) ||
        left.event.startDate.localeCompare(right.event.startDate) ||
        left.event.name.localeCompare(right.event.name),
    )
    .map(({ event }) => event);
}

export function formatEventDate(
  event: Pick<UsviEvent, "startDate" | "endDate" | "occurrenceDates">,
) {
  if (event.occurrenceDates?.length) {
    return formatOccurrenceDates(event.occurrenceDates);
  }

  const start = formatIsoDate(event.startDate);
  if (!event.endDate || event.endDate === event.startDate) return start;
  return `${start} – ${formatIsoDate(event.endDate)}`;
}

function formatOccurrenceDates(values: readonly string[]) {
  const years = new Set(values.map((value) => value.slice(0, 4)));
  if (years.size !== 1) return values.map(formatIsoDate).join(" · ");

  const year = values[0]?.slice(0, 4) ?? "";
  const labels = values.map((value) =>
    new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${value}T12:00:00Z`)),
  );
  return `${labels.join(" · ")}, ${year}`;
}

function formatIsoDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T12:00:00Z`));
}
