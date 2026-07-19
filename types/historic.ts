import type { DirectoryItem } from "@/types/directory";

export type HistoricCategory =
  | "fort"
  | "district"
  | "ruin"
  | "church"
  | "landmark"
  | "museum";

export type HistoricRecord = DirectoryItem & {
  category: HistoricCategory;
  period?: string;
  significance?: string[];
};