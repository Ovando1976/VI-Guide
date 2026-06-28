import { knoxEarlyEstateLinks } from "../../src/data/history/generated/knoxEarlyEstateLinks.ts";
import { geographicIndex } from "../../src/data/core/geographicIndex.ts";

function normalize(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/\bestate\b/g, "")
    .replace(/\bplantation\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function asArray(index) {
  if (Array.isArray(index)) return index;
  if (Array.isArray(index.items)) return index.items;
  if (Array.isArray(index.records)) return index.records;
  if (Array.isArray(index.geographicIndex)) return index.geographicIndex;
  if (Array.isArray(index.default)) return index.default;

  for (const value of Object.values(index ?? {})) {
    if (Array.isArray(value)) return value;
  }

  return [];
}

const allItems = asArray(geographicIndex);
const estates = allItems.filter((item) => {
  const type = String(item.type || item.kind || item.category || "").toLowerCase().trim();
  const featureType = String(item.featureType || "").toLowerCase().trim();
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => String(tag).toLowerCase()) : [];
  const name = normalize(item.name || item.title || item.displayName || "");

  if (!name || name === "estate" || name.length < 3) return false;

  return type === "estate" || featureType === "estate" || tags.includes("estate");
});

console.log("Geographic index items:", allItems.length);
console.log("Verified early estate links:", knoxEarlyEstateLinks.length);
console.log("Modern estate records:", estates.length);

for (const link of knoxEarlyEstateLinks) {
  const target = normalize(link.originalEstateName || link.colonistName);

  const matches = estates
    .map((estate) => {
      const estateName = normalize(estate.name || estate.title || estate.displayName || "");
      if (!estateName || estateName === "estate" || estateName.length < 3) {
        return { estate, score: 0 };
      }
      const score =
        estateName === target ? 3 :
        estateName.includes(target) || target.includes(estateName) ? 2 :
        estateName.split(" ").some((part) => part.length > 3 && target.includes(part)) ? 1 :
        0;

      return { estate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  console.log("\n---");
  console.log("Colonist:", link.colonistName);
  console.log("Original estate:", link.originalEstateName || "unknown");
  console.log("Confidence:", link.confidence);
  console.log("Modern matches:", matches.length);

  for (const match of matches.slice(0, 10)) {
    console.log(
      `- ${match.estate.name || match.estate.title} | ${match.estate.island ?? match.estate.islands ?? "unknown island"} | ${match.estate.id}`
    );
  }
}
