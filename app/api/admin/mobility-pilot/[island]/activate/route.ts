import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  buildMobilityPilotGateReport,
  MOBILITY_PILOT_ISLANDS,
} from "@/lib/mobility-pilot-readiness";
import { requiredText } from "@/lib/taxi-tariff-governance";
import type { IslandCode } from "@/types/usvi";

export async function POST(
  request: NextRequest,
  { params }: { params: { island: string } },
) {
  try {
    const session = await requireSession(["admin"]);
    const island = params.island.trim() as IslandCode;
    if (!MOBILITY_PILOT_ISLANDS.includes(island)) {
      return NextResponse.json(
        { error: "Pilot island is invalid." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      attested?: boolean;
      reviewReference?: unknown;
    };
    if (body.attested !== true) {
      return NextResponse.json(
        { error: "Administrator pilot activation attestation is required." },
        { status: 400 },
      );
    }
    const reviewReference = requiredText(
      body.reviewReference,
      "Pilot activation review reference",
    );

    const report = await buildMobilityPilotGateReport(island);
    if (!report.ready) {
      return NextResponse.json(
        {
          error:
            "This island cannot be activated until every live readiness gate passes.",
          code: "PILOT_READINESS_FAILED",
          report,
        },
        { status: 409 },
      );
    }

    const db = getAdminDb();
    const controlRef = db.collection("mobilityPilotIslands").doc(island);
    const auditRef = db.collection("mobilityPilotAudit").doc();
    const batch = db.batch();
    batch.set(
      controlRef,
      {
        island,
        status: "active",
        activationAuditId: auditRef.id,
        activatedAt: FieldValue.serverTimestamp(),
        activatedBy: session.uid,
        activationReviewReference: reviewReference,
        gateSnapshot: report,
        deactivatedAt: FieldValue.delete(),
        deactivatedBy: FieldValue.delete(),
        deactivationReason: FieldValue.delete(),
        deactivationReviewReference: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(auditRef, {
      action: "mobility_pilot_activated",
      auditId: auditRef.id,
      actorId: session.uid,
      island,
      reviewReference,
      tariffId: report.tariff.tariffId,
      tariffVersion: report.tariff.version,
      associationIds: report.association.associationIds,
      eligibleFleetPairs: report.fleet.eligiblePairs,
      gateSnapshot: report,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({
      ok: true,
      island,
      status: "active",
      activationAuditId: auditRef.id,
      report,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("mobility pilot activation error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to activate mobility pilot.",
      },
      { status: 400 },
    );
  }
}
