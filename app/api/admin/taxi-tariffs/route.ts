import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import {
  normalizeTariffDraft,
  requiredText,
} from "@/lib/taxi-tariff-governance";
import type { OfficialTaxiTariff } from "@/types/taxi-operations";
import { normalizeTimestamp } from "@/lib/timestamps";

const DUPLICATE_VERSION_ERROR =
  "A tariff with this island and version already exists. Use a new version identifier for every revision.";

export async function GET() {
  try {
    await requireSession(["admin"]);
    const snapshot = await getAdminDb().collection("taxiTariffs").get();
    const tariffs = snapshot.docs
      .map((document) =>
        serializeTariff({
          id: document.id,
          ...document.data(),
        } as OfficialTaxiTariff),
      )
      .sort((a, b) => {
        if (a.island !== b.island) return a.island.localeCompare(b.island);
        return safeTimestamp(b.effectiveAt) - safeTimestamp(a.effectiveAt);
      });

    return NextResponse.json({ ok: true, tariffs });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("list taxi tariffs error", error);
    return NextResponse.json(
      { error: "Unable to load taxi tariffs." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    const body = (await request.json()) as {
      attested?: boolean;
      reviewReference?: unknown;
      title?: unknown;
      version?: unknown;
      island?: unknown;
      effectiveAt?: unknown;
      sourceUrl?: unknown;
      rules?: unknown;
    };

    if (body.attested !== true) {
      return NextResponse.json(
        { error: "Administrator source-review attestation is required." },
        { status: 400 },
      );
    }

    const reviewReference = requiredText(
      body.reviewReference,
      "Review reference",
    );
    const tariff = normalizeTariffDraft(body);
    const db = getAdminDb();
    const tariffRef = db.collection("taxiTariffs").doc();
    const auditRef = db.collection("taxiTariffAudit").doc();

    await db.runTransaction(async (transaction) => {
      const duplicateSnapshot = await transaction.get(
        db
          .collection("taxiTariffs")
          .where("island", "==", tariff.island)
          .where("version", "==", tariff.version)
          .limit(1),
      );
      if (!duplicateSnapshot.empty) throw new Error(DUPLICATE_VERSION_ERROR);

      transaction.set(tariffRef, {
        ...tariff,
        status: "draft",
        activationStatus: "unverified",
        reviewReference,
        reviewedBy: session.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(auditRef, {
        action: "tariff_draft_created",
        actorId: session.uid,
        tariffId: tariffRef.id,
        island: tariff.island,
        version: tariff.version,
        reviewReference,
        ruleCount: tariff.rules.length,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json(
      {
        ok: true,
        tariffId: tariffRef.id,
        status: "draft",
      },
      { status: 201 },
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("create taxi tariff draft error", error);
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create taxi tariff draft.";
    return NextResponse.json(
      { error: message },
      { status: message === DUPLICATE_VERSION_ERROR ? 409 : 400 },
    );
  }
}

function serializeTariff(tariff: OfficialTaxiTariff): OfficialTaxiTariff {
  return {
    ...tariff,
    activatedAt: normalizeTimestamp(tariff.activatedAt),
    retiredAt: normalizeTimestamp(tariff.retiredAt),
    createdAt: normalizeTimestamp(tariff.createdAt),
    updatedAt: normalizeTimestamp(tariff.updatedAt),
  };
}

function safeTimestamp(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}
