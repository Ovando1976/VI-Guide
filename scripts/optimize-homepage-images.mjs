import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const auditPath = "reports/homepage-image-audit.json";
const outputDir = "public/images/optimized/homepage";

const sourceFiles = [
  "src/data/generated/homepageImages.ts",
  "src/components/VisitorHome.tsx",
  "src/components/FeaturedIslandPicks.tsx",
];

if (!fs.existsSync(auditPath)) {
  throw new Error(`Missing ${auditPath}. Run the audit first.`);
}

fs.mkdirSync(outputDir, { recursive: true });

const audit = JSON.parse(fs.readFileSync(auditPath, "utf8"));

const uniqueLargeUrls = Array.from(
  new Set(
    audit.records
      .filter((item) => item.exists && item.bytes > 500 * 1024)
      .map((item) => item.url)
  )
);

const replacements = {};
const report = [];

for (const url of uniqueLargeUrls) {
  const inputPath = path.join("public", url.replace(/^\//, ""));

  if (!fs.existsSync(inputPath)) {
    throw new Error(`Missing source image: ${inputPath}`);
  }

  const hash = crypto.createHash("sha1").update(url).digest("hex").slice(0, 10);
  const parsed = path.parse(url);
  const safeBase = parsed.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const outputName = `${safeBase}-${hash}.webp`;
  const outputPath = path.join(outputDir, outputName);
  const outputUrl = `/images/optimized/homepage/${outputName}`;

  const metadata = await sharp(inputPath).metadata();

  const isHero = url.includes("sapphire-marina-1");
  const maxWidth = isHero ? 1600 : 1000;

  let pipeline = sharp(inputPath).rotate();

  if (metadata.width && metadata.width > maxWidth) {
    pipeline = pipeline.resize({
      width: maxWidth,
      withoutEnlargement: true,
    });
  }

  await pipeline.webp({ quality: 78, effort: 6 }).toFile(outputPath);

  const beforeBytes = fs.statSync(inputPath).size;
  const afterBytes = fs.statSync(outputPath).size;
  const outMeta = await sharp(outputPath).metadata();

  if (!fs.existsSync(outputPath)) {
    throw new Error(`Failed to create optimized image: ${outputPath}`);
  }

  replacements[url] = outputUrl;

  report.push({
    originalUrl: url,
    optimizedUrl: outputUrl,
    originalPath: inputPath,
    optimizedPath: outputPath,
    originalBytes: beforeBytes,
    optimizedBytes: afterBytes,
    originalKB: Math.round((beforeBytes / 1024) * 10) / 10,
    optimizedKB: Math.round((afterBytes / 1024) * 10) / 10,
    savedPercent: Math.round((100 - (afterBytes / beforeBytes) * 100) * 10) / 10,
    originalWidth: metadata.width ?? null,
    originalHeight: metadata.height ?? null,
    optimizedWidth: outMeta.width ?? null,
    optimizedHeight: outMeta.height ?? null,
  });
}

for (const file of sourceFiles) {
  if (!fs.existsSync(file)) continue;

  let text = fs.readFileSync(file, "utf8");
  const before = text;

  for (const [oldUrl, newUrl] of Object.entries(replacements)) {
    text = text.split(oldUrl).join(newUrl);
  }

  if (text !== before) {
    fs.writeFileSync(file, text);
  }
}

// Validate all optimized URLs exist after rewrite.
for (const newUrl of Object.values(replacements)) {
  const publicPath = path.join("public", newUrl.replace(/^\//, ""));
  if (!fs.existsSync(publicPath)) {
    throw new Error(`Rewritten URL does not exist: ${newUrl}`);
  }
}

// Validate no accidental duplicate output names.
const outputNames = report.map((item) => path.basename(item.optimizedPath));
const duplicateNames = outputNames.filter((name, index) => outputNames.indexOf(name) !== index);
if (duplicateNames.length) {
  throw new Error(`Duplicate output names created: ${duplicateNames.join(", ")}`);
}

fs.writeFileSync(
  "reports/homepage-image-optimization-report.json",
  JSON.stringify(
    {
      summary: {
        optimizedCount: report.length,
        totalOriginalKB: Math.round(report.reduce((sum, item) => sum + item.originalKB, 0) * 10) / 10,
        totalOptimizedKB: Math.round(report.reduce((sum, item) => sum + item.optimizedKB, 0) * 10) / 10,
        totalSavedKB:
          Math.round(
            (report.reduce((sum, item) => sum + item.originalKB, 0) -
              report.reduce((sum, item) => sum + item.optimizedKB, 0)) *
              10
          ) / 10,
      },
      replacements,
      report,
    },
    null,
    2
  )
);

const md = [];
md.push("# Homepage Image Optimization Report");
md.push("");
md.push("## Summary");
md.push(`- Optimized images: ${report.length}`);
md.push(
  `- Original total: ${
    Math.round(report.reduce((sum, item) => sum + item.originalKB, 0) * 10) / 10
  } KB`
);
md.push(
  `- Optimized total: ${
    Math.round(report.reduce((sum, item) => sum + item.optimizedKB, 0) * 10) / 10
  } KB`
);
md.push(
  `- Saved: ${
    Math.round(
      (report.reduce((sum, item) => sum + item.originalKB, 0) -
        report.reduce((sum, item) => sum + item.optimizedKB, 0)) *
        10
    ) / 10
  } KB`
);
md.push("");
md.push("## Optimized Files");

for (const item of report.sort((a, b) => b.originalBytes - a.originalBytes)) {
  md.push(
    `- \`${item.originalUrl}\` → \`${item.optimizedUrl}\` — ${item.originalKB} KB → ${item.optimizedKB} KB, saved ${item.savedPercent}%, ${item.originalWidth}×${item.originalHeight} → ${item.optimizedWidth}×${item.optimizedHeight}`
  );
}

fs.writeFileSync("reports/homepage-image-optimization-report.md", md.join("\n") + "\n");

console.log(JSON.stringify({
  optimizedCount: report.length,
  totalOriginalKB: Math.round(report.reduce((sum, item) => sum + item.originalKB, 0) * 10) / 10,
  totalOptimizedKB: Math.round(report.reduce((sum, item) => sum + item.optimizedKB, 0) * 10) / 10,
  replacements,
}, null, 2));
