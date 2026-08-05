import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  getUsviToday,
  isBookableEndDate,
  isBookableStartDate,
} from "@/lib/booking/booking-dates";
import { normalizeBookingNotification } from "@/lib/notifications/booking-notification-outbox";
import { safeInternalDestinationOrNull } from "@/lib/safe-internal-destination";
import type {
  CommerceBookingKind,
  CommerceBookingRequest,
} from "@/types/commerce-booking";
import type { IntelligenceIsland } from "@/types/intelligence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOOKING_KINDS: CommerceBookingKind[] = [
  "accommodation",
  "tour",
  "experience",
];
const ISLANDS: IntelligenceIsland[] = ["stt", "stj", "stx"];

export async function POST(request: NextRequest) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Booking requests are not configured on the server." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | Partial<CommerceBookingRequest>
    | null;
  const booking = normalizeBooking(body);

  if (!booking) {
    return NextResponse.json(
      {
        error:
          "Please complete the required booking information with future travel dates.",
      },
      { status: 400 },
    );
  }

  const reference = createReference(booking.kind);
  const now = new Date().toISOString();
  const db = getAdminDb();
  const document = db.collection("commerceBookings").doc();
  const batch = db.batch();

  batch.set(document, {
    ...booking,
    reference,
    status: "requested",
    createdAt: now,
    updatedAt: now,
    serverCreatedAt: FieldValue.serverTimestamp(),
    source: "vi-guide-web",
  });

  const notificationInputs = [
    {
      audience: "traveler" as const,
      recipientEmail: booking.email,
      title: "Booking request received",
      message: `We received your request for ${booking.listingName}. VI Guide will keep this booking status updated.`,
      href: "/bookings",
    },
    {
      audience: "merchant" as const,
      recipientEmail: null,
      title: "New booking request",
      message: `${booking.guestName} requested ${booking.listingName} for ${booking.startDate}.`,
      href: "/merchant/reservations",
    },
    {
      audience: "operations" as const,
      recipientEmail: null,
      title: "New booking request",
      message: `${booking.listingName} received booking request ${reference}.`,
      href: "/admin/operations",
    },
  ];

  for (const input of notificationInputs) {
    const notification = normalizeBookingNotification({
      bookingId: document.id,
      reference,
      event: "booking_requested",
      audience: input.audience,
      listingId: booking.listingId,
      listingName: booking.listingName,
      recipientEmail: input.recipientEmail,
      title: input.title,
      message: input.message,
      href: input.href,
      createdAt: now,
    });
    if (!notification) {
      return NextResponse.json(
        { error: "Unable to prepare booking notifications." },
        { status: 500 },
      );
    }

    batch.set(db.collection("notificationOutbox").doc(notification.id), {
      ...notification,
      serverCreatedAt: FieldValue.serverTimestamp(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  return NextResponse.json(
    {
      ok: true,
      bookingId: document.id,
      reference,
      status: "requested",
    },
    { status: 201 },
  );
}

function normalizeBooking(
  body: Partial<CommerceBookingRequest> | null,
): CommerceBookingRequest | null {
  if (!body) return null;

  const kind = body.kind;
  const island = body.island;
  if (!isBookingKind(kind) || !isIsland(island)) return null;

  const listingId = clean(body.listingId, 160);
  const listingName = clean(body.listingName, 180);
  const guestName = clean(body.guestName, 160);
  const email = clean(body.email, 220).toLowerCase();
  const startDate = clean(body.startDate, 10);
  const endDate = clean(body.endDate, 10);
  const adults = Math.max(1, Math.min(20, Number(body.adults) || 1));
  const children = Math.max(0, Math.min(20, Number(body.children) || 0));
  const listingHref = safeInternalDestinationOrNull(
    clean(body.listingHref, 500) || null,
    "https://vi-guide.local",
  );
  const today = getUsviToday();

  if (
    !listingId ||
    !listingName ||
    !guestName ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !isBookableStartDate(startDate, today)
  ) {
    return null;
  }

  if (kind === "accommodation" && !isBookableEndDate(startDate, endDate)) {
    return null;
  }

  return {
    kind,
    listingId,
    listingName,
    island,
    startDate,
    adults,
    children,
    guestName,
    email,
    ...(endDate ? { endDate } : {}),
    ...(clean(body.preferredTime, 20)
      ? { preferredTime: clean(body.preferredTime, 20) }
      : {}),
    ...(clean(body.phone, 40) ? { phone: clean(body.phone, 40) } : {}),
    ...(clean(body.notes, 1600) ? { notes: clean(body.notes, 1600) } : {}),
    ...(listingHref ? { listingHref } : {}),
  };
}

function isBookingKind(value: unknown): value is CommerceBookingKind {
  return (
    typeof value === "string" &&
    BOOKING_KINDS.includes(value as CommerceBookingKind)
  );
}

function isIsland(value: unknown): value is IntelligenceIsland {
  return (
    typeof value === "string" &&
    ISLANDS.includes(value as IntelligenceIsland)
  );
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function createReference(kind: CommerceBookingKind) {
  const prefix =
    kind === "accommodation" ? "STAY" : kind === "tour" ? "TOUR" : "EXP";
  return `VI-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}
