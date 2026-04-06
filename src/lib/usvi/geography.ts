import { IslandCode, AreaKind } from "../../types";

export interface EstateFeature {
  slug: string;
  name: string;
  islandCode: IslandCode;
  quarter: string;
  coordinates: { lat: number; lng: number };
  description?: string;
  historic?: boolean;
}

export const USVI_QUARTERS: Record<IslandCode, string[]> = {
  st_thomas: [
    "Charlotte Amalie",
    "East End",
    "Little Northside",
    "New Quarter",
    "Southside",
    "Tutu",
    "Water Island",
    "West End"
  ],
  st_john: [
    "Coral Bay",
    "Cruz Bay",
    "Mahogany Run",
    "Reef Bay"
  ],
  st_croix: [
    "Christiansted",
    "East End",
    "Frederiksted",
    "Northside",
    "Prince",
    "Queen",
    "West End",
    "King",
    "Company"
  ],
  water_island: ["Water Island"]
};

/**
 * Normalizes estate names and resolves quarter identity.
 * This is a core part of the "territory-scale operating layer".
 */
export function resolveEstateContext(estateName: string, island: IslandCode): { estate: string; quarter: string } | null {
  const normalized = estateName.toLowerCase().trim();
  
  if (island === 'st_thomas') {
    if (normalized.includes('peterborg')) return { estate: 'Peterborg', quarter: 'Little Northside' };
    if (normalized.includes('elizabeth')) return { estate: 'Elizabeth', quarter: 'Little Northside' };
    if (normalized.includes('magens')) return { estate: 'Magens Bay', quarter: 'Little Northside' };
    if (normalized.includes('red hook')) return { estate: 'Red Hook', quarter: 'East End' };
    if (normalized.includes('charlotte amalie')) return { estate: 'Charlotte Amalie', quarter: 'Charlotte Amalie' };
    if (normalized.includes('hull bay')) return { estate: 'Hull Bay', quarter: 'Little Northside' };
    if (normalized.includes('frenchman')) return { estate: 'Frenchman Bay', quarter: 'Southside' };
    if (normalized.includes('smith bay')) return { estate: 'Smith Bay', quarter: 'East End' };
  }

  if (island === 'st_john') {
    if (normalized.includes('cruz bay')) return { estate: 'Cruz Bay', quarter: 'Cruz Bay' };
    if (normalized.includes('coral bay')) return { estate: 'Coral Bay', quarter: 'Coral Bay' };
    if (normalized.includes('chocolate hole')) return { estate: 'Chocolate Hole', quarter: 'Cruz Bay' };
    if (normalized.includes('catherineberg')) return { estate: 'Catherineberg', quarter: 'Cruz Bay' };
  }

  if (island === 'st_croix') {
    if (normalized.includes('christiansted')) return { estate: 'Christiansted', quarter: 'Christiansted' };
    if (normalized.includes('frederiksted')) return { estate: 'Frederiksted', quarter: 'Frederiksted' };
    if (normalized.includes('cane bay')) return { estate: 'Cane Bay', quarter: 'Northside' };
    if (normalized.includes('judith')) return { estate: 'Judith\'s Fancy', quarter: 'Queen' };
  }
  
  return null;
}

/**
 * Provides territory-wide geographic intelligence.
 */
export function getTerritoryIntelligence(island: IslandCode) {
  return {
    quarters: USVI_QUARTERS[island],
    totalEstates: island === 'st_thomas' ? 120 : island === 'st_john' ? 45 : 150, // Mocked
    transitHubs: island === 'st_thomas' ? ['Red Hook', 'Charlotte Amalie'] : island === 'st_john' ? ['Cruz Bay'] : ['Christiansted', 'Frederiksted'],
    activeListings: 150, // Mocked
    upcomingEvents: 25 // Mocked
  };
}
