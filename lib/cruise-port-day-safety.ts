export type CruisePortDaySafetyStatus =
  | "safe_buffer"
  | "buffer_short"
  | "misses_all_aboard";

export type CruisePortDaySafetyInput = {
  allAboardTime: string;
  plannedReturnDepartureTime: string;
  estimatedReturnTravelMinutes: number;
  desiredSafetyBufferMinutes: number;
};

export type CruisePortDaySafetyResult = {
  status: CruisePortDaySafetyStatus;
  returnBufferMet: boolean;
  allAboardTime: string;
  plannedReturnDepartureTime: string;
  expectedPortReturnTime: string;
  safeReturnDeadline: string;
  expectedBufferMinutes: number;
  desiredSafetyBufferMinutes: number;
  estimatedReturnTravelMinutes: number;
};

export type CruisePortDaySafetyValidation =
  | { ok: true; result: CruisePortDaySafetyResult }
  | { ok: false; error: string };

/**
 * Traveler-facing planning estimate for a same-day cruise port call.
 *
 * This deliberately does not call estimated travel time "verified". The checkout
 * boundary has a stricter, server-side verified return-buffer invariant. This
 * helper lets a traveler detect a bad plan earlier without weakening that gate.
 */
export function evaluateCruisePortDaySafety(
  input: CruisePortDaySafetyInput,
): CruisePortDaySafetyValidation {
  const allAboardMinutes = parseClockMinutes(input.allAboardTime);
  const plannedDepartureMinutes = parseClockMinutes(
    input.plannedReturnDepartureTime,
  );
  const returnTravelMinutes = normalizeDuration(
    input.estimatedReturnTravelMinutes,
    1,
    360,
  );
  const desiredBufferMinutes = normalizeDuration(
    input.desiredSafetyBufferMinutes,
    1,
    240,
  );

  if (allAboardMinutes === null || plannedDepartureMinutes === null) {
    return { ok: false, error: "Enter valid all-aboard and return-departure times." };
  }
  if (returnTravelMinutes === null) {
    return {
      ok: false,
      error: "Enter an estimated return travel time between 1 and 360 minutes.",
    };
  }
  if (desiredBufferMinutes === null) {
    return {
      ok: false,
      error: "Enter a desired safety buffer between 1 and 240 minutes.",
    };
  }

  // Cruise port-day planning is intentionally same-day. If a traveler enters a
  // departure after all-aboard, fail closed rather than guessing an overnight rollover.
  if (plannedDepartureMinutes > allAboardMinutes) {
    return {
      ok: false,
      error: "The planned return departure must be before the ship's all-aboard time.",
    };
  }

  const expectedReturnMinutes = plannedDepartureMinutes + returnTravelMinutes;
  const safeReturnDeadlineMinutes = allAboardMinutes - desiredBufferMinutes;
  const expectedBufferMinutes = allAboardMinutes - expectedReturnMinutes;

  const status: CruisePortDaySafetyStatus =
    expectedReturnMinutes > allAboardMinutes
      ? "misses_all_aboard"
      : expectedReturnMinutes > safeReturnDeadlineMinutes
        ? "buffer_short"
        : "safe_buffer";

  return {
    ok: true,
    result: {
      status,
      returnBufferMet: status === "safe_buffer",
      allAboardTime: formatClockMinutes(allAboardMinutes),
      plannedReturnDepartureTime: formatClockMinutes(plannedDepartureMinutes),
      expectedPortReturnTime: formatClockMinutes(expectedReturnMinutes),
      safeReturnDeadline: formatClockMinutes(safeReturnDeadlineMinutes),
      expectedBufferMinutes,
      desiredSafetyBufferMinutes: desiredBufferMinutes,
      estimatedReturnTravelMinutes: returnTravelMinutes,
    },
  };
}

export function cruisePortDaySafetyLabel(status: CruisePortDaySafetyStatus) {
  switch (status) {
    case "safe_buffer":
      return "Buffer protected";
    case "buffer_short":
      return "Buffer too tight";
    case "misses_all_aboard":
      return "Misses all aboard";
  }
}

function parseClockMinutes(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return null;
  const [hoursText, minutesText] = value.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return hours * 60 + minutes;
}

function normalizeDuration(value: number, minimum: number, maximum: number) {
  return Number.isInteger(value) && value >= minimum && value <= maximum
    ? value
    : null;
}

function formatClockMinutes(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
