import type { IslandCode, PlaceCategory } from "../types";

export type DemoPartnerTier = "Verified" | "Featured" | "Concierge";

export type DemoPartnerAction =
  | "profile_view"
  | "call"
  | "directions"
  | "save"
  | "request_info"
  | "concierge";

export type DemoPartner = {
  id: string;
  name: string;
  category: PlaceCategory | "transportation" | "ferry" | "shopping_center";
  islandCode: IslandCode;
  area: string;
  address: string;
  phone: string;
  website?: string;
  image: string;
  description: string;
  partnerTier: DemoPartnerTier;
  offer?: string;
  tags: string[];
  metrics: {
    profileViews: number;
    directionClicks: number;
    calls: number;
    saves: number;
    conciergeMentions: number;
    inquiries: number;
  };
};

export const demoPartners: DemoPartner[] = [
  {
    id: "sapphire-beach-bar",
    name: "Sapphire Beach Bar",
    category: "bar",
    islandCode: "st_thomas",
    area: "East End",
    address: "Sapphire Beach, St. Thomas",
    phone: "(340) 555-0121",
    website: "https://example.com",
    image: "/images/places/st-thomas/sapphire-beach-1.jpg",
    description:
      "Beachfront food, drinks, music, and visitor-friendly beach day energy near Red Hook.",
    partnerTier: "Concierge",
    offer: "Show this app for a demo beach-day special.",
    tags: ["Beach Bar", "Food", "Cocktails", "Live Music"],
    metrics: {
      profileViews: 1248,
      directionClicks: 312,
      calls: 84,
      saves: 146,
      conciergeMentions: 58,
      inquiries: 21,
    },
  },
  {
    id: "coral-world",
    name: "Coral World Ocean Park",
    category: "attraction",
    islandCode: "st_thomas",
    area: "Coki Point",
    address: "Coki Point, St. Thomas",
    phone: "(340) 555-0134",
    website: "https://example.com",
    image: "/images/places/st-thomas/coki-beach-1.jpg",
    description:
      "Family-friendly marine attraction that fits perfectly into beach, cruise, and taxi itineraries.",
    partnerTier: "Featured",
    offer: "Featured family activity near Coki Beach.",
    tags: ["Attraction", "Family", "Marine Life", "Cruise Day"],
    metrics: {
      profileViews: 982,
      directionClicks: 244,
      calls: 61,
      saves: 118,
      conciergeMentions: 46,
      inquiries: 17,
    },
  },
  {
    id: "mountain-top",
    name: "Mountain Top",
    category: "shopping",
    islandCode: "st_thomas",
    area: "Northside",
    address: "Mountain Top, St. Thomas",
    phone: "(340) 555-0177",
    website: "https://example.com",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    description:
      "Classic overlook, shopping stop, and island tour destination with views over Magens Bay.",
    partnerTier: "Featured",
    offer: "Add this stop to your island tour plan.",
    tags: ["Views", "Shopping", "Tours", "Cruise"],
    metrics: {
      profileViews: 1410,
      directionClicks: 389,
      calls: 74,
      saves: 133,
      conciergeMentions: 63,
      inquiries: 19,
    },
  },
  {
    id: "three-palms",
    name: "3 Palms",
    category: "restaurant",
    islandCode: "st_thomas",
    area: "Red Hook",
    address: "American Yacht Harbor, Red Hook",
    phone: "(340) 555-0155",
    website: "https://example.com",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
    description:
      "Red Hook dining prospect for visitors planning dinner before or after ferry travel.",
    partnerTier: "Verified",
    offer: "Recommended dinner stop near the Red Hook ferry.",
    tags: ["Dinner", "Red Hook", "Seafood", "Ferry Nearby"],
    metrics: {
      profileViews: 786,
      directionClicks: 198,
      calls: 56,
      saves: 91,
      conciergeMentions: 34,
      inquiries: 12,
    },
  },
  {
    id: "vi-taxi",
    name: "VI Taxi Association",
    category: "transportation",
    islandCode: "st_thomas",
    area: "Islandwide",
    address: "St. Thomas, USVI",
    phone: "(340) 555-0100",
    website: "https://example.com",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    description:
      "Transportation partner for airport, cruise, beach, ferry, and island tour requests.",
    partnerTier: "Concierge",
    offer: "Demo dispatch lead flow for licensed operators.",
    tags: ["Taxi", "Airport", "Cruise", "Tours"],
    metrics: {
      profileViews: 1675,
      directionClicks: 421,
      calls: 139,
      saves: 77,
      conciergeMentions: 88,
      inquiries: 32,
    },
  },
  {
    id: "dolphin-water-taxi",
    name: "Dolphin Water Taxi",
    category: "ferry",
    islandCode: "st_thomas",
    area: "Red Hook",
    address: "American Yacht Harbor, Red Hook",
    phone: "(340) 555-0199",
    website: "https://example.com",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
    description:
      "High-value water transfer partner for visitors moving between islands and marinas.",
    partnerTier: "Featured",
    offer: "Water transfer inquiry demo.",
    tags: ["Water Taxi", "Transfers", "Red Hook", "Marina"],
    metrics: {
      profileViews: 694,
      directionClicks: 152,
      calls: 47,
      saves: 66,
      conciergeMentions: 29,
      inquiries: 14,
    },
  },
  {
    id: "havensight-mall",
    name: "Havensight Mall",
    category: "shopping_center",
    islandCode: "st_thomas",
    area: "Havensight",
    address: "Havensight, St. Thomas",
    phone: "(340) 555-0142",
    website: "https://example.com",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    description:
      "Cruise corridor shopping and dining partner for visitor day plans and QR campaigns.",
    partnerTier: "Featured",
    offer: "Cruise-day shopping route placement.",
    tags: ["Shopping", "Cruise", "Dining", "Walkable"],
    metrics: {
      profileViews: 1120,
      directionClicks: 303,
      calls: 39,
      saves: 104,
      conciergeMentions: 44,
      inquiries: 16,
    },
  },
  {
    id: "crown-bay-center",
    name: "Crown Bay Center",
    category: "shopping_center",
    islandCode: "st_thomas",
    area: "Crown Bay",
    address: "Crown Bay, St. Thomas",
    phone: "(340) 555-0188",
    website: "https://example.com",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
    description:
      "Shopping, services, and local business discovery near the Crown Bay cruise terminal.",
    partnerTier: "Verified",
    offer: "Featured Crown Bay visitor stop.",
    tags: ["Cruise", "Shopping", "Services", "Local"],
    metrics: {
      profileViews: 902,
      directionClicks: 211,
      calls: 31,
      saves: 87,
      conciergeMentions: 26,
      inquiries: 10,
    },
  },
];

export function getDemoPartnerById(id: string): DemoPartner {
  return demoPartners.find((partner) => partner.id === id) ?? demoPartners[0];
}
