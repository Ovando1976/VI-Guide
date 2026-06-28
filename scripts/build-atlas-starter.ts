import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

type IslandCode = "st_thomas" | "st_john" | "st_croix" | "water_island";

type FeatureType =
  | "estate"
  | "quarter"
  | "bay"
  | "beach"
  | "harbor"
  | "road"
  | "point"
  | "cay"
  | "reef"
  | "rock"
  | "hill"
  | "mountain"
  | "valley"
  | "gut"
  | "pond"
  | "fort"
  | "church"
  | "town"
  | "village"
  | "building"
  | "historic_site";

type GazetteerFeature = {
  id: string;
  canonicalName: string;
  featureType: FeatureType;
  island: IslandCode;
  aliases: string[];
  coordinates: { lat: number; lng: number } | null;
  sourceMaps: string[];
  notes: string;
};

const sourceMap = {
  id: "st_thomas_historic_map_early",
  title: "Historic Map of St. Thomas",
  island: "st_thomas",
  imagePath: "/images/maps/st-thomas-historic-map.jpeg",
  status: "manual_transcription_started",
};

const features: GazetteerFeature[] = [
  {
    id: "st_thomas_estate_dorothea",
    canonicalName: "Dorothea",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Estate Dorothea"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible on uploaded historic St. Thomas map.",
  },
  {
    id: "st_thomas_estate_neltjeberg",
    canonicalName: "Neltjeberg",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Neltjebjerg", "Estate Neltjeberg"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible on northwestern St. Thomas map area.",
  },
  {
    id: "st_thomas_estate_hull",
    canonicalName: "Hull",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Estate Hull"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible near north central St. Thomas.",
  },
  {
    id: "st_thomas_estate_st_peter",
    canonicalName: "St. Peter",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Saint Peter", "Estate St. Peter"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible near central highlands.",
  },
  {
    id: "st_thomas_estate_lovenlund",
    canonicalName: "Lovenlund",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Løvenlund", "Estate Lovenlund"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible east of Charlotte Amalie area.",
  },
  {
    id: "st_thomas_estate_rosendal",
    canonicalName: "Rosendal",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Rosendahl", "Estate Rosendal"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible east of Charlotte Amalie.",
  },
  {
    id: "st_thomas_estate_annas_retreat",
    canonicalName: "Anna's Retreat",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Annas Retreat", "Estate Anna's Retreat"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible in eastern St. Thomas.",
  },
  {
    id: "st_thomas_estate_tutu",
    canonicalName: "Tutu",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Estate Tutu"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible in eastern St. Thomas.",
  },
  {
    id: "st_thomas_estate_nazareth",
    canonicalName: "Nazareth",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Estate Nazareth"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible near eastern St. Thomas.",
  },
  {
    id: "st_thomas_estate_frydendal",
    canonicalName: "Frydendal",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Fryden Dal", "Estate Frydendal"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible on eastern St. Thomas.",
  },
  {
    id: "st_thomas_estate_bovoni",
    canonicalName: "Bovoni",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Estate Bovoni"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible in southeastern St. Thomas.",
  },
  {
    id: "st_thomas_estate_bolongo",
    canonicalName: "Bolongo",
    featureType: "estate",
    island: "st_thomas",
    aliases: ["Estate Bolongo"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible on southern St. Thomas.",
  },
  {
    id: "st_thomas_town_charlotte_amalie",
    canonicalName: "Charlotte Amalie",
    featureType: "town",
    island: "st_thomas",
    aliases: ["Charlotte Amalia", "Amalienborg"],
    coordinates: { lat: 18.3419, lng: -64.9307 },
    sourceMaps: [sourceMap.id],
    notes: "Historic town center shown prominently on map.",
  },
  {
    id: "st_thomas_bay_magens_bay",
    canonicalName: "Magens Bay",
    featureType: "bay",
    island: "st_thomas",
    aliases: ["Magen's Bay"],
    coordinates: { lat: 18.3637, lng: -64.9304 },
    sourceMaps: [sourceMap.id],
    notes: "North shore bay visible on map.",
  },
  {
    id: "st_thomas_cay_hans_lollik",
    canonicalName: "Hans Lollik",
    featureType: "cay",
    island: "st_thomas",
    aliases: ["Hans Lollick", "Hans Lollik Island"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Offshore island north of St. Thomas.",
  },
  {
    id: "st_thomas_cay_inner_brass",
    canonicalName: "Inner Brass",
    featureType: "cay",
    island: "st_thomas",
    aliases: ["Inner Brass Island"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Offshore feature north of St. Thomas.",
  },
  {
    id: "st_thomas_cay_outer_brass",
    canonicalName: "Outer Brass",
    featureType: "cay",
    island: "st_thomas",
    aliases: ["Outer Brass Island"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Offshore feature north of St. Thomas.",
  },
  {
    id: "st_thomas_cay_thatch_cay",
    canonicalName: "Thatch Cay",
    featureType: "cay",
    island: "st_thomas",
    aliases: ["Thatch Island"],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible northeast of St. Thomas.",
  },
  {
    id: "st_thomas_cay_grass_cay",
    canonicalName: "Grass Cay",
    featureType: "cay",
    island: "st_thomas",
    aliases: [],
    coordinates: null,
    sourceMaps: [sourceMap.id],
    notes: "Visible near eastern offshore area.",
  },
];

function writeJson(path: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2));
}

function writeTs(path: string, name: string, data: unknown) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(
    path,
    `// Auto-generated by scripts/build-atlas-starter.ts\nexport const ${name} = ${JSON.stringify(
      data,
      null,
      2
    )} as const;\n`
  );
}

writeJson("data/maps/st_thomas_early_map/map-metadata.json", sourceMap);
writeJson("data/master/gazetteer.json", features);
writeTs("src/data/atlas/gazetteer.ts", "gazetteer", features);
writeTs("src/data/atlas/sourceMaps.ts", "sourceMaps", [sourceMap]);

console.log("Atlas starter built.");
console.log(`Features: ${features.length}`);
console.log("Wrote data/master/gazetteer.json");
console.log("Wrote src/data/atlas/gazetteer.ts");
console.log("Wrote src/data/atlas/sourceMaps.ts");
