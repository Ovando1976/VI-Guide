import assert from "node:assert/strict";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";

const root = process.cwd();
const HOME_SURFACES = [
  "app/page.tsx",
  "components/home/home-live-status.tsx",
  "components/home/home-concierge-hub.tsx",
] as const;

const KNOWN_BAD_MAGENS_PATH = "/images/beaches/st-thomas/magens-bay-1.jpg";
const VERIFIED_MAGENS_PATH = "/images/places/st-thomas/magens-bay-beach-1.jpg";

function source(path: string) {
  return readFileSync(resolve(root, path), "utf8");
}

function localImagePaths(text: string) {
  const paths = new Set<string>();
  const pattern = /["'`](\/images\/[^"'`?#]+)["'`]/g;
  for (const match of text.matchAll(pattern)) {
    paths.add(match[1]);
  }
  return [...paths];
}

function assertImageSignature(publicPath: string) {
  const filePath = resolve(root, "public", publicPath.replace(/^\//, ""));
  assert.ok(existsSync(filePath), `Homepage image does not exist: ${publicPath}`);

  const size = statSync(filePath).size;
  assert.ok(size > 512, `Homepage image is suspiciously small: ${publicPath} (${size} bytes)`);

  const bytes = readFileSync(filePath);
  const extension = extname(filePath).toLowerCase();

  if (extension === ".jpg" || extension === ".jpeg") {
    assert.ok(
      bytes.length >= 3 &&
        bytes[0] === 0xff &&
        bytes[1] === 0xd8 &&
        bytes[2] === 0xff,
      `Homepage image extension/content mismatch: ${publicPath} is not JPEG data`,
    );
    return;
  }

  if (extension === ".png") {
    const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    assert.ok(
      pngSignature.every((value, index) => bytes[index] === value),
      `Homepage image extension/content mismatch: ${publicPath} is not PNG data`,
    );
    return;
  }

  if (extension === ".webp") {
    assert.ok(
      bytes.length >= 12 &&
        bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
        bytes.subarray(8, 12).toString("ascii") === "WEBP",
      `Homepage image extension/content mismatch: ${publicPath} is not WebP data`,
    );
    return;
  }

  if (extension === ".svg") {
    const text = bytes.toString("utf8", 0, Math.min(bytes.length, 4096));
    assert.match(text, /<svg\b/i, `Homepage image extension/content mismatch: ${publicPath} is not SVG data`);
    return;
  }

  throw new Error(`Homepage image integrity contract does not recognize ${extension}: ${publicPath}`);
}

const sources = HOME_SURFACES.map((path) => ({ path, text: source(path) }));
const allImages = new Set<string>();

for (const { path, text } of sources) {
  assert.ok(
    !text.includes(KNOWN_BAD_MAGENS_PATH),
    `${path} still references the mislabeled Magens Bay asset`,
  );

  for (const imagePath of localImagePaths(text)) {
    allImages.add(imagePath);
  }
}

const home = source("app/page.tsx");
assert.ok(
  source("components/home/home-concierge-hub.tsx").includes(VERIFIED_MAGENS_PATH),
  "Homepage Concierge Beach day must use the verified Magens Bay JPEG",
);
assert.doesNotMatch(
  home,
  /usvitaxi\.com|Annie's Taxi Service/,
  "Homepage must not ship the unlicensed Annie's Taxi image or attribution",
);
assert.doesNotMatch(
  home,
  /image:\s*"https:\/\//,
  "Homepage quick-card images must be locally controlled assets with documented reuse rights",
);
assert.ok(allImages.size > 0, "No local homepage images were discovered for integrity validation");

for (const imagePath of [...allImages].sort()) {
  assertImageSignature(imagePath);
}

console.log(`VI Guide homepage image integrity passed for ${allImages.size} unique local images.`);
