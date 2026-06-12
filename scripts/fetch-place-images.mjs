import fs from "node:fs";
import path from "node:path";

const CSV = "reports/missing-place-images.csv";
const PUBLIC_DIR = "public";
const REPORT = "reports/fetched-place-images.json";
const DRY_RUN = process.argv.includes("--dry-run");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const rows = [];
  for (const line of lines.slice(1)) {
    const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)"$/);
    if (!m) continue;
    rows.push({
      title: m[1].replaceAll('""', '"'),
      imagePath: m[3].replaceAll('""', '"'),
    });
  }
  return rows;
}

function islandFromPath(imagePath) {
  if (imagePath.includes("/st-thomas/")) return "St. Thomas";
  if (imagePath.includes("/st-john/")) return "St. John";
  if (imagePath.includes("/st-croix/")) return "St. Croix";
  if (imagePath.includes("/water-island/")) return "Water Island";
  return "U.S. Virgin Islands";
}

function scoreImage(title, island, fileTitle) {
  const hay = fileTitle.toLowerCase();
  const words = title.toLowerCase().replace(/[^a-z0-9 ]/g, "").split(/\s+/).filter(Boolean);

  let score = 0;
  for (const word of words) {
    if (word.length > 2 && hay.includes(word)) score += 5;
  }

  if (hay.includes("virgin islands")) score += 8;
  if (hay.includes("usvi")) score += 8;
  if (hay.includes(island.toLowerCase())) score += 12;
  if (hay.includes("beach")) score += 4;
  if (hay.includes("restaurant")) score += 3;
  if (hay.includes("logo")) score -= 20;
  if (hay.includes("map")) score -= 10;

  return score;
}

async function commonsSearch(title, island) {
  const queries = [
    `${title} ${island}`,
    `${title} U.S. Virgin Islands`,
    `${title} USVI`,
    title,
  ];

  const seen = new Set();
  const candidates = [];

  for (const q of queries) {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", `${q} filetype:bitmap`);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", "10");
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime|size|extmetadata");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");

    const res = await fetch(url);
    if (!res.ok) continue;

    const json = await res.json();
    const pages = Object.values(json.query?.pages || {});

    for (const page of pages) {
      if (seen.has(page.title)) continue;
      seen.add(page.title);

      const info = page.imageinfo?.[0];
      if (!info?.url) continue;
      if (!["image/jpeg", "image/png", "image/webp"].includes(info.mime)) continue;
      if ((info.width || 0) < 500 || (info.height || 0) < 350) continue;

      candidates.push({
        title: page.title,
        url: info.url,
        mime: info.mime,
        width: info.width,
        height: info.height,
        license: info.extmetadata?.LicenseShortName?.value || "",
        artist: info.extmetadata?.Artist?.value || "",
        credit: info.extmetadata?.Credit?.value || "",
        score: scoreImage(title, island, page.title),
      });
    }

    await sleep(700);
  }

  return candidates.sort((a, b) => b.score - a.score);
}

async function download(url, outPath) {
  const res = await fetch(url, {
    headers: { "User-Agent": "USVIExplorerImageFetcher/1.0" },
  });

  if (!res.ok) throw new Error(`Download failed: ${res.status}`);

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
}

const csv = fs.readFileSync(CSV, "utf8");
const rows = parseCsv(csv);

const report = [];

for (const row of rows) {
  const diskPath = path.join(PUBLIC_DIR, row.imagePath.replace(/^\//, ""));

  if (fs.existsSync(diskPath)) {
    report.push({ ...row, status: "already_exists" });
    continue;
  }

  const island = islandFromPath(row.imagePath);
  console.log(`Searching: ${row.title} (${island})`);

  try {
    const candidates = await commonsSearch(row.title, island);
    const best = candidates[0];

    if (!best || best.score < 8) {
      console.log(`  No strong Commons match.`);
      report.push({
        ...row,
        status: "not_found",
        island,
        candidates: candidates.slice(0, 5),
      });
      continue;
    }

    console.log(`  Best: ${best.title} score=${best.score}`);

    if (!DRY_RUN) {
      await download(best.url, diskPath);
      console.log(`  Saved: ${diskPath}`);
    }

    report.push({
      ...row,
      status: DRY_RUN ? "dry_run_match" : "downloaded",
      island,
      selected: best,
      candidates: candidates.slice(0, 5),
    });

    await sleep(1200);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
    report.push({
      ...row,
      status: "error",
      error: err.message,
    });
  }
}

fs.writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");

console.log("");
console.log(`Report written: ${REPORT}`);
console.log(`Downloaded: ${report.filter((r) => r.status === "downloaded").length}`);
console.log(`Not found: ${report.filter((r) => r.status === "not_found").length}`);
console.log(`Errors: ${report.filter((r) => r.status === "error").length}`);
