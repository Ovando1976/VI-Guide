import { getTravelKnowledge } from "@/lib/travel-knowledge";
import type { ConciergeContext } from "@/types/concierge";

export type ConciergeToolName =
  | "search_places"
  | "search_beaches"
  | "search_history"
  | "search_stays"
  | "nearby"
  | "check_time_budget"
  | "build_day_plan";

export type ConciergeToolResult = {
  tool: ConciergeToolName;
  ok: boolean;
  evidence: unknown;
  warnings: string[];
};

const STOP_WORDS = new Set([
  "about", "after", "before", "could", "from", "have", "help", "island",
  "looking", "need", "please", "that", "there", "this", "want", "what",
  "where", "with", "would", "something", "some", "give", "find", "make",
]);

function tokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function search(kind: "places" | "beaches" | "historic" | "stays", query: string, context: ConciergeContext) {
  const wanted = tokens(query);
  return getTravelKnowledge(kind)
    .filter((item) => item.island.toLowerCase() === context.island.toLowerCase())
    .map((item) => {
      const haystack = `${item.name} ${item.description} ${item.category ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
      const score = wanted.reduce((n, token) => n + (haystack.includes(token) ? 3 : 0), 0)
        + (context.selectedEstate?.geoid && item.estateGeoid === context.selectedEstate.geoid ? 6 : 0);
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
    .slice(0, 8)
    .map(({ item }) => ({
      name: item.name,
      slug: item.slug,
      description: item.description.slice(0, 280),
      category: item.category,
      island: item.island,
      estateGeoid: item.estateGeoid ?? null,
      tags: item.tags?.slice(0, 8) ?? [],
    }));
}

export function runConciergeTool(
  tool: ConciergeToolName,
  input: { query?: string; minutesAvailable?: number; departureTime?: string },
  context: ConciergeContext,
): ConciergeToolResult {
  switch (tool) {
    case "search_places":
      return { tool, ok: true, evidence: search("places", input.query ?? "", context), warnings: [] };
    case "search_beaches":
      return { tool, ok: true, evidence: search("beaches", input.query ?? "beach", context), warnings: [] };
    case "search_history":
      return { tool, ok: true, evidence: search("historic", input.query ?? "history", context), warnings: [] };
    case "search_stays":
      return { tool, ok: true, evidence: search("stays", input.query ?? "", context), warnings: [] };
    case "nearby": {
      const nearby = context.nearbyEstates.slice(0, 8).map((estate) => ({ geoid: estate.geoid, name: estate.name }));
      return {
        tool,
        ok: true,
        evidence: nearby,
        warnings: nearby.length ? [] : ["No nearby mapped estates were supplied by the current map context."],
      };
    }
    case "check_time_budget": {
      const minutes = Math.max(0, Math.min(1440, Number(input.minutesAvailable) || 0));
      const usable = Math.max(0, minutes - 120);
      return {
        tool,
        ok: true,
        evidence: {
          availableMinutes: minutes,
          protectedBufferMinutes: 120,
          usableMinutes: usable,
          recommendation: usable <= 0 ? "No usable planning window was established. Ask for or derive a time window before constructing a schedule." : usable < 120 ? "Keep the plan to one primary stop." : usable < 240 ? "Use one primary stop plus one nearby food or short-interest stop." : "A two-to-three-stop plan may fit if locations are geographically coherent.",
        },
        warnings: minutes === 0 ? ["No time budget was supplied; do not construct a timed itinerary."] : minutes < 180 ? ["Short window: avoid cross-island transfers and overpacking the itinerary."] : [],
      };
    }
    case "build_day_plan": {
      const minutes = Math.max(0, Math.min(1440, Number(input.minutesAvailable) || 0));
      const usable = Math.max(0, minutes - 120);
      const places = search("places", input.query ?? "", context);
      const beaches = search("beaches", input.query ?? "beach", context);
      const history = search("historic", input.query ?? "history", context);
      if (minutes === 0 || usable === 0) {
        return {
          tool,
          ok: true,
          evidence: {
            availableMinutes: minutes,
            protectedBufferMinutes: 120,
            usableMinutes: usable,
            candidates: [],
            sequencingRule: "Do not construct a timed itinerary until a real time window is known. Gather interests and evidence first.",
          },
          warnings: ["No usable time window was supplied; this result is discovery evidence only, not an itinerary draft."],
        };
      }
      const candidates = [...beaches.slice(0, 2), ...places.slice(0, 2), ...history.slice(0, 2)];
      return {
        tool,
        ok: true,
        evidence: {
          availableMinutes: minutes,
          protectedBufferMinutes: 120,
          usableMinutes: usable,
          candidates: candidates.slice(0, usable >= 240 ? 5 : usable >= 120 ? 3 : 1),
          sequencingRule: "Prefer geographically coherent stops and preserve the return buffer. Exact travel times and operating hours must be verified before promising a schedule.",
        },
        warnings: ["This planner creates a planning draft, not a booking or confirmed schedule."],
      };
    }
  }
}
