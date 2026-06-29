import type { IslandCode } from "../../types";
import { communityHubs } from "./communityHubs";

export type TransportHubType =
  | "airport"
  | "ferry_terminal"
  | "cruise_port"
  | "safari_stop"
  | "bus_stop"
  | "taxi_stand"
  | "landmark"
  | "school"
  | "ball_park"
  | "community_hub";

export type TransportHub = {
  id: string;
  island: IslandCode;
  name: string;
  type: TransportHubType;
  lat: number;
  lng: number;
  aliases: string[];
  description: string;
};

export const transportHubs: TransportHub[] = [
  {
    id: "stt-airport",
    island: "st_thomas",
    name: "Cyril E. King Airport",
    type: "airport",
    lat: 18.3373,
    lng: -64.9734,
    aliases: ["airport", "stt airport", "cek", "cyril e king"],
    description: "Main St. Thomas airport pickup and drop-off area.",
  },
  {
    id: "stt-red-hook",
    island: "st_thomas",
    name: "Red Hook Ferry Terminal",
    type: "ferry_terminal",
    lat: 18.3269,
    lng: -64.8496,
    aliases: ["red hook", "ferry", "st john ferry"],
    description: "Primary ferry connection from St. Thomas to St. John.",
  },
  {
    id: "stt-havensight",
    island: "st_thomas",
    name: "Havensight Cruise Port",
    type: "cruise_port",
    lat: 18.3317,
    lng: -64.9241,
    aliases: ["havensight", "cruise ship dock", "wico"],
    description: "Major cruise ship port and visitor pickup zone.",
  },
  {
    id: "stt-charlotte-amalie",
    island: "st_thomas",
    name: "Charlotte Amalie",
    type: "taxi_stand",
    lat: 18.3419,
    lng: -64.9307,
    aliases: ["town", "downtown", "charlotte amalie"],
    description: "Downtown St. Thomas shopping, taxi, safari, and walking hub.",
  },
  {
    id: "stt-99-steps",
    island: "st_thomas",
    name: "99 Steps",
    type: "landmark",
    lat: 18.3425,
    lng: -64.9301,
    aliases: ["99 steps", "ninety nine steps"],
    description: "Historic Charlotte Amalie landmark.",
  },
  {
    id: "stj-cruz-bay",
    island: "st_john",
    name: "Cruz Bay Ferry Terminal",
    type: "ferry_terminal",
    lat: 18.3317,
    lng: -64.7944,
    aliases: ["cruz bay", "st john ferry", "ferry dock"],
    description: "Primary ferry arrival point on St. John.",
  },
  {
    id: "stx-airport",
    island: "st_croix",
    name: "Henry E. Rohlsen Airport",
    type: "airport",
    lat: 17.7019,
    lng: -64.7986,
    aliases: ["stx airport", "rohlsen airport", "airport"],
    description: "Main St. Croix airport pickup and drop-off area.",
  },
  {
    id: "stx-christiansted",
    island: "st_croix",
    name: "Christiansted",
    type: "taxi_stand",
    lat: 17.7466,
    lng: -64.7041,
    aliases: ["christiansted", "town"],
    description: "Historic town, boardwalk, ferry, dining, and taxi area.",
  },
  {
    id: "stx-frederiksted",
    island: "st_croix",
    name: "Frederiksted Pier",
    type: "cruise_port",
    lat: 17.7125,
    lng: -64.8831,
    aliases: ["frederiksted", "pier", "cruise pier"],
    description: "Cruise and west-end transportation hub.",
  },
];


export const allTransportHubs: TransportHub[] = [
  ...transportHubs,
  ...communityHubs,
];