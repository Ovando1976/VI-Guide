import { strict as assert } from "node:assert";
import { dictionaryCleanerInternals } from "./clean-geographic-dictionary";

const { looksLikeHeaderOrJunkName, inferIsland } = dictionaryCleanerInternals;

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

console.log("Geographic dictionary cleaner regression tests passed");
