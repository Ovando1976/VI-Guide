import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import { getAdminDb } from "@/lib/firebase-admin";
import { dollarsToCents } from "@/lib/settlement-payment-evidence";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";
import type { RideBooking } from "@/types/mobility";

const SETTLEMENT_STATUSES = [
  "pending_review",
  "held",
  "approved",
  "paid",
  "void",
  "failed",
] as const;

export async function GET() {
  try {
    await requireSession(["admin", "dispatcher"]);

    const snapshot = await getAdminDb()
      .collection("bookings")
      .where("settlement.status", "in", [...SETTLEMENT_STATUSES])
      .limit(250)
      .get();

    const settlements = snapshot.docs
      .map((document) =>
        serializeSettlement({
          id: document.id,
          ...document.data(),
        } as RideBooking),
      )
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));

    return NextResponse.json({
      ok: true,
      moneyMovedByViGuide: false,
      settlements,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error("settlement ledger error", error);
    return NextResponse.json(
      { error: "Unable to load the settlement ledger." },
      { status: 500 },
    );
  }
}

function serializeSettlement(booking: RideBooking) {
  const settlement = booking.settlement!;
  return {
    id: booking.id,
    status: settlement.status,
    island: booking.island,
    mode: booking.mode,
    driverId: booking.driverId ?? null,
    associationId: booking.associationId ?? null,
    origin: booking.origin?.estateName ?? "Pickup",
    destination: booking.destination?.estateName ?? "Destination",
    grossFare: Number(settlement.grossFare ?? 0),
    serviceFee: Number(settlement.serviceFee ?? 0),
    operatorSettlement: Number(settlement.operatorSettlement ?? 0),
    operatorSettlementCents: dollarsToCents(settlement.operatorSettlement),
    feeAgreementId: settlement.feeAgreementId ?? null,
    holdReason: settlement.holdReason ?? null,
    reviewReference: settlement.reviewReference ?? null,
    approvedBy: settlement.approvedBy ?? null,
    approvedAt: normalizeTimestampOrEpoch(settlement.approvedAt),
    paidAmountCents: settlement.paidAmountCents ?? null,
    externalPaymentReference: settlement.externalPaymentReference ?? null,
    externalPaymentMethod: settlement.externalPaymentMethod ?? null,
    paymentNote: settlement.paymentNote ?? null,
    paidBy: settlement.paidBy ?? null,
    paidAt: normalizeTimestampOrEpoch(settlement.paidAt),
    completedAt: normalizeTimestampOrEpoch(booking.completedAt),
    createdAt: normalizeTimestampOrEpoch(booking.createdAt),
    updatedAt: normalizeTimestampOrEpoch(booking.updatedAt),
  };
}
