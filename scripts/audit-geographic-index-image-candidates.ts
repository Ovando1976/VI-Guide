// @ts-nocheck

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { geographicIndex } from "../src/data/core/geographicIndex";

const ROOT = process.cwd();

const REPORT_IN = path.join(ROOT, "reports/data-cleanliness-report.json");
const REPORT_OUT = path.join(ROOT, "reports/geographic-index-image-candidates.json");

const IMAGE_ROOTS = [
  "public/images",
  "public/img",
  "public/assets",
  "public",
].map((file) => path.join(ROOT, file));

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);

const GENERIC_WORDS = new Set([
  "estate",
  "historic",
  "district",
  "site",
  "place",
  "point",
  "bay",
  "road",
  "street",
  "island",
  "st",
  "saint",
  "the",
  "and",
  "of",
  "national",
  "park",
  "plantation",
  "great",
  "house",
  "school",
  "church",
  "manse",
  "fort",
  "ruin",
  "ruins",
]);

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalize(value: unknown) {
  return stripDiacritics(String(value || ""))
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9']+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slug(value: unknown) {
  return normalize(value)
    .replace(/\bst croix\b/g, " ")
    .replace(/\bst thomas\b/g, " ")
    .replace(/\bst john\b/g, " ")
    .replace(/\bwater island\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanSlug(value: unknown) {
  return slug(value)
    .split("-")
    .filter((token) => token && !GENERIC_WORDS.has(token))
    .join("-");
}

function tokens(value: unknown) {
  return cleanSlug(value).split("-").filter(Boolean);
}

function tokenOverlap(a: unknown, b: unknown) {
  const left = new Set(tokens(a));
  const right = new Set(tokens(b));

  if (!left.size || !right.size) return 0;

  let same = 0;
  for (const token of left) {
    if (right.has(token)) same += 1;
  }

  return same / new Set([...left, ...right]).size;
}

function levenshtein(a: string, b: string) {
  const left = cleanSlug(a);
  const right = cleanSlug(b);

  const m = left.length;
  const n = right.length;

  if (!m || !n) return Math.max(m, n);

  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i += 1) dp[i][0] = i;
  for (let j = 0; j <= n; j += 1) dp[0][j] = j;

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[m][n];
}

function similarity(a: string, b: string) {
  const left = cleanSlug(a);
  const right = cleanSlug(b);

  if (!left || !right) return 0;

  const distance = levenshtein(left, right);
  return 1 - distance / Math.max(left.length, right.length);
}

function listFilesRecursive(dir: string) {
  const files = [];

  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);

    if (stat.isDirectory()) {
      if (
        full.includes("/public/data") ||
        full.includes("/public/geo") ||
        full.includes("/public/tiles")
      ) {
        continue;
      }

      files.push(...listFilesRecursive(full));
      continue;
    }

    const ext = path.extname(entry).toLowerCase();

    if (IMAGE_EXTENSIONS.has(ext)) {
      files.push(full);
    }
  }

  return files;
}

function getName(record: any) {
  return (
    record.name ||
    record.title ||
    record.siteName ||
    record.label ||
    record.displayName ||
    record.term ||
    record.id ||
    ""
  );
}

function getIsland(record: any) {
  return record.island || record.islandCode || "";
}

function getType(record: any) {
  return record.type || record.kind || record.featureType || "";
}

function getExistingImage(record: any) {
  return (
    record.imageUrl ||
    record.image ||
    record.localImage ||
    record.imagePath ||
    record.thumbnail ||
    record.heroImage ||
    ""
  );
}

function imageCandidateMeta(absPath: string) {
  const relPublic = path.relative(path.join(ROOT, "public"), absPath).replace(/\\/g, "/");
  const publicPath = `/${relPublic}`;
  const base = path.basename(absPath, path.extname(absPath));
  const parent = path.basename(path.dirname(absPath));
  const relNoExt = relPublic.replace(/\.[^.]+$/, "");

  return {
    absPath,
    publicPath,
    fileName: path.basename(absPath),
    base,
    parent,
    relNoExt,
    slugBase: slug(base),
    cleanBase: cleanSlug(base),
    slugRel: slug(relNoExt),
    cleanRel: cleanSlug(relNoExt),
  };
}

function recordCandidateNames(record: any) {
  return [
    getName(record),
    record.id,
    record.geoid,
    record.slug,
    record.canonicalName,
    ...(record.aliases || []),
    ...(record.alternateNames || []),
  ].filter(Boolean);
}

