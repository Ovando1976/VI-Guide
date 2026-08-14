import type {
  IntelligenceActiveTrip,
  IntelligenceMemory,
} from "@/types/intelligence";
import {
  evaluateCruiseReturnWindow,
  type TimedTripStop,
} from "@/lib/intelligence/trip-risk-cruise";
import type {
  TripRiskIssue,
  TripRiskOptions,
  TripRiskReport,
  TripRiskSeverity,
} from "@/lib/intelligence/trip-risk-types";
import {
  buildTripRiskReport,
  createTripRiskIssue,
  formatMinutes,
  hasAccessibilityConcern,
  hasBookingConcern,
  isTransportSensitive,
  localTripDate,
  minutesFromTime,
  NORMAL_TRANSFER_BUFFER_MINUTES,
  normalizeRiskDate,
  pastTripRiskReport,
  safeRiskId,
  SENSITIVE_TRANSFER_BUFFER_MINUTES,
  stopDuration,
  uniqueRiskIssues,
  validDuration,
  weatherAlertApplies,
  weatherRiskSeverity,
} from "@/lib/intelligence/trip-risk-utils";

export type {
  TripRiskCategory,
  TripRiskIssue,
  TripRiskOptions,
  TripRiskReport,
  TripRiskSeverity,
  TripReturnWindow,
  TripWeatherAlert,
} from "@/lib/intelligence/trip-risk-types";

export function evaluateTripRisk(
  trip: IntelligenceActiveTrip | undefined,
  memory: IntelligenceMemory = {},
  options: TripRiskOptions = {},
): TripRiskReport {
  if (!trip) {
    return buildTripRiskReport(
      [
        createTripRiskIssue(
          "trip_missing",
          "high",
          "trip_data",
          "No active journey is available",
          "Timing, transfers, and return windows cannot be protected until a journey is saved.",
          "Create or save a journey, then run the trip check again.",
          35,
        ),
      ],
      "not_ready",
    );
  }

  const now = normalizeRiskDate(options.now);
  if (trip.date < localTripDate(now)) return pastTripRiskReport();
  if (!trip.stops.length) {
    return buildTripRiskReport(
      [
        createTripRiskIssue(
          "trip_empty",
          "high",
          "trip_data",
          "The journey has no stops",
          "There is no itinerary sequence to monitor.",
          "Add a destination or ask Concierge to build the day.",
          35,
        ),
      ],
      "not_ready",
    );
  }

  const issues: TripRiskIssue[] = [];
  const timedStops = buildTimedStops(trip);
  addCompletenessRisks(trip, issues);
  addTimingAndTransferRisks(timedStops, issues);
  addDensityRisk(trip, issues);
  addAccessibilityRisk(trip, memory, issues);
  addBookingRisk(trip, issues);
  const returnWindow = evaluateCruiseReturnWindow(
    trip,
    memory,
    timedStops,
    issues,
  );
  addWeatherRisks(trip, now, options, issues);

  return buildTripRiskReport(
    uniqueRiskIssues(issues),
    undefined,
    returnWindow,
  );
}

export function buildTripRiskPrompt(
  report: TripRiskReport,
  trip?: IntelligenceActiveTrip,
) {
  const risks = report.issues
    .slice(0, 6)
    .map(
      (item, index) =>
        `${index + 1}. [${item.severity.toUpperCase()}] ${item.title}: ${item.recommendation}`,
    )
    .join("\n");
  const stops = (trip?.stops ?? [])
    .slice(0, 12)
    .map(
      (stop, index) =>
        `${index + 1}. ${stop.title}${stop.startTime ? ` at ${stop.startTime}` : ""}${stop.durationMinutes ? ` for ${stop.durationMinutes} minutes` : ""}`,
    )
    .join("\n");

  return [
    "Protect and improve my active Virgin Islands journey using this proactive risk report.",
    "Preserve strong choices, but fix critical timing, transportation, accessibility, booking, weather, and return-to-ship risks.",
    "Give me a practical revised sequence and clearly explain what changed. Do not claim live availability or confirmed bookings.",
    trip ? `Journey: ${trip.title} on ${trip.date}` : "Journey: not saved",
    `Trip health: ${report.score}/100 (${report.status})`,
    risks ? `Risks:\n${risks}` : "Risks: No material issues detected.",
    stops ? `Current stops:\n${stops}` : "Current stops: none",
  ]
    .join("\n\n")
    .slice(0, 3900);
}

