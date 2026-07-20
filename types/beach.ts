export type BeachRecord = {
    id: string;
    slug: string;
    name: string;
    island: "stt" | "stj" | "stx";
    category:"beach";
    estateGeoid?: string;
    description: string;
    heroImage: string;
    images?: string[];
    tags: string[];
    amenities?: string[];
    vibe?: BeachVibe;
    lat?: number;
    lng?: number;
    featured?: boolean;
    bestFor?: string[];
  };

  import type { DirectoryItem } from "@/types/directory";

export type BeachVibe =
  | "calm"
  | "family"
  | "snorkel"
  | "surf"
  | "sunset"
  | "lively";
