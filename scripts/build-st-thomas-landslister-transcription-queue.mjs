import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const MANIFEST =
  "generated/rigsarkivet/st-thomas-landslister-1688-1718/st-thomas-landslister-manifest.json";

const OUT_JSON =
  "generated/rigsarkivet/st-thomas-landslister-1688-1718/st-thomas-landslister-transcription-queue.json";

const OUT_MD =
  "reports/estate-history/st-thomas-landslister-transcription-queue.md";

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

const missing = manifest
  .filter((page) => !page.hasTranscription)
  .map((page) => ({
    page: page.page,
    pictureId: page.pictureId,
    url: page.url,
    status: "needs-image-transcription",
    targetFields: [
      "Årstal",
      "Øens navn",
      "Gadenavn eller plantagenavn og matrikelnr.",
      "Beboere / Beboer",
      "Anden tekst",
      "Kommentarer"
    ],
    notes: ""
  }));

mkdirSync(path.dirname(OUT_JSON), { recursive: true });
mkdirSync(path.dirname(OUT_MD), { recursive: true });

writeFileSync(OUT_JSON, JSON.stringify(missing, null, 2));

writeFileSync(
  OUT_MD,
  [
    "# St. Thomas Landslister Transcription Queue",
    "",
    "The Rigsarkivet crowdsourcing pages expose structured transcription fields for only part of the series.",
    "",
    `Pages needing image transcription: ${missing.length}`,
    "",
    "## First 100 pages needing transcription",
    "",
    ...missing.slice(0, 100).map(
      (page) =>
        `- Page ${page.page}, picture ${page.pictureId || "unknown"} — ${page.url}`
    ),
    "",
    "## Target fields",
    "",
    "- Årstal",
    "- Øens navn",
    "- Gadenavn eller plantagenavn og matrikelnr.",
    "- Beboere / Beboer",
    "- Anden tekst",
    "- Kommentarer",
    "",
  ].join("\n")
);

console.log({
  missing: missing.length,
  json: OUT_JSON,
  report: OUT_MD,
});
