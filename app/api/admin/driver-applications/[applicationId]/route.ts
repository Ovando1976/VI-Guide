import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: { applicationId: string } },
) {
  try {
    const admin = await requireSession(["admin"]);
    const applicationId = clean(params.applicationId, 128);
    const body = (await request.json().catch(() => null)) as
      | Record<string, unknown>
      | null;
    const action = clean(body?.action, 40);
    const reviewNote = clean(body?.reviewNote, 500);

    if (
      !applicationId ||
      !["approve", "request_changes", "reject"].includes(action)
    ) {
      return NextResponse.json(
        { error: "Invalid review request." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const applicationRef = db
      .collection("driverApplications")
      .doc(applicationId);
    const initialSnapshot = await applicationRef.get();
    if (!initialSnapshot.exists) {
      return NextResponse.json(
        { error: "Driver application not found." },
        { status: 404 },
      );
    }
    const initialApplication = initialSnapshot.data() as Record<string, unknown>;
    if (clean(initialApplication.uid, 128) !== applicationId) {
      return NextResponse.json(
        { error: "Driver application identity does not match its account UID." },
        { status: 409 },
      );
    }

    if (initialApplication.status === "approved") {
      if (action === "approve") {
        return NextResponse.json({
          ok: true,
          status: "approved",
          driverId: applicationId,
          sessionRefreshRequired: true,
        });
      }
      return NextResponse.json(
        {
          error:
            "Approved driver access must be revoked through the trusted role process.",
        },
        { status: 409 },
      );
    }

    if (action === "request_changes" || action === "reject") {
      const now = new Date().toISOString();
      const nextStatus =
        action === "request_changes" ? "changes_requested" : "rejected";
      const batch = db.batch();
      batch.set(
        applicationRef,
        {
          status: nextStatus,
          reviewNote: reviewNote || null,
          reviewedAt: now,
          reviewedBy: admin.uid,
          reviewedByEmail: admin.email ?? null,
          updatedAt: now,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batch.set(db.collection("driverApplicationAudit").doc(), {
        action,
        applicationId,
        actorUid: admin.uid,
        actorEmail: admin.email ?? null,
        previousStatus: clean(initialApplication.status, 40) || "pending",
        nextStatus,
        reviewNote: reviewNote || null,
        createdAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();
      return NextResponse.json({ ok: true, status: nextStatus });
    }

    if (initialApplication.status !== "pending") {
      return NextResponse.json(
        {
          error:
            "Only a pending application can be approved. Ask the driver to resubmit any requested changes first.",
        },
        { status: 409 },
      );
    }

    const driverId = applicationId;
    const vehicleId = clean(body?.vehicleId, 128);
    const associationId = clean(body?.associationId, 128);
    if (!vehicleId || !associationId) {
      return NextResponse.json(
        { error: "Approval requires a verified vehicleId and associationId." },
        { status: 400 },
      );
    }

    assertCurrentDriverCredentials(initialApplication);

    const adminAuth = getAdminAuth();
    const user = await adminAuth.getUser(applicationId);
    if (user.disabled) {
      return NextResponse.json(
        { error: "Enable this Firebase account before granting driver access." },
        { status: 409 },
      );
    }
    const currentRole = clean(user.customClaims?.role, 40) || "rider";
    if (currentRole !== "rider") {
      return NextResponse.json(
        {
          error: `This account is currently ${currentRole}; driver approval will not overwrite another privileged role.`,
        },
        { status: 409 },
      );
    }

    const previousClaims = { ...(user.customClaims ?? {}) };
    const nextClaims = {
      ...previousClaims,
      role: "driver",
      driverId,
    };

    await adminAuth.revokeRefreshTokens(user.uid);
    await adminAuth.setCustomUserClaims(user.uid, nextClaims);

    try {
      await db.runTransaction(async (transaction) => {
        const vehicleRef = db.collection("vehicles").doc(vehicleId);
        const associationRef = db
          .collection("taxiAssociations")
          .doc(associationId);
        const driverRef = db.collection("drivers").doc(driverId);
        const auditRef = db.collection("driverApplicationAudit").doc();
        const [freshApplicationSnapshot, vehicleSnapshot, associationSnapshot] =
          await Promise.all([
            transaction.get(applicationRef),
            transaction.get(vehicleRef),
            transaction.get(associationRef),
          ]);

        if (!freshApplicationSnapshot.exists) {
          throw new DriverApplicationActionError(
            "Driver application no longer exists.",
            409,
          );
        }
        if (!vehicleSnapshot.exists || !associationSnapshot.exists) {
          throw new DriverApplicationActionError(
            "The linked fleet vehicle and taxi association must exist.",
            409,
          );
        }

        const application = freshApplicationSnapshot.data() as Record<
          string,
          unknown
        >;
        const vehicle = vehicleSnapshot.data() as Record<string, unknown>;
        const association = associationSnapshot.data() as Record<
          string,
          unknown
        >;

        if (
          clean(application.uid, 128) !== applicationId ||
          application.status !== "pending"
        ) {
          throw new DriverApplicationActionError(
            "Driver application changed during review. Reload before approving.",
            409,
          );
        }
        assertCurrentDriverCredentials(application);
        assertActiveAssociation(association, application);
        assertDispatchReadyVehicle(
          vehicle,
          application,
          associationId,
          driverId,
        );

        const now = new Date().toISOString();
        transaction.set(
          driverRef,
          {
            fullName: clean(application.displayName, 120),
            displayName:
              clean(application.displayName, 120) ||
              user.displayName ||
              user.email ||
              "Driver",
            phone: clean(application.phone, 80),
            idHint: clean(application.taxiCommissionBadgeNumber, 80).slice(-4),
            availability: "offline",
            islands: [clean(application.island, 20)],
            vehicleId,
            associationId,
            verified: true,
            authorizationStatus: "active",
            taxiCommissionBadgeNumber: clean(
              application.taxiCommissionBadgeNumber,
              80,
            ),
            taxiCommissionBadgeExpiresAt: clean(
              application.taxiCommissionBadgeExpiresAt,
              40,
            ),
            licenseClass: clean(application.licenseClass, 40),
            licenseExpiresAt: clean(application.licenseExpiresAt, 40),
            onboardingApplicationId: applicationId,
            verifiedAt: now,
            verifiedBy: admin.uid,
            updatedAt: now,
          },
          { merge: true },
        );
        transaction.set(
          vehicleRef,
          { driverId, updatedAt: now },
          { merge: true },
        );
        transaction.set(
          applicationRef,
          {
            status: "approved",
            driverId,
            vehicleId,
            associationId,
            approvedAt: now,
            reviewedAt: now,
            reviewedBy: admin.uid,
            reviewedByEmail: admin.email ?? null,
            reviewNote: reviewNote || null,
            updatedAt: now,
            serverUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
        transaction.set(auditRef, {
          action: "approved",
          applicationId,
          driverId,
          vehicleId,
          associationId,
          actorUid: admin.uid,
          actorEmail: admin.email ?? null,
          previousStatus: "pending",
          nextStatus: "approved",
          reviewNote: reviewNote || null,
          createdAt: now,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      });
    } catch (writeError) {
      try {
        await adminAuth.setCustomUserClaims(user.uid, previousClaims);
        await adminAuth.revokeRefreshTokens(user.uid);
      } catch (rollbackError) {
        console.error("driver claim rollback failed", rollbackError);
      }
      throw writeError;
    }

    return NextResponse.json({
      ok: true,
      status: "approved",
      driverId,
      sessionRefreshRequired: true,
      message:
        "Driver access approved. Existing sessions were invalidated; the driver must sign in again before Driver OS unlocks.",
    });
  } catch (error) {
    if (error instanceof DriverApplicationActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("driver application review error", error);
    return NextResponse.json(
      { error: "Unable to review driver application." },
      { status: 500 },
    );
  }
}

function assertCurrentDriverCredentials(application: Record<string, unknown>) {
  if (
    !clean(application.taxiCommissionBadgeNumber, 80) ||
    !isFutureDate(application.taxiCommissionBadgeExpiresAt) ||
    !clean(application.licenseClass, 40) ||
    !isFutureDate(application.licenseExpiresAt)
  ) {
    throw new DriverApplicationActionError(
      "Driver credentials are missing or expired.",
      409,
    );
  }
}

function assertActiveAssociation(
  association: Record<string, unknown>,
  application: Record<string, unknown>,
) {
  const island = clean(application.island, 20);
  const islands = Array.isArray(association.islands)
    ? association.islands.map((value) => clean(value, 20)).filter(Boolean)
    : [];
  if (association.status !== "active" || !islands.includes(island)) {
    throw new DriverApplicationActionError(
      "Taxi association is not active for the applicant's island.",
      409,
    );
  }
}

function assertDispatchReadyVehicle(
  vehicle: Record<string, unknown>,
  application: Record<string, unknown>,
  associationId: string,
  driverId: string,
) {
  const island = clean(application.island, 20);
  const vehicleIslands = Array.isArray(vehicle.islands)
    ? vehicle.islands.map((value) => clean(value, 20)).filter(Boolean)
    : [];
  const applicantPlate = normalizePlate(application.taxiPlate);
  const fleetPlate = normalizePlate(vehicle.taxiPlate ?? vehicle.plate);
  if (
    vehicle.active !== true ||
    clean(vehicle.associationId, 128) !== associationId ||
    !vehicleIslands.includes(island) ||
    !fleetPlate ||
    fleetPlate !== applicantPlate ||
    !clean(vehicle.medallionNumber, 80) ||
    vehicle.inspectionStatus !== "active" ||
    !isFutureDate(vehicle.inspectionExpiresAt) ||
    vehicle.insuranceStatus !== "active" ||
    !isFutureDate(vehicle.insuranceExpiresAt)
  ) {
    throw new DriverApplicationActionError(
      "Fleet vehicle is not dispatch-ready or does not match the submitted taxi plate.",
      409,
    );
  }
  const assignedDriverId = clean(vehicle.driverId, 128);
  if (assignedDriverId && assignedDriverId !== driverId) {
    throw new DriverApplicationActionError(
      "Fleet vehicle is already assigned to another driver.",
      409,
    );
  }
}

function normalizePlate(value: unknown) {
  return clean(value, 80).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isFutureDate(value: unknown) {
  return (
    typeof value === "string" &&
    Number.isFinite(Date.parse(value)) &&
    Date.parse(value) > Date.now()
  );
}

function clean(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

class DriverApplicationActionError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
