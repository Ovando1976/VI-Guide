import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { assignServerDriver } from "@/lib/server-bookings";

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
      | { driverId?: unknown }
      | null;
    const isDispatch =
      session.role === "admin" || session.role === "dispatcher";
    const requestedDriverId = cleanDriverId(body?.driverId);
    const driverId = isDispatch
      ? requestedDriverId
      : session.driverId ?? session.uid;

    if (!driverId) {
      return NextResponse.json(
        {
          error: isDispatch
            ? "Select a driver before assigning this ride."
            : "Your account is not linked to a driver profile.",
        },
        { status: 400 },
      );
    }

    await assignServerDriver({
      bookingId,
      driverId,
      actorType: isDispatch ? "admin" : "driver",
      actorId: session.uid,
    });

    return NextResponse.json({
      ok: true,
      bookingId,
      driverId,
      status: "matched",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("accept booking error", error);

    const message =
      error instanceof Error ? error.message : "Failed to accept booking.";
    const conflict =
      message.includes("Payment must clear") ||
      message.includes("no longer available") ||
      message.includes("already accepted") ||
      message.includes("not linked") ||
      message.includes("not found") ||
      message.includes("eligible");

    return NextResponse.json(
      { error: message },
      { status: conflict ? 409 : 500 },
    );
  }
}

function cleanDriverId(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, "").trim().slice(0, 180);
}
