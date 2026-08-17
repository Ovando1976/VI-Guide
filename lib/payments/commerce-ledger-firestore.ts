import { FieldValue, type Firestore } from "firebase-admin/firestore";

import type { CommerceLedgerEntry } from "@/lib/payments/commerce-ledger";

export type CommerceLedgerDocumentRead = {
  ref: FirebaseFirestore.DocumentReference;
  exists: boolean;
  data: FirebaseFirestore.DocumentData | null;
};

export async function readCommerceLedgerDocument(
  transaction: FirebaseFirestore.Transaction,
  db: Firestore,
  entryId: string,
): Promise<CommerceLedgerDocumentRead> {
  const ref = db.collection("commerceLedgerEntries").doc(entryId);
  const snapshot = await transaction.get(ref);
  return {
    ref,
    exists: snapshot.exists,
    data: snapshot.exists ? snapshot.data() ?? {} : null,
  };
}

export function resolveStoredCommerceCaptureEntry(input: {
  id: string;
  data: FirebaseFirestore.DocumentData | null;
  expectedPaymentIntentId: string;
  expectedGrossAmountCents: number;
}): CommerceLedgerEntry | null {
  if (!input.data || input.data.kind !== "capture") return null;

  const status =
    input.data.status === "held"
      ? "held"
      : input.data.status === "review_required"
        ? "review_required"
        : null;
  const bookingId = clean(input.data.bookingId, 180);
  const bookingReference = clean(input.data.bookingReference, 180);
  const listingId = clean(input.data.listingId, 180);
  const listingName = clean(input.data.listingName, 220);
  const paymentIntentId = clean(input.data.paymentIntentId, 220);
  const checkoutSessionId = clean(input.data.checkoutSessionId, 220);
  const stripeEventId = clean(input.data.stripeEventId, 220);
  const currency = clean(input.data.currency, 3).toLowerCase();
  const feeBps = boundedFeeBps(input.data.feeBps);
  const feePolicySource =
    input.data.feePolicySource === "environment"
      ? "environment"
      : input.data.feePolicySource === "unconfigured"
        ? "unconfigured"
        : null;
  const grossAmountCents = integerMoney(input.data.grossAmountCents);
  const platformFeeCents = integerMoney(input.data.platformFeeCents);
  const merchantSettlementCents = integerMoney(
    input.data.merchantSettlementCents,
  );
  const unallocatedAmountCents = integerMoney(
    input.data.unallocatedAmountCents,
  );
  const occurredAt = normalizedIso(input.data.occurredAt);
  const createdAt = normalizedIso(
    input.data.createdAt ?? input.data.serverCreatedAt,
  );
  const updatedAt = normalizedIso(
    input.data.updatedAt ?? input.data.serverUpdatedAt ?? input.data.createdAt,
  );

  if (
    !input.id ||
    !status ||
    !bookingId ||
    !bookingReference ||
    !listingId ||
    !listingName ||
    !paymentIntentId ||
    !checkoutSessionId ||
    !stripeEventId ||
    !/^[a-z]{3}$/.test(currency) ||
    feeBps === null ||
    !feePolicySource ||
    grossAmountCents === null ||
    platformFeeCents === null ||
    merchantSettlementCents === null ||
    unallocatedAmountCents === null ||
    !occurredAt ||
    !createdAt ||
    !updatedAt ||
    paymentIntentId !== input.expectedPaymentIntentId
  ) {
    return null;
  }

  const validHeld = Boolean(
    status === "held" &&
      grossAmountCents === input.expectedGrossAmountCents &&
      grossAmountCents > 0 &&
      platformFeeCents >= 0 &&
      merchantSettlementCents >= 0 &&
      platformFeeCents + merchantSettlementCents === grossAmountCents &&
      unallocatedAmountCents === 0,
  );
  const validReview = Boolean(
    status === "review_required" &&
      grossAmountCents === 0 &&
      platformFeeCents === 0 &&
      merchantSettlementCents === 0 &&
      unallocatedAmountCents === input.expectedGrossAmountCents,
  );
  if (!validHeld && !validReview) return null;

  return {
    id: input.id,
    kind: "capture",
    status,
    bookingId,
    bookingReference,
    listingId,
    listingName,
    paymentIntentId,
    checkoutSessionId,
    refundId: null,
    reversalOfEntryId: null,
    stripeEventId,
    currency,
    feeBps,
    feePolicySource,
    grossAmountCents,
    platformFeeCents,
    merchantSettlementCents,
    reportedRefundAmountCents: null,
    unallocatedAmountCents,
    occurredAt,
    createdAt,
    updatedAt,
  };
}

export function createCommerceCaptureLedgerEntry(
  transaction: FirebaseFirestore.Transaction,
  document: CommerceLedgerDocumentRead,
  entry: CommerceLedgerEntry,
) {
  if (document.exists) return;
  transaction.create(document.ref, {
    ...entry,
    serverCreatedAt: FieldValue.serverTimestamp(),
    serverUpdatedAt: FieldValue.serverTimestamp(),
  });
}

export function writeCommerceRefundLedgerEntry(
  transaction: FirebaseFirestore.Transaction,
  document: CommerceLedgerDocumentRead,
  entry: CommerceLedgerEntry,
) {
  if (entry.kind !== "refund") return;
  const existingCreatedAt = document.data?.createdAt;
  transaction.set(
    document.ref,
    {
      ...entry,
      createdAt: existingCreatedAt ?? entry.createdAt,
      serverCreatedAt:
        document.data?.serverCreatedAt ?? FieldValue.serverTimestamp(),
      serverUpdatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
}

function normalizedIso(value: unknown) {
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate?: unknown }).toDate === "function"
  ) {
    const date = (value as { toDate(): Date }).toDate();
    if (Number.isFinite(date.getTime())) return date.toISOString();
  }
  return "";
}

function boundedFeeBps(value: unknown) {
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 0 && amount <= 10_000
    ? amount
    : null;
}

function integerMoney(value: unknown) {
  const amount = Number(value);
  return Number.isSafeInteger(amount) ? amount : null;
}

function clean(value: unknown, maxLength: number) {
  return typeof value === "string"
    ? value.replace(/\s+/g, " ").trim().slice(0, maxLength)
    : "";
}