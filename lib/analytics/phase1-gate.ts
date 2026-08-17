import {
  FINANCIAL_VI_EVENT_NAMES,
  type VIEvent,
  type VIEventName,
} from "@/lib/analytics/vi-event";

export const PHASE1_VERTICAL_SLICE: VIEventName[] = [
  "landing_view",
  "concierge_started",
  "plan_created",
  "plan_item_added",
  "checkout_started",
  "payment_completed",
];

export type Phase1GateViolation = {
  code:
    | "client_financial_event"
    | "duplicate_financial_event"
    | "unattributed_revenue"
    | "missing_return_buffer"
    | "vertical_slice_incomplete";
  message: string;
  eventId?: string;
};

export type Phase1GateResult = {
  passed: boolean;
  violations: Phase1GateViolation[];
  sequence: {
    required: VIEventName[];
    observed: VIEventName[];
    complete: boolean;
  };
};

export function evaluatePhase1Gate(events: VIEvent[]): Phase1GateResult {
  const violations: Phase1GateViolation[] = [];
  const financialKeys = new Set<string>();

  for (const event of events) {
    const financial = FINANCIAL_VI_EVENT_NAMES.has(
      event.eventName as Parameters<typeof FINANCIAL_VI_EVENT_NAMES.has>[0],
    );

    if (financial) {
      if (event.origin !== "server") {
        violations.push({
          code: "client_financial_event",
          eventId: event.eventId,
          message: `${event.eventName} must be server-originated.`,
        });
      }
      if (!event.providerId?.trim() || !event.bookingId?.trim()) {
        violations.push({
          code: "unattributed_revenue",
          eventId: event.eventId,
          message: `${event.eventName} must resolve both providerId and bookingId.`,
        });
      }

      const stripeEventId = String(event.payload.stripeEventId ?? "").trim();
      const ledgerEntryId = String(event.payload.ledgerEntryId ?? "").trim();
      const financialKey = [
        event.eventName,
        event.bookingId ?? "",
        stripeEventId || ledgerEntryId || event.eventId,
      ].join("|");
      if (financialKeys.has(financialKey)) {
        violations.push({
          code: "duplicate_financial_event",
          eventId: event.eventId,
          message: `Duplicate financial side effect detected for ${financialKey}.`,
        });
      }
      financialKeys.add(financialKey);
    }

    if (
      event.travelerType === "cruise" &&
      (event.eventName === "plan_created" ||
        event.eventName === "plan_item_added" ||
        event.eventName === "checkout_started") &&
      typeof event.payload.return_buffer_met !== "boolean"
    ) {
      violations.push({
        code: "missing_return_buffer",
        eventId: event.eventId,
        message: `${event.eventName} must explicitly report return_buffer_met for cruise journeys.`,
      });
    }
  }

  const observed = PHASE1_VERTICAL_SLICE.filter((name) =>
    events.some((event) => event.eventName === name),
  );
  const complete = observed.length === PHASE1_VERTICAL_SLICE.length;
  if (!complete) {
    violations.push({
      code: "vertical_slice_incomplete",
      message: `Observed ${observed.length}/${PHASE1_VERTICAL_SLICE.length} required Phase 1 events.`,
    });
  }

  return {
    passed: violations.length === 0,
    violations,
    sequence: {
      required: [...PHASE1_VERTICAL_SLICE],
      observed,
      complete,
    },
  };
}
