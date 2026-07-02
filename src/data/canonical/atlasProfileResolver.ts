import * as discoveriesModule from "./discoveriesCanonical";
import * as geographicIndexModule from "../core/geographicIndex";
import {
  getEstateProfileForSelection,
  type EstateSourceConfidence,
} from "./estateProfiles";

export type CanonicalProfileFields = {
  summary?: string;
  description?: string;
  historicalContext?: string;
  modernContext?: string;
  sourceConfidence?: EstateSourceConfidence;
  sourceNotes?: string[];
  sourceRefs?: string[];
  relatedFeatures?: string[];
};

export type AtlasSelectionLike = CanonicalProfileFields & {
  id?: string | number | null;
  geoid?: string | number | null;
  title?: string | null;
  name?: string | null;
  label?: string | null;
  estate?: string | null;
  type?: string | null;
  source?: string | null;
  island?: string | null;
  lat?: number;
  lng?: number;
  coords?: [number, number] | number[];
  isEstate?: boolean;
  isParcel?: boolean;
  isPoint?: boolean;
  properties?: Record<string, unknown>;
};

type LooseRecord = Record<string, unknown>;

function normalize(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\bestate\b/g, "")
    .replace(/[_-]/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanString(value: unknown): string {
  return String(value ?? "").trim();
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const text = cleanString(value);
    if (text) return text;
  }

  return "";
}

function getRecordId(record: LooseRecord) {
  return firstString(
    record.geoid,
    record.GEOID,
    record.estateId,
    record.id,
    record.slug,
    record.placeId,
    record.businessId,
    record.siteId,
  );
}

function getRecordTitle(record: LooseRecord) {
  return firstString(
    record.displayName,
    record.title,
    record.name,
    record.label,
    record.estate,
    record.ESTATE,
    record.baseName,
    record.fullName,
    record.id,
  );
}

function getRecordDescription(record: LooseRecord) {
  return firstString(
    record.description,
    record.summary,
    record.shortDescription,
    record.longDescription,
    record.overview,
    record.historicalContext,
  );
}

function collectRecords(value: unknown, out: LooseRecord[] = [], depth = 0) {
  if (depth > 8 || value == null) return out;

  if (Array.isArray(value)) {
    for (const item of value) collectRecords(item, out, depth + 1);
    return out;
  }

  if (typeof value !== "object") return out;

  const obj = value as LooseRecord;

  const title = getRecordTitle(obj);
  const id = getRecordId(obj);
  const description = getRecordDescription(obj);
  const type = cleanString(obj.type);

  if (title || id || description || type) {
    out.push(obj);
  }

  for (const [key, child] of Object.entries(obj)) {
    if (
      key === "geometry" ||
      key === "coordinates" ||
      key === "features" ||
      key === "properties"
    ) {
      continue;
    }

    if (typeof child === "object" && child !== null) {
      collectRecords(child, out, depth + 1);
    }
  }

  return out;
}

const sourceRecords: LooseRecord[] = [
  ...collectRecords(geographicIndexModule),
  ...collectRecords(discoveriesModule),
];

function selectionTokens(selection: AtlasSelectionLike) {
  const props = selection.properties ?? {};

  return [
    selection.id,
    selection.geoid,
    selection.title,
    selection.name,
    selection.label,
    selection.estate,
    props.id,
    props.geoid,
    props.GEOID,
    props.estateId,
    props.name,
    props.title,
    props.label,
    props.estate,
    props.ESTATE,
    props.baseName,
    props.fullName,
  ]
    .map(normalize)
    .filter(Boolean);
}

function scoreRecord(selection: AtlasSelectionLike, record: LooseRecord) {
  const tokens = selectionTokens(selection);
  if (!tokens.length) return 0;

  const id = normalize(getRecordId(record));
  const title = normalize(getRecordTitle(record));
  const description = normalize(getRecordDescription(record));
  const type = normalize(record.type);
  const island = normalize(record.island);

  let score = 0;

  for (const token of tokens) {
    if (!token) continue;

    if (id && token === id) score += 100;
    if (title && token === title) score += 90;
    if (id && (id.includes(token) || token.includes(id))) score += 45;
    if (title && (title.includes(token) || token.includes(title))) score += 40;
    if (description && description.includes(token)) score += 10;
  }

  const selectedType = normalize(selection.type);
  const selectedIsland = normalize(selection.island || selection.properties?.island);

  if (selectedType && type && selectedType === type) score += 12;
  if (selectedIsland && island && selectedIsland === island) score += 12;

  return score;
}

