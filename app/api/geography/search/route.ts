import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import { GEOGRAPHIC_DICTIONARY_SEED } from "@/lib/geographic-seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeographicDictionaryEntry = {
  id: string;
  slug: string;
  canonicalName: string;
  featureType: string;
  island: string;
  shortDescription?: string;
  description?: string;
  aliases?: string[];
  variantSpellings?: string[];
  obsoleteNames?: string[];
  linguisticEquivalents?: string[];
  searchTokens?: string[];
  featured?: boolean;
};

function looksLikeGarbageName(value: string) {
  const v = value.trim();
  if (!v) return true;
  if (v.length < 3) return true;
  if (v.length > 80) return true;

  const upper = v.toUpperCase();
  const compactUpper = upper.replace(/[^A-Z0-9]/g, "");
  const blockedFragments = [
    "GEOGRAPHICDICTIONARY",
    "U.S.COAST",
    "COASTANDGEODETIC",
    "COAST ANDGEODETIC",
    "SURVEY",
    "VIRGINISLANDS",
    "DEPARTMENT OF COMMERCE",
  ];

  if (
    blockedFragments.some(
      (item) =>
        upper.includes(item) ||
        compactUpper.includes(item.replace(/[^A-Z0-9]/g, "")),
    )
  ) return true;

  if (/[{}[\]|\\]/.test(v)) return true;
  if (/[0-9]{3,}/.test(v)) return true;
  if (/^[^a-zA-Z]+$/.test(v)) return true;
  if ((v.match(/[.;:()]/g) || []).length >= 3) return true;
  if ((v.match(/[A-Z]/g) || []).length > 12 && !v.includes("St.")) return true;
  return false;
}

function isUsableEntry(
  entry: GeographicDictionaryEntry & { parseConfidence?: number; needsReview?: boolean },
) {
  if (!entry.canonicalName) return false;
  if (looksLikeGarbageName(entry.canonicalName)) return false;
  if ((entry.parseConfidence ?? 1) < 0.7) return false;
  return true;
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’'`"]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

async function loadEntries() {
  if (hasFirebaseAdminConfiguration()) {
    try {
      const snapshot = await getAdminDb()
        .collection("geographic_dictionary_entries")
        .limit(5000)
        .get();
      if (!snapshot.empty) {
        return snapshot.docs.map(
          (document) =>
            ({ id: document.id, ...document.data() }) as GeographicDictionaryEntry,
        );
      }
    } catch {
      // Local development and previews can search the checked-in snapshot.
    }
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    "generated",
    "geographic-dictionary-normalized.json",
  );
  const raw = await fs.readFile(filePath, "utf8");
  const generated = JSON.parse(raw) as GeographicDictionaryEntry[];
  return [...GEOGRAPHIC_DICTIONARY_SEED, ...generated];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const island = (searchParams.get("island") || "all").trim().toUpperCase();
    const type = (searchParams.get("type") || "all").trim().toLowerCase();
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 50);

    if (!q) {
      return NextResponse.json({ ok: true, count: 0, results: [] });
    }

    let entries = (await loadEntries()).filter(isUsableEntry);

    if (island !== "ALL") {
      entries = entries.filter((entry) => entry.island.toUpperCase() === island);
    }

    if (type !== "all") {
      const requestedTypes = new Set(
        type.split(",").map((value) => normalizeText(value)).filter(Boolean),
      );
      entries = entries.filter((entry) =>
        requestedTypes.has(normalizeText(entry.featureType || "")),
      );
    }

    const nq = normalizeText(q);
    const results = entries
      .map((entry) => {
        const aliases = [
          ...(entry.aliases || []),
          ...(entry.variantSpellings || []),
          ...(entry.obsoleteNames || []),
          ...(entry.linguisticEquivalents || []),
        ];

        const canonical = normalizeText(entry.canonicalName);
        const shortDescription = normalizeText(entry.shortDescription || "");
        const description = normalizeText(entry.description || "");
        const exactCanonical = canonical === nq;
        const startsCanonical = canonical.startsWith(nq);
        const aliasMatch = aliases.some((alias) => normalizeText(alias) === nq);
        const tokenMatch = (entry.searchTokens || []).includes(nq);
        const phraseMatch =
          canonical.includes(nq) || aliases.some((alias) => normalizeText(alias).includes(nq));
        const descriptionMatch =
          nq.length >= 5 && (shortDescription.includes(nq) || description.includes(nq));

        if (
          !exactCanonical && !startsCanonical && !aliasMatch && !tokenMatch &&
          !phraseMatch && !descriptionMatch
        ) return null;

        const score =
          (exactCanonical ? 120 : 0) +
          (startsCanonical ? 90 : 0) +
          (aliasMatch ? 80 : 0) +
          (tokenMatch ? 60 : 0) +
          (phraseMatch ? 30 : 0) +
          (descriptionMatch ? 10 : 0) +
          (entry.featured ? 5 : 0);

        return { ...entry, aliases, score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, limit);

    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (error) {
    console.error("geography search error", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
