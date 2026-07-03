import { getEstateHistoryDescription } from "./estateHistoryDescriptions";
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

function professionalShortDescription(name: string, narrative?: string, fallback?: string) {
  const text = clean(narrative || fallback);

  if (/bovoni/i.test(name)) {
    return "Bovoni is a Frenchman’s Bay estate and modern St. Thomas community with residential housing, commercial businesses, gas stations, schools, community facilities, and the Clinton E. Phipps Racetrack.";
  }

  return text || `${name} is linked to the VI Guide estate-history source index.`;
}

function professionalHistoricalDescription(name: string, narrative?: string, fallback?: string) {
  const text = clean(narrative || fallback);

  if (/bovoni/i.test(name)) {
    return "Bovoni is a historic estate and present-day community in the Frenchman’s Bay area of St. Thomas. Historic source material describes the estate landscape as including a lagoon with small islets, sea crabs, pelicans, and other coastal wildlife. Around the turn of the twentieth century, the area was described as isolated or underused. Today, Bovoni includes residential housing, community facilities, school and shelter functions, gas stations, shopping and commercial business areas, and the Clinton E. Phipps Racetrack.";
  }

  return text || `${name} is linked to the VI Guide estate-history source index.`;
}

function professionalKeyFacts(name: string, facts: string[]) {
  if (/bovoni/i.test(name)) {
    return [
      "Historic estate in the Frenchman’s Bay area of St. Thomas.",
      "Historic landscape includes a lagoon and small islets.",
      "Associated coastal wildlife includes sea crabs, pelicans, and other wild birds.",
      "Described around the turn of the twentieth century as isolated or underused.",
      "Present-day Bovoni includes residential housing.",
      "Present-day Bovoni includes school and shelter functions.",
      "Present-day Bovoni includes gas stations.",
      "Present-day Bovoni includes shopping and commercial business areas.",
      "Clinton E. Phipps Racetrack is located in Estate Bovoni."
    ];
  }

  return facts;
}

export type EstateSourceIndexEntry = {
  name: string;
  estateId?: string;
  shortDescription?: string;
  historicalDescription?: string;
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

  if (!manual && !generated && !sixtoAcreage && !sixtoNarrative && !sixtoExtract) {
    return null;
  }

  const name =
    manual?.name ||
    generated?.name ||
    sixtoAcreage?.name ||
    sixtoNarrative?.name ||
    sixtoExtract?.estateName ||
    raw;

  const rawKeyFacts = [
    ...(manual?.keyFacts ?? []),
    ...(sixtoNarrative?.keyFacts ?? []),
    sixtoAcreage
      ? `Sixto lists ${sixtoAcreage.name} in the 1902 Estates and Acreage of St. Thomas table.`
      : "",
    sixtoAcreage?.acres !== null && sixtoAcreage?.acres !== undefined
      ? `Sixto acreage: ${sixtoAcreage.acres} acres.`
      : "",
    sixtoAcreage?.category
      ? `Sixto category: ${sixtoAcreage.category.replaceAll("-", " ")}.`
      : "",
  ].filter(Boolean);

  const sourceRefs = [
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

  const narrativeDescription =
    sixtoNarrative?.historicalDescription ||
    manual?.historicalDescription ||
    generated?.historicalDescription;

  const narrativeSummary =
    sixtoNarrative?.summary ||
    manual?.shortDescription ||
    generated?.shortDescription;

  return {
    name,
    estateId: manual?.id || generated?.id,
    shortDescription: professionalShortDescription(name, narrativeSummary, narrativeDescription),
    historicalDescription: professionalHistoricalDescription(name, narrativeDescription, narrativeSummary),
    confidence:
      manual?.confidence ||
      generated?.confidence ||
      sixtoNarrative?.researchStatus,
    researchStatus:
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
    keyFacts: professionalKeyFacts(name, rawKeyFacts),
    sourceRefs,
  };
}
