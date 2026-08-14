import assert from "node:assert/strict";

import {
  COMMERCE_SANDBOX_CONFIRMATION,
  validateCommerceSandboxEnvironment,
  type CommerceSandboxEnvironmentInput,
} from "../lib/payments/commerce-sandbox-safety";

const restrictedTestKey = stripeKeyFixture("rk", "test");
const secretTestKey = stripeKeyFixture("sk", "test");
const publishableTestKey = stripeKeyFixture("pk", "test");
const webhookTestSecret = webhookSecretFixture();

const validInput: CommerceSandboxEnvironmentInput = {
  confirmation: COMMERCE_SANDBOX_CONFIRMATION,
  stripeSecretKey: restrictedTestKey,
  stripePublishableKey: publishableTestKey,
  stripeWebhookSecret: webhookTestSecret,
  firebaseProjectId: "vi-guide-commerce-sandbox",
  expectedFirebaseProjectId: "vi-guide-commerce-sandbox",
  productionFirebaseProjectId: "vi-guide-production",
  appUrl: "https://vi-guide-commerce-sandbox.example.test",
  productionAppUrl: "https://usvi-explorer.com",
  platformFeeBps: "1000",
};

const valid = validateCommerceSandboxEnvironment(validInput);
if (!valid.ok) throw new Error(valid.errors.join("\n"));
assert.equal(valid.ok, true);
assert.deepEqual(valid.configuration, {
  stripeMode: "test",
  stripeKeyKind: "restricted",
  firebaseProjectId: "vi-guide-commerce-sandbox",
  appOrigin: "https://vi-guide-commerce-sandbox.example.test",
  platformFeeBps: 1000,
});
const serializedValidResult = JSON.stringify(valid);
assert.equal(serializedValidResult.includes(restrictedTestKey), false);
assert.equal(serializedValidResult.includes(publishableTestKey), false);
assert.equal(serializedValidResult.includes(webhookTestSecret), false);

const secretKeyVariant = validateCommerceSandboxEnvironment({
  ...validInput,
  stripeSecretKey: secretTestKey,
  appUrl: "http://localhost:3000",
});
if (!secretKeyVariant.ok) {
  throw new Error(secretKeyVariant.errors.join("\n"));
}
assert.equal(secretKeyVariant.ok, true);
assert.equal(secretKeyVariant.configuration.stripeKeyKind, "secret");
assert.equal(secretKeyVariant.configuration.appOrigin, "http://localhost:3000");

assertBlocked(
  { ...validInput, confirmation: "yes" },
  "VI_GUIDE_COMMERCE_SANDBOX_CONFIRMATION",
);
assertBlocked(
  { ...validInput, stripeSecretKey: "sk_live_never_allowed" },
  "test-mode key",
);
assertBlocked(
  { ...validInput, stripeSecretKey: "rk_live_never_allowed" },
  "test-mode key",
);
assertBlocked(
  { ...validInput, stripePublishableKey: "pk_live_never_allowed" },
  "pk_test_",
);
assertBlocked(
  { ...validInput, stripeWebhookSecret: "not-a-webhook-secret" },
  "webhook signing secret",
);
assertBlocked(
  {
    ...validInput,
    firebaseProjectId: "vi-guide-commerce-sandbox",
    expectedFirebaseProjectId: "another-sandbox",
  },
  "exactly match",
);
assertBlocked(
  {
    ...validInput,
    firebaseProjectId: "vi-guide-commerce",
    expectedFirebaseProjectId: "vi-guide-commerce",
  },
  "explicit sandbox",
);
assertBlocked(
  {
    ...validInput,
    firebaseProjectId: "vi-guide-production",
    expectedFirebaseProjectId: "vi-guide-production",
    productionFirebaseProjectId: "vi-guide-production",
  },
  "must not match",
);
assertBlocked(
  { ...validInput, appUrl: "https://usvi-explorer.com" },
  "production USVI Explorer hostname",
);
assertBlocked(
  { ...validInput, appUrl: "https://preview.example.com" },
  "remote sandbox hostname",
);
assertBlocked(
  { ...validInput, appUrl: "http://commerce-sandbox.example.test" },
  "must use HTTPS",
);
assertBlocked(
  {
    ...validInput,
    appUrl: "https://commerce-sandbox.example.test",
    productionAppUrl: "https://commerce-sandbox.example.test/other",
  },
  "must not match",
);
assertBlocked(
  { ...validInput, platformFeeBps: "10.5" },
  "whole number",
);
assertBlocked(
  { ...validInput, platformFeeBps: "10001" },
  "whole number",
);

console.log("Commerce sandbox safety tests passed.");

function stripeKeyFixture(kind: "rk" | "sk" | "pk", mode: "test") {
  return [kind, mode, "fixture1234567890"].join("_");
}

function webhookSecretFixture() {
  return ["wh", "sec_", "fixture1234567890"].join("");
}

function assertBlocked(
  input: CommerceSandboxEnvironmentInput,
  expectedMessage: string,
) {
  const result = validateCommerceSandboxEnvironment(input);
  if (result.ok) throw new Error("Expected sandbox configuration to be blocked.");
  assert.equal(result.ok, false);
  assert.ok(
    result.errors.some((error) => error.includes(expectedMessage)),
    `Expected an error containing ${JSON.stringify(expectedMessage)}. Received: ${result.errors.join(" | ")}`,
  );
}
