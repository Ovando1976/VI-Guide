export type EstatePlaceSeed = {
  id: string;
  name: string;
  type:
    | "school"
    | "church"
    | "government_office"
    | "clinic"
    | "hospital"
    | "police"
    | "fire_station"
    | "post_office"
    | "park"
    | "beach"
    | "restaurant"
    | "attraction"
    | "port"
    | "transportation"
    | "business"
    | "historic_site"
    | "other";
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  estateName?: string;
  estateGeoid?: string;
  address?: string;
  notes?: string;
  source?: string;
};

export const estatePlaceSeeds: EstatePlaceSeed[] = [];