import fs from "node:fs";
import path from "node:path";

type AuditRow = {
  id: string;
  name: string;
  island: "stt" | "stj" | "stx";
  kind: string;
  status: string;
};

type CommonsPage = {
  title?: string;
  imageinfo?: Array<{
    thumburl?: string;
    descriptionurl?: string;
    extmetadata?: Record<string, { value?: string }>;
  }>;
};

const root = process.cwd();
const auditPath = path.join(root, "reports", "map-image-audit.json");
const outputPath = path.join(root, "reports", "map-image-wikimedia-candidates.json");
const reviewPath = path.join(root, "reports", "map-image-wikimedia-review.csv");
const islandNames = { stt: "Saint Thomas", stj: "Saint John", stx: "Saint Croix" };
const ignored = new Set(["the", "and", "saint", "st", "us", "virgin", "islands", "historic", "district"]);

function stripHtml(value = "") {
  return value.replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').trim();
}

function tokens(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter((token) => token.length > 2 && !ignored.has(token));
}

function score(name: string, title: string) {
  const wanted = new Set(tokens(name));
  const available = new Set(tokens(title));
  if (!wanted.size) return 0;
  let matches = 0;
  for (const token of wanted) if (available.has(token)) matches += 1;
  return Number((matches / wanted.size).toFixed(3));
}

function csv(value: unknown) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

async function candidates(row: AuditRow) {
  const query = `${row.name} ${islandNames[row.island]} U.S. Virgin Islands`;
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: query,
    gsrnamespace: "6",
    gsrlimit: "5",
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "1400",
  });
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "VI-Guide/1.0 (map image research)" },
  });
  if (!response.ok) throw new Error(`Commons returned ${response.status}`);
  const payload = await response.json() as { query?: { pages?: Record<string, CommonsPage> } };
  return Object.values(payload.query?.pages ?? {}).map((page) => {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata ?? {};
    return {
      title: page.title ?? "",
      score: score(row.name, page.title ?? ""),
      previewUrl: info?.thumburl ?? "",
      sourceUrl: info?.descriptionurl ?? "",
      creator: stripHtml(metadata.Artist?.value),
      license: stripHtml(metadata.LicenseShortName?.value),
      licenseUrl: stripHtml(metadata.LicenseUrl?.value),
      usageTerms: stripHtml(metadata.UsageTerms?.value),
    };
  }).filter((item) => item.previewUrl && item.sourceUrl).sort((a, b) => b.score - a.score);
}

async function main() {
  if (!fs.existsSync(auditPath)) throw new Error("Run npm run map-images:audit first.");
  const audit = JSON.parse(fs.readFileSync(auditPath, "utf8")) as { rows: AuditRow[] };
  const missing = audit.rows.filter((row) => ["missing", "placeholder", "broken-local"].includes(row.status));
  const rows = [] as Array<AuditRow & { queryStatus: string; candidates: Awaited<ReturnType<typeof candidates>> }>;
  for (const [index, row] of missing.entries()) {
    try {
      rows.push({ ...row, queryStatus: "review", candidates: await candidates(row) });
    } catch (error) {
      rows.push({ ...row, queryStatus: error instanceof Error ? error.message : String(error), candidates: [] });
    }
    if ((index + 1) % 20 === 0) console.log(`Searched ${index + 1}/${missing.length}`);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  fs.writeFileSync(outputPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2)}\n`);
  const headings = ["id", "name", "island", "kind", "candidateScore", "candidateTitle", "previewUrl", "sourceUrl", "creator", "license", "licenseUrl", "decision"];
  const review = rows.map((row) => {
    const candidate = row.candidates[0];
    return [row.id, row.name, row.island, row.kind, candidate?.score, candidate?.title, candidate?.previewUrl, candidate?.sourceUrl, candidate?.creator, candidate?.license, candidate?.licenseUrl, ""];
  });
  fs.writeFileSync(reviewPath, [headings, ...review].map((row) => row.map(csv).join(",")).join("\n") + "\n");
  console.table({ total: rows.length, withCandidate: rows.filter((row) => row.candidates.length).length, noCandidate: rows.filter((row) => !row.candidates.length).length });
  console.log("Wrote reports/map-image-wikimedia-candidates.json");
  console.log("Wrote reports/map-image-wikimedia-review.csv");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
