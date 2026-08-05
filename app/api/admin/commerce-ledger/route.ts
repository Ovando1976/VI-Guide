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
  commerceRefundLedgerId,
  resolveCommerceLedgerPolicy,
  summarizeCommerceLedger,
  type CommerceLedgerEntry,
} from "@/lib/payments/commerce-ledger";
import {
  hasCommerceFinancialActivity,
  resolveStoredCommerceLedgerPolicy,
  summarizeCommerceLedgerListings,
  summarizeCommerceLedgerReconciliation,
} from "@/lib/payments/commerce-ledger-operations";
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
    const bookingRecords = bookingSnapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    }));

    return NextResponse.json({
      policy: resolveCommerceLedgerPolicy(
        process.env.VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS,
      ),
      summary: summarizeCommerceLedger(entries),
      reconciliation: summarizeCommerceLedgerReconciliation(
        bookingRecords,
        entries.map((entry) => entry.id),
      ),
      listings: summarizeCommerceLedgerListings(entries),
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
    const [bookingSnapshot, ledgerSnapshot] = await Promise.all([
      db
        .collection("commerceBookings")
        .orderBy("updatedAt", "desc")
        .limit(MAX_RECONCILE_BOOKINGS)
        .get(),
      db
        .collection("commerceLedgerEntries")
        .orderBy("occurredAt", "desc")
        .limit(MAX_LEDGER_ENTRIES)
        .get(),
    ]);
    const existingEntries = new Map(
      ledgerSnapshot.docs.map((document) => [
        document.id,
        serializeLedgerEntry(document.id, document.data()),
      ]),
    );

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
      const bookingRecord = { id: bookingDocument.id, ...booking };
      if (!hasCommerceFinancialActivity(bookingRecord)) continue;

      const paymentIntentId = clean(booking.paymentIntentId, 220);
      const checkoutSessionId = clean(booking.checkoutSessionId, 220);
      const paidAmountCents = positiveMoney(booking.paidAmountCents);
      const paidAt = validIso(booking.paidAt ?? booking.updatedAt);
      if (!paymentIntentId || !checkoutSessionId || !paidAmountCents || !paidAt) {
        skippedBookings += 1;
        continue;
      }

      const captureId = commerceCaptureLedgerId(paymentIntentId);
      let captureEntry = existingEntries.get(captureId) ?? null;
      if (!captureEntry) {
        captureEntry = buildCommerceCaptureLedgerEntry({
          bookingId: bookingDocument.id,
          bookingReference:
            clean(booking.reference, 180) || bookingDocument.id,
          listingId:
            clean(booking.listingId, 180) ||
            `unassigned-${bookingDocument.id}`,
          listingName:
            clean(booking.listingName, 220) || "VI Guide booking",
          paymentIntentId,
          checkoutSessionId,
          stripeEventId: `reconciliation-capture-${bookingDocument.id}`,
          grossAmountCents: paidAmountCents,
          currency: "usd",
          policy: resolveStoredCommerceLedgerPolicy(bookingRecord),
          verified: booking.paymentIntegrityStatus === "verified",
          occurredAt: paidAt,
        });
        if (!captureEntry) {
          skippedBookings += 1;
          continue;
        }

        batch.create(
          db.collection("commerceLedgerEntries").doc(captureEntry.id),
          {
            ...captureEntry,
            reconciliationSource: true,
            reconciledByUid: session.uid,
            reconciledByEmail: session.email ?? null,
            serverCreatedAt: FieldValue.serverTimestamp(),
            serverUpdatedAt: FieldValue.serverTimestamp(),
          },
        );
        existingEntries.set(captureEntry.id, captureEntry);
        batchWrites += 1;
        captureEntries += 1;
        if (captureEntry.status === "review_required") reviewedEntries += 1;
      }

      const now = new Date().toISOString();
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
        commerceLedgerUpdatedAt: now,
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
        refundUpdatedAt
      ) {
        const refundEntryId = commerceRefundLedgerId(refundId);
        let refundEntry = existingEntries.get(refundEntryId) ?? null;
        if (!refundEntry) {
          refundEntry = buildCommerceRefundLedgerEntry({
            bookingId: bookingDocument.id,
            bookingReference:
              clean(booking.reference, 180) || bookingDocument.id,
            listingId:
              clean(booking.listingId, 180) ||
              `unassigned-${bookingDocument.id}`,
            listingName:
              clean(booking.listingName, 220) || "VI Guide booking",
            paymentIntentId,
            checkoutSessionId,
            refundId,
            stripeEventId: `reconciliation-refund-${refundId}`,
            refundStatus:
              refundStatus === "processing" ? "pending" : refundStatus,
            refundAmountCents,
            currency: "usd",
            paymentIntentMatches:
              booking.paymentIntegrityStatus === "verified",
            fullRefund: refundAmountCents === paidAmountCents,
            captureEntryId: captureEntry.id,
            captureGrossAmountCents:
              captureEntry.status === "held"
                ? captureEntry.grossAmountCents
                : paidAmountCents,
            capturePlatformFeeCents: captureEntry.platformFeeCents,
            captureMerchantSettlementCents:
              captureEntry.status === "held"
                ? captureEntry.merchantSettlementCents
                : paidAmountCents,
            feeBps: captureEntry.feeBps,
            feePolicySource: captureEntry.feePolicySource,
            occurredAt: refundUpdatedAt,
          });

          if (refundEntry) {
            batch.create(
              db.collection("commerceLedgerEntries").doc(refundEntry.id),
              {
                ...refundEntry,
                reconciliationSource: true,
                reconciledByUid: session.uid,
                reconciledByEmail: session.email ?? null,
                serverCreatedAt: FieldValue.serverTimestamp(),
                serverUpdatedAt: FieldValue.serverTimestamp(),
              },
            );
            existingEntries.set(refundEntry.id, refundEntry);
            batchWrites += 1;
            refundEntries += 1;
            if (refundEntry.status === "review_required") reviewedEntries += 1;
          }
        }

        if (refundEntry) {
          bookingPatch.commerceLedgerLatestRefundId = refundEntry.id;
          bookingPatch.commerceLedgerLatestRefundStatus = refundEntry.status;
        }
      }

      batch.set(bookingDocument.ref, bookingPatch, { merge: true });
      batchWrites += 1;
      if (batchWrites >= MAX_BATCH_WRITES) await flushBatch();
    }

    batch.create(db.collection("commerceLedgerReconciliationAudit").doc(), {
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
