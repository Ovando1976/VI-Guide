import { estateResearchTargets } from "./estateResearchTargets";
import { originalEstateOwnerMatches } from "./originalEstateOwnerMatches";

export const estateResearchBatches = [
  {
    id: "batch-001-priority-archive-targets",
    name: "Priority archival estate targets",
    status: "active",
    estates: estateResearchTargets.map((target) => target.modernEstateName),
  },
  {
    id: "batch-000-verified-seed-matches",
    name: "Verified seed owner matches",
    status: "complete",
    estates: originalEstateOwnerMatches.map((match) => match.currentEstateName),
  },
];

export const estateResearchProgress = {
  verifiedOwnerMatches: originalEstateOwnerMatches.length,
  activeResearchTargets: estateResearchTargets.length,
  strategy: "Scale to all modern estates in batches after validating archival evidence workflow.",
};
