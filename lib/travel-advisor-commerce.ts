export const ADVISOR_COMMERCE_STATUSES = [
  "draft",
  "requested",
  "reviewing",
  "payment_required",
  "paid",
  "confirmed",
  "completed",
  "declined",
  "cancelled",
] as const;

export type AdvisorCommerceStatus = (typeof ADVISOR_COMMERCE_STATUSES)[number];

export type AdvisorCommerceBooking = {
  id: string;
  reference: string;
  listingName: string;
  kind: string;
  status: AdvisorCommerceStatus;
  paymentStatus: string;
  startDate: string;
  endDate: string | null;
  paidAmountCents: number;
  depositAmountCents: number;
  paymentHref: string | null;
  sourceProposalShareId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdvisorCommerceSummary = {
  totalBookings: number;
  activeBookings: number;
  paymentRequired: number;
  paidBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  paidAmountCents: number;
  latestStatus: AdvisorCommerceStatus | null;
};

export function normalizeAdvisorCommerceStatus(value: unknown): AdvisorCommerceStatus {
  return typeof value === "string" &&
    ADVISOR_COMMERCE_STATUSES.includes(value as AdvisorCommerceStatus)
    ? (value as AdvisorCommerceStatus)
    : "requested";
}

export function serializeAdvisorCommerceBooking(
  id: string,
  data: Record<string, unknown>,
): AdvisorCommerceBooking {
  return {
    id: clean(id, 180),
    reference: clean(data.reference, 160),
    listingName: clean(data.listingName, 180) || "USVI Explorer booking",
    kind: clean(data.kind, 60) || "experience",
    status: normalizeAdvisorCommerceStatus(data.status),
    paymentStatus: clean(data.paymentStatus, 60) || "unpaid",
    startDate: clean(data.startDate, 10),
    endDate: clean(data.endDate, 10) || null,
    paidAmountCents: nonNegativeMoney(data.paidAmountCents),
    depositAmountCents: nonNegativeMoney(data.depositAmountCents),
    paymentHref: safeInternalHref(data.paymentHref),
    sourceProposalShareId: clean(data.sourceProposalShareId, 40) || null,
    createdAt: clean(data.createdAt, 50),
    updatedAt: clean(data.updatedAt, 50) || clean(data.createdAt, 50),
  };
}

export function summarizeTravelAdvisorBookings(
  bookings: AdvisorCommerceBooking[],
): AdvisorCommerceSummary {
  const sorted = [...bookings].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );

  return {
    totalBookings: bookings.length,
    activeBookings: bookings.filter((booking) =>
      ["requested", "reviewing", "payment_required", "paid", "confirmed"].includes(
        booking.status,
      ),
    ).length,
    paymentRequired: bookings.filter(
      (booking) => booking.status === "payment_required",
    ).length,
    paidBookings: bookings.filter(
      (booking) =>
        booking.status === "paid" ||
        booking.status === "confirmed" ||
        booking.status === "completed" ||
        booking.paymentStatus === "paid",
    ).length,
    confirmedBookings: bookings.filter(
      (booking) => booking.status === "confirmed" || booking.status === "completed",
    ).length,
    completedBookings: bookings.filter((booking) => booking.status === "completed").length,
    paidAmountCents: bookings.reduce(
      (total, booking) => total + booking.paidAmountCents,
      0,
    ),
    latestStatus: sorted[0]?.status ?? null,
  };
}

export function advisorCommerceStatusLabel(status: AdvisorCommerceStatus) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function nonNegativeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 ? amount : 0;
}

function safeInternalHref(value: unknown) {
  const href = clean(value, 500);
  return href.startsWith("/") && !href.startsWith("//") ? href : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
