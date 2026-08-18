import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  normalizeTariffDraft,
  requiredText,
} from "@/lib/taxi-tariff-governance";
import type { OfficialTaxiTariff } from "@/types/taxi-operations";

const DUPLICATE_VERSION_ERROR =
  "A tariff with this island and version already exists. Use a new version identifier for every revision.";

export async function POST(
  request: NextRequest,
  { params }: { params: { tariffId: string } },
) {
  try {
    const session = await requireSession(["admin"]);
    const sourceTariffId = params.tariffId.trim();
    if (!sourceTariffId) {
      return NextResponse.json({ error: "Tariff ID is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      attested?: boolean;
      reviewReference?: unknown;
      version?: unknown;
    };
    if (body.attested !== true) {
      return NextResponse.json(
        { error: "Administrator source-review attestation is required." },
        { status: 400 },
      );
    }

    const reviewReference = requiredText(
      body.reviewReference,
      "Source review reference",
    );
    const version = requiredText(body.version, "Reviewed draft version");

    const db = getAdminDb();
    const sourceRef = db.collection("taxiTariffs").doc(sourceTariffId);
    const draftRef = db.collection("taxiTariffs").doc();
    const auditRef = db.collection("taxiTariffAudit").doc();

    let island = "";
    let ruleCount = 0;

    await db.runTransaction(async (transaction) => {
      const sourceSnapshot = await transaction.get(sourceRef);
      if (!sourceSnapshot.exists) throw new Error("Tariff not found.");

      const source = {
        id: sourceSnapshot.id,
        ...sourceSnapshot.data(),
      } as OfficialTaxiTariff;

      if (source.reviewReference && source.reviewedBy) {
        throw new Error(
          "This tariff already belongs to the reviewed workflow. Activate or revise that governed version instead.",
        );
      }
      if (!source.sourceUrl) {
        throw new Error(
          "Legacy tariff has no official source URL. Add or import a source-backed tariff instead of promoting this record.",
        );
      }
      if (!Array.isArray(source.rules) || source.rules.length === 0) {
        throw new Error("Legacy tariff has no route rules to promote.");
      }

      const normalized = normalizeTariffDraft({
        title: source.title,
        version,
        island: source.island,
        effectiveAt: source.effectiveAt,
        sourceUrl: source.sourceUrl,
        rules: source.rules,
      });

      const duplicateSnapshot = await transaction.get(
        db
          .collection("taxiTariffs")
          .where("island", "==", normalized.island)
          .where("version", "==", normalized.version)
          .limit(1),
      );
      if (!duplicateSnapshot.empty) throw new Error(DUPLICATE_VERSION_ERROR);

      island = normalized.island;
      ruleCount = normalized.rules.length;

      transaction.set(draftRef, {
        ...normalized,
        status: "draft",
        activationStatus: "unverified",
        reviewReference,
        reviewedBy: session.uid,
        promotedFromTariffId: sourceTariffId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(auditRef, {
        action: "tariff_legacy_promoted_to_draft",
        actorId: session.uid,
        sourceTariffId,
        tariffId: draftRef.id,
        island: normalized.island,
        version: normalized.version,
        reviewReference,
        ruleCount,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json(
      {
        ok: true,
        tariffId: draftRef.id,
        sourceTariffId,
        island,
        version,
        ruleCount,
        status: "draft",
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("promote legacy taxi tariff error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to promote legacy tariff into a reviewed draft.";
    return NextResponse.json(
      { error: message },
      { status: message === DUPLICATE_VERSION_ERROR ? 409 : message === "Tariff not found." ? 404 : 400 },
    );
  }
}
