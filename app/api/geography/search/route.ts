import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

import { getAccommodations } from "@/lib/accommodations";
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
  geoid?: string;
  relatedEstateGeoids?: string[];
  shortDescription?: string;
  description?: string;
  aliases?: string[];
  variantSpellings?: string[];
  obsoleteNames?: string[];
  linguisticEquivalents?: string[];
  searchTokens?: string[];
  featured?: boolean;
  parseConfidence?: number;
  needsReview?: boolean;
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

function isUsableEntry(entry: GeographicDictionaryEntry) {
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

function verifiedAccommodationEntries(): GeographicDictionaryEntry[] {
  return getAccommodations().flatMap((item) => {
    // Accommodation search stays fail-closed. getAccommodations() only attaches
    // estateGeoid when the property has a property-specific reviewed mapping.
    if (!item.estateGeoid) return [];

    return [
      {
        id: `accommodation-${item.id}`,
        slug: item.slug,
        canonicalName: item.name,
        featureType: "accommodation",
        island: item.island.toUpperCase(),
        relatedEstateGeoids: [item.estateGeoid],
        shortDescription: item.location
          ? `${item.category} in ${item.location}`
          : `${item.category} accommodation`,
        aliases: [],
        variantSpellings: [],
        obsoleteNames: [],
        linguisticEquivalents: [],
        searchTokens: [item.name, item.location || "", ...(item.tags || [])],
        featured: item.featured,
        parseConfidence: 1,
        needsReview: false,
      },
    ];
  });
}

async function loadEntries() {
  // Curated entries carry reviewed traveler aliases and governed fare-area links.
  // Keep them available even when Firebase is configured; Firebase augments rather
  // than replaces the checked-in search safety layer.
  const entries: GeographicDictionaryEntry[] = [
    ...(GEOGRAPHIC_DICTIONARY_SEED as GeographicDictionaryEntry[]),
    ...verifiedAccommodationEntries(),
  ];

  if (hasFirebaseAdminConfiguration()) {
    try {
      const snapshot = await getAdminDb()
        .collection("geographic_dictionary_entries")
        .limit(5000)
        .get();
      if (!snapshot.empty) {
        entries.push(
          ...snapshot.docs.map(
            (document) =>
              ({ id: document.id, ...document.data() }) as GeographicDictionaryEntry,
          ),
        );
      }
    } catch {
      // Previews can still use the curated and checked-in generated sources.
    }
  }

  try {
    const filePath = path.join(
      process.cwd(),
      "data",
      "generated",
      "geographic-dictionary-normalized.json",
    );
    const raw = await fs.readFile(filePath, "utf8");
    entries.push(...(JSON.parse(raw) as GeographicDictionaryEntry[]));
  } catch {
    // Curated/Firebase entries remain searchable if the generated snapshot is absent.
  }

  return entries;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();
    const island = (searchParams.get("island") || "all").trim().toUpperCase();
    const type = (searchParams.get("type") || "all").trim().toLowerCase();
    const match = (searchParams.get("match") || "all").trim().toLowerCase();
    const nameOnly = match === "name";
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
    const ranked = entries
      .map((entry, sourceIndex) => {
        const aliases = [
          ...(entry.aliases || []),
          ...(entry.variantSpellings || []),
          ...(entry.obsoleteNames || []),
          ...(entry.linguisticEquivalents || []),
        ];
        const normalizedAliases = aliases.map(normalizeText).filter(Boolean);
        const canonical = normalizeText(entry.canonicalName);
        const shortDescription = normalizeText(entry.shortDescription || "");
        const description = normalizeText(entry.description || "");
        const normalizedTokens = (entry.searchTokens || []).map(normalizeText);
        const exactCanonical = canonical === nq;
        const startsCanonical = canonical.startsWith(nq);
        const exactAlias = normalizedAliases.some((alias) => alias === nq);
        const startsAlias = normalizedAliases.some((alias) => alias.startsWith(nq));
        const phraseMatch =
          canonical.includes(nq) || normalizedAliases.some((alias) => alias.includes(nq));
        const tokenMatch = !nameOnly && normalizedTokens.includes(nq);
        const descriptionMatch =
          !nameOnly &&
          nq.length >= 5 &&
          (shortDescription.includes(nq) || description.includes(nq));

        if (
          !exactCanonical && !startsCanonical && !exactAlias && !startsAlias &&
          !phraseMatch && !tokenMatch && !descriptionMatch
        ) return null;

        const score =
          (exactCanonical ? 140 : 0) +
          (exactAlias ? 130 : 0) +
          (startsCanonical ? 100 : 0) +
          (startsAlias ? 90 : 0) +
          (phraseMatch ? 45 : 0) +
          (tokenMatch ? 20 : 0) +
          (descriptionMatch ? 5 : 0) +
          (entry.featured ? 5 : 0);

        return { ...entry, aliases, score, sourceIndex };
      })
      .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
      .sort((a, b) => b.score - a.score || a.sourceIndex - b.sourceIndex);

    // Firebase/generated snapshots can contain the same named feature as the
    // curated layer. Deduplicate after ranking so the curated, governed record
    // wins an equal-score tie and users never see repeated place rows.
    const seen = new Set<string>();
    const results = [] as typeof ranked;
    for (const entry of ranked) {
      const key = [
        entry.island.toUpperCase(),
        normalizeText(entry.featureType || ""),
        normalizeText(entry.canonicalName),
      ].join("|");
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(entry);
      if (results.length >= limit) break;
    }

    return NextResponse.json({ ok: true, count: results.length, results });
  } catch (error) {
    console.error("geography search error", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
