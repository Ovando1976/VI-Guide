import { NextRequest, NextResponse } from "next/server";
import { assignServerDriver } from "@/lib/server-bookings";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const session = await requireSession(["driver", "dispatcher", "admin"]);
    const { bookingId } = params;
    const body = (await request.json().catch(() => ({}))) as { driverId?: string };
    const isDispatch = session.role === "admin" || session.role === "dispatcher";
    const driverId = isDispatch && body.driverId
      ? body.driverId
      : session.driverId ?? session.uid;

    await assignServerDriver({
      bookingId,
      driverId,
      actorType: isDispatch ? "admin" : "driver",
      actorId: session.uid,
    });

    return NextResponse.json({ ok: true, bookingId });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("accept booking error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to accept booking.",
      },
      { status: 500 }
    );
  }
}
