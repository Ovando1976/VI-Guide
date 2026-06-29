import atlasSearchIndexFile from "../../../public/data/atlas/atlasSearchIndex.json";

export type AtlasSearchRecord = {
  canonicalId: string;
  displayName: string;
  normalizedName: string;
  island: string;
  type: string;
  category: string;
  lat?: number;
  lng?: number;
  description?: string;
  aliases: string[];
  relatedNames: string[];
  sources: string[];
  sourceIds: string[];
  relationshipCount: number;
  tags?: string[];
  id?: string;
  name?: string;
  estateId?: string;
  [key: string]: unknown;
};

type AtlasSearchIndexFile = {
  metadata: Record<string, unknown>;
  records: AtlasSearchRecord[];
};

const data = atlasSearchIndexFile as unknown as AtlasSearchIndexFile;

export const atlasSearchIndex = data.records;
export const atlasSearchIndexMetadata = data.metadata;
