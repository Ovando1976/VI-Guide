import masterAtlasFile from "../../../public/data/atlas/masterAtlas.json";

export type AtlasRecord = {
  id: string;
  name?: string;
  title?: string;
  type?: string;
  category?: string;
  source?: string;
  island?: string;
  lat?: number;
  lng?: number;
  description?: string;
  [key: string]: unknown;
};

export type AtlasMetadata = {
  generatedAt?: string;
  rawRecords?: number;
  totalRecords: number;
  mergedDuplicates?: number;
  officialEstateSourceRecords?: number;
  canonicalOfficialEstateRecords?: number;
  bySource: Record<string, number>;
  byType?: Record<string, number>;
  [key: string]: unknown;
};

type MasterAtlasFile = {
  metadata: AtlasMetadata;
  records: AtlasRecord[];
};

const data = masterAtlasFile as unknown as MasterAtlasFile;

export const atlasMetadata = data.metadata;
export const atlasRecords = data.records;
