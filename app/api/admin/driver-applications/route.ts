import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APPLICATION_STATUSES = new Set([
  "pending",
  "changes_requested",
  "approved",
  "rejected",
]);

function clean(value: unknown, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isFutureDate(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) > Date.now()
  );
}

function applicationStatus(value: unknown) {
  const status = clean(value, 40);
  return APPLICATION_STATUSES.has(status) ? status : "pending";
}

export async function GET() {
  try {
    await requireSession(["admin"]);
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

    const applications = applicationSnapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        displayName: clean(data.displayName, 100) || "Unnamed applicant",
        email: clean(data.email, 220),
        phone: clean(data.phone, 40),
        island: clean(data.island, 20),
        taxiCommissionBadgeNumber: clean(data.taxiCommissionBadgeNumber, 80),
        taxiCommissionBadgeExpiresAt: clean(
          data.taxiCommissionBadgeExpiresAt,
          32,
        ),
        licenseClass: clean(data.licenseClass, 40),
        licenseExpiresAt: clean(data.licenseExpiresAt, 32),
        taxiPlate: clean(data.taxiPlate, 40),
        vehicleDescription: clean(data.vehicleDescription, 160),
        associationName: clean(data.associationName, 120),
        status: applicationStatus(data.status),
        reviewNote: clean(data.reviewNote, 500) || null,
        submittedAt: clean(data.submittedAt, 40),
        updatedAt: clean(data.updatedAt, 40),
        driverId: clean(data.driverId, 128) || null,
        vehicleId: clean(data.vehicleId, 128) || null,
        associationId: clean(data.associationId, 128) || null,
      };
    });

    const associations = associationSnapshot.docs
      .map((document) => {
        const data = document.data();
        return {
          id: document.id,
          name: clean(data.name, 160) || document.id,
          status: clean(data.status, 40),
          islands: Array.isArray(data.islands)
            ? data.islands
                .map((value: unknown) => clean(value, 20))
                .filter(Boolean)
            : [],
        };
      })
      .filter((association) => association.status === "active");

    const vehicles = vehicleSnapshot.docs.map((document) => {
      const data = document.data();
      const active = data.active === true;
      const inspectionCurrent =
        data.inspectionStatus === "active" &&
        isFutureDate(data.inspectionExpiresAt);
      const insuranceCurrent =
        data.insuranceStatus === "active" &&
        isFutureDate(data.insuranceExpiresAt);
      const taxiPlate = clean(data.taxiPlate, 40);
      const medallionNumber = clean(data.medallionNumber, 80);
      return {
        id: document.id,
        associationId: clean(data.associationId, 128),
        driverId: clean(data.driverId, 128) || null,
        taxiPlate,
        medallionNumber,
        description:
          [clean(data.year, 20), clean(data.make, 60), clean(data.model, 60), clean(data.color, 40)]
            .filter(Boolean)
            .join(" ") || taxiPlate || document.id,
        dispatchReady:
          active &&
          inspectionCurrent &&
          insuranceCurrent &&
          Boolean(taxiPlate) &&
          Boolean(medallionNumber),
      };
    });

    return NextResponse.json({
      ok: true,
      applications,
      associations,
      vehicles,
      counts: {
        pending: applications.filter((item) => item.status === "pending").length,
        changesRequested: applications.filter(
          (item) => item.status === "changes_requested",
        ).length,
        approved: applications.filter((item) => item.status === "approved").length,
        rejected: applications.filter((item) => item.status === "rejected").length,
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application admin list error", error);
    return NextResponse.json(
      { error: "Unable to load driver applications." },
      { status: 500 },
    );
  }
}
