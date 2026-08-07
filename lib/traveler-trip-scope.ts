import type { TrackedBooking } from "@/lib/booking/booking-tracker";
import type { JourneyPlan } from "@/lib/journey-planner";
import type {
  TravelerAdvisorTrip,
  TravelerCommerceBooking,
  TravelerStayRequest,
} from "@/lib/traveler-trip-command";
import type { IntelligenceIsland } from "@/types/intelligence";

const MAX_TRIP_SPAN_DAYS = 21;
const CONTIGUOUS_GAP_DAYS = 2;

export type TravelerTripScope = {
  id: string;
  primaryPlanId: string;
  planIds: string[];
  title: string;
  startDate: string;
  endDate: string;
  islands: IntelligenceIsland[];
  dayCount: number;
  stopCount: number;
};

export function buildTravelerTripScopes(plans: JourneyPlan[]): TravelerTripScope[] {
  const sorted = [...plans]
    .filter((plan) => isIsoDate(plan.date))
    .sort((left, right) =>
      left.date === right.date
        ? left.createdAt.localeCompare(right.createdAt)
        : left.date.localeCompare(right.date),
    );
  if (!sorted.length) return [];

  const groups: JourneyPlan[][] = [];
  for (const plan of sorted) {
    const current = groups.at(-1);
    if (!current?.length) {
      groups.push([plan]);
      continue;
    }
    const first = current[0];
    const previous = current[current.length - 1];
    const gap = dayDifference(previous.date, plan.date);
    const span = dayDifference(first.date, plan.date);
    if (gap >= 0 && gap <= CONTIGUOUS_GAP_DAYS && span <= MAX_TRIP_SPAN_DAYS) {
      current.push(plan);
    } else {
      groups.push([plan]);
    }
  }

  return groups
    .map((group) => scopeFromPlans(group))
    .sort((left, right) => right.startDate.localeCompare(left.startDate));
}

export function resolveTravelerTripScope(
  scopes: TravelerTripScope[],
  selectedPlanId: string | null | undefined,
  today = territoryDate(new Date()),
) {
  const selected = clean(selectedPlanId, 160);
  if (selected) {
    const explicit = scopes.find(
      (scope) =>
        scope.primaryPlanId === selected || scope.planIds.includes(selected),
    );
    if (explicit) return explicit;
  }

  const upcoming = scopes
    .filter((scope) => scope.endDate >= today)
    .sort((left, right) => left.startDate.localeCompare(right.startDate))[0];
  if (upcoming) return upcoming;

  return [...scopes].sort((left, right) =>
    right.endDate.localeCompare(left.endDate),
  )[0] ?? null;
}

export function scopeTravelerTripRecords(input: {
  scope: TravelerTripScope | null;
  bookings: TravelerCommerceBooking[];
  stayRequests: TravelerStayRequest[];
  advisorTrips: TravelerAdvisorTrip[];
  trackedBookings?: TrackedBooking[];
}) {
  if (!input.scope) {
    return {
      bookings: input.bookings,
      stayRequests: input.stayRequests,
      advisorTrips: input.advisorTrips,
      trackedBookings: input.trackedBookings ?? [],
    };
  }

  const scope = input.scope;
  return {
    bookings: input.bookings.filter((booking) =>
      recordMatchesScope(
        scope,
        booking.startDate,
        booking.endDate ?? booking.startDate,
        booking.island,
      ),
    ),
    stayRequests: input.stayRequests.filter((stay) =>
      recordMatchesScope(scope, stay.checkIn, stay.checkOut, null),
    ),
    advisorTrips: input.advisorTrips.filter((trip) => {
      if (!trip.arrival && !trip.departure) return false;
      return recordMatchesScope(
        scope,
        trip.arrival ?? trip.departure ?? "",
        trip.departure ?? trip.arrival ?? "",
        trip.island,
      );
    }),
    trackedBookings: (input.trackedBookings ?? []).filter((booking) =>
      recordMatchesScope(
        scope,
        booking.startDate,
        booking.endDate ?? booking.startDate,
        booking.island,
      ),
    ),
  };
}

export function plansForTravelerTripScope(
  plans: JourneyPlan[],
  scope: TravelerTripScope | null,
) {
  if (!scope) return plans;
  const ids = new Set(scope.planIds);
  return plans
    .filter((plan) => ids.has(plan.id))
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function travelerTripScopeLabel(scope: TravelerTripScope) {
  const dateLabel =
    scope.startDate === scope.endDate
      ? formatDate(scope.startDate)
      : `${formatDate(scope.startDate)} – ${formatDate(scope.endDate)}`;
  const islandLabel = scope.islands.map(islandName).join(" + ");
  return `${dateLabel}${islandLabel ? ` · ${islandLabel}` : ""}`;
}

function scopeFromPlans(plans: JourneyPlan[]): TravelerTripScope {
  const ordered = [...plans].sort((left, right) =>
    left.date === right.date
      ? left.createdAt.localeCompare(right.createdAt)
      : left.date.localeCompare(right.date),
  );
  const islands = Array.from(new Set(ordered.map((plan) => plan.island)));
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  return {
    id: `trip_${first.id}`.slice(0, 180),
    primaryPlanId: first.id,
    planIds: ordered.map((plan) => plan.id),
    title:
      ordered.length === 1
        ? first.title
        : `${first.title} + ${ordered.length - 1} more ${ordered.length - 1 === 1 ? "day" : "days"}`,
    startDate: first.date,
    endDate: last.date,
    islands,
    dayCount: ordered.length,
    stopCount: ordered.reduce((total, plan) => total + plan.plan.length, 0),
  };
}

function recordMatchesScope(
  scope: TravelerTripScope,
  startDate: string,
  endDate: string,
  island: IntelligenceIsland | null,
) {
  if (!isIsoDate(startDate) || !isIsoDate(endDate)) return false;
  const startsBeforeScopeEnds = startDate <= scope.endDate;
  const endsAfterScopeStarts = endDate >= scope.startDate;
  if (!startsBeforeScopeEnds || !endsAfterScopeStarts) return false;
  if (!island) return true;
  return scope.islands.includes(island);
}

function dayDifference(start: string, end: string) {
  const startMs = Date.parse(`${start}T00:00:00Z`);
  const endMs = Date.parse(`${end}T00:00:00Z`);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return Number.POSITIVE_INFINITY;
  return Math.round((endMs - startMs) / 86_400_000);
}

function territoryDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${lookup.year}-${lookup.month}-${lookup.day}`;
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      }).format(date)
    : value;
}

function islandName(island: IntelligenceIsland) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
