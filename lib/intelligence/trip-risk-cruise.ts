import type {
  IntelligenceActiveTrip,
  IntelligenceActiveTripStop,
  IntelligenceMemory,
} from "@/types/intelligence";
import type {
  TripRiskIssue,
  TripReturnWindow,
} from "@/lib/intelligence/trip-risk-types";
import {
  createTripRiskIssue,
  isTransportSensitive,
  minutesFromTime,
  NORMAL_RETURN_BUFFER_MINUTES,
  SENSITIVE_RETURN_BUFFER_MINUTES,
  timeFromMinutes,
} from "@/lib/intelligence/trip-risk-utils";

export type TimedTripStop = {
  stop: IntelligenceActiveTripStop;
  index: number;
  start: number;
  duration: number;
};

export function evaluateCruiseReturnWindow(
  trip: IntelligenceActiveTrip,
  memory: IntelligenceMemory,
  timedStops: TimedTripStop[],
  issues: TripRiskIssue[],
): TripReturnWindow | undefined {
  const cruise = memory.cruise;
  const allAboard = minutesFromTime(cruise?.allAboardTime);
  if (!cruise?.allAboardTime || allAboard === undefined) return undefined;

  const arrival = minutesFromTime(cruise.arrivalTime);
  const requiredBuffer = trip.stops.some(isTransportSensitive)
    ? SENSITIVE_RETURN_BUFFER_MINUTES
    : NORMAL_RETURN_BUFFER_MINUTES;
  const latestScheduled = timedStops.length
    ? Math.max(...timedStops.map((item) => item.start + item.duration))
    : undefined;
  const safeReturn = allAboard - requiredBuffer;
  const buffer =
    latestScheduled === undefined ? undefined : allAboard - latestScheduled;
  const returnWindow: TripReturnWindow = {
    ...(cruise.arrivalTime ? { arrivalTime: cruise.arrivalTime } : {}),
    allAboardTime: cruise.allAboardTime,
    safeReturnByTime: timeFromMinutes(safeReturn),
    ...(latestScheduled !== undefined
      ? { latestScheduledEndTime: timeFromMinutes(latestScheduled) }
      : {}),
    ...(buffer !== undefined ? { estimatedBufferMinutes: buffer } : {}),
    requiredBufferMinutes: requiredBuffer,
  };

  if (arrival !== undefined && allAboard <= arrival) {
    issues.push(
      createTripRiskIssue(
        "cruise_window_invalid",
        "critical",
        "return_window",
        "Cruise arrival and all-aboard times conflict",
        "The saved all-aboard time is not later than the saved arrival time.",
        "Correct the ship schedule before using return-to-ship guidance.",
        40,
      ),
    );
    return returnWindow;
  }

  if (latestScheduled === undefined) {
    issues.push(
      createTripRiskIssue(
        "cruise_return_unverifiable",
        "high",
        "return_window",
        "Return-to-ship timing cannot be verified",
        `All aboard is ${cruise.allAboardTime}, but the itinerary has no usable stop times.`,
        `Add stop times and plan to return by ${timeFromMinutes(safeReturn)}.`,
        24,
      ),
    );
    return returnWindow;
  }

  if (latestScheduled > allAboard) {
    issues.push(
      createTripRiskIssue(
        "cruise_return_missed",
        "critical",
        "return_window",
        "The itinerary runs past all-aboard time",
        `The last activity ends at ${timeFromMinutes(latestScheduled)}, after all aboard at ${cruise.allAboardTime}.`,
        `Rebuild the final part of the day to return by ${timeFromMinutes(safeReturn)}.`,
        45,
      ),
    );
  } else if ((buffer ?? 0) < 45) {
    issues.push(
      createTripRiskIssue(
        "cruise_return_critical",
        "critical",
        "return_window",
        "Return-to-ship buffer is critically short",
        `Only ${buffer} minutes remain before all aboard.`,
        `End activities earlier and return by ${timeFromMinutes(safeReturn)}.`,
        36,
      ),
    );
  } else if ((buffer ?? 0) < 90) {
    issues.push(
      createTripRiskIssue(
        "cruise_return_high",
        "high",
        "return_window",
        "Return-to-ship buffer is too tight",
        `The plan leaves about ${buffer} minutes before all aboard.`,
        `Move the final stop earlier and return by ${timeFromMinutes(safeReturn)}.`,
        24,
      ),
    );
  } else if ((buffer ?? 0) < requiredBuffer) {
    issues.push(
      createTripRiskIssue(
        "cruise_return_watch",
        "medium",
        "return_window",
        "Return-to-ship buffer needs attention",
        `The plan leaves ${buffer} minutes; USVI Explorer recommends ${requiredBuffer}.`,
        `Protect a return by ${timeFromMinutes(safeReturn)} and prearrange the final transfer.`,
        12,
      ),
    );
  }

  const lastTimedIndex = Math.max(...timedStops.map((item) => item.index));
  if (
    trip.stops
      .slice(lastTimedIndex + 1)
      .some((stop) => !stop.startTime)
  ) {
    issues.push(
      createTripRiskIssue(
        "cruise_untimed_final_stop",
        "high",
        "return_window",
        "An untimed stop follows the protected schedule",
        "The final flexible activity is outside the calculated return-to-ship buffer.",
        "Time or remove the final stop before relying on the return window.",
        18,
      ),
    );
  }

  if (arrival !== undefined && timedStops[0] && timedStops[0].start < arrival + 45) {
    issues.push(
      createTripRiskIssue(
        "cruise_departure_tight",
        "high",
        "return_window",
        "The first stop begins too soon after arrival",
        `Only ${timedStops[0].start - arrival} minutes are allowed to leave the ship and port.`,
        "Allow at least 45 minutes before the first activity.",
        16,
        [timedStops[0].stop.id],
      ),
    );
  }

  return returnWindow;
}
