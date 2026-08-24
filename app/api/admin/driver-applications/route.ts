import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Driver application review is not configured." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const [applicationSnapshot, associationSnapshot, vehicleSnapshot] =
      await Promise.all([
        db
          .collection("driverApplications")
          .orderBy("updatedAt", "desc")
          .limit(200)
          .get(),
        db.collection("taxiAssociations").limit(200).get(),
        db.collection("vehicles").limit(500).get(),
      ]);

    return NextResponse.json({
      applications: applicationSnapshot.docs.map((document) =>
        serializeApplication(document.id, document.data()),
      ),
      associations: associationSnapshot.docs.map((document) => ({
        id: document.id,
        name: clean(document.data().name, 160) || document.id,
        status: clean(document.data().status, 40),
        islands: stringList(document.data().islands, 8),
      })),
      vehicles: vehicleSnapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          associationId: clean(data.associationId, 128),
          driverId: clean(data.driverId, 128) || null,
          islands: stringList(data.islands, 8),
          active: data.active === true,
          taxiPlate: clean(data.taxiPlate ?? data.plate, 80),
          medallionNumber: clean(data.medallionNumber, 80),
          make: clean(data.make, 80),
          model: clean(data.model, 80),
          color: clean(data.color, 80),
          inspectionStatus: clean(data.inspectionStatus, 40),
          inspectionExpiresAt: timestamp(data.inspectionExpiresAt),
          insuranceStatus: clean(data.insuranceStatus, 40),
          insuranceExpiresAt: timestamp(data.insuranceExpiresAt),
        };
      }),
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application review list error", error);
    return NextResponse.json(
      { error: "Unable to load driver applications." },
      { status: 500 },
    );
  }
}

function serializeApplication(
  id: string,
  data: FirebaseFirestore.DocumentData,
) {
  return {
    id,
    uid: clean(data.uid, 128),
    email: clean(data.email, 220),
    displayName: clean(data.displayName, 120),
    phone: clean(data.phone, 80),
    island: clean(data.island, 20),
    taxiCommissionBadgeNumber: clean(data.taxiCommissionBadgeNumber, 80),
    taxiCommissionBadgeExpiresAt: timestamp(data.taxiCommissionBadgeExpiresAt),
    licenseClass: clean(data.licenseClass, 40),
    licenseExpiresAt: timestamp(data.licenseExpiresAt),
    taxiPlate: clean(data.taxiPlate, 80),
    vehicleDescription: clean(data.vehicleDescription, 220),
    associationName: clean(data.associationName, 160),
    status: clean(data.status, 40) || "pending",
    reviewNote: clean(data.reviewNote, 500) || null,
    signupFeeCents: Number(data.signupFeeCents ?? 0),
    platformCommissionBps: Number(data.platformCommissionBps ?? 0),
    driverShareBps: Number(data.driverShareBps ?? 0),
    associationId: clean(data.associationId, 128) || null,
    vehicleId: clean(data.vehicleId, 128) || null,
    submittedAt: timestamp(data.submittedAt),
    updatedAt: timestamp(data.updatedAt),
    approvedAt: timestamp(data.approvedAt),
  };
}

function timestamp(value: unknown) {
  if (!value) return null;
  try {
    return normalizeTimestampOrEpoch(value as never);
  } catch {
    return clean(value, 80) || null;
  }
}

function stringList(value: unknown, max: number) {
  return Array.isArray(value)
    ? value
        .map((item) => clean(item, 40))
        .filter(Boolean)
        .slice(0, max)
    : [];
}

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}
