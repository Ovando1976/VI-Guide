import { runConciergeTool } from "@/lib/concierge-tools";
import type { ConciergeContext } from "@/types/concierge";

const context: ConciergeContext = {
  island: "stt",
  islandName: "St. Thomas",
  selectedEstate: null,
  pickup: null,
  destination: null,
  rideMode: "private",
  passengers: 2,
  luggage: 0,
  activeLens: "places",
  nearbyEstates: [{ geoid: "STT-TEST-0001", name: "Charlotte Amalie" }],
  traveler: { partySize: 2, interests: ["beach"], pace: "balanced" },
};

const tools = [
  "search_places",
  "search_beaches",
  "search_history",
  "search_stays",
  "nearby",
  "check_time_budget",
  "build_day_plan",
] as const;

for (const tool of tools) {
  const result = runConciergeTool(tool, { query: "beach", minutesAvailable: 360 }, context);
  if (!result.ok || result.tool !== tool) throw new Error(`Concierge tool failed: ${tool}`);
}

const short = runConciergeTool("check_time_budget", { minutesAvailable: 150 }, context);
const shortEvidence = short.evidence as { usableMinutes?: number };
if (shortEvidence.usableMinutes !== 30) throw new Error("Time-budget buffer contract failed.");

const zeroBudget = runConciergeTool("check_time_budget", { minutesAvailable: 0 }, context);
const zeroBudgetEvidence = zeroBudget.evidence as { usableMinutes?: number };
if (zeroBudgetEvidence.usableMinutes !== 0 || !zeroBudget.warnings.length) throw new Error("Zero-budget safety contract failed.");

const zeroPlan = runConciergeTool("build_day_plan", { query: "beach", minutesAvailable: 0 }, context);
const zeroPlanEvidence = zeroPlan.evidence as { candidates?: unknown[]; usableMinutes?: number };
if (zeroPlanEvidence.usableMinutes !== 0 || !Array.isArray(zeroPlanEvidence.candidates) || zeroPlanEvidence.candidates.length !== 0) {
  throw new Error("Zero-time itinerary safety contract failed.");
}

const nearby = runConciergeTool("nearby", {}, context);
if (!Array.isArray(nearby.evidence) || nearby.evidence.length !== 1) throw new Error("Nearby evidence contract failed.");

console.log("Concierge tool contracts passed.");
