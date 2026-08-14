import { findFerryRoute, type FerryPortId } from "@/lib/ferry-planner";

export type DoorToDoorPresetId = "airport-cruz-bay" | "charlotte-cruz-bay" | "stt-christiansted";

export type DoorToDoorLeg = {
  id: string;
  mode: "taxi" | "ferry" | "walk";
  title: string;
  from: string;
  to: string;
  durationMinutes?: number;
  note: string;
  actionHref?: string;
};

export type DoorToDoorJourney = {
  id: DoorToDoorPresetId;
  title: string;
  summary: string;
  fromPort: FerryPortId;
  toPort: FerryPortId;
  legs: DoorToDoorLeg[];
};

const PRESETS: Record<DoorToDoorPresetId, Omit<DoorToDoorJourney, "legs"> & { origin: string; destination: string }> = {
  "airport-cruz-bay": {
    id: "airport-cruz-bay",
    title: "Cyril E. King Airport → Cruz Bay",
    summary: "Airport pickup, Red Hook ferry connection, then arrival in Cruz Bay.",
    fromPort: "red-hook",
    toPort: "cruz-bay",
    origin: "Cyril E. King Airport",
    destination: "Cruz Bay, St. John",
  },
  "charlotte-cruz-bay": {
    id: "charlotte-cruz-bay",
    title: "Charlotte Amalie → Cruz Bay",
    summary: "Connect downtown Charlotte Amalie directly to Cruz Bay by passenger ferry.",
    fromPort: "charlotte-amalie",
    toPort: "cruz-bay",
    origin: "Charlotte Amalie",
    destination: "Cruz Bay, St. John",
  },
  "stt-christiansted": {
    id: "stt-christiansted",
    title: "St. Thomas → Christiansted",
    summary: "Connect Charlotte Amalie to Gallows Bay, then finish in Christiansted.",
    fromPort: "charlotte-amalie",
    toPort: "gallows-bay",
    origin: "Charlotte Amalie",
    destination: "Christiansted, St. Croix",
  },
};

export const DOOR_TO_DOOR_PRESETS = Object.values(PRESETS);

export function buildDoorToDoorJourney(id: DoorToDoorPresetId): DoorToDoorJourney | null {
  const preset = PRESETS[id];
  const ferry = findFerryRoute(preset.fromPort, preset.toPort);
  if (!ferry) return null;

  const originIsTerminal = preset.origin === "Charlotte Amalie" && preset.fromPort === "charlotte-amalie";
  const destinationIsTerminal = preset.toPort === "cruz-bay";
  const legs: DoorToDoorLeg[] = [];

  if (!originIsTerminal) {
    legs.push({
      id: `${id}-pickup`,
      mode: "taxi",
      title: "Get to the ferry",
      from: preset.origin,
      to: ferry.fromLabel,
      note: `Leave enough time to reach the terminal and arrive at least ${ferry.checkInMinutes} minutes before departure.`,
      actionHref: `/mobility?mode=ferry-transfer&pickupName=${encodeURIComponent(preset.origin)}&destinationName=${encodeURIComponent(ferry.fromLabel)}`,
    });
  }

  legs.push({
    id: `${id}-ferry`,
    mode: "ferry",
    title: ferry.serviceLabel,
    from: ferry.fromLabel,
    to: ferry.toLabel,
    durationMinutes: ferry.durationMinutes,
    note: `${ferry.operatingDays}. Published departures: ${ferry.departures.join(", ")}.`,
  });

  if (!destinationIsTerminal) {
    legs.push({
      id: `${id}-arrival`,
      mode: "taxi",
      title: "Finish the journey",
      from: ferry.toLabel,
      to: preset.destination,
      note: "Continue from the arrival terminal to your final destination with USVI Explorer Mobility.",
      actionHref: `/mobility?mode=ferry-transfer&pickupName=${encodeURIComponent(ferry.toLabel)}&destinationName=${encodeURIComponent(preset.destination)}`,
    });
  }

  return { ...preset, legs };
}

export function doorToDoorConciergeHref(journey: DoorToDoorJourney) {
  return `/concierge?prompt=${encodeURIComponent(`Plan my complete door-to-door journey: ${journey.title}. Coordinate the ground transfers, ferry check-in buffer, published sailing options, and arrival connection.`)}`;
}
