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

  const keyFacts = [
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

  return {
    name,
    estateId: manual?.id || generated?.id,
    shortDescription:
      sixtoNarrative?.summary ||
      manual?.shortDescription ||
      generated?.shortDescription,
    historicalDescription:
      sixtoNarrative?.historicalDescription ||
      manual?.historicalDescription ||
      generated?.historicalDescription,
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
    keyFacts,
    sourceRefs,
  };
}
