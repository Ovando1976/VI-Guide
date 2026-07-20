import { NextRequest, NextResponse } from "next/server";
import { updateServerTripStatus } from "@/lib/server-bookings";
import type { RideBooking } from "@/types/mobility";
import type { TripEventType } from "@/types/trip-event";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getServerBooking } from "@/lib/server-bookings";

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

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await requireSession();
    const { bookingId } = params;

    const body = (await request.json()) as {
      status?: RideBooking["status"];
      message?: string;
    };

    if (!body.status || !ALLOWED_STATUS_UPDATES.includes(body.status)) {
      return NextResponse.json(
        { error: "Valid status is required." },
        { status: 400 }
      );
    }
    if (
      body.status === "cancelled" &&
      session.role !== "rider" &&
      (!body.message || body.message.trim().length < 8)
    ) {
      return NextResponse.json(
        { error: "A cancellation reason of at least 8 characters is required." },
        { status: 400 },
      );
    }

    const eventType = STATUS_TO_EVENT[body.status];

    if (!eventType) {
      return NextResponse.json(
        { error: "No trip event is configured for this status." },
        { status: 400 }
      );
    }

    const booking = await getServerBooking(bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    const driverId = session.driverId ?? session.uid;
    const privileged = session.role === "admin" || session.role === "dispatcher";
    const isAssignedDriver = session.role === "driver" && booking.driverId === driverId;
    const isRiderCancelling = session.role === "rider" && booking.riderId === session.uid && body.status === "cancelled";
    if (!privileged && !isAssignedDriver && !isRiderCancelling) {
      return NextResponse.json({ error: "You cannot update this booking." }, { status: 403 });
    }

    await updateServerTripStatus({
      bookingId,
      status: body.status,
      actorType: privileged ? "admin" : session.role === "driver" ? "driver" : "rider",
      actorId: session.uid,
      message: body.message ?? defaultStatusMessage(body.status),
      eventType,
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      status: body.status,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("update booking status error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update booking status.",
      },
      { status: 500 }
    );
  }
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
