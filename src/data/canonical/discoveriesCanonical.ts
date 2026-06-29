import canonicalFile from "../../../public/data/canonical/discoveries.canonical.json";

export type CanonicalDiscovery = {
  id: string;
  sourceIds: string[];
  title: string;
  normalizedTitle: string;
  island: string;
  category: string;
  type: string;
  description: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  tags: string[];
  confidence: number;
  duplicateCount: number;
  searchText: string;
};

type CanonicalDiscoveryFile = {
  metadata: {
    generatedAt: string;
    inputRecords: number;
    canonicalRecords: number;
    duplicatesMerged: number;
    byIsland: Record<string, number>;
    byCategory: Record<string, number>;
  };
  records: CanonicalDiscovery[];
};

const data = canonicalFile as CanonicalDiscoveryFile;

export const canonicalDiscoveryMetadata = data.metadata;
export const canonicalDiscoveries = data.records;