function buildTimedStops(trip: IntelligenceActiveTrip): TimedTripStop[] {
  return trip.stops
    .map((stop, index) => ({
      stop,
      index,
      start: minutesFromTime(stop.startTime),
      duration: stopDuration(stop),
    }))
    .filter(
      (item): item is TimedTripStop => item.start !== undefined,
    )
    .sort((first, second) => first.start - second.start);
}

function addCompletenessRisks(
  trip: IntelligenceActiveTrip,
  issues: TripRiskIssue[],
) {
  const untimed = trip.stops.filter((stop) => !stop.startTime);
  const missingDurations = trip.stops.filter(
    (stop) => !validDuration(stop.durationMinutes),
  );

  if (trip.status === "ready" && untimed.length) {
    const many = untimed.length >= Math.ceil(trip.stops.length / 2);
    issues.push(
      createTripRiskIssue(
        "timing_missing",
        many ? "medium" : "low",
        "timing",
        `${untimed.length} ${untimed.length === 1 ? "stop has" : "stops have"} no start time`,
        "Flexible stops make transfer and return-window checks less reliable.",
        "Assign approximate times to the most important stops.",
        many ? 12 : 5,
        untimed.map((stop) => stop.id),
      ),
    );
  }

  if (missingDurations.length >= Math.ceil(trip.stops.length / 2)) {
    issues.push(
      createTripRiskIssue(
        "duration_missing",
        "medium",
        "timing",
        "Most stop durations are not defined",
        "USVI Explorer is using conservative 75-minute estimates.",
        "Add realistic durations before relying on the timeline.",
        10,
        missingDurations.map((stop) => stop.id),
      ),
    );
  }
}

function addTimingAndTransferRisks(
  timedStops: TimedTripStop[],
  issues: TripRiskIssue[],
) {
  for (let index = 1; index < timedStops.length; index += 1) {
    const previous = timedStops[index - 1];
    const current = timedStops[index];
    const gap = current.start - (previous.start + previous.duration);

    if (gap < 0) {
      issues.push(
        createTripRiskIssue(
          `overlap_${previous.stop.id}_${current.stop.id}`,
          "high",
          "timing",
          `${previous.stop.title} overlaps ${current.stop.title}`,
          `The second stop starts ${Math.abs(gap)} minutes before the earlier stop is expected to end.`,
          "Move, shorten, or remove one of these stops.",
          22,
          [previous.stop.id, current.stop.id],
        ),
      );
      continue;
    }

    const requiredBuffer =
      isTransportSensitive(previous.stop) || isTransportSensitive(current.stop)
        ? SENSITIVE_TRANSFER_BUFFER_MINUTES
        : NORMAL_TRANSFER_BUFFER_MINUTES;
    if (gap >= requiredBuffer) continue;

    const severity: TripRiskSeverity =
      gap < 10 || requiredBuffer === SENSITIVE_TRANSFER_BUFFER_MINUTES
        ? "high"
        : "medium";
    issues.push(
      createTripRiskIssue(
        `transfer_${previous.stop.id}_${current.stop.id}`,
        severity,
        "transfer",
        `Only ${gap} minutes between two stops`,
        `${previous.stop.title} to ${current.stop.title} needs about ${requiredBuffer} minutes of transfer and recovery time.`,
        "Move the next start later or arrange transportation in advance.",
        severity === "high" ? 17 : 10,
        [previous.stop.id, current.stop.id],
      ),
    );
  }
}

