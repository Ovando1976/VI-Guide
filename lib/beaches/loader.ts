import type { BeachRecord } from "@/types/beach";

export const BEACHES: BeachRecord[] = [
  {
    id: "buck-island-shore",
    slug: "buck-island-shore",
    name: "Buck Island Shoreline",
    island: "stx",
    category: "beach",
    description:
      "A St. Croix coastal experience tied to reef, excursion, and scenic water access.",
    heroImage: "/images/beaches/buck-island-shore.jpg",
    tags: ["reef", "excursion", "scenic"],
    amenities: ["boat access"],
    vibe: "snorkel",
  },
  {
    id: "magens-bay",
    slug: "magens-bay",
    name: "Magens Bay",
    island: "stt",
    category: "beach",
    description:
      "An iconic St. Thomas beach with calm water, wide sand, and easy all-day access.",
    heroImage: "/images/beaches/magens-bay.jpg",
    images: ["/images/beaches/magens-bay.jpg"],
    tags: ["iconic", "calm water", "family"],
    vibe: "family",
    amenities: ["parking", "food", "restrooms"],
    bestFor: ["swimming", "family day", "easy access"],
    featured: true,
  },
  {
    id: "sapphire-beach",
    slug: "sapphire-beach",
    name: "Sapphire Beach",
    island: "stt",
    category: "beach",
    description:
      "A bright east-end beach known for clear water, views, and quick access from resort zones.",
    heroImage: "/images/beaches/sapphire-beach.jpg",
    images: ["/images/beaches/sapphire-beach.jpg"],
    tags: ["east end", "views", "snorkel"],
    vibe: "snorkel",
    amenities: ["parking", "food", "bar"],
    bestFor: ["snorkeling", "sunrise", "east-end trips"],
  },
  {
    id: "trunk-bay",
    slug: "trunk-bay",
    name: "Trunk Bay",
    island: "stj",
    category: "beach",
    description:
      "One of the most famous beaches in the Virgin Islands, known for clear water and snorkeling.",
    heroImage: "/images/beaches/trunk-bay.jpg",
    images: ["/images/beaches/trunk-bay.jpg"],
    tags: ["iconic", "north shore", "snorkel"],
    vibe: "snorkel",
    amenities: ["parking", "showers", "snorkeling"],
    bestFor: ["snorkeling", "scenic day trips", "visitors"],
    featured: true,
  },
  {
    id: "cinnamon-bay",
    slug: "cinnamon-bay",
    name: "Cinnamon Bay",
    island: "stj",
    category: "beach",
    description:
      "A long, beautiful north shore beach with more open room and classic St. John scenery.",
    heroImage: "/images/beaches/cinnamon-bay.jpg",
    images: ["/images/beaches/cinnamon-bay.jpg"],
    tags: ["north shore", "wide beach", "scenic"],
    vibe: "family",
    amenities: ["parking"],
    bestFor: ["beach day", "group outings", "north shore drive"],
  },
  {
    id: "rainbow-beach",
    slug: "rainbow-beach",
    name: "Rainbow Beach",
    island: "stx",
    category: "beach",
    description:
      "A laid-back west-end beach with easy access, sunset appeal, and a relaxed local energy.",
    heroImage: "/images/beaches/rainbow-beach.jpg",
    images: ["/images/beaches/rainbow-beach.jpg"],
    tags: ["west end", "sunset", "local vibe"],
    vibe: "sunset",
    amenities: ["food", "bar", "parking"],
    bestFor: ["sunset", "casual beach day", "west end trips"],
    featured: true,
  },
  {
    id: "cane-bay",
    slug: "cane-bay",
    name: "Cane Bay",
    island: "stx",
    category: "beach",
    description:
      "A strong St. Croix beach destination known for water access, scenery, and north shore energy.",
    heroImage: "/images/beaches/cane-bay.jpg",
    images: ["/images/beaches/cane-bay.jpg"],
    tags: ["north shore", "water access", "scenic"],
    vibe: "lively",
    amenities: ["parking", "food"],
    bestFor: ["north shore drive", "water day", "hangouts"],
  },
];

export function getBeachBySlug(slug: string) {
  return BEACHES.find((beach) => beach.slug === slug) ?? null;
}
