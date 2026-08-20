import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const picker = fs.readFileSync(
  path.join(process.cwd(), "components/mobility-place-picker.tsx"),
  "utf8",
);
const routeFields = fs.readFileSync(
  path.join(process.cwd(), "components/mobility-route-fields.tsx"),
  "utf8",
);

test("geography search only selects a mapped official estate GEOID", () => {
  assert.match(picker, /\/api\/geography\/search/);
  assert.match(picker, /relatedEstateGeoids/);
  assert.match(picker, /onChange\(mappedGeoid\)/);
  assert.match(picker, /fare area needs review/);
});

test("route fields present traveler-facing pickup and destination labels", () => {
  assert.match(routeFields, /> Pickup/);
  assert.match(routeFields, /> Destination/);
  assert.match(routeFields, /Search airport, hotel, beach, ferry/);
  assert.match(routeFields, /Search beach, hotel, town, harbor/);
});
