import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "USVI Compass — U.S. Virgin Islands",
    short_name: "USVI Compass",
    description:
      "Explore beaches, places, stays, heritage, transportation, and island plans across the U.S. Virgin Islands.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f7f5",
    theme_color: "#062b35",
    orientation: "portrait-primary",
    categories: ["travel", "navigation", "lifestyle"],
    shortcuts: [
      {
        name: "Ask Concierge",
        short_name: "Concierge",
        description: "Search the live USVI Compass catalog and plan an island day.",
        url: "/concierge",
      },
      {
        name: "Open Map",
        short_name: "Map",
        description: "Explore the U.S. Virgin Islands map.",
        url: "/map",
      },
      {
        name: "Plan a Ride",
        short_name: "Ride",
        description: "Review local transportation options.",
        url: "/mobility",
      },
    ],
  };
}
