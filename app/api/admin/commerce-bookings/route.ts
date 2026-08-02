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
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

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
type ReviewBooking = CommerceBooking & {
  reviewSource: "commerceBookings" | "stayBookingRequests";
};

export async function GET() {
  try {
    await requireSession([...REVIEW_ROLES]);
    if (!hasFirebaseAdminConfiguration()) return unavailable();

    const db = getAdminDb();
    const [commerceSnapshot, staySnapshot] = await Promise.all([
      db.collection("commerceBookings").orderBy("createdAt", "desc").limit(100).get(),
      db.collection("stayBookingRequests").orderBy("createdAt", "desc").limit(100).get(),
    ]);

    const bookings = [
      ...commerceSnapshot.docs.map((document) =>
        normalizeCommerceBooking(document.id, document.data()),
      ),
      ...staySnapshot.docs.map((document) =>
        normalizeStayRequest(document.id, document.data()),
      ),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

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
      reviewSource?: unknown;
    } | null;

    const bookingId = clean(body?.bookingId, 180);
    const status = body?.status;
    const internalNote = clean(body?.internalNote, 1600);
    const reviewSource = body?.reviewSource;

    if (
      !bookingId ||
      !isReviewStatus(status) ||
      !isReviewSource(reviewSource)
    ) {
      return NextResponse.json(
        { error: "A valid booking and status are required." },
        { status: 400 },
      );
    }

    const reference = getAdminDb().collection(reviewSource).doc(bookingId);
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

function normalizeCommerceBooking(
  id: string,
  data: FirebaseFirestore.DocumentData,
): ReviewBooking {
  return {
    id,
    ...data,
    createdAt: normalizeTimestampOrEpoch(data.createdAt),
    updatedAt: normalizeTimestampOrEpoch(data.updatedAt ?? data.createdAt),
    reviewSource: "commerceBookings",
  } as ReviewBooking;
}

function normalizeStayRequest(id: string, data: FirebaseFirestore.DocumentData) {
  const island = clean(data.island, 10).toLowerCase();
  const email = clean(data.riderEmail, 220).toLowerCase();
  const createdAt = normalizeTimestampOrEpoch(data.createdAt);
  return {
    id,
    kind: "accommodation" as const,
    listingId: clean(data.staySlug, 160),
    listingName: clean(data.stayName, 180) || "Accommodation request",
    listingHref: data.staySlug
      ? `/accommodations/${encodeURIComponent(String(data.staySlug))}`
      : undefined,
    island: island === "stj" || island === "stx" ? island : "stt",
    startDate: clean(data.checkIn, 10),
    endDate: clean(data.checkOut, 10) || undefined,
    adults: Number(data.adults) || 1,
    children: Number(data.children) || 0,
    guestName: clean(data.guestName, 160) || email || "Signed-in guest",
    email,
    phone: clean(data.phone, 40) || undefined,
    notes: clean(data.notes, 1600) || undefined,
    status: normalizeStayStatus(data.status),
    reference: id,
    createdAt,
    updatedAt: normalizeTimestampOrEpoch(data.updatedAt ?? data.createdAt),
    reviewSource: "stayBookingRequests" as const,
  } satisfies CommerceBooking & { reviewSource: "stayBookingRequests" };
}

function normalizeStayStatus(value: unknown): CommerceBookingStatus {
  return value === "reviewing" ||
    value === "confirmed" ||
    value === "declined" ||
    value === "cancelled"
    ? value
    : "requested";
}

function isReviewSource(
  value: unknown,
): value is "commerceBookings" | "stayBookingRequests" {
  return value === "commerceBookings" || value === "stayBookingRequests";
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
