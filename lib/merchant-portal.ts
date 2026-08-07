import {
  addCalendarDays,
  getUsviToday,
} from "@/lib/booking/booking-dates";
import { normalizeManagedListingIds } from "@/lib/merchant-access";
import type {
  CommerceBookingStatus,
  CommercePaymentStatus,
} from "@/types/commerce-booking";
import type { ProviderAvailabilityDay } from "@/types/provider-operations";

export type MerchantListingSelectionInput = {
  requestedListingId?: unknown;
  managedListingIds?: unknown;
  restricted: boolean;
};

export type MerchantSummaryBooking = {
  status?: unknown;
  paymentStatus?: unknown;
};

export type MerchantOperationsSummary = {
  total: number;
  active: number;
  needsAction: number;
  awaitingPayment: number;
  readyToConfirm: number;
  confirmed: number;
  completed: number;
  closed: number;
};

export type ProviderAvailabilityWindowDecisionInput = {
  startDate: string;
  windowDays: number;
  isOpen: boolean;
  startTime?: string;
  endTime?: string;
  capacity?: number;
};

export type ProviderAvailabilityWindowDecisionResult = {
  days: ProviderAvailabilityDay[];
  decisionDates: string[];
  appliedCount: number;
  startDate: string;
  endDate: string;
};

const COMMERCE_BOOKING_STATUSES = new Set<CommerceBookingStatus>([
  "draft",
  "requested",
  "reviewing",
  "payment_required",
  "paid",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
]);
const COMMERCE_PAYMENT_STATUSES = new Set<CommercePaymentStatus>([
  "unpaid",
  "pending",
  "paid",
  "refund_pending",
  "refunded",
  "refund_failed",
]);

export function resolveMerchantListingSelection({
  requestedListingId,
  managedListingIds,
  restricted,
}: MerchantListingSelectionInput) {
  const requested = cleanListingId(requestedListingId);
  if (!restricted) return requested;

  const managed = normalizeManagedListingIds(managedListingIds);
  return requested && managed.includes(requested) ? requested : managed[0] ?? "";
}

export function humanizeListingId(value: unknown) {
  const listingId = cleanListingId(value);
  if (!listingId) return "Assigned business";

  return listingId
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function buildProviderAvailabilityDays(
  capacity: number,
  today: string = getUsviToday(),
): ProviderAvailabilityDay[] {
  const normalizedCapacity = Number.isFinite(capacity)
    ? Math.max(0, Math.min(500, Math.round(capacity)))
    : 10;

  return Array.from({ length: 14 }, (_, index) => ({
    date: addCalendarDays(today, index),
    isOpen: true,
    capacity: normalizedCapacity,
    startTime: "09:00",
    endTime: "17:00",
  }));
}

export function selectProviderAvailabilityDecisions(
  days: ProviderAvailabilityDay[],
  decisionDates: Iterable<string>,
) {
  const dates = normalizeDecisionDates(decisionDates);
  return days.filter((day) => dates.has(day.date));
}

export function applyProviderAvailabilityWindowDecision(
  days: ProviderAvailabilityDay[],
  decisionDates: Iterable<string>,
  input: ProviderAvailabilityWindowDecisionInput,
): ProviderAvailabilityWindowDecisionResult {
  const decided = normalizeDecisionDates(decisionDates);
  const startDate = normalizeIsoDate(input.startDate);
  const windowDays = clampWhole(input.windowDays, 1, 90, 14);
  const endDate = startDate ? addCalendarDays(startDate, windowDays - 1) : "";

  if (!startDate || !endDate) {
    return {
      days: [...days],
      decisionDates: Array.from(decided).sort(),
      appliedCount: 0,
      startDate: "",
      endDate: "",
    };
  }

  const nextDecisionDates = new Set(decided);
  const startTime = validTime(input.startTime) ? input.startTime : "09:00";
  const endTime = validTime(input.endTime) ? input.endTime : "17:00";
  const capacity = clampWhole(input.capacity, 1, 500, 10);
  let appliedCount = 0;

  const nextDays = days.map((day) => {
    if (
      decided.has(day.date) ||
      day.date < startDate ||
      day.date > endDate
    ) {
      return day;
    }

    nextDecisionDates.add(day.date);
    appliedCount += 1;

    if (!input.isOpen) {
      return { ...day, isOpen: false };
    }

    return {
      ...day,
      isOpen: true,
      capacity,
      startTime,
      endTime,
    };
  });

  return {
    days: nextDays,
    decisionDates: Array.from(nextDecisionDates).sort(),
    appliedCount,
    startDate,
    endDate,
  };
}

export function summarizeMerchantBookings(
  value: unknown,
): MerchantOperationsSummary {
  const bookings = Array.isArray(value) ? value : [];
  const summary: MerchantOperationsSummary = {
    total: 0,
    active: 0,
    needsAction: 0,
    awaitingPayment: 0,
    readyToConfirm: 0,
    confirmed: 0,
    completed: 0,
    closed: 0,
  };

  for (const booking of bookings) {
    if (!booking || typeof booking !== "object") continue;
    const record = booking as MerchantSummaryBooking;
    const status = normalizeBookingStatus(record.status);
    if (!status || status === "draft") continue;

    const paymentStatus = normalizePaymentStatus(record.paymentStatus);
    summary.total += 1;

    if (paymentStatus === "refunded") {
      summary.closed += 1;
    } else if (status === "requested" || status === "reviewing") {
      summary.needsAction += 1;
      summary.active += 1;
    } else if (status === "payment_required") {
      summary.awaitingPayment += 1;
      summary.active += 1;
    } else if (status === "paid") {
      summary.readyToConfirm += 1;
      summary.active += 1;
    } else if (status === "confirmed") {
      summary.confirmed += 1;
      summary.active += 1;
    } else if (status === "completed") {
      summary.completed += 1;
    } else if (status === "declined" || status === "cancelled") {
      summary.closed += 1;
    }
  }

  return summary;
}

function normalizeBookingStatus(value: unknown): CommerceBookingStatus | null {
  return typeof value === "string" &&
    COMMERCE_BOOKING_STATUSES.has(value as CommerceBookingStatus)
    ? (value as CommerceBookingStatus)
    : null;
}

function normalizePaymentStatus(value: unknown): CommercePaymentStatus | null {
  return typeof value === "string" &&
    COMMERCE_PAYMENT_STATUSES.has(value as CommercePaymentStatus)
    ? (value as CommercePaymentStatus)
    : null;
}

function normalizeDecisionDates(values: Iterable<string>) {
  return new Set(
    Array.from(values).filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
  );
}

function normalizeIsoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : "";
}

function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function clampWhole(
  value: unknown,
  min: number,
  max: number,
  fallback: number,
) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}

function cleanListingId(value: unknown) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, 160)
    : "";
}