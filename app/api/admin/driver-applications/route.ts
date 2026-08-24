import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function text(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function future(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) > Date.now()
  );
}

export async function GET() {
  try {
    await requireSession(["admin"]);
    const db = getAdminDb();
    const [applicationSnapshot, associationSnapshot, vehicleSnapshot] =
      await Promise.all([
        db.collection("driverApplications").get(),
        db.collection("taxiAssociations").get(),
        db.collection("vehicles").get(),
      ]);

    const applications = applicationSnapshot.docs
      .map((doc) => {
        const value = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          uid: text(value.uid, 128),
          status: text(value.status, 32) || "pending",
          displayName: text(value.displayName, 100),
          email: text(value.email, 160),
          phone: text(value.phone, 40),
          island: text(value.island, 20),
          taxiCommissionBadgeNumber: text(
            value.taxiCommissionBadgeNumber,
            80,
          ),
          taxiCommissionBadgeExpiresAt: text(
            value.taxiCommissionBadgeExpiresAt,
            32,
          ),
          licenseClass: text(value.licenseClass, 40),
          licenseExpiresAt: text(value.licenseExpiresAt, 32),
          taxiPlate: text(value.taxiPlate, 40),
          vehicleDescription: text(value.vehicleDescription, 160),
          associationName: text(value.associationName, 120),
          reviewNote: text(value.reviewNote, 500),
          submittedAt: text(value.submittedAt, 40),
          updatedAt: text(value.updatedAt, 40),
          driverId: text(value.driverId, 128),
          vehicleId: text(value.vehicleId, 128),
          associationId: text(value.associationId, 128),
        };
      })
      .sort((a, b) => {
        const rank = (status: string) =>
          status === "pending" ? 0 : status === "changes_requested" ? 1 : 2;
        return rank(a.status) - rank(b.status) || b.updatedAt.localeCompare(a.updatedAt);
      });

    const associations = associationSnapshot.docs
      .map((doc) => {
        const value = doc.data() as Record<string, unknown>;
        return {
          id: doc.id,
          name: text(value.name, 120) || doc.id,
          status: text(value.status, 32),
          islands: Array.isArray(value.islands)
            ? value.islands.filter((item): item is string => typeof item === "string")
            : [],
        };
      })
      .filter((association) => association.status === "active")
      .sort((a, b) => a.name.localeCompare(b.name));

    const vehicles = vehicleSnapshot.docs
      .map((doc) => {
        const value = doc.data() as Record<string, unknown>;
        const dispatchReady =
          value.active === true &&
          text(value.inspectionStatus, 32) === "active" &&
          future(value.inspectionExpiresAt) &&
          text(value.insuranceStatus, 32) === "active" &&
          future(value.insuranceExpiresAt) &&
          Boolean(text(value.taxiPlate ?? value.plate, 40)) &&
          Boolean(text(value.medallionNumber, 80));
        return {
          id: doc.id,
          associationId: text(value.associationId, 128),
          driverId: text(value.driverId, 128),
          islands: Array.isArray(value.islands)
            ? value.islands.filter((item): item is string => typeof item === "string")
            : [],
          taxiPlate: text(value.taxiPlate ?? value.plate, 40),
          medallionNumber: text(value.medallionNumber, 80),
          make: text(value.make, 80),
          model: text(value.model, 80),
          color: text(value.color, 80),
          inspectionExpiresAt: text(value.inspectionExpiresAt, 32),
          insuranceExpiresAt: text(value.insuranceExpiresAt, 32),
          dispatchReady,
        };
      })
      .filter((vehicle) => vehicle.dispatchReady)
      .sort((a, b) => a.taxiPlate.localeCompare(b.taxiPlate));

    return NextResponse.json({ applications, associations, vehicles });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application admin queue error", error);
    return NextResponse.json(
      { error: "Unable to load the driver application queue." },
      { status: 500 },
    );
  }
}
