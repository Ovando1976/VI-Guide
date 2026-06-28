import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

import type { IslandCode, UserProfile } from "../types";

type AppIntelligenceInput = {
  selectedIsland?: IslandCode;
  selectedIslandLabel?: string;
  profile?: UserProfile | null;
  userLocation?: { lat: number; lng: number } | null;
  contextTitle?: string | null;
};

export type AppIntelligenceContext = {
  currentPath: string;
  routeName: string;
  selectedIsland?: IslandCode;
  selectedIslandLabel: string;
  query: string;
  intent: string;
  contextTitle?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  favoriteCount: number;
  suggestions: string[];
  systemContext: string;
};

function routeName(pathname: string) {
  if (pathname.includes("beach")) return "Beaches";
  if (pathname.includes("eat")) return "Food";
  if (pathname.includes("event")) return "Events";
  if (pathname.includes("map")) return "Map";
  if (pathname.includes("mobility")) return "Mobility";
  if (pathname.includes("business")) return "Businesses";
  if (pathname.includes("merchant")) return "Merchant Dashboard";
  if (pathname.includes("history")) return "History";
  if (pathname.includes("dictionary")) return "Dictionary";
  if (pathname.includes("concierge")) return "Concierge";
  return "Home";
}

function suggestionsForRoute(pathname: string) {
  if (pathname.includes("beach")) {
    return ["Is this beach crowded?", "Taxi from here", "Best beach nearby"];
  }

  if (pathname.includes("eat")) {
    return ["Best lunch nearby", "Family-friendly food", "Call this restaurant"];
  }

  if (pathname.includes("map")) {
    return ["What is near here?", "Route to Red Hook", "Show historic places"];
  }

  if (pathname.includes("mobility")) {
    return ["Taxi to Magens Bay", "Airport to Red Hook", "Estimate my fare"];
  }

  if (pathname.includes("business")) {
    return ["Find contractors", "Best tour companies", "Restaurants near me"];
  }

  if (pathname.includes("merchant")) {
    return ["What needs attention?", "Summarize leads", "Show revenue risks"];
  }

  if (pathname.includes("history")) {
    return ["Historic tour nearby", "Explain this estate", "Find archives"];
  }

  return [
    "Best beach and lunch near me",
    "Taxi to Red Hook",
    "Plan a historic day",
    "Find local businesses",
    "Ask about this island",
  ];
}

export function useAppIntelligence({
  selectedIsland,
  selectedIslandLabel = "St. Thomas",
  profile,
  userLocation,
  contextTitle,
}: AppIntelligenceInput): AppIntelligenceContext {
  const location = useLocation();
  const [params] = useSearchParams();

  return useMemo(() => {
    const route = routeName(location.pathname);
    const query = params.get("q") || params.get("context") || "";
    const intent = params.get("intent") || "";

    const systemContext = [
      `Current route: ${route}`,
      `Path: ${location.pathname}`,
      `Island: ${selectedIslandLabel}`,
      selectedIsland ? `Island code: ${selectedIsland}` : "",
      query ? `Current query/context: ${query}` : "",
      intent ? `Intent: ${intent}` : "",
      contextTitle ? `Current item being viewed: ${contextTitle}` : "",
      userLocation
        ? `User location: ${userLocation.lat}, ${userLocation.lng}`
        : "",
      profile?.favorites?.length
        ? `User has ${profile.favorites.length} saved favorites.`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      currentPath: location.pathname,
      routeName: route,
      selectedIsland,
      selectedIslandLabel,
      query,
      intent,
      contextTitle,
      userLocation,
      favoriteCount: profile?.favorites?.length ?? 0,
      suggestions: suggestionsForRoute(location.pathname),
      systemContext,
    };
  }, [
    location.pathname,
    params,
    selectedIsland,
    selectedIslandLabel,
    profile?.favorites?.length,
    userLocation,
    contextTitle,
  ]);
}