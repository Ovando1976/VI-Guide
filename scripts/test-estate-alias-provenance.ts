import assert from "node:assert/strict";
import {
  normalizeFirestoreEstate,
  searchEstates,
  type FirestoreEstateDoc,
} from "../lib/usvi";

const geometry: GeoJSON.Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [-64.9, 18.3],
      [-64.89, 18.3],
      [-64.89, 18.31],
      [-64.9, 18.3],
    ],
  ],
};

const doc: FirestoreEstateDoc = {
  geoid: "7803000001",
  baseName: "Canonical Estate",
  fullName: "Estate Canonical Estate",
  estateCode: "001",
  island: "stt",
  county: "030",
  centroid: { lat: 18.305, lng: -64.895 },
  internalPoint: { lat: 18.305, lng: -64.895 },
  geometry,
  aliases: ["Current Alias"],
  historicalAliases: ["Old Plantation Name"],
  historicalNotes: ["Historic note retained for provenance."],
  sources: ["census_estate_geometry", "geographic_dictionary"],
};

const estate = normalizeFirestoreEstate(doc);
assert.ok(estate, "valid Firestore estate should normalize");
assert.ok(estate.aliases?.includes("Current Alias"), "current aliases must survive normalization");
assert.ok(
  estate.aliases?.includes("Old Plantation Name"),
  "historical aliases must participate in the combined alias/search set",
);
assert.deepEqual(estate.historicalAliases, ["Old Plantation Name"]);
assert.deepEqual(estate.historicalNotes, ["Historic note retained for provenance."]);
assert.deepEqual(estate.sources, ["census_estate_geometry", "geographic_dictionary"]);

assert.equal(searchEstates([estate], "Old Plantation Name", "stt").length, 1);
assert.equal(searchEstates([estate], "Current Alias", "stt").length, 1);
assert.equal(searchEstates([estate], "Canonical Estate", "stt").length, 1);
assert.equal(searchEstates([estate], "Old Plantation Name", "stx").length, 0);

console.log("Estate alias/provenance normalization checks passed.");
