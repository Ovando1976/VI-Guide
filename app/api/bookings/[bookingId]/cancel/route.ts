import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { cancelBookingWithFinancialResolution } from "@/lib/booking-cancellation";
import { getServerBooking } from "@/lib/server-bookings";

const REASON_CODES = new Set([
  "plans_changed",
  "pickup_issue",
  "driver_delay",
  "duplicate_booking",
  "safety_concern",
  "other",
]);

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession();
    const bookingId = params.bookingId.trim();
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    const booking = await getServerBooking(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const privileged =
      session.role === "admin" || session.role === "dispatcher";
    const assignedDriver =
      session.role === "driver" &&
      booking.driverId === (session.driverId ?? session.uid);
    const rider = session.role === "rider" && booking.riderId === session.uid;
    if (!privileged && !assignedDriver && !rider) {
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => null)) as
      | { reasonCode?: unknown; reason?: unknown }
      | null;
    const reasonCode = cleanReasonCode(body?.reasonCode);
    const reason = cleanReason(body?.reason);
    if (!reasonCode || !reason) {
      return NextResponse.json(
        { error: "Select a cancellation reason and provide a brief explanation." },
        { status: 400 },
      );
    }

    const actorType = privileged
      ? "admin"
      : assignedDriver
        ? "driver"
        : "rider";
    const result = await cancelBookingWithFinancialResolution({
      bookingId,
      actorType,
      actorId: session.uid,
      reasonCode,
      reason,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("booking cancellation error", error);
    const message =
      error instanceof Error ? error.message : "Unable to cancel this ride.";
    const conflict =
      message.includes("can no longer be cancelled") ||
      message.includes("advanced while cancellation") ||
      message.includes("already completed");
    return NextResponse.json(
      { error: message },
      { status: conflict ? 409 : 500 },
    );
  }
}

function cleanReasonCode(value: unknown) {
  if (typeof value !== "string") return "";
  const cleaned = value.trim().toLowerCase();
  return REASON_CODES.has(cleaned) ? cleaned : "";
}

function cleanReason(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, 400);
}
