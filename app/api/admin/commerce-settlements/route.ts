import { FieldValue } from "firebase-admin/firestore";
import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, requireSession } from "@/lib/auth-server";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  buildConnectSettlementIdempotencyKey,
  buildConnectSettlementOperationId,
  buildConnectTransferGroup,
  connectSettlementEligibilityError,
} from "@/lib/payments/connect-settlement";
import { commerceCaptureLedgerId } from "@/lib/payments/commerce-ledger";
import { normalizeStoredCommerceLedgerEntry } from "@/lib/payments/commerce-ledger-operations";
import {
  marketplaceTransferCapabilityStatus,
  retrieveMarketplaceRecipientAccount,
  StripeMarketplaceConnectError,
} from "@/lib/payments/stripe-connect-marketplace";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SETTLEMENT_BOOKINGS = 150;

type MerchantPaymentProfileRecord = {
  id: string;
  data: FirebaseFirestore.DocumentData;
};

export async function GET() {
  try {
    await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration()) {
      return NextResponse.json(
        { error: "Marketplace settlement is not configured on the server." },
        { status: 503 },
      );
    }

    const db = getAdminDb();
    const [bookingSnapshot, profileSnapshot] = await Promise.all([
      db
        .collection("commerceBookings")
        .orderBy("updatedAt", "desc")
        .limit(MAX_SETTLEMENT_BOOKINGS)
        .get(),
      db.collection("merchantPaymentProfiles").get(),
    ]);

    const bookingDocuments = bookingSnapshot.docs.filter((document) => {
      const data = document.data();
      return (
        clean(data.status, 40) === "completed" ||
        Boolean(clean(data.stripeTransferId, 220)) ||
        Boolean(clean(data.settlementStatus, 40))
      );
    });

    const captureIds = bookingDocuments
      .map((document) => captureIdForBooking(document.data()))
      .filter(Boolean);
    const captureSnapshots = captureIds.length
      ? await db.getAll(
          ...captureIds.map((id) =>
            db.collection("commerceLedgerEntries").doc(id),
          ),
        )
      : [];
    const captures = new Map(
      captureSnapshots
        .filter((snapshot) => snapshot.exists)
        .map((snapshot) => [snapshot.id, snapshot.data() ?? {}] as const),
    );

    const profiles: MerchantPaymentProfileRecord[] = profileSnapshot.docs.map(
      (document) => ({
        id: document.id,
        data: document.data(),
      }),
    );

    const rows = bookingDocuments.map((document) => {
      const booking = document.data();
      const listingId = clean(booking.listingId, 180);
      const matchingProfiles = profiles.filter((profile) =>
        normalizeListingIds(profile.data.listingIds).includes(listingId),
      );
      const profile =
        matchingProfiles.length === 1 ? matchingProfiles[0] : null;
      const transferStatus =
        clean(profile?.data.transferStatus, 40) || "unknown";
      const captureId = captureIdForBooking(booking);
      const capture = captureId
        ? normalizeStoredCommerceLedgerEntry({
            id: captureId,
            data: captures.get(captureId) ?? {},
          })
        : null;
      const mappingError =
        matchingProfiles.length === 0
          ? "No merchant payout profile is assigned to this listing."
          : matchingProfiles.length > 1
            ? "More than one merchant payout profile is assigned to this listing."
            : null;
      const eligibilityError =
        mappingError ||
        (!capture
          ? "The verified commerce capture is missing or invalid."
          : connectSettlementEligibilityError({
              bookingStatus: booking.status,
              paymentStatus: booking.paymentStatus,
              paymentIntegrityStatus: booking.paymentIntegrityStatus,
              refundStatus: booking.refundStatus,
              financialHoldStatus: booking.financialHoldStatus,
              existingTransferId: booking.stripeTransferId,
              ledgerKind: capture.kind,
              ledgerStatus: capture.status,
              ledgerFeeBps: capture.feeBps,
              ledgerFeePolicySource: capture.feePolicySource,
              grossAmountCents: capture.grossAmountCents,
              platformFeeCents: capture.platformFeeCents,
              merchantSettlementCents: capture.merchantSettlementCents,
              connectedAccountTransferStatus: transferStatus,
            }));

      return {
        bookingId: document.id,
        reference: clean(booking.reference, 180) || document.id,
        listingId,
        listingName:
          clean(booking.listingName, 220) || "VI Guide booking",
        status: clean(booking.status, 40),
        paymentStatus: clean(booking.paymentStatus, 40),
        paymentIntegrityStatus: clean(booking.paymentIntegrityStatus, 40),
        refundStatus:
          clean(booking.refundStatus, 40) || "not_requested",
        settlementStatus:
          clean(booking.settlementStatus, 40) || "held",
        transferId: clean(booking.stripeTransferId, 220) || null,
        transferReversalId:
          clean(booking.stripeTransferReversalId, 220) || null,
        connectedAccountId:
          clean(profile?.data.stripeAccountId, 220) || null,
        connectedTransferStatus: transferStatus,
        merchantProfileMatches: matchingProfiles.length,
        grossAmountCents: capture?.grossAmountCents ?? 0,
        platformFeeCents: capture?.platformFeeCents ?? 0,
        merchantSettlementCents: capture?.merchantSettlementCents ?? 0,
        feeBps: capture?.feeBps ?? 0,
        releaseEligible: !eligibilityError,
        eligibilityError,
        updatedAt: normalizeTimestamp(booking.updatedAt),
      };
    });

    return NextResponse.json({
      rows,
      summary: {
        total: rows.length,
        ready: rows.filter((row) => row.releaseEligible).length,
        transferred: rows.filter(
          (row) => row.settlementStatus === "transferred",
        ).length,
        reversed: rows.filter((row) => row.settlementStatus === "reversed")
          .length,
        reviewRequired: rows.filter(
          (row) => row.settlementStatus === "review_required",
        ).length,
        platformFeeCents: rows.reduce(
          (sum, row) => sum + row.platformFeeCents,
          0,
        ),
        merchantSettlementCents: rows.reduce(
          (sum, row) => sum + row.merchantSettlementCents,
          0,
        ),
      },
    });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("commerce settlement list error", error);
    return NextResponse.json(
      { error: "Unable to load marketplace settlements." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(["admin"]);
    if (!hasFirebaseAdminConfiguration() || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Marketplace settlement is not configured on the server." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { bookingId?: unknown; confirmReference?: unknown }
      | null;
    const bookingId = clean(body?.bookingId, 180);
    const confirmReference = clean(body?.confirmReference, 180);
    if (!bookingId || !confirmReference) {
      return NextResponse.json(
        { error: "Booking ID and exact booking reference are required." },
        { status: 400 },
      );
    }

    const db = getAdminDb();
    const bookingRef = db.collection("commerceBookings").doc(bookingId);
    const initialBookingSnapshot = await bookingRef.get();
    if (!initialBookingSnapshot.exists) {
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );
    }

    const initialBooking = initialBookingSnapshot.data() ?? {};
    const reference = clean(initialBooking.reference, 180) || bookingId;
    if (confirmReference !== reference) {
      return NextResponse.json(
        { error: "Type the exact booking reference to authorize settlement." },
        { status: 409 },
      );
    }

    const listingId = clean(initialBooking.listingId, 180);
    if (!listingId) {
      return NextResponse.json(
        { error: "This booking has no merchant listing assignment." },
        { status: 409 },
      );
    }

    const profileSnapshot = await db
      .collection("merchantPaymentProfiles")
      .where("listingIds", "array-contains", listingId)
      .limit(3)
      .get();
    if (profileSnapshot.size !== 1) {
      return NextResponse.json(
        {
          error:
            profileSnapshot.size === 0
              ? "No Stripe payout profile is assigned to this listing."
              : "More than one Stripe payout profile is assigned to this listing.",
        },
        { status: 409 },
      );
    }

    const profileDocument = profileSnapshot.docs[0];
    const profile = profileDocument.data();
    const destinationAccountId = clean(profile.stripeAccountId, 220);
    if (!destinationAccountId) {
      return NextResponse.json(
        { error: "The merchant payout profile has no Stripe account." },
        { status: 409 },
      );
    }

    const connectedAccount = await retrieveMarketplaceRecipientAccount(
      destinationAccountId,
    );
    const connectedTransferStatus = marketplaceTransferCapabilityStatus(
      connectedAccount,
    );

    const captureId = captureIdForBooking(initialBooking);
    if (!captureId) {
      return NextResponse.json(
        { error: "This booking does not have a commerce capture ledger entry." },
        { status: 409 },
      );
    }

    const captureRef = db.collection("commerceLedgerEntries").doc(captureId);
    const captureSnapshot = await captureRef.get();
    const capture = captureSnapshot.exists
      ? normalizeStoredCommerceLedgerEntry({
          id: captureSnapshot.id,
          data: captureSnapshot.data() ?? {},
        })
      : null;
    if (!capture || capture.kind !== "capture") {
      return NextResponse.json(
        { error: "The commerce capture ledger entry is missing or invalid." },
        { status: 409 },
      );
    }

    const eligibilityError = connectSettlementEligibilityError({
      bookingStatus: initialBooking.status,
      paymentStatus: initialBooking.paymentStatus,
      paymentIntegrityStatus: initialBooking.paymentIntegrityStatus,
      refundStatus: initialBooking.refundStatus,
      financialHoldStatus: initialBooking.financialHoldStatus,
      existingTransferId: initialBooking.stripeTransferId,
      ledgerKind: capture.kind,
      ledgerStatus: capture.status,
      ledgerFeeBps: capture.feeBps,
      ledgerFeePolicySource: capture.feePolicySource,
      grossAmountCents: capture.grossAmountCents,
      platformFeeCents: capture.platformFeeCents,
      merchantSettlementCents: capture.merchantSettlementCents,
      connectedAccountTransferStatus: connectedTransferStatus,
    });
    if (eligibilityError) {
      return NextResponse.json(
        { error: eligibilityError },
        { status: 409 },
      );
    }

    const operationId = buildConnectSettlementOperationId({
      bookingId,
      captureEntryId: capture.id,
      destinationAccountId,
    });
    const idempotencyKey = buildConnectSettlementIdempotencyKey(operationId);
    const transferGroup = buildConnectTransferGroup(bookingId);
    if (!operationId || !idempotencyKey || !transferGroup) {
      return NextResponse.json(
        { error: "Unable to derive safe settlement identifiers." },
        { status: 409 },
      );
    }

    const operationRef = db
      .collection("commerceSettlementOperations")
      .doc(operationId);
    const profileRef = profileDocument.ref;
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, captureCheck, profileCheck, operationSnapshot] =
        await Promise.all([
          transaction.get(bookingRef),
          transaction.get(captureRef),
          transaction.get(profileRef),
          transaction.get(operationRef),
        ]);

      if (
        !bookingSnapshot.exists ||
        !captureCheck.exists ||
        !profileCheck.exists
      ) {
        throw new SettlementActionError(
          "Settlement records changed before authorization. Refresh and review again.",
          409,
        );
      }

      const booking = bookingSnapshot.data() ?? {};
      const checkedProfile = profileCheck.data() ?? {};
      const checkedCapture = normalizeStoredCommerceLedgerEntry({
        id: captureCheck.id,
        data: captureCheck.data() ?? {},
      });
      if (!checkedCapture || checkedCapture.kind !== "capture") {
        throw new SettlementActionError(
          "The capture ledger is no longer valid.",
          409,
        );
      }
      if (
        clean(checkedProfile.stripeAccountId, 220) !==
          destinationAccountId ||
        !normalizeListingIds(checkedProfile.listingIds).includes(listingId)
      ) {
        throw new SettlementActionError(
          "The merchant payout assignment changed before settlement.",
          409,
        );
      }

      const currentError = connectSettlementEligibilityError({
        bookingStatus: booking.status,
        paymentStatus: booking.paymentStatus,
        paymentIntegrityStatus: booking.paymentIntegrityStatus,
        refundStatus: booking.refundStatus,
        financialHoldStatus: booking.financialHoldStatus,
        existingTransferId: booking.stripeTransferId,
        ledgerKind: checkedCapture.kind,
        ledgerStatus: checkedCapture.status,
        ledgerFeeBps: checkedCapture.feeBps,
        ledgerFeePolicySource: checkedCapture.feePolicySource,
        grossAmountCents: checkedCapture.grossAmountCents,
        platformFeeCents: checkedCapture.platformFeeCents,
        merchantSettlementCents: checkedCapture.merchantSettlementCents,
        connectedAccountTransferStatus: connectedTransferStatus,
      });
      if (currentError) {
        throw new SettlementActionError(currentError, 409);
      }

      if (operationSnapshot.exists) {
        const state = clean(operationSnapshot.data()?.status, 40);
        throw new SettlementActionError(
          state === "succeeded"
            ? "This settlement has already been released."
            : "A settlement operation already exists and requires operations review.",
          409,
        );
      }

      transaction.create(operationRef, {
        bookingId,
        bookingReference: reference,
        listingId,
        listingName:
          clean(booking.listingName, 220) || "VI Guide booking",
        captureEntryId: checkedCapture.id,
        destinationAccountId,
        merchantProfileId: profileDocument.id,
        grossAmountCents: checkedCapture.grossAmountCents,
        platformFeeCents: checkedCapture.platformFeeCents,
        merchantSettlementCents: checkedCapture.merchantSettlementCents,
        feeBps: checkedCapture.feeBps,
        transferGroup,
        status: "processing",
        requestedByUid: session.uid,
        requestedByEmail: session.email ?? null,
        requestedAt: now,
        updatedAt: now,
        serverCreatedAt: FieldValue.serverTimestamp(),
        serverUpdatedAt: FieldValue.serverTimestamp(),
      });
      transaction.update(bookingRef, {
        settlementOperationId: operationId,
        settlementStatus: "processing",
        settlementDestinationAccountId: destinationAccountId,
        paymentStatus: "merchant_settled",
        settlementUpdatedAt: now,
        updatedAt: now,
      });
    });

    const paymentIntentId = clean(initialBooking.paymentIntentId, 220);
    let sourceChargeId = "";

    try {
      const paymentIntent = await getStripe().paymentIntents.retrieve(
        paymentIntentId,
        { expand: ["latest_charge"] },
      );
      sourceChargeId = expandableId(paymentIntent.latest_charge);
      if (!sourceChargeId) {
        throw new Error("The captured PaymentIntent has no source charge.");
      }

      const transfer = await getStripe().transfers.create(
        {
          amount: capture.merchantSettlementCents,
          currency: "usd",
          destination: destinationAccountId,
          source_transaction: sourceChargeId,
          transfer_group: transferGroup,
          description: `VI Guide settlement ${reference}`,
          metadata: {
            bookingId,
            bookingReference: reference,
            listingId,
            captureEntryId: capture.id,
            settlementOperationId: operationId,
          },
        },
        { idempotencyKey },
      );

      const completedAt = new Date().toISOString();
      await db.runTransaction(async (transaction) => {
        const [bookingSnapshot, operationSnapshot] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(operationRef),
        ]);
        if (!bookingSnapshot.exists || !operationSnapshot.exists) return;
        if (clean(operationSnapshot.data()?.status, 40) === "succeeded") {
          return;
        }

        transaction.update(operationRef, {
          status: "succeeded",
          stripeTransferId: transfer.id,
          sourceChargeId,
          completedAt,
          updatedAt: completedAt,
          serverUpdatedAt: FieldValue.serverTimestamp(),
        });
        transaction.update(bookingRef, {
          paymentStatus: "merchant_settled",
          settlementStatus: "transferred",
          stripeTransferId: transfer.id,
          stripeTransferAmountCents: transfer.amount,
          stripeTransferDestination: destinationAccountId,
          stripeTransferSourceChargeId: sourceChargeId,
          stripeTransferGroup: transferGroup,
          settlementTransferredAt: completedAt,
          settlementUpdatedAt: completedAt,
          updatedAt: completedAt,
        });
        transaction.set(db.collection("notifications").doc(), {
          audience: "merchant",
          kind: "booking",
          priority: "normal",
          title: "Merchant settlement released",
          message: `${formatMoney(transfer.amount)} was released for ${reference}.`,
          href: "/merchant/payouts",
          reference,
          readAt: null,
          createdAt: completedAt,
          updatedAt: completedAt,
          serverCreatedAt: FieldValue.serverTimestamp(),
        });
      });

      return NextResponse.json({
        ok: true,
        bookingId,
        reference,
        operationId,
        transferId: transfer.id,
        amountCents: transfer.amount,
        platformFeeCents: capture.platformFeeCents,
        merchantSettlementCents: capture.merchantSettlementCents,
      });
    } catch (error) {
      const failedAt = new Date().toISOString();
      const message = stripeErrorMessage(error);
      await Promise.all([
        operationRef.set(
          {
            status: "review_required",
            sourceChargeId: sourceChargeId || null,
            failureReason: message,
            updatedAt: failedAt,
            serverUpdatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        ),
        bookingRef.set(
          {
            paymentStatus: "merchant_settled",
            settlementStatus: "review_required",
            settlementFailureReason: message,
            settlementUpdatedAt: failedAt,
            updatedAt: failedAt,
          },
          { merge: true },
        ),
      ]);

      return NextResponse.json(
        {
          error:
            "Stripe did not complete a clean merchant transfer. The booking is locked from refund and requires settlement reconciliation before another money movement.",
        },
        { status: 502 },
      );
    }
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    if (error instanceof SettlementActionError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    if (error instanceof StripeMarketplaceConnectError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: normalizeStatus(error.statusCode) },
      );
    }
    console.error("commerce settlement release error", error);
    return NextResponse.json(
      { error: "Unable to release merchant settlement." },
      { status: 500 },
    );
  }
}

class SettlementActionError extends Error {
  constructor(
    message: string,
    public status: 404 | 409,
  ) {
    super(message);
  }
}

function captureIdForBooking(booking: FirebaseFirestore.DocumentData) {
  return (
    clean(booking.commerceLedgerCaptureId, 120) ||
    commerceCaptureLedgerId(clean(booking.paymentIntentId, 220))
  );
}

function normalizeListingIds(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => clean(item, 180)).filter(Boolean))]
    : [];
}

function expandableId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    return clean((value as { id?: unknown }).id, 220);
  }
  return "";
}

function stripeErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message.slice(0, 500);
  return "Stripe returned an unknown settlement error.";
}

function normalizeTimestamp(value: unknown) {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : "";
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate(): Date }).toDate();
    return Number.isFinite(date.getTime()) ? date.toISOString() : "";
  }
  return "";
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function normalizeStatus(value: number) {
  return Number.isInteger(value) && value >= 400 && value <= 599
    ? value
    : 502;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}
