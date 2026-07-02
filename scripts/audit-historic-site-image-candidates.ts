// @ts-nocheck

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import * as historicModule from "../src/data/historicSites";

const ROOT = process.cwd();
const REPORT_IN = path.join(ROOT, "reports/data-cleanliness-report.json");
const REPORT_OUT = path.join(ROOT, "reports/historic-site-image-candidates.json");

const IMAGE_ROOTS = [
  "public/images",
  "public/img",
  "public/assets",
  "public",
].map((file) => path.join(ROOT, file));

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".svg"]);

const historicSites =
  historicModule.historicSites ||
  historicModule.HISTORIC_SITES ||
  historicModule.default ||
  Object.values(historicModule).find((value) => Array.isArray(value));

if (!Array.isArray(historicSites)) {
  throw new Error("Could not find historicSites array export in src/data/historicSites.ts");
}

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
    .replace(/\bthe\b/g, " ")
    .replace(/\bestate\b/g, " ")
    .replace(/\bhistoric\b/g, " ")
    .replace(/\bdistrict\b/g, " ")
    .replace(/\bnational\b/g, " ")
    .replace(/\bpark\b/g, " ")
    .replace(/\bsite\b/g, " ")
    .replace(/\bruins?\b/g, " ")
    .replace(/\bplantation\b/g, " ")
    .replace(/\bst croix\b/g, " ")
    .replace(/\bst thomas\b/g, " ")
    .replace(/\bst john\b/g, " ")
    .replace(/\bwater island\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function tokens(value: unknown) {
  return slug(value).split("-").filter(Boolean);
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
  const left = slug(a);
  const right = slug(b);

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
  const left = slug(a);
  const right = slug(b);

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
    record.id ||
    ""
  );
}

function getIsland(record: any) {
  return record.island || record.islandCode || "";
}

function getCurrentImage(record: any) {
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

function pathExistsFromPublic(publicPath: string) {
  if (!publicPath || typeof publicPath !== "string") return false;

  const clean = publicPath.split("?")[0].trim();
  if (!clean.startsWith("/")) return false;

  return existsSync(path.join(ROOT, "public", clean.slice(1)));
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
    slugRel: slug(relNoExt),
  };
}

function scoreCandidate(record: any, image: any) {
  const name = getName(record);
  const id = record.id || "";
  const aliases = record.aliases || record.alternateNames || [];
  const island = getIsland(record);

  const namesToTry = [name, id, ...aliases].filter(Boolean);

  let bestScore = 0;
  let reason = "";

  for (const value of namesToTry) {
    const recordSlug = slug(value);

    if (!recordSlug) continue;

    if (recordSlug === image.slugBase || recordSlug === image.slugRel) {
      return { score: 1, reason: "exact_slug" };
    }

    if (image.slugRel.endsWith(recordSlug) || image.slugRel.includes(recordSlug)) {
      bestScore = Math.max(bestScore, 0.95);
      reason = "path_contains_record_slug";
    }

    if (recordSlug.includes(image.slugBase) && image.slugBase.length >= 5) {
      bestScore = Math.max(bestScore, 0.9);
      reason = "record_contains_file_slug";
    }

    const sim = Math.max(similarity(value, image.base), similarity(value, image.relNoExt));
    const overlap = Math.max(tokenOverlap(value, image.base), tokenOverlap(value, image.relNoExt));
    const score = Math.max(sim, overlap);

    if (score > bestScore) {
      bestScore = score;
      reason = score >= 0.82 ? "similarity_or_token_overlap" : "weak_similarity";
    }
  }

  if (island && normalize(image.publicPath).includes(normalize(island).replace(/_/g, " "))) {
    bestScore += 0.02;
  }

  return {
    score: Math.min(1, Number(bestScore.toFixed(3))),
    reason,
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

  const cleanlinessReport = existsSync(REPORT_IN)
    ? JSON.parse(readFileSync(REPORT_IN, "utf8"))
    : { issues: [] };

  const missingImageIssues = cleanlinessReport.issues.filter(
    (issue: any) =>
      issue.source === "historic_sites" &&
      issue.issue === "missing_local_image_file"
  );

  const imageFiles = [...new Set(IMAGE_ROOTS.flatMap(listFilesRecursive))].map(imageCandidateMeta);

  const targets = missingImageIssues.length
    ? missingImageIssues.map((issue: any) => ({
        index: issue.index,
        issue,
        record: historicSites[issue.index],
      }))
    : historicSites.map((record: any, index: number) => ({
        index,
        issue: null,
        record,
      })).filter(({ record }) => {
        const current = getCurrentImage(record);
        return current && current.startsWith("/") && !pathExistsFromPublic(current);
      });

  const proposals = targets.map(({ index, issue, record }) => {
    const scored = imageFiles
      .map((image) => {
        const result = scoreCandidate(record, image);
        return {
          ...image,
          score: result.score,
          reason: result.reason,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0] || null;

    return {
      index,
      id: record?.id || "",
      name: getName(record),
      island: getIsland(record),
      currentImage: getCurrentImage(record),
      issueDetail: issue?.detail || "",
      confidence: confidence(best?.score || 0),
      bestScore: best?.score || 0,
      bestMatch: best
        ? {
            publicPath: best.publicPath,
            fileName: best.fileName,
            score: best.score,
            reason: best.reason,
          }
        : null,
      alternatives: scored.slice(1, 6).map((item) => ({
        publicPath: item.publicPath,
        fileName: item.fileName,
        score: item.score,
        reason: item.reason,
      })),
    };
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    historicSites: historicSites.length,
    missingImageIssues: missingImageIssues.length,
    targets: targets.length,
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

  console.log("Historic site image candidate audit complete.");
  console.log(`Report: ${path.relative(ROOT, REPORT_OUT)}`);
  console.table(summary.confidenceTotals);

  console.log("\nExact/strong candidates:");
  console.table(
    proposals
      .filter((proposal) => ["exact", "strong"].includes(proposal.confidence))
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        island: proposal.island,
        currentImage: proposal.currentImage,
        candidate: proposal.bestMatch?.publicPath,
        score: proposal.bestScore,
        reason: proposal.bestMatch?.reason,
      }))
  );

  console.log("\nReview candidates:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "review")
      .slice(0, 60)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        island: proposal.island,
        currentImage: proposal.currentImage,
        candidate: proposal.bestMatch?.publicPath,
        score: proposal.bestScore,
        reason: proposal.bestMatch?.reason,
      }))
  );

  console.log("\nNo candidate:");
  console.table(
    proposals
      .filter((proposal) => proposal.confidence === "none")
      .slice(0, 40)
      .map((proposal) => ({
        index: proposal.index,
        name: proposal.name,
        island: proposal.island,
        currentImage: proposal.currentImage,
      }))
  );
}

main();
