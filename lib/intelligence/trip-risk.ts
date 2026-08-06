import type {
  IntelligenceActiveTrip,
  IntelligenceActiveTripStop,
  IntelligenceMemory,
} from "@/types/intelligence";

export type TripRiskSeverity = "critical" | "high" | "medium" | "low" | "info";
export type TripRiskCategory =
  | "return_window"
  | "timing"
  | "transfer"
  | "density"
  | "accessibility"
  | "booking"
  | "weather"
  | "trip_data";

export type TripWeatherAlert = {
  id: string;
  event: string;
  headline: string;
  severity: "extreme" | "severe" | "moderate" | "minor" | "unknown";
  urgency?: string;
  onset?: string;
  expires?: string;
  areaDesc?: string;
  instruction?: string;
  sourceUrl?: string;
};

export type TripRiskIssue = {
  id: string;
  severity: TripRiskSeverity;
  category: TripRiskCategory;
  title: string;
  detail: string;
  recommendation: string;
  stopIds?: string[];
  penalty: number;
  sourceUrl?: string;
};

export type TripReturnWindow = {
  arrivalTime?: string;
  allAboardTime: string;
  safeReturnByTime: string;
  latestScheduledEndTime?: string;
  estimatedBufferMinutes?: number;
  requiredBufferMinutes: number;
};

export type TripRiskReport = {
  status: "critical" | "attention" | "watch" | "healthy" | "not_ready" | "past";
  score: number;
  summary: string;
  issueCount: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  issues: TripRiskIssue[];
  returnWindow?: TripReturnWindow;
};

export type TripRiskOptions = {
  now?: string | Date;
  weatherAlerts?: TripWeatherAlert[];
};

const DEFAULT_STOP_DURATION_MINUTES = 75;
const STANDARD_TRANSFER_BUFFER_MINUTES = 25;
const SENSITIVE_TRANSFER_BUFFER_MINUTES = 45;
const STANDARD_RETURN_BUFFER_MINUTES = 90;
const SENSITIVE_RETURN_BUFFER_MINUTES = 120;

