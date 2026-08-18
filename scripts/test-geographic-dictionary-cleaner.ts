import { strict as assert } from "node:assert";
import { dictionaryCleanerInternals } from "./clean-geographic-dictionary";

const { looksLikeHeaderOrJunkName, inferIsland, applyVerification } = dictionaryCleanerInternals;

assert.equal(
  looksLikeHeaderOrJunkName("ThevegetationoftheVirginIslandsisnaturallydivisibleintosix"),
  true,
  "Narrative vegetation paragraph must be rejected as a fake place name",
);

assert.equal(
  looksLikeHeaderOrJunkName("ChrletlenstedandFrderikstedwchhasagrammarachoolandnjunior"),
  true,
  "Merged school-description OCR must be rejected as a fake dictionary entry",
);

assert.equal(
  inferIsland({
    id: "beverhoutberg",
    slug: "beverhoutberg",
    canonicalName: "Beverhoutberg",
    featureType: "hill",
    island: "UNKNOWN",
    description: "Hill with old estate on summit south of Susannaberg, St. John.",
  }),
  "STJ",
  "Explicit St. John text must override UNKNOWN island",
);

assert.equal(
  inferIsland({
    id: "concordia",
    slug: "concordia",
    canonicalName: "Concordia",
    featureType: "estate",
    island: "UNKNOWN",
    description: "Estate 8, Queen Quarter, St. Croix.",
  }),
  "STX",
  "Explicit St. Croix text must override UNKNOWN island",
);

assert.equal(
  inferIsland({
    id: "corteri",
    slug: "corteri",
    canonicalName: "Corteri",
    featureType: "estate",
    island: "STJ",
    description: "Seventeenth century French Plantage near south coast of St. Croix, not far from Longford.",
  }),
  "STX",
  "Explicit St. Croix evidence must correct a stale wrong St. John assignment",
);

const verifiedBourlc = applyVerification(
  {
    id: "bourlc-plantage",
    slug: "bourlc-plantage",
    canonicalName: "Bourlc Plantage",
    normalizedName: "bourlc plantage",
    featureType: "estate",
    island: "UNKNOWN",
  },
  {
    normalizedName: "bourlc plantage",
    canonicalName: "Bourlc Plantage",
    island: "STX",
    relationship: "variant_of",
    relatedName: "Castle Burke",
    confidence: "medium",
    evidence: "Dictionary text says Burke Estate; same as Castle Burke, St. Croix.",
    source: "Geographic Dictionary of the Virgin Islands (1925)",
  },
);

assert.equal(verifiedBourlc.island, "STX", "Bourlc Plantage verification must apply to the parsed key");
assert.equal(verifiedBourlc.verification?.relatedName, "Castle Burke", "Bourlc Plantage must retain its Castle Burke relationship");

console.log("Geographic dictionary cleaner regression tests passed");
