import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const HOME_SURFACES = [
  "app/page.tsx",
  "app/experiences/page.tsx",
  "components/home/home-live-status.tsx",
  "components/home/home-concierge-hub.tsx",
] as const;

const KNOWN_BAD_MAGENS_PATH = "/images/beaches/st-thomas/magens-bay-1.jpg";
const VERIFIED_MAGENS_PATH = "/images/places/st-thomas/magens-bay-beach-1.jpg";
const SELECTED_USVI_TAXI_IMAGE = "/images/mobility/usvi-taxi-van.png";

function source(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

function localImagePaths(text: string) {
  const paths = new Set<string>();
  const pattern = /["'`](\/images\/[^"'`?#]+)["'`]/g;
  for (const match of text.matchAll(pattern)) paths.add(match[1]);
  return [...paths];
}

function assertImageSignature(publicPath: string) {
  const filePath = resolve(root, "public", publicPath.replace(/^\//, ""));
  assert.ok(existsSync(filePath), `Homepage/activity image does not exist: ${publicPath}`);
  const size = statSync(filePath).size;
  assert.ok(size > 512, `Homepage/activity image is suspiciously small: ${publicPath} (${size} bytes)`);
  const bytes = readFileSync(filePath);
  const extension = extname(filePath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    assert.ok(bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff, `Homepage/activity image extension/content mismatch: ${publicPath} is not JPEG data`);
    return;
  }
  if (extension === ".png") {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    assert.ok(pngSignature.every((value, index) => bytes[index] === value), `Homepage/activity image extension/content mismatch: ${publicPath} is not PNG data`);
    return;
  }
  if (extension === ".webp") {
    assert.ok(bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP", `Homepage/activity image extension/content mismatch: ${publicPath} is not WebP data`);
    return;
  }
  if (extension === ".svg") {
    const text = bytes.toString("utf8", 0, Math.min(bytes.length, 4096));
    assert.match(text, /<svg\b/i, `Homepage/activity image extension/content mismatch: ${publicPath} is not SVG data`);
    return;
  }
  throw new Error(`Homepage/activity image integrity contract does not recognize ${extension}: ${publicPath}`);
}

const sources = HOME_SURFACES.map((path) => ({ path, text: source(path) }));
const allImages = new Set<string>();
for (const { path, text } of sources) {
  assert.ok(!text.includes(KNOWN_BAD_MAGENS_PATH), `${path} still references the mislabeled Magens Bay asset`);
  for (const imagePath of localImagePaths(text)) allImages.add(imagePath);
}

const home = source("app/page.tsx");
const primaryActions = source("components/home/home-primary-actions.tsx");
const intentLauncher = source("components/home/home-intent-launcher.tsx");

assert.match(home, /HomePrimaryActions/);
assert.match(home, /<HomePrimaryActions conciergeHref=\{CONCIERGE_START_HREF\} \/>/);
assert.match(primaryActions, /href="#traveler-intent"/);
assert.match(primaryActions, /Start my visit/);
assert.match(primaryActions, /trackAcquisitionEvent\("intent_selected"/);
assert.match(primaryActions, /trackAcquisitionEvent\("concierge_started"/);
assert.match(intentLauncher, /id="traveler-intent"/);
assert.match(intentLauncher, /Where are you in your Virgin Islands journey\?/);

assert.ok(source("components/home/home-concierge-hub.tsx").includes(VERIFIED_MAGENS_PATH), "Homepage Concierge Beach day must use the verified Magens Bay JPEG");
assert.ok(home.includes(SELECTED_USVI_TAXI_IMAGE), "Homepage Ride card must use the local user-selected white Ford USVI taxi van image");
assert.match(home, /label: "Ride"[\s\S]{0,360}detail: "Taxi · airport · ferry"/, "Homepage Ride card must explain its taxi, airport, and ferry scope");
assert.match(home, /label: "Ride"[\s\S]{0,420}icon: CarFront/);
assert.match(home, /White Ford passenger taxi van marked TAXI and ON DUTY on St\. Thomas/, "Homepage Ride image needs truthful accessible alt text");
assert.doesNotMatch(home, /label: "Ride"[\s\S]{0,420}red-hook-ferry-terminal-1\.jpg/, "Homepage Ride card must not fall back to the ferry-terminal photo");
assert.doesNotMatch(home, /https:\/\/usvitaxi\.com\/wp-content\/uploads\/2023\/03\/cropped-our_taxi\.jpg/, "Homepage must not hotlink the selected taxi van");
assert.doesNotMatch(home, /<img\b/, "Homepage quick cards must use Next Image rather than raw img elements");
const remoteQuickImages = [...home.matchAll(/image:\s*"(https:\/\/[^"\s]+)"/g)].map((match) => match[1]);
assert.deepEqual(remoteQuickImages, [], "Homepage quick cards must not depend on remote images");
assert.ok(allImages.has(SELECTED_USVI_TAXI_IMAGE), "Homepage/activity image audit must include the local selected taxi van");
assert.ok(allImages.size > 0, "No local homepage/activity images were discovered for integrity validation");
for (const imagePath of [...allImages].sort()) assertImageSignature(imagePath);

console.log(`USVI Explorer homepage/activity image integrity, local taxi asset, and hero intent handoff passed for ${allImages.size} local images.`);
