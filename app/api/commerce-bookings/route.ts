import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
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
      { error: "Please complete the required booking information." },
      { status: 400 },
    );
  }

  const reference = createReference(booking.kind);
  const now = new Date().toISOString();
  const document = await getAdminDb().collection("commerceBookings").add({
    ...booking,
    reference,
    status: "requested",
    createdAt: now,
    updatedAt: now,
    serverCreatedAt: FieldValue.serverTimestamp(),
    source: "vi-guide-web",
  });

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
  if (!BOOKING_KINDS.includes(body.kind as CommerceBookingKind)) return null;
  if (!ISLANDS.includes(body.island as IntelligenceIsland)) return null;

  const listingId = clean(body.listingId, 160);
  const listingName = clean(body.listingName, 180);
  const guestName = clean(body.guestName, 160);
  const email = clean(body.email, 220).toLowerCase();
  const startDate = clean(body.startDate, 10);
  const endDate = clean(body.endDate, 10);
  const adults = Math.max(1, Math.min(20, Number(body.adults) || 1));
  const children = Math.max(0, Math.min(20, Number(body.children) || 0));

  if (
    !listingId ||
    !listingName ||
    !guestName ||
    !/^\S+@\S+\.\S+$/.test(email) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate)
  ) {
    return null;
  }

  if (
    body.kind === "accommodation" &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate <= startDate)
  ) {
    return null;
  }

  return {
    kind: body.kind,
    listingId,
    listingName,
    island: body.island,
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
    ...(clean(body.listingHref, 500)
      ? { listingHref: clean(body.listingHref, 500) }
      : {}),
  };
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function createReference(kind: CommerceBookingKind) {
  const prefix = kind === "accommodation" ? "STAY" : kind === "tour" ? "TOUR" : "EXP";
  return `VI-${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;
}
