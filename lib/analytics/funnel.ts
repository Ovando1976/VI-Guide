import { PHASE1_VERTICAL_SLICE } from "@/lib/analytics/phase1-gate";
import type { VIEventName } from "@/lib/analytics/vi-event";

export type FunnelEventRecord = {
  eventName?: unknown;
  origin?: unknown;
  travelerType?: unknown;
  providerId?: unknown;
  bookingId?: unknown;
  payload?: unknown;
};

export type Phase1FunnelSummary = {
  totalEvents: number;
  counts: Record<string, number>;
  funnel: Array<{ eventName: VIEventName; count: number }>;
  financial: {
    paymentCompleted: number;
    commissionGenerated: number;
    refundCompleted: number;
    unattributed: number;
    clientOriginated: number;
  };
  cruise: {
    relevantEvents: number;
    returnBufferReported: number;
    returnBufferMet: number;
    returnBufferMissing: number;
  };
};

export function summarizePhase1Funnel(
  records: FunnelEventRecord[],
): Phase1FunnelSummary {
  const counts: Record<string, number> = {};
  let unattributed = 0;
  let clientOriginated = 0;
  let cruiseRelevant = 0;
  let returnBufferReported = 0;
  let returnBufferMet = 0;

  for (const record of records) {
    const eventName = typeof record.eventName === "string" ? record.eventName : "unknown";
    counts[eventName] = (counts[eventName] ?? 0) + 1;

    if (["payment_completed", "commission_generated", "refund_completed"].includes(eventName)) {
      if (record.origin === "client") clientOriginated += 1;
      if (!clean(record.providerId) || !clean(record.bookingId)) unattributed += 1;
    }

    if (
      record.travelerType === "cruise" &&
      ["plan_created", "plan_item_added", "checkout_started"].includes(eventName)
    ) {
      cruiseRelevant += 1;
      const payload =
        record.payload && typeof record.payload === "object"
          ? (record.payload as Record<string, unknown>)
          : {};
      if (typeof payload.return_buffer_met === "boolean") {
        returnBufferReported += 1;
        if (payload.return_buffer_met) returnBufferMet += 1;
      }
    }
  }

  return {
    totalEvents: records.length,
    counts,
    funnel: PHASE1_VERTICAL_SLICE.map((eventName) => ({
      eventName,
      count: counts[eventName] ?? 0,
    })),
    financial: {
      paymentCompleted: counts.payment_completed ?? 0,
      commissionGenerated: counts.commission_generated ?? 0,
      refundCompleted: counts.refund_completed ?? 0,
      unattributed,
      clientOriginated,
    },
    cruise: {
      relevantEvents: cruiseRelevant,
      returnBufferReported,
      returnBufferMet,
      returnBufferMissing: cruiseRelevant - returnBufferReported,
    },
  };
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
