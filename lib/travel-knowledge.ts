import {
  getBeachDirectoryItems,
  getPlaceDirectoryItems,
} from "@/lib/directory-data";
import { ACCOMMODATIONS } from "@/lib/accommodations";
import { getHistoricDirectoryItems } from "@/lib/historic-sites";
import type { DirectoryItem } from "@/types/directory";

export type TravelKnowledgeKind = "places" | "beaches" | "historic" | "stays";

const PLACES = getPlaceDirectoryItems();
const BEACHES = getBeachDirectoryItems();
const HISTORIC = getHistoricDirectoryItems();

export const TRAVEL_KNOWLEDGE: Record<TravelKnowledgeKind, DirectoryItem[]> = {
  places: PLACES,
  beaches: BEACHES,
  historic: HISTORIC,
  stays: ACCOMMODATIONS,
};

export function getTravelKnowledge(kind: TravelKnowledgeKind): DirectoryItem[] {
  return TRAVEL_KNOWLEDGE[kind];
}

export function getTravelKnowledgeItem(
  kind: TravelKnowledgeKind,
  slug: string
): DirectoryItem | undefined {
  return TRAVEL_KNOWLEDGE[kind].find(
    (item) => item.slug === slug || item.id === slug
  );
}

export const ALL_PUBLIC_TRAVEL_KNOWLEDGE: readonly DirectoryItem[] = [
  ...PLACES,
  ...BEACHES,
  ...HISTORIC,
  ...ACCOMMODATIONS,
];
