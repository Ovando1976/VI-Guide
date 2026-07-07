import fs from "node:fs";
import path from "node:path";

const seedsPath = path.resolve("imports/accommodation-image-source-seeds.csv");
const generatedPath = path.resolve("src/data/customerBookingCatalog.generated.ts");
const outJson = path.resolve("reports/accommodation-public-image-candidates.json");
const outCsv = path.resolve("reports/accommodation-public-image-candidates.csv");

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
  return rows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]))
  );
}

function extractGeneratedRecords(text) {
  const marker = "= [";
  const startMarker = text.indexOf(marker);
  if (startMarker === -1) return [];

  const start = text.indexOf("[", startMarker);
  const end = text.lastIndexOf("];");
  if (start === -1 || end === -1 || end <= start) return [];

  return JSON.parse(text.slice(start, end + 1));
}

function normalizeUrl(value, base) {
  if (!value) return "";
  try {
    return new URL(value, base).toString();
  } catch {
    return "";
  }
}

function decodeHtml(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#x2F;/g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function metaContent(html, names) {
  const hits = [];

  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "ig"),
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "ig"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["'][^>]*>`, "ig"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`, "ig"),
    ];

    for (const pattern of patterns) {
      for (const match of html.matchAll(pattern)) {
        if (match[1]) hits.push(decodeHtml(match[1]));
      }
    }
  }

  return hits;
}

function imageTags(html) {
  const hits = [];
  const imgPattern = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/ig;

  for (const match of html.matchAll(imgPattern)) {
    const src = decodeHtml(match[1]);
    const nearby = match[0].toLowerCase();

    if (
      nearby.includes("hero") ||
      nearby.includes("hotel") ||
      nearby.includes("resort") ||
      nearby.includes("villa") ||
      nearby.includes("beach") ||
      nearby.includes("room") ||
      nearby.includes("property")
    ) {
      hits.push(src);
    }
  }

  return hits;
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 VI-Guide image candidate discovery; license review required",
      },
    });

    const html = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
      html,
    };
  } finally {
    clearTimeout(timeout);
  }
}

const seeds = readCsvObjects(seedsPath);
const generatedText = fs.existsSync(generatedPath)
  ? fs.readFileSync(generatedPath, "utf8")
  : "";
const catalog = extractGeneratedRecords(generatedText);

const seedByName = new Map(
  seeds.map((seed) => [seed.businessName.trim().toLowerCase(), seed])
);

const targets = seeds.map((seed) => {
  const record =
    catalog.find(
      (item) =>
        item.businessName.toLowerCase() === seed.businessName.trim().toLowerCase()
    ) || {};

  return {
    ...record,
    businessName: seed.businessName.trim(),
    officialUrl: seed.officialUrl.trim(),
    notes: seed.notes.trim(),
  };
});

const results = [];

for (const target of targets) {
  console.log(`Checking ${target.businessName} -> ${target.officialUrl}`);

  try {
    const page = await fetchPage(target.officialUrl);

    const candidates = [
      ...metaContent(page.html, [
        "og:image",
        "og:image:secure_url",
        "twitter:image",
        "twitter:image:src",
      ]),
      ...imageTags(page.html),
    ]
      .map((url) => normalizeUrl(url, page.finalUrl || target.officialUrl))
      .filter(Boolean);

    const unique = [...new Set(candidates)].slice(0, 8);

    results.push({
      businessName: target.businessName,
      category: target.category || "",
      island: target.island || "",
      officialUrl: target.officialUrl,
      fetchStatus: page.status,
      finalUrl: page.finalUrl,
      candidateCount: unique.length,
      candidates: unique.map((url, index) => ({
        rank: index + 1,
        imageUrl: url,
        sourcePage: page.finalUrl || target.officialUrl,
        sourceName: "Official website public image candidate",
        imageStatus: "needs_review",
        usageNote:
          "Publicly discoverable image candidate. Do not download or publish until license/permission is confirmed.",
      })),
    });
  } catch (error) {
    results.push({
      businessName: target.businessName,
      category: target.category || "",
      island: target.island || "",
      officialUrl: target.officialUrl,
      fetchStatus: "error",
      finalUrl: "",
      candidateCount: 0,
      error: error instanceof Error ? error.message : String(error),
      candidates: [],
    });
  }
}

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(
  outJson,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      totalTargets: results.length,
      targetsWithCandidates: results.filter((item) => item.candidateCount > 0).length,
      results,
    },
    null,
    2
  )
);

const csvRows = [
  [
    "businessName",
    "category",
    "island",
    "rank",
    "imageUrl",
    "sourcePage",
    "sourceName",
    "imageStatus",
    "usageNote",
  ],
];

for (const result of results) {
  if (!result.candidates.length) {
    csvRows.push([
      result.businessName,
      result.category || "",
      result.island || "",
      "",
      "",
      result.finalUrl || result.officialUrl,
      "No candidate found",
      "needs_review",
      result.error || "No public image candidate found from page metadata",
    ]);
    continue;
  }

  for (const candidate of result.candidates) {
    csvRows.push([
      result.businessName,
      result.category || "",
      result.island || "",
      String(candidate.rank),
      candidate.imageUrl,
      candidate.sourcePage,
      candidate.sourceName,
      candidate.imageStatus,
      candidate.usageNote,
    ]);
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

fs.writeFileSync(
  outCsv,
  csvRows.map((row) => row.map(csvEscape).join(",")).join("\n")
);

console.log(`Wrote ${outJson}`);
console.log(`Wrote ${outCsv}`);
console.table({
  totalTargets: results.length,
  targetsWithCandidates: results.filter((item) => item.candidateCount > 0).length,
});
