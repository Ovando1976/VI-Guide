import { NextRequest, NextResponse } from "next/server";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type { CommerceBookingStatus } from "@/types/commerce-booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES: CommerceBookingStatus[] = [
  "reviewing",
  "confirmed",
  "declined",
  "cancelled",
];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  if (!hasFirebaseAdminConfiguration()) {
    return NextResponse.json(
      { error: "Merchant bookings are not configured on the server." },
      { status: 503 },
    );
  }

  const bookingId = clean(params.bookingId, 160);
  const body = (await request.json().catch(() => null)) as
    | { status?: unknown; merchantNote?: unknown; proposedTime?: unknown }
    | null;
  const status = clean(body?.status, 40) as CommerceBookingStatus;
  const merchantNote = clean(body?.merchantNote, 1200);
  const proposedTime = clean(body?.proposedTime, 40);

  if (!bookingId || !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json(
      { error: "Choose a valid booking action." },
      { status: 400 },
    );
  }

  const reference = getAdminDb().collection("commerceBookings").doc(bookingId);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const updatedAt = new Date().toISOString();
  await reference.update({
    status,
    updatedAt,
    merchantNote: merchantNote || null,
    proposedTime: proposedTime || null,
    merchantRespondedAt: updatedAt,
  });

  return NextResponse.json({
    ok: true,
    booking: {
      id: bookingId,
      status,
      merchantNote: merchantNote || null,
      proposedTime: proposedTime || null,
      updatedAt,
    },
  });
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
