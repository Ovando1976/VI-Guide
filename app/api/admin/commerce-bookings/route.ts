import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import type {
  CommerceBooking,
  CommerceBookingStatus,
} from "@/types/commerce-booking";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REVIEW_ROLES = ["admin", "dispatcher"] as const;
const REVIEW_STATUSES: CommerceBookingStatus[] = [
  "requested",
  "reviewing",
  "confirmed",
  "declined",
  "cancelled",
];

export async function GET() {
  try {
    await requireSession([...REVIEW_ROLES]);
    if (!hasFirebaseAdminConfiguration()) return unavailable();

    const snapshot = await getAdminDb()
      .collection("commerceBookings")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const bookings = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as CommerceBooking[];

    return NextResponse.json(
      { bookings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce booking review list error", error);
    return NextResponse.json(
      { error: "Unable to load booking requests." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireSession([...REVIEW_ROLES]);
    if (!hasFirebaseAdminConfiguration()) return unavailable();

    const body = (await request.json().catch(() => null)) as {
      bookingId?: unknown;
      status?: unknown;
      internalNote?: unknown;
    } | null;

    const bookingId = clean(body?.bookingId, 180);
    const status = body?.status;
    const internalNote = clean(body?.internalNote, 1600);

    if (!bookingId || !isReviewStatus(status)) {
      return NextResponse.json(
        { error: "A valid booking and status are required." },
        { status: 400 },
      );
    }

    const reference = getAdminDb().collection("commerceBookings").doc(bookingId);
    const snapshot = await reference.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    await reference.update({
      status,
      internalNote,
      reviewedBy: session.uid,
      reviewedByEmail: session.email ?? null,
      reviewedAt: new Date().toISOString(),
      serverReviewedAt: FieldValue.serverTimestamp(),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, bookingId, status });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce booking review update error", error);
    return NextResponse.json(
      { error: "Unable to update this booking request." },
      { status: 500 },
    );
  }
}

function isReviewStatus(value: unknown): value is CommerceBookingStatus {
  return (
    typeof value === "string" &&
    REVIEW_STATUSES.includes(value as CommerceBookingStatus)
  );
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}

function unavailable() {
  return NextResponse.json(
    { error: "Booking review is not configured on the server." },
    { status: 503 },
  );
}
