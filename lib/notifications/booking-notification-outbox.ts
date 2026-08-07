export type BookingNotificationEvent =
  | "booking_requested"
  | "booking_reviewing"
  | "payment_required"
  | "booking_paid"
  | "booking_confirmed"
  | "booking_completed"
  | "booking_declined"
  | "booking_cancelled"
  | "booking_refunded"
  | "refund_failed"
  | "refund_review_required"
  | "travel_advisor_requested"
  | "travel_advisor_followup"
  | "travel_advisor_proposal";

export type BookingNotificationAudience =
  | "traveler"
  | "merchant"
  | "operations";

export type BookingNotificationActor = {
  uid?: string | null;
  email?: string | null;
  role?: string | null;
};

export type BookingNotificationInput = {
  bookingId: string;
  reference: string;
  event: BookingNotificationEvent;
  audience: BookingNotificationAudience;
  listingId: string;
  listingName: string;
  recipientEmail?: string | null;
  recipientUid?: string | null;
  title: string;
  message: string;
  href: string;
  actor?: BookingNotificationActor | null;
  dedupeKey?: string | null;
  createdAt: string;
};

export function bookingNotificationOutboxId(input: BookingNotificationInput) {
  const parts = [
    cleanKey(input.bookingId),
    cleanKey(input.event),
    cleanKey(input.audience),
  ];
  const dedupeKey = clean(input.dedupeKey, 180);
  if (dedupeKey) parts.push(cleanKey(dedupeKey));
  return parts.join("__");
}

export function normalizeBookingNotification(
  input: BookingNotificationInput,
) {
  const bookingId = clean(input.bookingId, 160);
  const recipientEmail = cleanEmail(input.recipientEmail);
  const recipientUid = clean(input.recipientUid, 160);
  const listingId = clean(input.listingId, 160);
  const listingName = clean(input.listingName, 180) || "VI Guide booking";
  const reference = clean(input.reference, 160) || bookingId;
  const title = clean(input.title, 180);
  const message = clean(input.message, 1200);
  const href = normalizeHref(input.href);
  const createdAt = normalizeIso(input.createdAt);

  if (!bookingId || !listingId || !title || !message || !createdAt) {
    return null;
  }

  return {
    id: bookingNotificationOutboxId(input),
    bookingId,
    reference,
    event: input.event,
    audience: input.audience,
    listingId,
    listingName,
    recipientEmail: recipientEmail || null,
    recipientUid: recipientUid || null,
    title,
    message,
    href,
    status: "pending" as const,
    attempts: 0,
    nextAttemptAt: createdAt,
    deliveredAt: null,
    failedAt: null,
    lastError: null,
    actorUid: clean(input.actor?.uid, 160) || null,
    actorEmail: cleanEmail(input.actor?.email) || null,
    actorRole: clean(input.actor?.role, 40) || null,
    createdAt,
    updatedAt: createdAt,
  };
}

export function bookingEventForStatus(
  status: unknown,
): BookingNotificationEvent | null {
  if (status === "requested") return "booking_requested";
  if (status === "reviewing") return "booking_reviewing";
  if (status === "payment_required") return "payment_required";
  if (status === "paid") return "booking_paid";
  if (status === "confirmed") return "booking_confirmed";
  if (status === "completed") return "booking_completed";
  if (status === "declined") return "booking_declined";
  if (status === "cancelled") return "booking_cancelled";
  return null;
}

function normalizeHref(value: unknown) {
  const href = clean(value, 500);
  return href.startsWith("/") && !href.startsWith("//")
    ? href
    : "/bookings";
}

function normalizeIso(value: unknown) {
  const text = clean(value, 40);
  const parsed = Date.parse(text);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function cleanEmail(value: unknown) {
  const email = clean(value, 220).toLowerCase();
  return /^\S+@\S+\.\S+$/.test(email) ? email : "";
}

function cleanKey(value: unknown) {
  return (
    clean(value, 180)
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
