import fs from "node:fs";
import path from "node:path";

const seedsPath = path.resolve("imports/accommodation-image-source-seeds.csv");
const catalogPath = path.resolve("imports/usvi-accommodations-catalog.csv");
const reportJson = path.resolve("reports/accommodation-official-image-candidates.json");
const reportCsv = path.resolve("reports/accommodation-official-image-candidates.csv");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
      continue;
    }

    if (ch === '"') {
      quoted = !quoted;
      continue;
    }

    if (ch === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += ch;
  }

  if (cell || row.length) {
    row.push(cell);
    if (row.some((value) => value.trim())) rows.push(row);
  }

  return rows;
}

function readCsvObjects(file) {
  const raw = fs.readFileSync(file, "utf8");
  const [headers, ...rows] = parseCsv(raw);
  return {
    headers,
    rows: rows.map((row) =>
      Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))
    ),
  };
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function writeCsv(file, headers, rows) {
  const output = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header] || "")).join(",")),
  ].join("\n");

  fs.writeFileSync(file, output);
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeUrl(value, base) {
  if (!value) return "";
  try {
    return new URL(decodeHtml(value), base).toString();
  } catch {
    return "";
  }
}

function extractMetaImages(html, baseUrl) {
  const candidates = [];
  const names = ["og:image", "og:image:secure_url", "twitter:image", "twitter:image:src"];

  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "ig"),
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "ig"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["'][^>]*>`, "ig"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`, "ig"),
    ];

    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        const url = normalizeUrl(match[1], baseUrl);
        if (url) candidates.push(url);
      }
    }
  }

  const imgPattern = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/ig;

  for (const match of html.matchAll(imgPattern)) {
    const tag = match[0].toLowerCase();
    const url = normalizeUrl(match[1], baseUrl);

    if (!url) continue;

    if (
      tag.includes("hero") ||
      tag.includes("hotel") ||
      tag.includes("resort") ||
      tag.includes("villa") ||
      tag.includes("property") ||
      tag.includes("room") ||
      tag.includes("beach")
    ) {
      candidates.push(url);
    }
  }

  return [...new Set(candidates)].filter((url) =>
    /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
  );
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 VI-Guide official image discovery; contact for partnership/permission",
      },
    });

    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
      html: await res.text(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

const seedData = readCsvObjects(seedsPath);
const catalogData = readCsvObjects(catalogPath);

const headers = [...catalogData.headers];

for (const field of [
  "imageAlt",
  "imageSourceName",
  "imageSourceUrl",
  "imageStatus",
]) {
  if (!headers.includes(field)) headers.push(field);
}

const report = [];

for (const seed of seedData.rows) {
  const businessName = seed.businessName.trim();
  const officialUrl = seed.officialUrl.trim();

  console.log(`Finding official image: ${businessName}`);

  try {
    const page = await fetchPage(officialUrl);
    const candidates = extractMetaImages(page.html, page.finalUrl || officialUrl);
    const selected = candidates[0] || "";

    report.push({
      businessName,
      officialUrl,
      fetchStatus: page.status,
      finalUrl: page.finalUrl,
      selectedImage: selected,
      candidates: candidates.slice(0, 10),
      usageNote:
        "Official public image candidate. Use provisionally; replace with partner-approved image or remove if business declines.",
    });

    if (!selected) continue;

    for (const row of catalogData.rows) {
      if (row.businessName.trim().toLowerCase() !== businessName.toLowerCase()) continue;

      row.image = selected;
      row.imageAlt = `${businessName} official property image`;
      row.imageSourceName = "Official website public image candidate";
      row.imageSourceUrl = page.finalUrl || officialUrl;
      row.imageStatus = "official_public_candidate";
      row.sourceUrl = row.sourceUrl || officialUrl;
      row.sourceName = row.sourceName || "Official website";
      row.lastVerified = row.lastVerified || "needs_partner_permission";
      row.verificationStatus = row.verificationStatus || "needs_review";
    }
  } catch (error) {
    report.push({
      businessName,
      officialUrl,
      fetchStatus: "error",
      finalUrl: "",
      selectedImage: "",
      candidates: [],
      error: error instanceof Error ? error.message : String(error),
      usageNote:
        "Could not fetch official image candidate. Keep placeholder until manual review.",
    });
  }
}

writeCsv(catalogPath, headers, catalogData.rows);

fs.mkdirSync(path.dirname(reportJson), { recursive: true });
fs.writeFileSync(
  reportJson,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      total: report.length,
      selected: report.filter((item) => item.selectedImage).length,
      records: report,
    },
    null,
    2
  )
);

const flatRows = [
  [
    "businessName",
    "officialUrl",
    "selectedImage",
    "sourcePage",
    "candidateCount",
    "usageNote",
  ],
];

for (const item of report) {
  flatRows.push([
    item.businessName,
    item.officialUrl,
    item.selectedImage || "",
    item.finalUrl || item.officialUrl,
    String(item.candidates?.length || 0),
    item.usageNote || item.error || "",
  ]);
}

fs.writeFileSync(
  reportCsv,
  flatRows.map((row) => row.map(csvEscape).join(",")).join("\n")
);

console.log(`Wrote ${reportJson}`);
console.log(`Wrote ${reportCsv}`);
console.table({
  total: report.length,
  selected: report.filter((item) => item.selectedImage).length,
});
