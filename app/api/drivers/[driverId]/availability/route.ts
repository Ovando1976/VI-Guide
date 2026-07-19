import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

const ALLOWED = ["available", "busy", "offline"] as const;
type DriverAvailability = (typeof ALLOWED)[number];

export async function POST(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const session = await requireSession(["driver", "admin"]);
    const { driverId } = params;
    const ownDriverId = session.driverId ?? session.uid;
    if (session.role !== "admin" && driverId !== ownDriverId) {
      return NextResponse.json({ error: "You may only update your own availability." }, { status: 403 });
    }
    const body = (await request.json()) as { availability?: DriverAvailability };

    if (!body.availability || !ALLOWED.includes(body.availability)) {
      return NextResponse.json(
        { error: "Valid availability is required." },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const driverRef = db.collection("drivers").doc(driverId);
    if (body.availability === "available") {
      const driverSnapshot = await driverRef.get();
      if (!driverSnapshot.exists) return NextResponse.json({ error: "Driver not found." }, { status: 404 });
      const driver = driverSnapshot.data();
      if (!driver?.verified || driver?.authorizationStatus !== "active" || !driver?.associationId || !driver?.vehicleId) {
        return NextResponse.json(
          { error: "Active Commission authorization, taxi association, and fleet vehicle are required before going available." },
          { status: 409 },
        );
      }
    }

    await driverRef.update({
      availability: body.availability,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true, driverId, availability: body.availability });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("update driver availability error", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update driver availability.",
      },
      { status: 500 }
    );
  }
}
