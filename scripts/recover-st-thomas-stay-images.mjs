import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const OUTPUT_DIR = path.join(ROOT, "public/images/accommodations");
const MANIFEST_PATH = path.join(ROOT, "data/accommodation-image-sources.json");

const properties = [
  ["hampton-by-hilton-st-thomas", "https://www.hilton.com/en/hotels/sttunhx-hampton-st-thomas/", "https://www.hilton.com/im/en/STTUNHX/25144957/hampton-main-2.jpg?ch=2799&cw=5000&gravity=NorthWest&impolicy=crop&rh=900&rw=1600&xposition=0&yposition=266"],
  ["the-ritz-carlton-st-thomas", "https://www.ritzcarlton.com/en/hotels/sttrz-the-ritz-carlton-st-thomas/overview/", "https://cache.marriott.com/is/image/marriotts7prod/rz-sttrz-rc-st-thomas-14503-79098%3AFeature-Hor?fit=constrain&wid=1600"],
  ["marriotts-frenchmans-cove", "https://www.marriott.com/en-us/hotels/sttuv-marriotts-frenchmans-cove/photos/", "https://cache.marriott.com/is/image/marriotts7prod/mv-sttuv-exterior21905-19267%3AWide-Hor?fit=constrain&wid=1600"],
  ["margaritaville-vacation-club-st-thomas", "https://www.stthomasmargaritaville.com/"],
  ["bluebeards-castle-resort", "https://www.bluebeards-castle.com/"],
  ["limetree-beach-resort-by-club-wyndham", "https://clubwyndham.wyndhamdestinations.com/us/en/resorts/featured-destinations/limetree-beach-resort"],
  ["elysian-beach-resort", "https://worldmark.wyndhamdestinations.com/us/en/resorts/united-states-of-america/virgin-islands/st-thomas/worldmark-elysian-beach-resort"],
  ["sapphire-beach-resort-and-marina", "https://www.usvisapphire.com/about-us"],
  ["sapphire-village-resort", "https://sapphirevillage.com/photos/"],
  ["flamboyan-on-the-bay-resort-villas", "https://www.fbrvi.com/resort/"],
  ["windward-passage-hotel", "https://www.windwardpassage.com/photo-gallery/"],
  ["the-mafolie-hotel", "https://www.mafolie.com/"],
  ["the-pink-palm-hotel", "https://www.pinkpalmhotel.com/"],
  ["hotel-1829", "https://www.hotel1829vi.com/about"],
  ["bunker-hill-hotel", "https://www.bunkerhillhotel.com/"],
  ["galleon-house-hotel", "https://www.galleonhouse.com/"],
  ["the-island-view-guesthouse", "https://www.islandviewstthomas.com/"],
  ["sunset-gardens-guesthouse", "https://sunsetgardensguesthouse.com/"],
  ["boundless-bliss-hotel", "https://www.boundlessblisshotel.com/"],
  ["pavilions-and-pools-resort", "http://www.pavilionsandpools.com/virtualtour.html"],
  ["tillett-gardens-guest-house", "https://tillettgardens.com/"],
];

const headers = {
  "user-agent": "Mozilla/5.0 (compatible; VI-Guide/1.0; accommodation image recovery)",
  accept: "text/html,application/xhtml+xml,image/avif,image/webp,image/jpeg,image/png,*/*",
};

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&#x2F;", "/")
    .replaceAll("&#47;", "/")
    .replaceAll("&quot;", '"');
}

function imagesFromHtml(html, pageUrl) {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/i,
  ];
  const candidates = [];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) candidates.push(match[1]);
  }
  for (const match of html.matchAll(/<(?:img|source)[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi)) {
    candidates.push(match[1]);
  }
  for (const match of html.matchAll(/<(?:img|source)[^>]+srcset=["']([^"']+)["']/gi)) {
    const best = match[1].split(",").at(-1)?.trim().split(/\s+/)[0];
    if (best) candidates.push(best);
  }
  for (const match of html.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) candidates.push(match[1]);
  return Array.from(new Set(candidates.map(decodeHtml)))
    .filter((value) => !/^(?:data:|javascript:|#)/i.test(value))
    .filter((value) => !/(?:logo|icon|favicon|sprite|avatar|badge|pixel|tracking)/i.test(value))
    .map((value) => {
      try { return new URL(value, pageUrl).href; } catch { return null; }
    })
    .filter(Boolean);
}

function extension(contentType) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("avif")) return "avif";
  return "jpg";
}

async function fetchChecked(url, referer) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { ...headers, ...(referer ? { referer } : {}) },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

function pageVariants(url) {
  const parsed = new URL(url);
  const hosts = new Set([parsed.host]);
  if (parsed.host.startsWith("www.")) hosts.add(parsed.host.slice(4));
  else hosts.add(`www.${parsed.host}`);
  return [...hosts].flatMap((host) => ["https:", "http:"].map((protocol) => {
    const candidate = new URL(parsed.href);
    candidate.protocol = protocol;
    candidate.host = host;
    return candidate.href;
  }));
}

async function discoverCandidates(propertyWebsite) {
  const errors = [];
  for (const pageUrl of pageVariants(propertyWebsite)) {
    try {
      const page = await fetchChecked(pageUrl);
      const candidates = imagesFromHtml(await page.text(), page.url);
      if (candidates.length) return candidates;
      errors.push(`${pageUrl}: no usable image markup`);
    } catch (error) {
      errors.push(`${pageUrl}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(errors.join("; "));
}

async function downloadFirstUsable(candidates, propertyWebsite) {
  const errors = [];
  for (const sourceUrl of candidates.slice(0, 80)) {
    try {
      const image = await fetchChecked(sourceUrl, propertyWebsite);
      const type = image.headers.get("content-type") || "";
      if (!type.startsWith("image/")) continue;
      const bytes = Buffer.from(await image.arrayBuffer());
      if (bytes.length < 20_000) continue;
      return { sourceUrl, type, bytes };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  throw new Error(`No usable official image (${errors.slice(0, 3).join(", ") || "candidates were too small"})`);
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, "utf8"));
let recovered = 0;
const failures = [];

for (const [slug, propertyWebsite, override] of properties) {
  try {
    const candidates = override ? [override] : await discoverCandidates(propertyWebsite);
    const { sourceUrl, type, bytes } = await downloadFirstUsable(candidates, propertyWebsite);
    const ext = extension(type);
    const filename = `${slug}.${ext}`;
    await fs.writeFile(path.join(OUTPUT_DIR, filename), bytes);
    manifest[slug] = {
      localPath: `/images/accommodations/${filename}`,
      sourceUrl,
      propertyWebsite,
      retrievedAt: new Date().toISOString(),
    };
    recovered += 1;
    console.log(`Recovered ${slug} -> ${filename}`);
  } catch (error) {
    failures.push({ slug, propertyWebsite, error: error instanceof Error ? error.message : String(error) });
    console.warn(`Skipped ${slug}: ${failures.at(-1).error}`);
  }
}

await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
await fs.writeFile(
  path.join(ROOT, "st-thomas-image-recovery-report.json"),
  `${JSON.stringify({ recovered, failed: failures.length, failures }, null, 2)}\n`,
);
console.log(`Finished: ${recovered} recovered, ${failures.length} need manual review.`);
if (failures.length) process.exitCode = 2;
