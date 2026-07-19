import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const catalogPath = path.join(root, "lib/accommodations.ts");
const outputDir = path.join(root, "public/images/accommodations");
const manifestPath = path.join(root, "data/accommodation-image-sources.json");
const overridesPath = path.join(root, "data/accommodation-image-overrides.json");
const source = await readFile(catalogPath, "utf8");
const overrides = JSON.parse(await readFile(overridesPath, "utf8"));
let entries = Array.from(source.matchAll(/\{ name: \"([^\"]+)\"[\s\S]*?website: \"([^\"]+)\"/g)).map((match) => ({
  name: match[1],
  website: match[2],
  slug: match[1].toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
}));
const requestedSlugs = new Set(process.argv.slice(2));
if (requestedSlugs.size) entries = entries.filter((entry) => requestedSlugs.has(entry.slug));

await mkdir(outputDir, { recursive: true });
let manifest = {};
try { manifest = JSON.parse(await readFile(manifestPath, "utf8")); } catch {}

function metaContent(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i"),
  ];
  return patterns.map((pattern) => html.match(pattern)?.[1]).find(Boolean);
}

for (const entry of entries) {
  try {
    const page = overrides[entry.slug] ? null : await fetch(entry.website, {
      redirect: "follow",
      headers: { "user-agent": "VI Guide catalog verifier/1.0" },
      signal: AbortSignal.timeout(25000),
    });
    if (page && !page.ok) throw new Error(`property site returned ${page.status}`);
    const finalUrl = page?.url ?? entry.website;
    const html = page ? await page.text() : "";
    const candidate = overrides[entry.slug] || metaContent(html, "og:image") || metaContent(html, "twitter:image");
    if (!candidate) throw new Error("no verified first-party image found");

    const sourceUrl = new URL(candidate.replace(/&amp;/g, "&"), finalUrl).href;
    const image = await fetch(sourceUrl, {
      redirect: "follow",
      headers: { "user-agent": "VI Guide catalog verifier/1.0", referer: finalUrl },
      signal: AbortSignal.timeout(25000),
    });
    if (!image.ok) throw new Error(`image returned ${image.status}`);
    const contentType = image.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) throw new Error(`unexpected ${contentType || "content type"}`);

    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${entry.slug}.${extension}`;
    await writeFile(path.join(outputDir, filename), Buffer.from(await image.arrayBuffer()));
    manifest[entry.slug] = {
      localPath: `/images/accommodations/${filename}`,
      sourceUrl,
      propertyWebsite: finalUrl,
      retrievedAt: new Date().toISOString(),
    };
    console.log(`✓ ${entry.name}`);
  } catch (error) {
    manifest[entry.slug] = {
      propertyWebsite: entry.website,
      error: error instanceof Error ? error.message : String(error),
      retrievedAt: new Date().toISOString(),
    };
    console.warn(`– ${entry.name}: ${manifest[entry.slug].error}`);
  }
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const successCount = Object.values(manifest).filter((entry) => entry.localPath).length;
console.log(`Downloaded ${successCount} of ${entries.length} property images.`);
