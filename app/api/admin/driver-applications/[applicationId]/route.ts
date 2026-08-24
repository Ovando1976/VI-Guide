import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function PATCH(
  request: Request,
  { params }: { params: { applicationId: string } },
) {
  try {
    const admin = await requireSession(["admin"]);
    const applicationId = clean(params.applicationId, 128);
    const body = (await request.json()) as Record<string, unknown>;
    const action = clean(body.action, 40);
    const reviewNote = clean(body.reviewNote, 500);

    if (!applicationId || !["approve", "request_changes", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid review request." }, { status: 400 });
    }

    const db = getAdminDb();
    const applicationRef = db.collection("driverApplications").doc(applicationId);
    const snapshot = await applicationRef.get();
    if (!snapshot.exists) {
      return NextResponse.json({ error: "Driver application not found." }, { status: 404 });
    }
    const application = snapshot.data() as Record<string, unknown>;

    if (application.status === "approved" && action !== "approve") {
      return NextResponse.json(
        { error: "Approved driver access must be revoked through the trusted role process." },
        { status: 409 },
      );
    }

    if (action === "request_changes" || action === "reject") {
      const now = new Date().toISOString();
      await applicationRef.set(
        {
          status: action === "request_changes" ? "changes_requested" : "rejected",
          reviewNote: reviewNote || null,
          reviewedAt: now,
          reviewedBy: admin.uid,
          updatedAt: now,
        },
        { merge: true },
      );
      return NextResponse.json({ ok: true, status: action });
    }

    const driverId = clean(body.driverId, 128) || applicationId;
    const vehicleId = clean(body.vehicleId, 128);
    const associationId = clean(body.associationId, 128);
    if (!vehicleId || !associationId) {
      return NextResponse.json(
        { error: "Approval requires a verified vehicleId and associationId." },
        { status: 400 },
      );
    }
    if (
      !application.taxiCommissionBadgeNumber ||
      !isFutureDate(application.taxiCommissionBadgeExpiresAt) ||
      !application.licenseClass ||
      !isFutureDate(application.licenseExpiresAt)
    ) {
      return NextResponse.json(
        { error: "Driver credentials are missing or expired." },
        { status: 409 },
      );
    }

    const [vehicleSnapshot, associationSnapshot] = await Promise.all([
      db.collection("vehicles").doc(vehicleId).get(),
      db.collection("taxiAssociations").doc(associationId).get(),
    ]);
    if (!vehicleSnapshot.exists || !associationSnapshot.exists) {
      return NextResponse.json(
        { error: "The linked fleet vehicle and taxi association must exist." },
        { status: 409 },
      );
    }

    const vehicle = vehicleSnapshot.data() as Record<string, unknown>;
    const association = associationSnapshot.data() as Record<string, unknown>;
    if (association.active === false) {
      return NextResponse.json({ error: "Taxi association is inactive." }, { status: 409 });
    }
    if (
      vehicle.active !== true ||
      vehicle.associationId !== associationId ||
      !vehicle.taxiPlate ||
      !vehicle.medallionNumber ||
      vehicle.inspectionStatus !== "active" ||
      !isFutureDate(vehicle.inspectionExpiresAt) ||
      vehicle.insuranceStatus !== "active" ||
      !isFutureDate(vehicle.insuranceExpiresAt)
    ) {
      return NextResponse.json(
        { error: "Fleet vehicle is not dispatch-ready for this association." },
        { status: 409 },
      );
    }
    if (vehicle.driverId && vehicle.driverId !== driverId) {
      return NextResponse.json(
        { error: "Fleet vehicle is already assigned to another driver." },
        { status: 409 },
      );
    }

    const user = await getAdminAuth().getUser(applicationId);
    const now = new Date().toISOString();
    await Promise.all([
      db.collection("drivers").doc(driverId).set(
        {
          displayName: application.displayName ?? user.displayName ?? user.email ?? "Driver",
          idHint: String(application.taxiCommissionBadgeNumber).slice(-4),
          availability: "offline",
          islands: [application.island],
          vehicleId,
          associationId,
          verified: true,
          authorizationStatus: "active",
          taxiCommissionBadgeNumber: application.taxiCommissionBadgeNumber,
          taxiCommissionBadgeExpiresAt: application.taxiCommissionBadgeExpiresAt,
          licenseClass: application.licenseClass,
          licenseExpiresAt: application.licenseExpiresAt,
          onboardingApplicationId: applicationId,
          verifiedAt: now,
          verifiedBy: admin.uid,
        },
        { merge: true },
      ),
      vehicleSnapshot.ref.set({ driverId, updatedAt: now }, { merge: true }),
    ]);

    await getAdminAuth().setCustomUserClaims(user.uid, {
      ...(user.customClaims ?? {}),
      role: "driver",
      driverId,
    });

    await applicationRef.set(
      {
        status: "approved",
        driverId,
        vehicleId,
        associationId,
        approvedAt: now,
        reviewedAt: now,
        reviewedBy: admin.uid,
        reviewNote: reviewNote || null,
        updatedAt: now,
      },
      { merge: true },
    );

    return NextResponse.json({
      ok: true,
      status: "approved",
      driverId,
      sessionRefreshRequired: true,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application review error", error);
    return NextResponse.json(
      { error: "Unable to review driver application." },
      { status: 500 },
    );
  }
}
