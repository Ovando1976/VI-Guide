import { getEstateHistoryDescription } from "./estateHistoryDescriptions";
import { getEstateProfile } from "./estateProfiles";
import { getManualEstateHistoryOverride } from "./manualEstateHistoryOverrides";
import { getSixtoEstateAcreage1902 } from "../history/sources/sixtoEstateAcreage1902";
import { getSixtoEstateNarrative1902 } from "../history/sources/sixtoEstateNarratives1902";
import { getSixtoEstateExtract } from "../history/sources/sixtoTimeAndIExtracts";

function clean(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function baseEstateName(value: unknown): string {
  return clean(value).replace(/^Estate\s+/i, "");
}

export type EstateSourceIndexEntry = {
  name: string;
  estateId?: string;
  shortDescription?: string;
  historicalDescription?: string;
  modernDescription?: string;
  confidence?: string;
  researchStatus?: string;
  sixto?: {
    acreage?: number | null;
    acreageCategory?: string;
    acreageSourcePage?: number;
    narrativeSummary?: string;
    narrativeDescription?: string;
    narrativePages?: number[];
    excerpts?: string[];
  };
  keyFacts: string[];
  sourceRefs: string[];
};

export function getEstateSourceIndexEntry(
  idOrName: unknown,
): EstateSourceIndexEntry | null {
  const raw = clean(idOrName);
  const base = baseEstateName(raw);

  const profile =
    getEstateProfile(raw) ||
    getEstateProfile(base);

  const manual =
    getManualEstateHistoryOverride(raw) ||
    getManualEstateHistoryOverride(base);

  const generated =
    getEstateHistoryDescription(raw) ||
    getEstateHistoryDescription(base);

  const sixtoAcreage =
    getSixtoEstateAcreage1902(raw) ||
    getSixtoEstateAcreage1902(base);

  const sixtoNarrative =
    getSixtoEstateNarrative1902(raw) ||
    getSixtoEstateNarrative1902(base);

  const sixtoExtract =
    getSixtoEstateExtract(raw) ||
    getSixtoEstateExtract(base);

  if (!profile && !manual && !generated && !sixtoAcreage && !sixtoNarrative && !sixtoExtract) {
    return null;
  }

  const name =
    profile?.displayName ||
    profile?.name ||
    manual?.name ||
    generated?.name ||
    sixtoAcreage?.name ||
    sixtoNarrative?.name ||
    sixtoExtract?.estateName ||
    raw;

  const keyFacts =
    profile?.slug === "bovoni"
      ? [
          "Late Danish-period Bovoni was a quiet coastal estate landscape.",
          "The older estate landscape included lagoon features, small islets, mangroves, open land, and coastal wildlife.",
          "A villa or resort future was imagined, but that did not become the main modern outcome.",
          "Modern Bovoni became a major south-shore residential community.",
          "Bovoni includes a large public housing presence.",
          "Bovoni includes a large private homeowner community.",
          "Part of the former lagoon/coastal landscape became associated with landfill and dump use.",
          "Modern Bovoni also includes public facilities, school and shelter functions, gas stations, shopping areas, commercial business complexes, transportation services, and the Clinton E. Phipps Racetrack.",
        ]
      : [
          ...(profile?.sourceNotes ?? []),
          ...(manual?.keyFacts ?? []),
          ...(sixtoNarrative?.keyFacts ?? []),
          sixtoAcreage
            ? `Sixto acreage table entry: ${sixtoAcreage.name}.`
            : "",
          sixtoAcreage?.acres !== null && sixtoAcreage?.acres !== undefined
            ? `Acreage listed: ${sixtoAcreage.acres} acres.`
            : "",
          sixtoAcreage?.category
            ? `Acreage table category: ${sixtoAcreage.category.replaceAll("-", " ")}.`
            : "",
        ].filter(Boolean);

  const sourceRefs = [
    ...(profile?.sourceRefs ?? []),
    ...(manual?.sourceRefs ?? []),
    ...(generated?.sourceRefs ?? []),
    sixtoAcreage
      ? `Adolph Sixto, Time and I; or, Looking Forward, c. 1902, PDF page ${sixtoAcreage.sourcePage}.`
      : "",
    sixtoNarrative
      ? `Adolph Sixto, Time and I; or, Looking Forward, c. 1902, pages ${sixtoNarrative.sourcePages.join(", ")}.`
      : "",
    sixtoExtract
      ? `Adolph Sixto, Time and I; or, Looking Forward, c. 1902, pages ${sixtoExtract.pages.join(", ")}.`
      : "",
  ].filter(Boolean);

  const historicalDescription =
    profile?.description ||
    profile?.historicalContext ||
    sixtoNarrative?.historicalDescription ||
    manual?.historicalDescription ||
    generated?.historicalDescription;

  const shortDescription =
    profile?.summary ||
    sixtoNarrative?.summary ||
    manual?.shortDescription ||
    generated?.shortDescription;

  return {
    name,
    estateId: profile?.estateId || manual?.id || generated?.id,
    shortDescription,
    historicalDescription,
    modernDescription: profile?.modernContext,
    confidence:
      profile?.sourceConfidence ||
      manual?.confidence ||
      generated?.confidence ||
      sixtoNarrative?.researchStatus,
    researchStatus:
      profile ? "profile-linked" :
      manual?.researchStatus ||
      generated?.researchStatus ||
      sixtoNarrative?.researchStatus,
    sixto: {
      acreage: sixtoAcreage?.acres,
      acreageCategory: sixtoAcreage?.category,
      acreageSourcePage: sixtoAcreage?.sourcePage,
      narrativeSummary: sixtoNarrative?.summary,
      narrativeDescription: sixtoNarrative?.historicalDescription,
      narrativePages: sixtoNarrative?.sourcePages,
      excerpts: sixtoNarrative?.excerpts || sixtoExtract?.excerpts,
    },
    keyFacts,
    sourceRefs,
  };
}