function scoreCandidate(record: any, image: any) {
  const island = getIsland(record);
  const type = getType(record);
  const namesToTry = recordCandidateNames(record);

  let bestScore = 0;
  let reason = "";
  let matchedOn = "";

  for (const value of namesToTry) {
    const recordSlug = slug(value);
    const recordCleanSlug = cleanSlug(value);

    if (!recordSlug || !recordCleanSlug || recordCleanSlug.length < 3) continue;

    if (recordSlug === image.slugBase || recordSlug === image.slugRel) {
      return { score: 1, reason: "exact_slug", matchedOn: value };
    }

    if (recordCleanSlug === image.cleanBase || recordCleanSlug === image.cleanRel) {
      return { score: 0.98, reason: "exact_clean_slug", matchedOn: value };
    }

    if (
      recordCleanSlug.length >= 5 &&
      (image.cleanRel.endsWith(recordCleanSlug) || image.cleanRel.includes(recordCleanSlug))
    ) {
      bestScore = Math.max(bestScore, 0.95);
      reason = "path_contains_record_slug";
      matchedOn = value;
    }

    if (
      image.cleanBase.length >= 5 &&
      recordCleanSlug.includes(image.cleanBase)
    ) {
      bestScore = Math.max(bestScore, 0.9);
      reason = "record_contains_file_slug";
      matchedOn = value;
    }

    const sim = Math.max(similarity(value, image.base), similarity(value, image.relNoExt));
    const overlap = Math.max(tokenOverlap(value, image.base), tokenOverlap(value, image.relNoExt));
    const score = Math.max(sim, overlap);

    if (score > bestScore) {
      bestScore = score;
      reason = score >= 0.84 ? "similarity_or_token_overlap" : "weak_similarity";
      matchedOn = value;
    }
  }

  if (island && normalize(image.publicPath).includes(normalize(island).replace(/_/g, " "))) {
    bestScore += 0.02;
  }

  if (type && normalize(image.publicPath).includes(normalize(type))) {
    bestScore += 0.01;
  }

  return {
    score: Math.min(1, Number(bestScore.toFixed(3))),
    reason,
    matchedOn,
  };
}

function confidence(score: number) {
  if (score >= 1) return "exact";
  if (score >= 0.95) return "strong";
  if (score >= 0.86) return "review";
  if (score >= 0.72) return "weak";
  return "none";
}

function main() {
  mkdirSync(path.join(ROOT, "reports"), { recursive: true });

  if (!existsSync(REPORT_IN)) {
    throw new Error(`Missing data cleanliness report: ${REPORT_IN}`);
  }

  const cleanlinessReport = JSON.parse(readFileSync(REPORT_IN, "utf8"));

  const missingImageIssues = cleanlinessReport.issues.filter(
    (issue: any) =>
      issue.source === "geographic_index" &&
      issue.issue === "missing_image"
  );

  const imageFiles = [...new Set(IMAGE_ROOTS.flatMap(listFilesRecursive))].map(imageCandidateMeta);

  const proposals = missingImageIssues.map((issue: any) => {
    const record = geographicIndex[issue.index];

    const scored = imageFiles
      .map((image) => {
        const result = scoreCandidate(record, image);

        return {
          ...image,
          score: result.score,
          reason: result.reason,
          matchedOn: result.matchedOn,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0] || null;

    return {
      index: issue.index,
      id: record?.id || "",
      geoid: record?.geoid || "",
      name: getName(record),
      type: getType(record),
      island: getIsland(record),
      currentImage: getExistingImage(record),
      issueDetail: issue.detail || "",
      confidence: confidence(best?.score || 0),
      bestScore: best?.score || 0,
      bestMatch: best
        ? {
            publicPath: best.publicPath,
            fileName: best.fileName,
            score: best.score,
            reason: best.reason,
            matchedOn: best.matchedOn,
          }
        : null,
      alternatives: scored.slice(1, 6).map((item) => ({
        publicPath: item.publicPath,
        fileName: item.fileName,
        score: item.score,
        reason: item.reason,
        matchedOn: item.matchedOn,
      })),
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    geographicIndexRecords: geographicIndex.length,
    missingImageIssues: missingImageIssues.length,
    imageFiles: imageFiles.length,
    confidenceTotals: proposals.reduce((acc: Record<string, number>, item) => {
      acc[item.confidence] = (acc[item.confidence] || 0) + 1;
      return acc;
    }, {}),
  };

  writeFileSync(
    REPORT_OUT,
    JSON.stringify(
      {
        summary,
        proposals,
      },
      null,
      2
    )
  );

  console.log("Geographic index image candidate audit complete.");
  console.log(`Report: ${path.relative(ROOT, REPORT_OUT)}`);
  console.table(summary.confidenceTotals);

  console.log("\nExact/strong candidates:");
  console.table(
    proposals
      .filter((proposal) => ["exact", "strong"].includes(proposal.confidence))
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
        candidate: proposal.bestMatch?.publicPath,
        score: proposal.bestScore,
        reason: proposal.bestMatch?.reason,
        matchedOn: proposal.bestMatch?.matchedOn,
      }))
  );

  console.log("\nReview candidates:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "review")
      .slice(0, 80)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
        candidate: proposal.bestMatch?.publicPath,
        score: proposal.bestScore,
        reason: proposal.bestMatch?.reason,
        matchedOn: proposal.bestMatch?.matchedOn,
      }))
  );

  console.log("\nNo candidate:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "none")
      .slice(0, 80)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        type: proposal.type,
        island: proposal.island,
      }))
  );
}

main();
