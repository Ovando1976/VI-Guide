import type { User } from "firebase/auth";
import type { Location } from "react-router-dom";

import type {
  BeachDoc,
  EventDoc,
  IslandCode,
  PlaceDoc,
  UserProfile,
} from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import type { ConciergeAction, ConciergeIntent } from "./conciergeBrain";

export type Listing = BeachDoc | PlaceDoc | EventDoc | GeographicIndexItem;

export type BookingOption = "tour" | "ride" | "bundle";

export type ParcelContext = {
  parcelId: string;
  label: string;
  island: string;
  estateName?: string | null;
  address?: string | null;
};

export type ConciergeMessage = {
  role: "user" | "model";
  text: string;
  results?: GeographicIndexItem[];
  actions?: ConciergeAction[];
  intent?: ConciergeIntent;
};

export type ConciergeResolverInput = {
  message: string;
  island: IslandCode;
  routeName: string;
  location: Location;
  contextTitle?: string;
  userLocation?: { lat: number; lng: number } | null;
  bookingSite?: GeographicIndexItem | null;
  parcelContext?: ParcelContext;
  user?: User | null;
  profile?: UserProfile | null;
  activeLeadId?: string | null;
  setActiveLeadId?: (id: string) => void;
};

export type ConciergeResolverResult = {
  text: string;
  results?: GeographicIndexItem[];
  actions?: ConciergeAction[];
  intent?: ConciergeIntent;
  activeLeadId?: string | null;
};
