import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  normalizeTariffDraft,
  requiredText,
} from "@/lib/taxi-tariff-governance";
import type { OfficialTaxiTariff } from "@/types/taxi-operations";

export async function POST(
  request: NextRequest,
  { params }: { params: { tariffId: string } },
) {
  try {
    const session = await requireSession(["admin"]);
    const tariffId = params.tariffId.trim();
    if (!tariffId) {
      return NextResponse.json(
        { error: "Tariff ID is required." },
        { status: 400 },
      );
    }

    const body = (await request.json()) as {
      attested?: boolean;
      reviewReference?: unknown;
    };
    if (body.attested !== true) {
      return NextResponse.json(
        { error: "Administrator activation attestation is required." },
        { status: 400 },
      );
    }
    const reviewReference = requiredText(
      body.reviewReference,
      "Activation review reference",
    );

    const db = getAdminDb();
    const tariffRef = db.collection("taxiTariffs").doc(tariffId);
    const auditRef = db.collection("taxiTariffAudit").doc();
    let island = "";
    let version = "";
    let retiredTariffIds: string[] = [];

    await db.runTransaction(async (transaction) => {
      const tariffSnapshot = await transaction.get(tariffRef);
      if (!tariffSnapshot.exists) throw new Error("Tariff not found.");

      const tariff = {
        id: tariffSnapshot.id,
        ...tariffSnapshot.data(),
      } as OfficialTaxiTariff;
      normalizeTariffDraft(tariff);
      if (!tariff.reviewReference || !tariff.reviewedBy) {
        throw new Error(
          "Tariff must be imported through the reviewed draft workflow before activation.",
        );
      }
      if (tariff.issuingAuthority !== "Virgin Islands Taxicab Commission") {
        throw new Error(
          "Tariff issuing authority must be the Virgin Islands Taxicab Commission.",
        );
      }
      if (tariff.currency !== "USD") {
        throw new Error("Tariff currency must be USD.");
      }
      if (Date.parse(tariff.effectiveAt) > Date.now()) {
        throw new Error(
          "A future-effective tariff cannot replace the currently effective tariff.",
        );
      }

      island = tariff.island;
      version = tariff.version;

      const activeSnapshot = await transaction.get(
        db
          .collection("taxiTariffs")
          .where("island", "==", tariff.island)
          .where("status", "==", "active"),
      );
      retiredTariffIds = activeSnapshot.docs
        .filter((document) => document.id !== tariffId)
        .map((document) => document.id);

      for (const document of activeSnapshot.docs) {
        if (document.id === tariffId) continue;
        transaction.update(document.ref, {
          status: "retired",
          retiredAt: FieldValue.serverTimestamp(),
          retiredBy: session.uid,
          retirementReason: `Superseded by tariff ${tariffId}.`,
          supersededByTariffId: tariffId,
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(tariffRef, {
        status: "active",
        activationStatus: "verified",
        activatedAt: FieldValue.serverTimestamp(),
        activatedBy: session.uid,
        activationReviewReference: reviewReference,
        retiredAt: FieldValue.delete(),
        retiredBy: FieldValue.delete(),
        retirementReason: FieldValue.delete(),
        supersededByTariffId: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(auditRef, {
        action: "tariff_activated",
        actorId: session.uid,
        tariffId,
        island: tariff.island,
        version: tariff.version,
        sourceReviewReference: tariff.reviewReference,
        activationReviewReference: reviewReference,
        retiredTariffIds,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      ok: true,
      tariffId,
      island,
      version,
      status: "active",
      activationStatus: "verified",
      retiredTariffIds,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("activate taxi tariff error", error);
    const message =
      error instanceof Error ? error.message : "Unable to activate tariff.";
    const notFound = message === "Tariff not found.";
    return NextResponse.json(
      { error: message },
      { status: notFound ? 404 : 400 },
    );
  }
}