function addDensityRisk(
  trip: IntelligenceActiveTrip,
  issues: TripRiskIssue[],
) {
  const totalDuration = trip.stops.reduce(
    (sum, stop) => sum + stopDuration(stop),
    0,
  );
  if (trip.stops.length > 8 || totalDuration > 600) {
    issues.push(
      createTripRiskIssue(
        "density_high",
        "high",
        "density",
        "The day is overpacked",
        `${trip.stops.length} stops and about ${formatMinutes(totalDuration)} of activity leave little disruption margin.`,
        "Remove lower-priority stops or split the plan into separate days.",
        18,
      ),
    );
  } else if (trip.stops.length > 6 || totalDuration > 480) {
    issues.push(
      createTripRiskIssue(
        "density_watch",
        "medium",
        "density",
        "The itinerary has limited recovery time",
        `${trip.stops.length} stops and about ${formatMinutes(totalDuration)} of activity can become fragile when transfers run late.`,
        "Choose one optional stop that can be dropped if needed.",
        10,
      ),
    );
  }
}

function addAccessibilityRisk(
  trip: IntelligenceActiveTrip,
  memory: IntelligenceMemory,
  issues: TripRiskIssue[],
) {
  const accessNeeds = memory.party?.accessibilityNeeds ?? [];
  const avoid = memory.preferences?.avoid ?? [];
  if (!accessNeeds.length && !avoid.length) return;

  const flagged = trip.stops.filter((stop) =>
    hasAccessibilityConcern(stop, avoid),
  );
  if (!flagged.length) return;

  issues.push(
    createTripRiskIssue(
      "accessibility_review",
      "medium",
      "accessibility",
      `${flagged.length} ${flagged.length === 1 ? "stop needs" : "stops need"} an accessibility check`,
      `Terrain or activity language may conflict with saved needs: ${accessNeeds.join(", ") || avoid.join(", ")}.`,
      "Confirm walking distance, steps, shade, seating, and pickup proximity.",
      12,
      flagged.map((stop) => stop.id),
    ),
  );
}

function addBookingRisk(
  trip: IntelligenceActiveTrip,
  issues: TripRiskIssue[],
) {
  const pending = trip.stops.filter(hasBookingConcern);
  if (!pending.length) return;

  issues.push(
    createTripRiskIssue(
      "booking_pending",
      trip.status === "ready" ? "medium" : "low",
      "booking",
      `${pending.length} ${pending.length === 1 ? "stop appears" : "stops appear"} unconfirmed`,
      "A request or availability-dependent stop is still part of the itinerary.",
      "Confirm it or keep a nearby fallback before departure.",
      trip.status === "ready" ? 11 : 5,
      pending.map((stop) => stop.id),
    ),
  );
}

function addWeatherRisks(
  trip: IntelligenceActiveTrip,
  now: Date,
  options: TripRiskOptions,
  issues: TripRiskIssue[],
) {
  for (const alert of options.weatherAlerts ?? []) {
    if (!weatherAlertApplies(alert, trip.date, now)) continue;
    const severity = weatherRiskSeverity(alert.severity);
    issues.push(
      createTripRiskIssue(
        `weather_${safeRiskId(alert.id)}`,
        severity,
        "weather",
        alert.event || "Official weather alert",
        [alert.headline, alert.areaDesc]
          .filter(Boolean)
          .join(" · ")
          .slice(0, 500),
        alert.instruction?.slice(0, 500) ||
          "Review the official alert and reconsider exposed beaches, boating, hiking, and ferry-dependent plans.",
        severity === "critical"
          ? 34
          : severity === "high"
            ? 24
            : severity === "medium"
              ? 12
              : 5,
        undefined,
        alert.sourceUrl,
      ),
    );
  }
}
