import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const IN_JSON =
  "generated/rigsarkivet/st-thomas-landslister-1688-1718/st-thomas-landslister-pages.json";

const OUT_JSON =
  "generated/rigsarkivet/st-thomas-landslister-1688-1718/st-thomas-landslister-manifest.json";

const OUT_MD =
  "reports/estate-history/st-thomas-landslister-manifest-report.md";

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

const pages = JSON.parse(readFileSync(IN_JSON, "utf8"));

const manifest = pages.map((page) => {
  const pageNumber = page.source?.page || page.page;
  const pictureId = page.source?.pictureId || page.pictureId;

  const hasTranscription = Boolean(
    clean(page.year) ||
      clean(page.islandName) ||
      clean(page.plantationNumberLine) ||
      page.residents?.length ||
      page.comments?.length,
  );

  return {
    page: pageNumber,
    pictureId,
    hasTranscription,
    year: clean(page.year),
    islandName: clean(page.islandName),
    plantationNumberLine: clean(page.plantationNumberLine),
    residentCount: page.residents?.length || 0,
    url:
      page.source?.url ||
      (pictureId ? `https://cs.rigsarkivet.dk/picture/view-values/${pictureId}` : ""),
    error: page.error || "",
  };
});

const withTranscription = manifest.filter((page) => page.hasTranscription);
const withoutTranscription = manifest.filter((page) => !page.hasTranscription);

mkdirSync(path.dirname(OUT_JSON), { recursive: true });
mkdirSync(path.dirname(OUT_MD), { recursive: true });

writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2));

writeFileSync(
  OUT_MD,
  [
    "# St. Thomas Landslister Manifest Report",
    "",
    "Source: Rigsarkivet crowdsourcing / Landslister for St. Thomas, 1688–1718.",
    "",
    `Total pages captured: ${manifest.length}`,
    `Pages with structured transcription: ${withTranscription.length}`,
    `Pages without structured transcription: ${withoutTranscription.length}`,
    "",
    "## Pages with structured transcription",
    "",
    ...withTranscription.map(
      (page) =>
        `- Page ${page.page}, picture ${page.pictureId}: ${page.year || "no year"} — ${
          page.plantationNumberLine || "no plantation line"
        } — residents ${page.residentCount}`,
    ),
    "",
    "## First pages without structured transcription",
    "",
    ...withoutTranscription.slice(0, 80).map(
      (page) => `- Page ${page.page}, picture ${page.pictureId || "unknown"}: ${page.url}`,
    ),
    "",
  ].join("\n"),
);

console.log({
  total: manifest.length,
  withTranscription: withTranscription.length,
  withoutTranscription: withoutTranscription.length,
  json: OUT_JSON,
  report: OUT_MD,
});