function findBestGenericRecord(selection: AtlasSelectionLike) {
  let best: LooseRecord | null = null;
  let bestScore = 0;

  for (const record of sourceRecords) {
    const score = scoreRecord(selection, record);

    if (score > bestScore) {
      best = record;
      bestScore = score;
    }
  }

  return bestScore >= 45 ? best : null;
}

function recordToProfile(record: LooseRecord | null): CanonicalProfileFields {
  if (!record) return {};

  const description = getRecordDescription(record);
  const summary = firstString(record.summary, record.shortDescription, description);
  const source = firstString(record.source, record.collection, record.sourceRef);

  return {
    summary: summary || undefined,
    description: description || undefined,
    historicalContext: cleanString(record.historicalContext) || undefined,
    modernContext: cleanString(record.modernContext) || undefined,
    sourceConfidence: "medium",
    sourceNotes: source ? [`Matched canonical app source: ${source}`] : [],
    sourceRefs: source ? [source] : ["src/data/core/geographicIndex", "src/data/canonical/discoveriesCanonical"],
  };
}

export function getCanonicalAtlasProfile(
  selection?: AtlasSelectionLike | null,
): CanonicalProfileFields {
  if (!selection) return {};

  const estateProfile = getEstateProfileForSelection(selection);

  if (estateProfile) {
    return {
      summary: estateProfile.summary,
      description: estateProfile.description,
      historicalContext: estateProfile.historicalContext,
      modernContext: estateProfile.modernContext,
      sourceConfidence: estateProfile.sourceConfidence,
      sourceNotes: estateProfile.sourceNotes,
      sourceRefs: estateProfile.sourceRefs,
      relatedFeatures: estateProfile.relatedFeatures,
    };
  }

  return recordToProfile(findBestGenericRecord(selection));
}

export function hydrateAtlasSelection<T extends AtlasSelectionLike>(selection: T): T {
  const profile = getCanonicalAtlasProfile(selection);
  const props = selection.properties ?? {};

  const description =
    profile.description ||
    cleanString(selection.description) ||
    cleanString(props.description) ||
    cleanString(props.summary) ||
    "";

  const summary =
    profile.summary ||
    cleanString(selection.summary) ||
    cleanString(props.summary) ||
    description;

  return {
    ...selection,
    description,
    summary,
    historicalContext:
      profile.historicalContext ||
      selection.historicalContext ||
      (props.historicalContext as string | undefined),
    modernContext:
      profile.modernContext ||
      selection.modernContext ||
      (props.modernContext as string | undefined),
    sourceConfidence:
      profile.sourceConfidence ||
      selection.sourceConfidence ||
      (props.sourceConfidence as EstateSourceConfidence | undefined),
    sourceNotes:
      profile.sourceNotes ||
      selection.sourceNotes ||
      (props.sourceNotes as string[] | undefined),
    sourceRefs:
      profile.sourceRefs ||
      selection.sourceRefs ||
      (props.sourceRefs as string[] | undefined),
    relatedFeatures:
      profile.relatedFeatures ||
      selection.relatedFeatures ||
      (props.relatedFeatures as string[] | undefined),
    properties: {
      ...props,
      description,
      summary,
      historicalContext:
        profile.historicalContext ||
        selection.historicalContext ||
        props.historicalContext,
      modernContext:
        profile.modernContext ||
        selection.modernContext ||
        props.modernContext,
      sourceConfidence:
        profile.sourceConfidence ||
        selection.sourceConfidence ||
        props.sourceConfidence,
      sourceNotes:
        profile.sourceNotes ||
        selection.sourceNotes ||
        props.sourceNotes,
      sourceRefs:
        profile.sourceRefs ||
        selection.sourceRefs ||
        props.sourceRefs,
      relatedFeatures:
        profile.relatedFeatures ||
        selection.relatedFeatures ||
        props.relatedFeatures,
    },
  };
}
