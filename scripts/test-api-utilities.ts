import assert from "node:assert/strict";

import { jsonBodyErrorMessage, parseJsonBody } from "../lib/api/request";
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
      body: JSON.stringify({ enabled: true }),
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

async function main() {
  await testRequestParsing();
  testTimestampNormalization();
  console.log("API utility contract tests passed.");
}

main().catch((error: unknown) => {
  console.error("API utility contract tests failed.", error);
  process.exitCode = 1;
});
