import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { RideBooking } from "@/types/mobility";

const TRACKABLE_STATUSES: RideBooking["status"][] = [
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } },
) {
  try {
    const session = await requireSession(["driver", "dispatcher", "admin"]);
    const bookingId = params.bookingId.trim();
    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | {
          latitude?: unknown;
          longitude?: unknown;
          accuracy?: unknown;
          heading?: unknown;
          speed?: unknown;
        }
      | null;
    const location = normalizeLocation(body);
    if (!location) {
      return NextResponse.json(
        { error: "A valid driver location is required." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("bookings").doc(bookingId);
    const snapshot = await bookingRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    const booking = { id: snapshot.id, ...snapshot.data() } as RideBooking;
    const privileged =
      session.role === "admin" || session.role === "dispatcher";
    const driverId = session.driverId ?? session.uid;
    if (!privileged && booking.driverId !== driverId) {
      return NextResponse.json(
        { error: "Only the assigned driver can update this location." },
        { status: 403 },
      );
    }
    if (!TRACKABLE_STATUSES.includes(booking.status)) {
      return NextResponse.json(
        { error: "This trip is not currently trackable." },
        { status: 409 },
      );
    }

    await bookingRef.update({
      driverLocation: {
        ...location,
        driverId: booking.driverId ?? driverId,
        recordedAt: new Date().toISOString(),
      },
      driverLocationUpdatedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      status: booking.status,
      location,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver location update error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update driver location.",
      },
      { status: 500 },
    );
  }
}

function normalizeLocation(
  body:
    | {
        latitude?: unknown;
        longitude?: unknown;
        accuracy?: unknown;
        heading?: unknown;
        speed?: unknown;
      }
    | null,
) {
  if (!body) return null;
  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
    accuracy: finiteOrNull(body.accuracy),
    heading: finiteOrNull(body.heading),
    speed: finiteOrNull(body.speed),
  };
}

function finiteOrNull(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
