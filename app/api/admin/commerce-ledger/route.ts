import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { resolveStoredCommerceCaptureEntry } from "@/lib/payments/commerce-ledger-firestore";
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
  normalizeStoredCommerceLedgerEntry,
  resolveStoredCommerceLedgerPolicy,
  summarizeCommerceLedgerListings,
  summarizeCommerceLedgerReconciliation,
  validateStoredCommerceLedgerEntries,
} from "@/lib/payments/commerce-ledger-operations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
      db.collection("commerceLedgerEntries").get(),
      db
        .collection("commerceBookings")
        .orderBy("updatedAt", "desc")
        .limit(MAX_RECONCILE_BOOKINGS)
        .get(),
    ]);
    const validation = validateStoredCommerceLedgerEntries(
      ledgerSnapshot.docs.map((document) => ({
        id: document.id,
        data: document.data(),
      })),
    );
    const entries = validation.entries.sort((left, right) =>
      right.occurredAt.localeCompare(left.occurredAt),
    );
    const bookingRecords = bookingSnapshot.docs.map((document) => ({
      ...document.data(),
      id: document.id,
    }));

    return NextResponse.json({
      policy: resolveCommerceLedgerPolicy(
        process.env.VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS,
      ),
      summary: summarizeCommerceLedger(entries),
      ledgerValidation: {
        totalRecords: ledgerSnapshot.size,
        validatedRecords: entries.length,
        rejectedRecordCount: validation.rejectedRecordCount,
      },
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
    const bookingSnapshot = await db
      .collection("commerceBookings")
      .orderBy("updatedAt", "desc")
      .limit(MAX_RECONCILE_BOOKINGS)
      .get();
    const existingLedgerData = await loadExactLedgerDocuments(
      db,
      bookingSnapshot.docs,
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
      const bookingRecord = { ...booking, id: bookingDocument.id };
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
      const storedCaptureData = existingLedgerData.get(captureId) ?? null;
      let captureEntry = storedCaptureData
        ? resolveStoredCommerceCaptureEntry({
            id: captureId,
            data: storedCaptureData,
            expectedPaymentIntentId: paymentIntentId,
            expectedGrossAmountCents: paidAmountCents,
          })
        : null;

      if (storedCaptureData && !captureEntry) {
        reviewedEntries += 1;
        skippedBookings += 1;
        continue;
      }

      if (!captureEntry) {
        captureEntry = buildCommerceCaptureLedgerEntry({
          bookingId: bookingDocument.id,
          bookingReference:
            clean(booking.reference, 180) || bookingDocument.id,
          listingId:
            clean(booking.listingId, 180) ||
            `unassigned-${bookingDocument.id}`,
          listingName:
            clean(booking.listingName, 220) || "USVI Explorer booking",
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
        existingLedgerData.set(captureEntry.id, captureEntry);
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
        const storedRefundData = existingLedgerData.get(refundEntryId) ?? null;
        let refundEntry = storedRefundData
          ? normalizeStoredCommerceLedgerEntry({
              id: refundEntryId,
              data: storedRefundData,
            })
          : null;

        if (storedRefundData && (!refundEntry || refundEntry.kind !== "refund")) {
          reviewedEntries += 1;
          skippedBookings += 1;
          continue;
        }

        if (!refundEntry) {
          const heldCapture = captureEntry.status === "held";
          refundEntry = buildCommerceRefundLedgerEntry({
            bookingId: bookingDocument.id,
            bookingReference:
              clean(booking.reference, 180) || bookingDocument.id,
            listingId:
              clean(booking.listingId, 180) ||
              `unassigned-${bookingDocument.id}`,
            listingName:
              clean(booking.listingName, 220) || "USVI Explorer booking",
            paymentIntentId,
            checkoutSessionId,
            refundId,
            stripeEventId: `reconciliation-refund-${refundId}`,
            refundStatus:
              refundStatus === "processing" ? "pending" : refundStatus,
            refundAmountCents,
            currency: "usd",
            paymentIntentMatches:
              booking.paymentIntegrityStatus === "verified" && heldCapture,
            fullRefund: refundAmountCents === paidAmountCents,
            captureEntryId: captureEntry.id,
            captureGrossAmountCents: heldCapture
              ? captureEntry.grossAmountCents
              : paidAmountCents,
            capturePlatformFeeCents: heldCapture
              ? captureEntry.platformFeeCents
              : 0,
            captureMerchantSettlementCents: heldCapture
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
            existingLedgerData.set(refundEntry.id, refundEntry);
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

async function loadExactLedgerDocuments(
  db: ReturnType<typeof getAdminDb>,
  bookings: Array<{
    id: string;
    data(): FirebaseFirestore.DocumentData;
  }>,
) {
  const entryIds = new Set<string>();
  for (const bookingDocument of bookings) {
    const booking = bookingDocument.data();
    const paymentIntentId = clean(booking.paymentIntentId, 220);
    const refundId = clean(booking.refundId, 220);
    const captureId = commerceCaptureLedgerId(paymentIntentId);
    const refundEntryId = commerceRefundLedgerId(refundId);
    if (captureId) entryIds.add(captureId);
    if (refundEntryId) entryIds.add(refundEntryId);
  }
  if (!entryIds.size) {
    return new Map<string, FirebaseFirestore.DocumentData>();
  }

  const references = [...entryIds].map((entryId) =>
    db.collection("commerceLedgerEntries").doc(entryId),
  );
  const snapshots = await db.getAll(...references);
  return new Map(
    snapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => [snapshot.id, snapshot.data() ?? {}] as const),
  );
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

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
