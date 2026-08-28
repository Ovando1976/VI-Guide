import assert from "node:assert/strict";

import { buildDiscoveryMapHref } from "../lib/discovery/map-links";
import { mapHrefForJourneyPlan } from "../lib/island-journey-map";
import { buildJourneyMobilityHref } from "../lib/mobility/ride-links";

function parseInternalHref(href: string) {
  return new URL(href, "https://usvi-explorer.local");
}

const mappedPlace = parseInternalHref(
  buildDiscoveryMapHref({
    id: "beach:magens-bay",
    name: "Magens Bay",
    slug: "magens-bay",
    island: "stt",
    type: "beach",
    lat: 18.3623,
    lng: -64.9236,
    estateGeoid: "7803086200",
  }),
);
assert.equal(mappedPlace.pathname, "/map");
assert.equal(mappedPlace.searchParams.get("place"), "beach:magens-bay");
assert.equal(mappedPlace.searchParams.get("estate"), "7803086200");

const standardTripMap = parseInternalHref(
  mapHrefForJourneyPlan({
    id: "plan_map",
    title: "Magens Bay day",
    island: "stt",
    date: "2026-08-28",
    createdAt: "2026-08-28T12:00:00.000Z",
    updatedAt: "2026-08-28T12:00:00.000Z",
    status: "ready",
    notes: "",
    plan: [
      {
        id: "stop_magens_map",
        placeId: "beach:magens-bay",
        title: "Magens Bay",
        island: "stt",
        kind: "beach",
        summary: "Beach stop",
        lat: 18.3623,
        lng: -64.9236,
        mapHref: mappedPlace.pathname + mappedPlace.search,
      },
    ],
  }),
);
assert.equal(standardTripMap.pathname, "/map");
assert.equal(standardTripMap.searchParams.get("trip"), "plan_map");
assert.equal(standardTripMap.searchParams.get("island"), "stt");
assert.equal(standardTripMap.searchParams.get("place"), "beach:magens-bay");
assert.equal(standardTripMap.searchParams.get("placeName"), "Magens Bay");

const ferryTripMap = parseInternalHref(
  mapHrefForJourneyPlan({
    id: "plan_ferry",
    title: "Red Hook to Cruz Bay",
    island: "stt",
    date: "2026-08-28",
    createdAt: "2026-08-28T12:00:00.000Z",
    updatedAt: "2026-08-28T12:00:00.000Z",
    status: "ready",
    notes: "",
    plan: [
      {
        id: "stop_ferry",
        title: "Red Hook → Cruz Bay",
        island: "stt",
        kind: "ferry",
        summary: "Ferry leg",
      },
    ],
  }),
);
assert.equal(ferryTripMap.pathname, "/map/journey");
assert.equal(ferryTripMap.searchParams.get("trip"), "plan_ferry");

const singleStop = parseInternalHref(
  buildJourneyMobilityHref({
    id: "plan_single",
    island: "stt",
    plan: [
      {
        id: "stop_magens",
        title: "Magens Bay",
        island: "stt",
        kind: "beach",
        summary: "Beach stop",
        lat: 18.3623,
        lng: -64.9236,
        mapHref: mappedPlace.pathname + mappedPlace.search,
      },
    ],
  }),
);
assert.equal(singleStop.pathname, "/mobility");
assert.equal(singleStop.hash, "#book");
assert.equal(singleStop.searchParams.get("trip"), "plan_single");
assert.equal(singleStop.searchParams.get("source"), "concierge");
assert.equal(singleStop.searchParams.get("to"), "7803086200");
assert.equal(singleStop.searchParams.get("destinationName"), "Magens Bay");
assert.equal(singleStop.searchParams.has("from"), false);

const multiStop = parseInternalHref(
  buildJourneyMobilityHref({
    id: "plan_multi",
    island: "stt",
    plan: [
      {
        id: "stop_airport",
        title: "Cyril E. King Airport",
        island: "stt",
        kind: "transport",
        summary: "Arrival",
        bookingHref: "/mobility?from=7803000300",
      },
      {
        id: "stop_red_hook",
        title: "Red Hook",
        island: "stt",
        kind: "place",
        summary: "Ferry connection",
        bookingHref: "/mobility?to=7803058400",
      },
    ],
  }),
);
assert.equal(multiStop.searchParams.get("from"), "7803000300");
assert.equal(multiStop.searchParams.get("to"), "7803058400");
assert.equal(multiStop.searchParams.get("pickupName"), "Cyril E. King Airport");
assert.equal(multiStop.searchParams.get("destinationName"), "Red Hook");

const unverifiedStop = parseInternalHref(
  buildJourneyMobilityHref({
    id: "plan_unverified",
    island: "stx",
    plan: [
      {
        id: "stop_unknown",
        title: "Unreviewed meeting point",
        island: "stx",
        kind: "place",
        summary: "Traveler-entered location",
        mapHref: "/map?island=stx&placeName=Unreviewed%20meeting%20point",
      },
    ],
  }),
);
assert.equal(unverifiedStop.searchParams.get("destinationName"), "Unreviewed meeting point");
assert.equal(unverifiedStop.searchParams.has("to"), false);

console.log("Traveler MVP map -> Concierge -> Mobility handoff contract passed.");
