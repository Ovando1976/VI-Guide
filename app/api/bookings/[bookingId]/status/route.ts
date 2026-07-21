import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getServerBooking,
  updateServerTripStatus,
} from "@/lib/server-bookings";
import type { RideBooking } from "@/types/mobility";
import type { TripEventType } from "@/types/trip-event";

const STATUS_TO_EVENT: Record<RideBooking["status"], TripEventType | null> = {
  draft: null,
  requested: "booking_requested",
  matched: "driver_matched",
  driver_en_route: "driver_en_route",
  arrived: "driver_arrived",
  in_progress: "trip_started",
  completed: "trip_completed",
  cancelled: "trip_cancelled",
};

const ALLOWED_STATUS_UPDATES: RideBooking["status"][] = [
  "driver_en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];

const DRIVER_STATUS_UPDATES: RideBooking["status"][] = [
  "driver_en_route",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
];

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession();
    const { bookingId } = params;

    const body = (await request.json().catch(() => null)) as
      | {
          status?: RideBooking["status"];
          message?: string;
        }
      | null;
    const requestedStatus = body?.status;

    if (
      !requestedStatus ||
      !ALLOWED_STATUS_UPDATES.includes(requestedStatus)
    ) {
      return NextResponse.json(
        { error: "Valid status is required." },
        { status: 400 },
      );
    }

    const eventType = STATUS_TO_EVENT[requestedStatus];
    if (!eventType) {
      return NextResponse.json(
        { error: "No trip event is configured for this status." },
        { status: 400 },
      );
    }

    const booking = await getServerBooking(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    const driverId = session.driverId ?? session.uid;
    const privileged =
      session.role === "admin" || session.role === "dispatcher";
    const isAssignedDriver =
      session.role === "driver" && booking.driverId === driverId;
    const isRiderCancelling =
      session.role === "rider" &&
      booking.riderId === session.uid &&
      requestedStatus === "cancelled";

    if (!privileged && !isAssignedDriver && !isRiderCancelling) {
      return NextResponse.json(
        { error: "You cannot update this booking." },
        { status: 403 },
      );
    }

    if (
      isAssignedDriver &&
      !DRIVER_STATUS_UPDATES.includes(requestedStatus)
    ) {
      return NextResponse.json(
        { error: "Drivers cannot perform that trip action." },
        { status: 403 },
      );
    }

    const actorType = privileged
      ? "admin"
      : isAssignedDriver
        ? "driver"
        : "rider";

    await updateServerTripStatus({
      bookingId,
      status: requestedStatus,
      actorType,
      actorId: session.uid,
      message:
        cleanMessage(body?.message) ?? defaultStatusMessage(requestedStatus),
      eventType,
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      status: requestedStatus,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("update booking status error", error);

    const message =
      error instanceof Error
        ? error.message
        : "Failed to update booking status.";
    const conflict =
      message.startsWith("Trip cannot move") ||
      message.includes("Payment must clear") ||
      message.includes("driver must be assigned");

    return NextResponse.json(
      { error: message },
      { status: conflict ? 409 : 500 },
    );
  }
}

function cleanMessage(value: unknown) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/\s+/g, " ").trim().slice(0, 280);
  return cleaned || null;
}

function defaultStatusMessage(status: RideBooking["status"]) {
  switch (status) {
    case "driver_en_route":
      return "Driver is en route to pickup.";
    case "arrived":
      return "Driver arrived at pickup.";
    case "in_progress":
      return "Trip started.";
    case "completed":
      return "Trip completed.";
    case "cancelled":
      return "Trip cancelled.";
    default:
      return `Booking status updated to ${status}.`;
  }
}
