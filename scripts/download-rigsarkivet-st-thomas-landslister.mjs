import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const SERIES_ID = 1514;
const FIRST_VIEW_VALUES_ID = 408597;
const START_PAGE = 1;
const END_PAGE = 693;

const OUT_DIR = "generated/rigsarkivet/st-thomas-landslister-1688-1718";
const OUT_JSON = `${OUT_DIR}/st-thomas-landslister-pages.json`;
const OUT_MD = "reports/estate-history/st-thomas-landslister-download-report.md";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function decodeEntities(text) {
  return String(text ?? "")
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|tr|li|h1|h2|h3|h4|td|th)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n[ \t]+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim(),
  );
}

function valueAfterLabelFromText(text, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escaped}\\s+([^\\n]+)`, "i"));
  return decodeEntities(match?.[1] || "").trim();
}

function collectBeboere(text) {
  const residents = [];
  const re = /Beboer\s+([^\n*]+?)(?=\n|Beboere|Anden tekst|Kommentarer|$)/gi;
  let match;

  while ((match = re.exec(text))) {
    const value = decodeEntities(match[1]).replace(/\s+/g, " ").trim();
    if (value && !residents.includes(value)) residents.push(value);
  }

  return residents;
}

function collectComments(text) {
  const comments = [];

  for (const label of ["Kommentarer", "Anden tekst"]) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`${escaped}\\s+([^\\n]+)`, "gi");
    let match;

    while ((match = re.exec(text))) {
      const value = decodeEntities(match[1]).replace(/\s+/g, " ").trim();
      if (value && value !== label && !comments.includes(value)) {
        comments.push(value);
      }
    }
  }

  return comments;
}

function parsePage(page, pictureId, html, url) {
  const text = htmlToText(html);

  return {
    source: {
      project: "Dansk Vestindien",
      archiveCreator:
        "Vestindisk-Guineisk Kompagni, Bogholderen, St. Thomas og St. Jan",
      archiveSeries: "Landslister for St. Thomas",
      content: "1688 - 1718",
      pictureSeriesId: SERIES_ID,
      pictureId,
      page,
      endpoint: "view-values",
      url,
    },
    proofread: /Korrekturlæst/i.test(text),
    year: valueAfterLabelFromText(text, "Årstal"),
    islandName: valueAfterLabelFromText(text, "Øens navn"),
    plantationNumberLine: valueAfterLabelFromText(
      text,
      "Gadenavn eller plantagenavn og matrikelnr.",
    ),
    residents: collectBeboere(text),
    comments: collectComments(text),
    rawText: text,
  };
}

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(path.dirname(OUT_MD), { recursive: true });

const pages = [];

for (let page = START_PAGE; page <= END_PAGE; page += 1) {
  const pictureId = FIRST_VIEW_VALUES_ID + page - 1;
  const url = `https://cs.rigsarkivet.dk/picture/view-values/${pictureId}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "VI-Guide historical research downloader; contact: ovandorawlins@gmail.com",
        Accept: "text/html",
      },
    });

    if (!res.ok) {
      pages.push({ page, pictureId, error: `HTTP ${res.status}`, url });
      console.log(`page ${page}/${END_PAGE} | id=${pictureId} | HTTP ${res.status}`);
      await delay(200);
      continue;
    }

    const html = await res.text();
    const parsed = parsePage(page, pictureId, html, url);
    pages.push(parsed);

    console.log(
      `page ${page}/${END_PAGE} | id=${pictureId} | year=${parsed.year || "-"} | line=${parsed.plantationNumberLine || "-"} | residents=${parsed.residents.length}`,
    );

    await delay(200);
  } catch (error) {
    pages.push({ page, pictureId, error: error.message, url });
    console.log(`page ${page}/${END_PAGE} | id=${pictureId} | ${error.message}`);
    await delay(500);
  }
}

writeFileSync(OUT_JSON, JSON.stringify(pages, null, 2));

const good = pages.filter((p) => !p.error);
const useful = good.filter(
  (p) => p.year || p.plantationNumberLine || p.residents?.length,
);

writeFileSync(
  OUT_MD,
  [
    "# St. Thomas Landslister Download Report",
    "",
    `Pages attempted: ${pages.length}`,
    `Pages downloaded: ${good.length}`,
    `Useful pages: ${useful.length}`,
    `Pages with year: ${good.filter((p) => p.year).length}`,
    `Pages with plantation/cadastral line: ${good.filter((p) => p.plantationNumberLine).length}`,
    `Pages with residents: ${good.filter((p) => p.residents?.length).length}`,
    "",
    `First view-values picture ID used: ${FIRST_VIEW_VALUES_ID}`,
    `Output JSON: ${OUT_JSON}`,
  ].join("\n"),
);

console.log({
  attempted: pages.length,
  downloaded: good.length,
  useful: useful.length,
  json: OUT_JSON,
  report: OUT_MD,
});
