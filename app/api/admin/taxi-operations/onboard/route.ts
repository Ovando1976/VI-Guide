import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import type { IslandCode } from "@/types/usvi";

const ISLANDS: IslandCode[] = ["stt", "stj", "stx"];

type OnboardingBody = {
  attested?: boolean;
  reviewReference?: string;
  associationId?: string;
  associationName?: string;
  associationRegistrationId?: string;
  islands?: IslandCode[];
  driverUid?: string;
  driverName?: string;
  driverPhone?: string;
  badgeNumber?: string;
  badgeExpiresAt?: string;
  licenseClass?: string;
  licenseExpiresAt?: string;
  make?: string;
  model?: string;
  color?: string;
  taxiPlate?: string;
  medallionNumber?: string;
  passengerCapacity?: number;
  luggageCapacity?: number;
  inspectionExpiresAt?: string;
  insuranceExpiresAt?: string;
};

function required(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${label} is required.`);
  return value.trim();
}

function futureDate(value: unknown, label: string) {
  const normalized = required(value, label);
  const timestamp = new Date(normalized).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= Date.now()) throw new Error(`${label} must be a future date.`);
  return normalized;
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    const body = (await request.json()) as OnboardingBody;
    if (body.attested !== true) return NextResponse.json({ error: "Administrator attestation is required." }, { status: 400 });
    const islands = Array.from(new Set(body.islands ?? [])).filter((value): value is IslandCode => ISLANDS.includes(value));
    if (!islands.length) return NextResponse.json({ error: "At least one operating island is required." }, { status: 400 });

    const db = getAdminDb();
    const associationRef = body.associationId
      ? db.collection("taxiAssociations").doc(body.associationId)
      : db.collection("taxiAssociations").doc();
    const driverUid = required(body.driverUid, "Driver authentication UID");
    const driverRef = db.collection("drivers").doc(driverUid);
    const vehicleRef = db.collection("vehicles").doc();
    const auditRef = db.collection("taxiOperationsAudit").doc();
    const reviewReference = required(body.reviewReference, "Review reference");

    const association = {
      name: required(body.associationName, "Association name"),
      commissionRegistrationId: required(body.associationRegistrationId, "Association registration ID"),
      islands,
      status: "active",
      reviewedBy: session.uid,
      reviewReference,
      updatedAt: FieldValue.serverTimestamp(),
      ...(!body.associationId ? { createdAt: FieldValue.serverTimestamp() } : {}),
    };
    const driver = {
      fullName: required(body.driverName, "Driver name"),
      displayName: required(body.driverName, "Driver name"),
      phone: required(body.driverPhone, "Driver phone"),
      islands,
      verified: true,
      authorizationStatus: "active",
      taxiCommissionBadgeNumber: required(body.badgeNumber, "Commission badge number"),
      taxiCommissionBadgeExpiresAt: futureDate(body.badgeExpiresAt, "Commission badge expiration"),
      licenseClass: required(body.licenseClass, "License class"),
      licenseExpiresAt: futureDate(body.licenseExpiresAt, "License expiration"),
      associationId: associationRef.id,
      vehicleId: vehicleRef.id,
      availability: "offline",
      airportCertified: false,
      ferryCertified: false,
      rating: 0,
      completedTrips: 0,
      reliabilityScore: 100,
      reviewedBy: session.uid,
      reviewReference,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    const vehicle = {
      driverId: driverUid,
      associationId: associationRef.id,
      islands,
      make: required(body.make, "Vehicle make"),
      model: required(body.model, "Vehicle model"),
      color: required(body.color, "Vehicle color"),
      taxiPlate: required(body.taxiPlate, "Taxi plate"),
      plate: required(body.taxiPlate, "Taxi plate"),
      medallionNumber: required(body.medallionNumber, "Medallion number"),
      capacity: Math.max(1, Math.trunc(Number(body.passengerCapacity || 0))),
      luggageCapacity: Math.max(0, Math.trunc(Number(body.luggageCapacity || 0))),
      inspectionStatus: "active",
      inspectionExpiresAt: futureDate(body.inspectionExpiresAt, "Inspection expiration"),
      insuranceStatus: "active",
      insuranceExpiresAt: futureDate(body.insuranceExpiresAt, "Insurance expiration"),
      active: true,
      reviewedBy: session.uid,
      reviewReference,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    if (vehicle.capacity < 1) return NextResponse.json({ error: "Passenger capacity is required." }, { status: 400 });

    const batch = db.batch();
    batch.set(associationRef, association, { merge: true });
    batch.set(driverRef, driver, { merge: false });
    batch.set(vehicleRef, vehicle);
    batch.set(auditRef, {
      action: "reviewed_operator_onboarded",
      actorId: session.uid,
      associationId: associationRef.id,
      driverId: driverUid,
      vehicleId: vehicleRef.id,
      reviewReference,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({ ok: true, associationId: associationRef.id, driverId: driverUid, vehicleId: vehicleRef.id });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("taxi operator onboarding error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to onboard operator." }, { status: 400 });
  }
}

