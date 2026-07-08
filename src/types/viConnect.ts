export type VIConnectIsland =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island";

export type VIConnectStatus = "local" | "visitor" | "returning_home";

export type VIConnectIntent =
  | "dating"
  | "serious"
  | "friendship"
  | "events"
  | "networking";

export type VIConnectProfile = {
  id: string;
  displayName: string;
  age: number;
  island: VIConnectIsland;
  status: VIConnectStatus;
  headline: string;
  bio: string;
  interests: string[];
  intent: VIConnectIntent[];
  verified: boolean;
  distanceLabel: string;
  imageUrl?: string;
  primaryPhotoUrl?: string;
  photoUrls?: string[];
  accentColor?: string;
  isDemoProfile?: boolean;
  favoriteSpot: string;
};

export type VIConnectDateIdea = {
  id: string;
  title: string;
  island: VIConnectIsland;
  category: "restaurant" | "beach" | "history" | "sunset" | "adventure" | "coffee";
  description: string;
  vibe: string;
  estimatedCost: string;
};

export type VIConnectEvent = {
  id: string;
  title: string;
  island: VIConnectIsland;
  dateLabel: string;
  locationLabel: string;
  description: string;
  tags: string[];
};

export type VIConnectVisibility = "visible" | "paused";

export type VIConnectUserProfile = {
  id: string;
  ownerId?: string;
  displayName: string;
  age: number;
  island: VIConnectIsland;
  status: VIConnectStatus;
  headline: string;
  bio: string;
  imageUrl?: string;
  primaryPhotoUrl?: string;
  photoUrls?: string[];
  interests: string[];
  intent: VIConnectIntent[];
  favoriteSpot: string;
  lookingFor: string[];
  verified: boolean;
  visibility: VIConnectVisibility;
  createdAt: string;
  updatedAt: string;
  isVisible?: boolean;
  verificationStatus?: "pending" | "verified" | "rejected";
};
