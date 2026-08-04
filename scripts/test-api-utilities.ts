import assert from "node:assert/strict";

import { jsonBodyErrorMessage, parseJsonBody } from "../lib/api/request";
import {
  buildCommerceCheckoutIdempotencyKey,
  isValidCommerceDeposit,
  MAX_COMMERCE_DEPOSIT_CENTS,
  normalizeCommerceEmail,
  validateCompletedCommerceCheckout,
  type CompletedCommerceCheckoutInput,
} from "../lib/payments/commerce-checkout-integrity";
import { normalizeTimestamp, normalizeTimestampOrEpoch } from "../lib/timestamps";

async function testRequestParsing() {
  const valid = await parseJsonBody<{ name: string }>(
    new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({ name: "VI Guide" }),
    }),
  );
  assert.deepEqual(valid, { ok: true, value: { name: "VI Guide" } });

  const missingContentType = await parseJsonBody<{ enabled: boolean }>(
    new Request("http://localhost/test", {
      method: "POST",
      body: new TextEncoder().encode(JSON.stringify({ enabled: true })),
    }),
  );
  assert.deepEqual(missingContentType, { ok: true, value: { enabled: true } });

  const invalidContentType = await parseJsonBody(
    new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "not-json",
    }),
  );
  assert.deepEqual(invalidContentType, { ok: false, reason: "invalid-content-type" });
  if (!invalidContentType.ok) {
    assert.equal(jsonBodyErrorMessage(invalidContentType), "Content-Type must be application/json.");
  }

  const invalidJson = await parseJsonBody(
    new Request("http://localhost/test", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    }),
  );
  assert.deepEqual(invalidJson, { ok: false, reason: "invalid-json" });
  if (!invalidJson.ok) {
    assert.equal(jsonBodyErrorMessage(invalidJson), "Request body must contain valid JSON.");
  }
}

function testTimestampNormalization() {
  const iso = "2026-08-02T12:00:00.000Z";
  const milliseconds = Date.parse(iso);
  const seconds = milliseconds / 1000;

  assert.equal(normalizeTimestamp(iso), iso);
  assert.equal(normalizeTimestamp(milliseconds), iso);
  assert.equal(normalizeTimestamp(new Date(milliseconds)), iso);
  assert.equal(normalizeTimestamp({ seconds }), iso);
  assert.equal(normalizeTimestamp({ toDate: () => new Date(milliseconds) }), iso);

  assert.equal(normalizeTimestamp(undefined), undefined);
  assert.equal(normalizeTimestamp(null), undefined);
  assert.equal(normalizeTimestamp(""), undefined);
  assert.equal(normalizeTimestamp("not-a-date"), undefined);
  assert.equal(normalizeTimestamp({}), undefined);
  assert.equal(normalizeTimestampOrEpoch("not-a-date"), "1970-01-01T00:00:00.000Z");
}

function testCommerceCheckoutIntegrity() {
  const valid: CompletedCommerceCheckoutInput = {
    checkoutSessionId: "cs_live_expected",
    expectedSessionId: "cs_live_expected",
    expectedAmountCents: 12_500,
    paidAmountCents: 12_500,
    currency: "usd",
    expectedEmail: "traveler@example.com",
    paidEmail: "traveler@example.com",
    expectedReference: "VI-STAY-ABC123",
    sessionReference: "VI-STAY-ABC123",
  };

  assert.equal(validateCompletedCommerceCheckout(valid), null);
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, expectedSessionId: "" }),
    "checkout_session_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({
      ...valid,
      checkoutSessionId: "cs_live_unexpected",
    }),
    "checkout_session_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, paidAmountCents: 12_499 }),
    "amount_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, expectedAmountCents: 0 }),
    "amount_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, currency: "eur" }),
    "currency_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, currency: null }),
    "currency_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({
      ...valid,
      paidEmail: "other@example.com",
    }),
    "customer_email_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, expectedEmail: "" }),
    "customer_email_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({
      ...valid,
      sessionReference: "VI-STAY-WRONG",
    }),
    "booking_reference_mismatch",
  );
  assert.equal(
    validateCompletedCommerceCheckout({ ...valid, sessionReference: "" }),
    "booking_reference_mismatch",
  );

  assert.equal(normalizeCommerceEmail(" Traveler@Example.COM "), "traveler@example.com");
  assert.equal(normalizeCommerceEmail(null), "");

  assert.equal(isValidCommerceDeposit(1), true);
  assert.equal(isValidCommerceDeposit(MAX_COMMERCE_DEPOSIT_CENTS), true);
  assert.equal(isValidCommerceDeposit(0), false);
  assert.equal(isValidCommerceDeposit(-1), false);
  assert.equal(isValidCommerceDeposit(10.5), false);
  assert.equal(isValidCommerceDeposit(MAX_COMMERCE_DEPOSIT_CENTS + 1), false);

  const keyInput = {
    bookingId: "booking-123",
    amountCents: 12_500,
    requestVersion: "2026-08-04T20:00:00.000Z",
  };
  const idempotencyKey = buildCommerceCheckoutIdempotencyKey(keyInput);
  assert.match(idempotencyKey, /^[a-f0-9]{64}$/);
  assert.equal(idempotencyKey, buildCommerceCheckoutIdempotencyKey(keyInput));
  assert.notEqual(
    idempotencyKey,
    buildCommerceCheckoutIdempotencyKey({ ...keyInput, amountCents: 12_501 }),
  );
  assert.notEqual(
    idempotencyKey,
    buildCommerceCheckoutIdempotencyKey({
      ...keyInput,
      requestVersion: "2026-08-04T20:01:00.000Z",
    }),
  );
}

async function main() {
  await testRequestParsing();
  testTimestampNormalization();
  testCommerceCheckoutIntegrity();
  console.log("API and payment contract tests passed.");
}

main().catch((error: unknown) => {
  console.error("API and payment contract tests failed.", error);
  process.exitCode = 1;
});
