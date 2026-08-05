import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  buildCommerceCaptureLedgerEntry,
  buildCommerceRefundLedgerEntry,
  commerceCaptureLedgerId,
  resolveCommerceLedgerPolicy,
  summarizeCommerceLedger,
  type CommerceLedgerEntry,
  type CommerceLedgerPolicy,
} from "@/lib/payments/commerce-ledger";
import { normalizeTimestampOrEpoch } from "@/lib/timestamps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEDGER_ENTRIES = 500;
const MAX_RECONCILE_BOOKINGS = 250;
const MAX_BATCH_WRITES = 400;

export async function GET() {
  try {
    await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Commerce accounting is not configured on the server." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const [ledgerSnapshot, bookingSnapshot] = await Promise.all([
      db
        .collection("commerceLedgerEntries")
        .orderBy("occurredAt", "desc")
        .limit(MAX_LEDGER_ENTRIES)
        .get(),
      db
        .collection("commerceBookings")
        .orderBy("updatedAt", "desc")
        .limit(MAX_RECONCILE_BOOKINGS)
        .get(),
    ]);
    const entries = ledgerSnapshot.docs.map((document) =>
      serializeLedgerEntry(document.id, document.data()),
    );
    const summary = summarizeCommerceLedger(entries);
    const ledgerIds = new Set(entries.map((entry) => entry.id));
    const reconciliation = summarizeReconciliationGaps(
      bookingSnapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
      ledgerIds,
    );

    return NextResponse.json({
      policy: resolveCommerceLedgerPolicy(
        process.env.VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS,
      ),
      summary,
      reconciliation,
      listings: summarizeListings(entries),
      entries,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce ledger list error", error);
    return NextResponse.json(
      { error: "Unable to load commerce accounting." },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Commerce accounting is not configured on the server." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const bookingSnapshot = await db
      .collection("commerceBookings")
      .orderBy("updatedAt", "desc")
      .limit(MAX_RECONCILE_BOOKINGS)
      .get();

    let batch = db.batch();
    let batchWrites = 0;
    let captureEntries = 0;
    let refundEntries = 0;
    let reviewedEntries = 0;
    let skippedBookings = 0;

    async function flushBatch() {
      if (!batchWrites) return;
      await batch.commit();
      batch = db.batch();
      batchWrites = 0;
    }

    for (const bookingDocument of bookingSnapshot.docs) {
      const booking = bookingDocument.data();
      if (!hasFinancialActivity(booking)) continue;

      const paymentIntentId = clean(booking.paymentIntentId, 220);
      const checkoutSessionId = clean(booking.checkoutSessionId, 220);
      const paidAmountCents = positiveMoney(booking.paidAmountCents);
      const paidAt = validIso(booking.paidAt ?? booking.updatedAt);
      if (!paymentIntentId || !checkoutSessionId || !paidAmountCents || !paidAt) {
        skippedBookings += 1;
        continue;
      }

      const policy = storedPolicy(booking);
      const captureEntry = buildCommerceCaptureLedgerEntry({
        bookingId: bookingDocument.id,
        bookingReference: clean(booking.reference, 180) || bookingDocument.id,
        listingId:
          clean(booking.listingId, 180) || `unassigned-${bookingDocument.id}`,
        listingName: clean(booking.listingName, 220) || "VI Guide booking",
        paymentIntentId,
        checkoutSessionId,
        stripeEventId: `reconciliation-capture-${bookingDocument.id}`,
        grossAmountCents: paidAmountCents,
        currency: "usd",
        policy,
        verified: booking.paymentIntegrityStatus === "verified",
        occurredAt: paidAt,
      });
      if (!captureEntry) {
        skippedBookings += 1;
        continue;
      }

      batch.set(
        db.collection("commerceLedgerEntries").doc(captureEntry.id),
        {
          ...captureEntry,
          reconciliationSource: true,
          reconciledByUid: session.uid,
          reconciledByEmail: session.email ?? null,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batchWrites += 1;
      captureEntries += 1;
      if (captureEntry.status === "review_required") reviewedEntries += 1;

      const bookingPatch: Record<string, unknown> = {
        commerceLedgerCaptureId: captureEntry.id,
        commerceLedgerCaptureStatus: captureEntry.status,
        commerceGrossAmountCents: captureEntry.grossAmountCents,
        commercePlatformFeeCents: captureEntry.platformFeeCents,
        commerceMerchantSettlementCents:
          captureEntry.merchantSettlementCents,
        commerceUnallocatedAmountCents: captureEntry.unallocatedAmountCents,
        commercePlatformFeeBps: captureEntry.feeBps,
        commerceFeePolicySource: captureEntry.feePolicySource,
        commerceLedgerUpdatedAt: new Date().toISOString(),
      };

      const refundId = clean(booking.refundId, 220);
      const refundStatus = normalizeRefundStatus(booking.refundStatus);
      const refundAmountCents = positiveMoney(booking.refundAmountCents);
      const refundUpdatedAt = validIso(
        booking.refundUpdatedAt ?? booking.updatedAt,
      );

      if (
        refundId &&
        refundStatus !== "not_requested" &&
        refundAmountCents &&
        refundUpdatedAt &&
        captureEntry.status === "held"
      ) {
        const refundEntry = buildCommerceRefundLedgerEntry({
          bookingId: bookingDocument.id,
          bookingReference:
            clean(booking.reference, 180) || bookingDocument.id,
          listingId:
            clean(booking.listingId, 180) ||
            `unassigned-${bookingDocument.id}`,
          listingName: clean(booking.listingName, 220) || "VI Guide booking",
          paymentIntentId,
          checkoutSessionId,
          refundId,
          stripeEventId: `reconciliation-refund-${refundId}`,
          refundStatus:
            refundStatus === "processing" ? "pending" : refundStatus,
          refundAmountCents,
          currency: "usd",
          paymentIntentMatches: true,
          fullRefund: refundAmountCents === paidAmountCents,
          captureEntryId: captureEntry.id,
          captureGrossAmountCents: captureEntry.grossAmountCents,
          capturePlatformFeeCents: captureEntry.platformFeeCents,
          captureMerchantSettlementCents:
            captureEntry.merchantSettlementCents,
          feeBps: captureEntry.feeBps,
          feePolicySource: captureEntry.feePolicySource,
          occurredAt: refundUpdatedAt,
        });

        if (refundEntry) {
          batch.set(
            db.collection("commerceLedgerEntries").doc(refundEntry.id),
            {
              ...refundEntry,
              reconciliationSource: true,
              reconciledByUid: session.uid,
              reconciledByEmail: session.email ?? null,
              serverUpdatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true },
          );
          batchWrites += 1;
          refundEntries += 1;
          if (refundEntry.status === "review_required") reviewedEntries += 1;
          bookingPatch.commerceLedgerLatestRefundId = refundEntry.id;
          bookingPatch.commerceLedgerLatestRefundStatus = refundEntry.status;
        }
      }

      batch.set(bookingDocument.ref, bookingPatch, { merge: true });
      batchWrites += 1;

      if (batchWrites >= MAX_BATCH_WRITES) await flushBatch();
    }

    const auditRef = db.collection("commerceLedgerReconciliationAudit").doc();
    batch.set(auditRef, {
      actorUid: session.uid,
      actorEmail: session.email ?? null,
      scannedBookings: bookingSnapshot.size,
      captureEntries,
      refundEntries,
      reviewedEntries,
      skippedBookings,
      createdAt: new Date().toISOString(),
      serverCreatedAt: FieldValue.serverTimestamp(),
    });
    batchWrites += 1;
    await flushBatch();

    return NextResponse.json({
      ok: true,
      scannedBookings: bookingSnapshot.size,
      captureEntries,
      refundEntries,
      reviewedEntries,
      skippedBookings,
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce ledger reconciliation error", error);
    return NextResponse.json(
      { error: "Unable to reconcile commerce accounting." },
      { status: 500 },
    );
  }
}

function serializeLedgerEntry(
  id: string,
  data: FirebaseFirestore.DocumentData,
): CommerceLedgerEntry {
  return {
    id,
    kind: data.kind === "refund" ? "refund" : "capture",
    status: normalizeLedgerStatus(data.status),
    bookingId: clean(data.bookingId, 180),
    bookingReference: clean(data.bookingReference, 180),
    listingId: clean(data.listingId, 180),
    listingName: clean(data.listingName, 220) || "VI Guide business",
    paymentIntentId: clean(data.paymentIntentId, 220),
    checkoutSessionId: clean(data.checkoutSessionId, 220) || null,
    refundId: clean(data.refundId, 220) || null,
    reversalOfEntryId: clean(data.reversalOfEntryId, 100) || null,
    stripeEventId: clean(data.stripeEventId, 220),
    currency: clean(data.currency, 3).toLowerCase() || "usd",
    feeBps: nonNegativeMoney(data.feeBps),
    feePolicySource:
      data.feePolicySource === "environment"
        ? "environment"
        : "unconfigured",
    grossAmountCents: signedMoney(data.grossAmountCents),
    platformFeeCents: signedMoney(data.platformFeeCents),
    merchantSettlementCents: signedMoney(data.merchantSettlementCents),
    reportedRefundAmountCents:
      data.reportedRefundAmountCents === null ||
      data.reportedRefundAmountCents === undefined
        ? null
        : nonNegativeMoney(data.reportedRefundAmountCents),
    unallocatedAmountCents: signedMoney(data.unallocatedAmountCents),
    occurredAt: normalizeTimestampOrEpoch(data.occurredAt),
    createdAt: normalizeTimestampOrEpoch(
      data.createdAt ?? data.serverCreatedAt,
    ),
    updatedAt: normalizeTimestampOrEpoch(
      data.updatedAt ?? data.serverUpdatedAt ?? data.createdAt,
    ),
  };
}

function summarizeListings(entries: CommerceLedgerEntry[]) {
  const listings = new Map<
    string,
    {
      listingId: string;
      listingName: string;
      captures: number;
      refunds: number;
      grossCents: number;
      platformFeeCents: number;
      merchantSettlementCents: number;
      reviewCount: number;
      latestAt: string;
    }
  >();

  for (const entry of entries) {
    const key = entry.listingId || "unassigned";
    const current = listings.get(key) ?? {
      listingId: key,
      listingName: entry.listingName || "VI Guide business",
      captures: 0,
      refunds: 0,
      grossCents: 0,
      platformFeeCents: 0,
      merchantSettlementCents: 0,
      reviewCount: 0,
      latestAt: "",
    };
    if (entry.kind === "capture") current.captures += 1;
    if (entry.kind === "refund") current.refunds += 1;
    current.grossCents += entry.grossAmountCents;
    current.platformFeeCents += entry.platformFeeCents;
    current.merchantSettlementCents += entry.merchantSettlementCents;
    if (entry.status === "review_required") current.reviewCount += 1;
    if (entry.occurredAt > current.latestAt) current.latestAt = entry.occurredAt;
    listings.set(key, current);
  }

  return [...listings.values()].sort(
    (left, right) =>
      right.merchantSettlementCents - left.merchantSettlementCents,
  );
}

function summarizeReconciliationGaps(
  bookings: Array<{ id: string; data: FirebaseFirestore.DocumentData }>,
  ledgerIds: Set<string>,
) {
  let financialBookings = 0;
  let missingCaptureEntries = 0;
  let reviewRequiredBookings = 0;

  for (const booking of bookings) {
    if (!hasFinancialActivity(booking.data)) continue;
    financialBookings += 1;
    const paymentIntentId = clean(booking.data.paymentIntentId, 220);
    const captureId = commerceCaptureLedgerId(paymentIntentId);
    if (captureId && !ledgerIds.has(captureId)) missingCaptureEntries += 1;
    if (
      booking.data.paymentIntegrityStatus === "review_required" ||
      booking.data.refundStatus === "review_required"
    ) {
      reviewRequiredBookings += 1;
    }
  }

  return {
    scannedBookings: bookings.length,
    financialBookings,
    missingCaptureEntries,
    reviewRequiredBookings,
  };
}

function storedPolicy(
  booking: FirebaseFirestore.DocumentData,
): CommerceLedgerPolicy {
  const hasStoredFee = Object.prototype.hasOwnProperty.call(
    booking,
    "commercePlatformFeeBps",
  );
  if (!hasStoredFee) return { feeBps: 0, source: "unconfigured" };

  const policy = resolveCommerceLedgerPolicy(booking.commercePlatformFeeBps);
  return {
    feeBps: policy.feeBps,
    source:
      booking.commerceFeePolicySource === "environment"
        ? "environment"
        : "unconfigured",
  };
}

function hasFinancialActivity(data: FirebaseFirestore.DocumentData) {
  return (
    Boolean(clean(data.paymentIntentId, 220)) &&
    ["paid", "refund_pending", "refunded", "refund_failed"].includes(
      clean(data.paymentStatus, 40),
    )
  );
}

function normalizeLedgerStatus(value: unknown) {
  return value === "posted" ||
    value === "processing" ||
    value === "review_required" ||
    value === "failed"
    ? value
    : "held";
}

function normalizeRefundStatus(value: unknown) {
  return value === "processing" ||
    value === "succeeded" ||
    value === "failed" ||
    value === "review_required"
    ? value
    : "not_requested";
}

function validIso(value: unknown) {
  if (typeof value !== "string") return "";
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
}

function positiveMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount > 0 ? amount : 0;
}

function nonNegativeMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) && amount >= 0 ? amount : 0;
}

function signedMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : 0;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
