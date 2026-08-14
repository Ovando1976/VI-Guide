import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "USVI Explorer — Your Virgin Islands Travel Companion",
    short_name: "USVI Explorer",
    description:
      "Discover, plan and move through St. Thomas, St. John and St. Croix with local context connected to every step.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f1e6",
    theme_color: "#062b3a",
    orientation: "portrait-primary",
    categories: ["travel", "navigation", "lifestyle"],
    shortcuts: [
      {
        name: "Ask Concierge",
        short_name: "Concierge",
        description: "Search the live USVI Explorer catalog and plan an island day.",
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
