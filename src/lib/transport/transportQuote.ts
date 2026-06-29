import { getVitranFare } from "../../data/transport/vitranFares";
import type { TransportNode, TransportQuote, VitranFareType } from "../../data/transport/transportTypes";

export function quoteVitranTrip({
  fareType = "regular",
  from,
  to,
}: {
  fareType?: VitranFareType;
  from?: TransportNode | null;
  to?: TransportNode | null;
}): TransportQuote {
  const fare = getVitranFare(fareType);

  return {
    mode: "vitran",
    label: `VITRAN ${fare.label}`,
    fare: fare.fare,
    fareText: fare.fareText,
    notes: [
      "Fixed-route VITRAN fare estimate.",
      from?.routes?.length ? `Origin routes: ${from.routes.join(", ")}` : "Origin route to be confirmed.",
      to?.routes?.length ? `Destination routes: ${to.routes.join(", ")}` : "Destination route to be confirmed.",
      "Schedules and stop locations should be verified against the latest DPW/VITRAN schedule.",
    ],
  };
}

export function buildMobilityQuotes({
  from,
  to,
  fareType = "regular",
}: {
  from?: TransportNode | null;
  to?: TransportNode | null;
  fareType?: VitranFareType;
}): TransportQuote[] {
  return [
    quoteVitranTrip({ from, to, fareType }),
    {
      mode: "safari",
      label: "Safari / Public Taxi Route",
      fare: 2,
      fareText: "$2.00",
      notes: ["Local safari estimate. Availability varies by route, time, and island."],
    },
    {
      mode: "taxi",
      label: "Taxi",
      fare: 0,
      fareText: "Official fare lookup",
      notes: ["Use VI Guide taxi-zone fare engine for the official taxi quote."],
    },
  ];
}
