import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requiredText } from "@/lib/taxi-tariff-governance";
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
      reason?: unknown;
      reviewReference?: unknown;
    };
    if (body.attested !== true) {
      return NextResponse.json(
        { error: "Administrator retirement attestation is required." },
        { status: 400 },
      );
    }
    const reason = requiredText(body.reason, "Retirement reason");
    const reviewReference = requiredText(
      body.reviewReference,
      "Retirement review reference",
    );

    const db = getAdminDb();
    const tariffRef = db.collection("taxiTariffs").doc(tariffId);
    const auditRef = db.collection("taxiTariffAudit").doc();
    let island = "";
    let version = "";

    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(tariffRef);
      if (!snapshot.exists) throw new Error("Tariff not found.");
      const tariff = {
        id: snapshot.id,
        ...snapshot.data(),
      } as OfficialTaxiTariff;

      if (tariff.status === "retired") {
        throw new Error("Tariff is already retired.");
      }

      island = tariff.island;
      version = tariff.version;

      transaction.update(tariffRef, {
        status: "retired",
        retiredAt: FieldValue.serverTimestamp(),
        retiredBy: session.uid,
        retirementReason: reason,
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(auditRef, {
        action: "tariff_retired",
        actorId: session.uid,
        tariffId,
        island: tariff.island,
        version: tariff.version,
        reason,
        reviewReference,
        previousStatus: tariff.status,
        createdAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({
      ok: true,
      tariffId,
      island,
      version,
      status: "retired",
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("retire taxi tariff error", error);
    const message =
      error instanceof Error ? error.message : "Unable to retire tariff.";
    const notFound = message === "Tariff not found.";
    return NextResponse.json(
      { error: message },
      { status: notFound ? 404 : 400 },
    );
  }
}
