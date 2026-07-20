export type DirectoryIsland = "stt" | "stj" | "stx";

export type DirectoryOperatingStatus =
  | "verified-operating"
  | "seasonal"
  | "temporarily-closed"
  | "permanently-closed"
  | "unconfirmed";

export type DirectoryVerificationLevel =
  | "government"
  | "association"
  | "official-property"
  | "secondary"
  | "unverified";

export type DirectoryItem = {
  id: string;
  slug: string;
  name: string;
  island: DirectoryIsland;
  category: string;
  description: string;
  heroImage: string;
  imageStatus?: "verified" | "pending";
  imageSourceUrl?: string;
  images?: string[];
  estateGeoid?: string;
  lat?: number;
  lng?: number;
  tags: string[];
  featured?: boolean;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string[];
  amenities?: string[];
  bestFor?: string[];
  googlePlaceId?: string;
  aliases?: string[];
  reservationUrl?: string;
  sourceLabel?: string;
  sourceUrl?: string;
  verifiedAt?: string;
  operatingStatus?: DirectoryOperatingStatus;
  verificationLevel?: DirectoryVerificationLevel;
  hoursNote?: string;
  accessibility?: string[];
};
