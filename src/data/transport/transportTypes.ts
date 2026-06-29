import type { IslandCode } from "../../types";

export type TransportNodeType =
  | "airport"
  | "ferry_terminal"
  | "cruise_port"
  | "taxi_stand"
  | "vitran_stop"
  | "safari_stop"
  | "school"
  | "ball_park"
  | "hospital"
  | "government"
  | "shopping"
  | "beach"
  | "historic_site"
  | "community_hub";

export type TransportNode = {
  id: string;
  island: IslandCode;
  name: string;
  type: TransportNodeType;
  lat: number;
  lng: number;
  aliases: string[];
  description: string;
  routes?: string[];
  canPickup: boolean;
  canDropoff: boolean;
};

export type VitranFareType =
  | "regular"
  | "student"
  | "senior"
  | "disability"
  | "paratransit";

export type TransportQuote = {
  mode: "vitran" | "taxi" | "safari" | "ferry" | "walk";
  label: string;
  fare: number;
  fareText: string;
  notes: string[];
};
