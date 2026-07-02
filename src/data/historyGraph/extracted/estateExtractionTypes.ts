export type EstateExtractionSource =
  | "generated"
  | "st_thomas"
  | "manual"
  | "archive"
  | "unknown";

export type EstateExtraction = {
  id: string;
  estateName: string;
  island?: string;
  quarter?: string;
  summary?: string;
  description?: string;
  source?: EstateExtractionSource | string;
  citations?: string[];
  aliases?: string[];
  relatedPlaces?: string[];
  yearRange?: string;
  [key: string]: unknown;
};