export function evaluateTripRisk(
  trip: IntelligenceActiveTrip | undefined,
  memory: IntelligenceMemory = {},
  options: TripRiskOptions = {},
): TripRiskReport {
  if (!trip) {
    const issue = createIssue(
      "trip_missing",
      "high",
      "trip_data",
      "No active journey is available",
      "VI Guide cannot protect timing, transfers, or return windows until a journey is saved.",
      "Create or save a journey, then run the trip check again.",
      35,
    );
    return buildReport([issue], "not_ready");
  }

  const now = normalizeDate(options.now);
  const tripDateRelation = compareTripDate(trip.date, now);
  if (tripDateRelation < 0) {
    return {
      status: "past",
      score: 100,
      summary: "This journey date has passed. Risk monitoring is paused.",
      issueCount: 0,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      issues: [],
    };
  }

  const issues: TripRiskIssue[] = [];
  if (!trip.stops.length) {
    issues.push(
      createIssue(
        "trip_empty",
        "high",
        "trip_data",
        "The journey has no stops",
        "There is no itinerary sequence to monitor or protect.",
        "Add the first destination or ask Concierge to build the day.",
        35,
      ),
    );
    return buildReport(issues, "not_ready");
  }

  const timed = trip.stops
    .map((stop, index) => ({
      stop,
      index,
      start: minutesFromTime(stop.startTime),
      duration: validDuration(stop.durationMinutes)
        ? stop.durationMinutes!
        : DEFAULT_STOP_DURATION_MINUTES,
    }))
    .filter((item): item is typeof item & { start: number } => item.start !== undefined)
    .sort((a, b) => a.start - b.start);

  const missingTimes = trip.stops.filter((stop) => !stop.startTime);
  const missingDurations = trip.stops.filter((stop) => !validDuration(stop.durationMinutes));

  if (trip.status === "ready" && missingTimes.length) {
    const ratio = missingTimes.length / trip.stops.length;
    issues.push(
      createIssue(
        "timing_missing",
        ratio >= 0.5 ? "medium" : "low",
        "timing",
        `${missingTimes.length} ${missingTimes.length === 1 ? "stop has" : "stops have"} no start time`,
        "Flexible stops make overlap, transfer, and return-window checks less reliable.",
        "Assign approximate start times to the most important stops.",
        ratio >= 0.5 ? 12 : 5,
        missingTimes.map((stop) => stop.id),
      ),
    );
  }

  if (missingDurations.length >= Math.ceil(trip.stops.length / 2)) {
    issues.push(
      createIssue(
        "duration_missing",
        "medium",
        "timing",
        "Most stop durations are not defined",
        "VI Guide is using conservative 75-minute estimates, which can hide schedule pressure.",
        "Add realistic durations before relying on the timeline.",
        10,
        missingDurations.map((stop) => stop.id),
      ),
    );
  }

  for (let index = 1; index < timed.length; index += 1) {
    const previous = timed[index - 1];
    const current = timed[index];
    const previousEnd = previous.start + previous.duration;
    const gap = current.start - previousEnd;
    if (gap < 0) {
      issues.push(
        createIssue(
          `overlap_${previous.stop.id}_${current.stop.id}`,
          "high",
          "timing",
          `${previous.stop.title} overlaps ${current.stop.title}`,
          `The second stop begins ${Math.abs(gap)} minutes before the earlier stop is expected to end.`,
          "Shorten, move, or remove one stop before treating this journey as ready.",
          22,
          [previous.stop.id, current.stop.id],
        ),
      );
      continue;
    }

    const requiredBuffer =
      isTransportSensitive(previous.stop) || isTransportSensitive(current.stop)
        ? SENSITIVE_TRANSFER_BUFFER_MINUTES
        : STANDARD_TRANSFER_BUFFER_MINUTES;
    if (gap < requiredBuffer) {
      const severity: TripRiskSeverity = gap < 10 || requiredBuffer > STANDARD_TRANSFER_BUFFER_MINUTES
        ? "high"
        : "medium";
      issues.push(
        createIssue(
          `transfer_${previous.stop.id}_${current.stop.id}`,
          severity,
          "transfer",
          `Only ${gap} minutes between ${previous.stop.title} and ${current.stop.title}`,
          `This sequence needs at least ${requiredBuffer} minutes of transfer and recovery time based on the stops involved.`,
          "Move the next start later or arrange transportation before the trip begins.",
          severity === "high" ? 17 : 10,
          [previous.stop.id, current.stop.id],
        ),
      );
    }
  }

  const totalDuration = trip.stops.reduce(
    (sum, stop) => sum + (validDuration(stop.durationMinutes) ? stop.durationMinutes! : DEFAULT_STOP_DURATION_MINUTES),
    0,
  );
  if (trip.stops.length > 8 || totalDuration > 600) {
    issues.push(
      createIssue(
        "density_high",
        "high",
        "density",
        "The day is overpacked",
        `${trip.stops.length} stops and roughly ${formatDuration(totalDuration)} of activity leave little room for traffic, queues, meals, or rest.`,
        "Remove lower-priority stops or split this into separate days.",
        18,
      ),
    );
  } else if (trip.stops.length > 6 || totalDuration > 480) {
    issues.push(
      createIssue(
        "density_watch",
        "medium",
        "density",
        "The itinerary has limited recovery time",
        `${trip.stops.length} stops and roughly ${formatDuration(totalDuration)} of activity can become fragile when transfers run late.`,
        "Identify one optional stop that can be dropped without disrupting the day.",
        10,
      ),
    );
  }

  const accessibilityNeeds = memory.party?.accessibilityNeeds ?? [];
  const avoid = memory.preferences?.avoid ?? [];
  if (accessibilityNeeds.length || avoid.length) {
    const sensitiveStops = trip.stops.filter((stop) => accessibilityConcern(stop, avoid));
    if (sensitiveStops.length) {
      issues.push(
        createIssue(
          "accessibility_review",
          "medium",
          "accessibility",
          `${sensitiveStops.length} ${sensitiveStops.length === 1 ? "stop needs" : "stops need"} an accessibility check`,
          `The itinerary includes terrain or activity language that may conflict with saved needs: ${accessibilityNeeds.join(", ") || avoid.join(", ")}.`,
          "Confirm step-free access, walking distance, shade, seating, and pickup proximity before departure.",
          12,
          sensitiveStops.map((stop) => stop.id),
        ),
      );
    }
  }

  const pendingStops = trip.stops.filter((stop) => bookingConcern(stop));
  if (pendingStops.length) {
    issues.push(
      createIssue(
        "booking_pending",
        trip.status === "ready" ? "medium" : "low",
        "booking",
        `${pendingStops.length} ${pendingStops.length === 1 ? "stop appears" : "stops appear"} unconfirmed`,
        "A request, pending confirmation, or availability-dependent stop is still being treated as part of the itinerary.",
        "Confirm the reservation or keep a nearby fallback before marking the journey ready.",
        trip.status === "ready" ? 11 : 5,
        pendingStops.map((stop) => stop.id),
      ),
    );
  }

  let returnWindow: TripReturnWindow | undefined;
  const allAboard = minutesFromTime(memory.cruise?.allAboardTime);
  const arrival = minutesFromTime(memory.cruise?.arrivalTime);
  if (allAboard !== undefined) {
    const hasSensitiveTransfer = trip.stops.some(isTransportSensitive);
    const requiredBuffer = hasSensitiveTransfer
      ? SENSITIVE_RETURN_BUFFER_MINUTES
      : STANDARD_RETURN_BUFFER_MINUTES;
    const latestScheduled = timed.length
      ? Math.max(...timed.map((item) => item.start + item.duration))
      : undefined;
    const safeReturn = Math.max(0, allAboard - requiredBuffer);
    const buffer = latestScheduled === undefined ? undefined : allAboard - latestScheduled;

    returnWindow = {
      ...(memory.cruise?.arrivalTime ? { arrivalTime: memory.cruise.arrivalTime } : {}),
      allAboardTime: memory.cruise!.allAboardTime!,
      safeReturnByTime: timeFromMinutes(safeReturn),
      ...(latestScheduled !== undefined
        ? { latestScheduledEndTime: timeFromMinutes(latestScheduled) }
        : {}),
      ...(buffer !== undefined ? { estimatedBufferMinutes: buffer } : {}),
      requiredBufferMinutes: requiredBuffer,
    };

    if (arrival !== undefined && allAboard <= arrival) {
      issues.push(
        createIssue(
          "cruise_window_invalid",
          "critical",
          "return_window",
          "Cruise arrival and all-aboard times conflict",
          "The saved all-aboard time is not later than the saved arrival time.",
          "Correct the ship schedule before using return-to-ship guidance.",
          40,
        ),
      );
    } else if (latestScheduled === undefined) {
      issues.push(
        createIssue(
          "cruise_return_unverifiable",
          "high",
          "return_window",
          "Return-to-ship timing cannot be verified",
          `The ship's all-aboard time is ${memory.cruise!.allAboardTime}, but the itinerary has no usable stop times.`,
          `Add stop times and plan to be back by ${timeFromMinutes(safeReturn)}.",
          24,
        ),
      );
    } else {
      const untimedAfterLastTimed = trip.stops
        .slice(Math.max(...timed.map((item) => item.index)) + 1)
        .some((stop) => !stop.startTime);
      if (latestScheduled > allAboard) {
        issues.push(
          createIssue(
            "cruise_return_missed",
            "critical",
            "return_window",
            "The itinerary runs past all-aboard time",
            `The last scheduled activity ends at ${timeFromMinutes(latestScheduled)}, after all aboard at ${memory.cruise!.allAboardTime}.`,
            `Rebuild the final part of the day to return by ${timeFromMinutes(safeReturn)}.",
            45,
          ),
        );
      } else if ((buffer ?? 0) < 45) {
        issues.push(
          createIssue(
            "cruise_return_critical",
            "critical",
            "return_window",
            "Return-to-ship buffer is critically short",
            `Only ${buffer} minutes remain between the itinerary and all aboard.`,
            `End activities earlier and target a return by ${timeFromMinutes(safeReturn)}.",
            36,
          ),
        );
      } else if ((buffer ?? 0) < 90) {
        issues.push(
          createIssue(
            "cruise_return_high",
            "high",
            "return_window",
            "Return-to-ship buffer is too tight",
            `The plan leaves about ${buffer} minutes before all aboard, below the protected return window.`,
            `Move the final stop earlier and target a return by ${timeFromMinutes(safeReturn)}.",
            24,
          ),
        );
      } else if ((buffer ?? 0) < requiredBuffer) {
        issues.push(
          createIssue(
            "cruise_return_watch",
            "medium",
            "return_window",
            "Return-to-ship buffer needs attention",
            `The plan leaves about ${buffer} minutes before all aboard; VI Guide recommends ${requiredBuffer} minutes for this itinerary.`,
            `Protect a return by ${timeFromMinutes(safeReturn)} and prearrange the final transfer.",
            12,
          ),
        );
      }
      if (untimedAfterLastTimed) {
        issues.push(
          createIssue(
            "cruise_untimed_final_stop",
            "high",
            "return_window",
            "An untimed stop follows the protected schedule",
            "The final flexible activity is not included in the calculated return-to-ship buffer.",
            "Time or remove the final stop before relying on the return window.",
            18,
          ),
        );
      }
    }

    if (arrival !== undefined && timed[0] && timed[0].start < arrival + 45) {
      issues.push(
        createIssue(
          "cruise_departure_tight",
          "high",
          "return_window",
          "The first stop begins too soon after arrival",
          `The first timed stop begins ${timed[0].start - arrival} minutes after the saved ship arrival.`,
          "Allow time to disembark, meet transportation, and clear the port area.",
          16,
          [timed[0].stop.id],
        ),
      );
    }
  }

  for (const alert of options.weatherAlerts ?? []) {
    if (!weatherAlertApplies(alert, trip.date, now)) continue;
    const severity = weatherSeverity(alert.severity);
    issues.push(
      createIssue(
        `weather_${sanitizeId(alert.id)}`,
        severity,
        "weather",
        alert.event || "Official weather alert",
        [alert.headline, alert.areaDesc].filter(Boolean).join(" · ").slice(0, 500),
        alert.instruction?.slice(0, 500) ||
          "Review the official alert and reconsider exposed beaches, boating, hiking, and ferry-dependent plans.",
        severity === "critical" ? 34 : severity === "high" ? 24 : severity === "medium" ? 12 : 5,
        undefined,
        alert.sourceUrl,
      ),
    );
  }

  return buildReport(dedupeIssues(issues), undefined, returnWindow);
}

export function buildTripRiskPrompt(
  report: TripRiskReport,
  trip: IntelligenceActiveTrip | undefined,
) {
  const issueText = report.issues
    .slice(0, 6)
    .map(
      (issue, index) =>
        `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.title}: ${issue.recommendation}`,
    )
    .join("\n");
  const stopText = (trip?.stops ?? [])
    .slice(0, 12)
    .map(
      (stop, index) =>
        `${index + 1}. ${stop.title}${stop.startTime ? ` at ${stop.startTime}` : ""}${stop.durationMinutes ? ` for ${stop.durationMinutes} minutes` : ""}`,
    )
    .join("\n");

  return [
    "Protect and improve my active Virgin Islands journey using the proactive risk report below.",
    "Preserve strong confirmed choices, but fix critical timing, transportation, accessibility, booking, weather, and return-to-ship risks.",
    "Give me a practical revised sequence and clearly explain what changed. Do not claim live availability or a confirmed booking.",
    trip ? `Journey: ${trip.title} on ${trip.date}` : "Journey: not yet saved",
    `Trip health: ${report.score}/100 (${report.status})`,
    issueText ? `Risks:\n${issueText}` : "Risks: No material issues detected.",
    stopText ? `Current stops:\n${stopText}` : "Current stops: none",
  ]
    .join("\n\n")
    .slice(0, 3900);
}

function buildReport(
  issues: TripRiskIssue[],
  forcedStatus?: TripRiskReport["status"],
  returnWindow?: TripReturnWindow,
): TripRiskReport {
  const criticalCount = issues.filter((issue) => issue.severity === "critical").length;
  const highCount = issues.filter((issue) => issue.severity === "high").length;
  const mediumCount = issues.filter((issue) => issue.severity === "medium").length;
  const score = Math.max(
    0,
    Math.min(100, 100 - issues.reduce((sum, issue) => sum + issue.penalty, 0)),
  );
  const status =
    forcedStatus ??
    (criticalCount
      ? "critical"
      : highCount
        ? "attention"
        : mediumCount
          ? "watch"
          : "healthy");
  const summary =
    status === "critical"
      ? "Immediate itinerary changes are needed before relying on this plan."
      : status === "attention"
        ? "Important timing or logistics risks should be resolved before departure."
        : status === "watch"
          ? "The trip is workable, but a few safeguards will make it more resilient."
          : status === "not_ready"
            ? "Save a usable itinerary before VI Guide can protect the trip."
            : "No material itinerary risks were detected from the information currently available.";

  return {
    status,
    score,
    summary,
    issueCount: issues.length,
    criticalCount,
    highCount,
    mediumCount,
    issues: issues.sort(compareIssues),
    ...(returnWindow ? { returnWindow } : {}),
  };
}

function createIssue(
  id: string,
  severity: TripRiskSeverity,
  category: TripRiskCategory,
  title: string,
  detail: string,
  recommendation: string,
  penalty: number,
  stopIds?: string[],
  sourceUrl?: string,
): TripRiskIssue {
  return {
    id,
    severity,
    category,
    title,
    detail,
    recommendation,
    penalty,
    ...(stopIds?.length ? { stopIds } : {}),
    ...(sourceUrl ? { sourceUrl } : {}),
  };
}

function compareIssues(first: TripRiskIssue, second: TripRiskIssue) {
  return severityRank(second.severity) - severityRank(first.severity) || first.title.localeCompare(second.title);
}

function severityRank(severity: TripRiskSeverity) {
  if (severity === "critical") return 5;
  if (severity === "high") return 4;
  if (severity === "medium") return 3;
  if (severity === "low") return 2;
  return 1;
}

function weatherSeverity(value: TripWeatherAlert["severity"]): TripRiskSeverity {
  if (value === "extreme") return "critical";
  if (value === "severe") return "high";
  if (value === "moderate") return "medium";
  return "low";
}

function weatherAlertApplies(alert: TripWeatherAlert, tripDate: string, now: Date) {
  const today = localDate(now);
  if (!alert.onset && !alert.expires) return tripDate === today;
  const onsetDate = alert.onset ? localDate(new Date(alert.onset)) : today;
  const expiresDate = alert.expires ? localDate(new Date(alert.expires)) : today;
  return tripDate >= onsetDate && tripDate <= expiresDate;
}

function compareTripDate(tripDate: string, now: Date) {
  return tripDate.localeCompare(localDate(now));
}

function localDate(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeDate(value: TripRiskOptions["now"]) {
  const date = value instanceof Date ? value : value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function minutesFromTime(value?: string) {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) return undefined;
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function timeFromMinutes(value: number) {
  const normalized = ((Math.round(value) % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

function validDuration(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isTransportSensitive(stop: IntelligenceActiveTripStop) {
  if (stop.mobility?.mode === "ferry") return true;
  const text = `${stop.title} ${stop.kind} ${stop.summary ?? ""}`.toLowerCase();
  return /(ferry|airport|terminal|cruise|ship|dock|marina|seaplane|water taxi)/.test(text);
}

function accessibilityConcern(stop: IntelligenceActiveTripStop, avoid: string[]) {
  const text = `${stop.title} ${stop.kind} ${stop.summary ?? ""} ${avoid.join(" ")}`.toLowerCase();
  return /(steep|stairs|stairway|hike|hiking|trail|climb|rugged|rocky|long walk|limited shade)/.test(text);
}

function bookingConcern(stop: IntelligenceActiveTripStop) {
  const text = `${stop.title} ${stop.summary ?? ""}`.toLowerCase();
  return /(unconfirmed|pending confirmation|pending request|availability request|request submitted|awaiting confirmation)/.test(text);
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `${hours}h${remainder ? ` ${remainder}m` : ""}`;
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120) || "alert";
}

function dedupeIssues(issues: TripRiskIssue[]) {
  return Array.from(new Map(issues.map((issue) => [issue.id, issue])).values());
}
