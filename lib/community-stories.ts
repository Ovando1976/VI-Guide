import type { DirectoryIsland } from "@/types/directory";

export type CommunityStory = {
  id: string;
  slug: string;
  island: DirectoryIsland;
  placeName: string;
  title: string;
  eyebrow: string;
  summary: string;
  paragraphs: string[];
  image: string;
  imageAlt: string;
  sourceLabel: string;
  sourceUrl: string;
  verifiedAt: string;
  mapHref: string;
  tags: string[];
};

export const COMMUNITY_STORIES: readonly CommunityStory[] = [
  {
    id: "community-charlotte-amalie-on-foot",
    slug: "charlotte-amalie-on-foot",
    island: "stt",
    placeName: "Charlotte Amalie",
    title: "Read Charlotte Amalie from the harbor upward",
    eyebrow: "St. Thomas field note",
    summary:
      "Downtown Charlotte Amalie makes more sense when you treat the harbor, Main Street, side streets, and hillside steps as one connected place instead of separate attractions.",
    paragraphs: [
      "Start near the harbor and let the town reveal itself in layers. Main Street and the surrounding side streets carry much of the walkable downtown energy, while the historic steps make the change in elevation impossible to ignore.",
      "For a traveler, that means the best plan is usually a compact walking cluster rather than a long checklist. Pair the waterfront and downtown core first, then decide whether the climb toward the hillside viewpoints fits your heat, footwear, timing, and mobility needs.",
      "VI Guide should help you understand that geography before it gives you more stops. Open the Living Map, keep the harbor as your orientation point, and use Concierge or Mobility when the hill becomes part of the plan rather than an afterthought.",
    ],
    image: "/images/usvi-harbor-hero.jpg",
    imageAlt: "Charlotte Amalie harbor and the hills of St. Thomas",
    sourceLabel: "Visit USVI · Charlotte Amalie",
    sourceUrl:
      "https://www.visitusvi.com/experience/best-things-to-do-in-charlotte-amalie-on-st-thomas/",
    verifiedAt: "2026-08-08",
    mapHref: "/map?island=stt&q=Charlotte%20Amalie",
    tags: ["downtown", "harbor", "walking", "steps", "local context"],
  },
  {
    id: "community-cruz-bay-gateway",
    slug: "cruz-bay-is-the-gateway",
    island: "stj",
    placeName: "Cruz Bay",
    title: "Treat Cruz Bay as the hinge of a St. John day",
    eyebrow: "St. John field note",
    summary:
      "Cruz Bay is more than an arrival point: it is the practical hinge between the public ferry, park information, local services, and the rest of a St. John itinerary.",
    paragraphs: [
      "A St. John day often begins with a clock already running. The public ferry brings you into Cruz Bay, and the Virgin Islands National Park visitor center sits only a short walk from the ferry dock. That makes the town the natural place to get oriented before moving deeper into the island.",
      "Instead of treating Cruz Bay as something to rush through, use it as the control point for the day. Confirm your return-ferry margin, decide how you are moving toward the beaches or trails, and keep enough flexibility to return without turning the final hour into a race.",
      "This is exactly where VI Guide can reduce friction: the map keeps the island context, My Trip holds the stops, and Concierge can work backward from the ferry you cannot afford to miss.",
    ],
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    imageAlt: "Green hills and turquoise water on St. John",
    sourceLabel: "National Park Service · Virgin Islands National Park",
    sourceUrl: "https://www.nps.gov/viis/planyourvisit/hours.htm",
    verifiedAt: "2026-08-08",
    mapHref: "/map?island=stj&q=Cruz%20Bay",
    tags: ["Cruz Bay", "ferry", "National Park", "timing", "St. John"],
  },
  {
    id: "community-christiansted-waterfront",
    slug: "christiansted-waterfront-in-context",
    island: "stx",
    placeName: "Christiansted",
    title: "Christiansted’s waterfront is a history map you can walk",
    eyebrow: "St. Croix field note",
    summary:
      "The Christiansted waterfront is not just a scenic edge of town; the National Historic Site concentrates major historic structures around the wharf, making place and history unusually easy to experience together.",
    paragraphs: [
      "Christiansted National Historic Site is centered on the waterfront and wharf area, where Fort Christiansvaern, the Danish Customs House, the Scale House, the Steeple Building, and the former Danish West India & Guinea Company Warehouse sit within a compact historic landscape.",
      "For a traveler, that concentration matters. You can understand more by moving slowly through one connected district than by treating every building as an isolated photo stop. The harbor, trade, government, defense, labor, and everyday life all overlap here.",
      "Use the Living Map as a layer over that story. Start with the waterfront cluster, then connect food, nearby streets, transportation, and the rest of your St. Croix day only after the historic core has a shape in your head.",
    ],
    image: "/images/accommodations/king-christian-hotel.jpg",
    imageAlt: "Historic waterfront architecture in Christiansted, St. Croix",
    sourceLabel: "National Park Service · Christiansted National Historic Site",
    sourceUrl: "https://www.nps.gov/chri/learn/historyculture/index.htm",
    verifiedAt: "2026-08-08",
    mapHref: "/map?island=stx&q=Christiansted%20National%20Historic%20Site",
    tags: ["Christiansted", "waterfront", "history", "Fort Christiansvaern", "St. Croix"],
  },
];

export function getCommunityStory(slug: string) {
  return COMMUNITY_STORIES.find(
    (story) => story.slug === slug || story.id === slug,
  );
}

export function islandLabel(island: DirectoryIsland) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}
