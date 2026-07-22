import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { authErrorResponse, requireSession } from "@/lib/auth-server";

const ALLOWED = ["available", "busy", "offline"] as const;
type DriverAvailability = (typeof ALLOWED)[number];

function hasCurrentExpiration(value?: string | null) {
  if (!value) return false;
  const expiresAt = Date.parse(value);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
  try {
    const session = await requireSession(["driver", "admin"]);
    const { driverId } = params;
    const ownDriverId = session.driverId ?? session.uid;
    if (session.role !== "admin" && driverId !== ownDriverId) {
      return NextResponse.json(
        { error: "You may only update your own availability." },
        { status: 403 },
      );
    }

    const body = (await request.json()) as { availability?: DriverAvailability };
    if (!body.availability || !ALLOWED.includes(body.availability)) {
      return NextResponse.json(
        { error: "Valid availability is required." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const driverRef = db.collection("drivers").doc(driverId);

    if (body.availability === "available") {
      const driverSnapshot = await driverRef.get();
      if (!driverSnapshot.exists) {
        return NextResponse.json({ error: "Driver not found." }, { status: 404 });
      }

      const driver = driverSnapshot.data();
      const failures: string[] = [];

      if (!driver?.verified) failures.push("driver verification");
      if (driver?.authorizationStatus !== "active") {
        failures.push("active Commission authorization");
      }
      if (!driver?.taxiCommissionBadgeNumber) failures.push("Taxicab Commission badge");
      if (!hasCurrentExpiration(driver?.taxiCommissionBadgeExpiresAt)) {
        failures.push("current Taxicab Commission badge expiration");
      }
      if (!driver?.licenseClass) failures.push("driver license class");
      if (!hasCurrentExpiration(driver?.licenseExpiresAt)) {
        failures.push("current driver license expiration");
      }
      if (!driver?.associationId) failures.push("taxi association membership");
      if (!driver?.vehicleId) failures.push("assigned fleet vehicle");

      if (!failures.length) {
        const [vehicleSnapshot, associationSnapshot] = await Promise.all([
          db.collection("vehicles").doc(driver.vehicleId).get(),
          db.collection("taxiAssociations").doc(driver.associationId).get(),
        ]);

        if (!vehicleSnapshot.exists) {
          failures.push("fleet vehicle record");
        } else {
          const vehicle = vehicleSnapshot.data();
          if (!vehicle?.active) failures.push("active fleet vehicle");
          if (vehicle?.driverId !== driverId) failures.push("vehicle-to-driver assignment");
          if (vehicle?.associationId !== driver.associationId) {
            failures.push("vehicle association alignment");
          }
          if (vehicle?.inspectionStatus !== "active") failures.push("active vehicle inspection");
          if (!hasCurrentExpiration(vehicle?.inspectionExpiresAt)) {
            failures.push("current vehicle inspection expiration");
          }
          if (vehicle?.insuranceStatus !== "active") failures.push("active vehicle insurance");
          if (!hasCurrentExpiration(vehicle?.insuranceExpiresAt)) {
            failures.push("current vehicle insurance expiration");
          }
          if (!vehicle?.taxiPlate) failures.push("taxi plate");
          if (!vehicle?.medallionNumber) failures.push("medallion number");
        }

        if (!associationSnapshot.exists) {
          failures.push("taxi association record");
        } else if (associationSnapshot.data()?.status !== "active") {
          failures.push("active taxi association");
        }
      }

      if (failures.length) {
        return NextResponse.json(
          {
            error: `Dispatch access is restricted. Resolve: ${failures.join(", ")}.`,
            failures,
          },
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
      { status: 500 },
    );
  }
}
