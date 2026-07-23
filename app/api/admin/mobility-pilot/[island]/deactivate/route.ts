import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { MOBILITY_PILOT_ISLANDS } from "@/lib/mobility-pilot-readiness";
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
      reason?: unknown;
      reviewReference?: unknown;
    };
    if (body.attested !== true) {
      return NextResponse.json(
        { error: "Administrator pilot deactivation attestation is required." },
        { status: 400 },
      );
    }
    const reason = requiredText(body.reason, "Pilot deactivation reason");
    const reviewReference = requiredText(
      body.reviewReference,
      "Pilot deactivation review reference",
    );

    const db = getAdminDb();
    const controlRef = db.collection("mobilityPilotIslands").doc(island);
    const auditRef = db.collection("mobilityPilotAudit").doc();
    const batch = db.batch();
    batch.set(
      controlRef,
      {
        island,
        status: "inactive",
        deactivatedAt: FieldValue.serverTimestamp(),
        deactivatedBy: session.uid,
        deactivationReason: reason,
        deactivationReviewReference: reviewReference,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    batch.set(auditRef, {
      action: "mobility_pilot_deactivated",
      actorId: session.uid,
      island,
      reason,
      reviewReference,
      createdAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({ ok: true, island, status: "inactive" });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("mobility pilot deactivation error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to deactivate mobility pilot.",
      },
      { status: 400 },
    );
  }
}
