import type { DirectoryItem } from "@/types/directory";

export type PlaceCategory =
  | "restaurant"
  | "bar"
  | "shop"
  | "attraction"
  | "marina"
  | "nightlife"
  | "service";

export type PlaceRecord = DirectoryItem & {
  category: PlaceCategory;
  address?: string;
  phone?: string;
  website?: string;
  priceTier?: "$" | "$$" | "$$$" | "$$$$";
};