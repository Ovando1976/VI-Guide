import type { DirectoryItem } from "@/types/directory";
import type { IslandCode } from "@/types/usvi";

export type AccommodationCategory =
  | "hotel"
  | "resort"
  | "villa"
  | "guesthouse"
  | "apartment"
  | "campground";

export type AccommodationRecord = DirectoryItem & {
  id: string;
  name: string;
  island: IslandCode;
  category: AccommodationCategory;
  location?: string;
  description?: string;
  image?: string;
  heroImage?: string;
  images?: string[];
  rating?: number;
  priceTier?: "$" | "$$" | "$$$" | "$$$$";
  amenities?: string[];
  bestFor?: string[];
  address?: string;
  phone?: string;
  website?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verificationStatus?:
    | "association-listed"
    | "official-site-verified"
    | "license-verified";
  verifiedAt?: string;
  lat?: number;
  lng?: number;
};
