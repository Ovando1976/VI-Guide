import {
  getBeachDirectoryItems,
  getPlaceDirectoryItems,
} from "@/lib/directory-data";
import { ACCOMMODATIONS } from "@/lib/accommodations";
import { COMMUNITY_STORIES } from "@/lib/community-stories";
import { getHistoricDirectoryItems } from "@/lib/historic-sites";
import type { DirectoryItem } from "@/types/directory";

export type TravelKnowledgeKind = "places" | "beaches" | "historic" | "stays";

const RAW_PLACES = getPlaceDirectoryItems();
const BEACHES = getBeachDirectoryItems();
const HISTORIC = getHistoricDirectoryItems();

const COMMUNITY_BY_PLACE = new Map(
  COMMUNITY_STORIES.map((story) => [story.placeName.trim().toLowerCase(), story]),
);

const PLACES = RAW_PLACES.map((item) => {
  const story = COMMUNITY_BY_PLACE.get(item.name.trim().toLowerCase());
  if (!story) return item;

  return {
    ...item,
    description: `${item.description} Community field note: ${story.summary}`,
    tags: Array.from(new Set([...item.tags, ...story.tags, "community field note"])),
  } satisfies DirectoryItem;
});

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
