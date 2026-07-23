import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RideBooking } from "@/types/mobility";

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);
    const db = getAdminDb();
    const [reviewSnapshot, processingSnapshot, failedSnapshot] =
      await Promise.all([
        db
          .collection("bookings")
          .where("paymentIntegrityStatus", "==", "review_required")
          .limit(100)
          .get(),
        db
          .collection("bookings")
          .where("paymentStatus", "==", "processing")
          .limit(100)
          .get(),
        db
          .collection("bookings")
          .where("paymentStatus", "in", ["failed", "canceled"])
          .limit(100)
          .get(),
      ]);

    const records = new Map<string, RideBooking>();
    for (const snapshot of [
      reviewSnapshot,
      processingSnapshot,
      failedSnapshot,
    ]) {
      for (const document of snapshot.docs) {
        records.set(document.id, {
          id: document.id,
          ...document.data(),
        } as RideBooking);
      }
    }

    const bookings = Array.from(records.values())
      .map(serializePaymentBooking)
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

    return NextResponse.json({
      ok: true,
      counts: {
        reviewRequired: bookings.filter(
          (booking) => booking.paymentIntegrityStatus === "review_required",
        ).length,
        processing: bookings.filter(
          (booking) => booking.paymentStatus === "processing",
        ).length,
        failed: bookings.filter((booking) =>
          ["failed", "canceled"].includes(booking.paymentStatus),
        ).length,
      },
      bookings,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("payment operations queue error", error);
    return NextResponse.json(
      { error: "Unable to load payment operations." },
      { status: 500 },
    );
  }
}

function serializePaymentBooking(booking: RideBooking) {
  return {
    id: booking.id,
    riderId: booking.riderId,
    island: booking.island,
    status: booking.status,
    paymentStatus: booking.paymentStatus ?? "unpaid",
    paymentIntegrityStatus: booking.paymentIntegrityStatus ?? "verified",
    paymentIntegrityIssue: booking.paymentIntegrityIssue ?? null,
    paymentIntentId: booking.paymentIntentId ?? null,
    amountAuthorized: booking.amountAuthorized ?? null,
    amountCaptured: booking.amountCaptured ?? null,
    unexpectedCapturedPaymentIntentId:
      booking.unexpectedCapturedPaymentIntentId ?? null,
    unexpectedCapturedAmount: booking.unexpectedCapturedAmount ?? null,
    origin: booking.origin?.estateName ?? "Pickup",
    destination: booking.destination?.estateName ?? "Destination",
    createdAt: serializeDate(booking.createdAt),
    updatedAt: serializeDate(booking.paymentUpdatedAt ?? booking.updatedAt),
  };
}

function serializeDate(value: unknown) {
  if (!value) return new Date(0).toISOString();
  if (typeof value === "string") return value;
  if (typeof value === "object" && value && "toDate" in value) {
    const candidate = value as { toDate?: () => Date };
    if (typeof candidate.toDate === "function") {
      return candidate.toDate().toISOString();
    }
  }
  if (typeof value === "object" && value && "seconds" in value) {
    const candidate = value as { seconds?: number };
    if (typeof candidate.seconds === "number") {
      return new Date(candidate.seconds * 1000).toISOString();
    }
  }
  return new Date(0).toISOString();
}
