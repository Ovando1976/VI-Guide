import type { User } from "firebase/auth";
import type { ConciergeAction, ConciergeIntent } from "../../features/concierge/conciergeBrain";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import type { BeachDoc, EventDoc, IslandCode, PlaceDoc, UserProfile } from "../../types";

export type Listing = BeachDoc | PlaceDoc | EventDoc | GeographicIndexItem;

export type ConciergeMessage = {
  role: "user" | "model";
  text: string;
  results?: GeographicIndexItem[];
  actions?: ConciergeAction[];
  intent?: ConciergeIntent;
};

export type ConciergeProps = {
  user: User | null;
  profile?: UserProfile | null;
  selectedIsland?: IslandCode;
  contextListing?: Listing | null;
  userLocation?: { lat: number; lng: number } | null;
  onSelectListing?: (listing: BeachDoc | PlaceDoc | EventDoc) => void;
  agentId?: string;
  initialPrompt?: string;
};
