import { originalEstateOwnerMatches } from "./originalEstateOwnerMatches";
import { estateResearchTargets } from "./estateResearchTargets";
import { batchOneEstateEvidence } from "./batchOneEstateEvidence";
import { complexEstateFootprints } from "./complexEstateFootprints";

export const estateHistoryDashboard = {
  verifiedOwnerMatches: originalEstateOwnerMatches.length,
  activeResearchTargets: estateResearchTargets.length,
  evidenceItems: batchOneEstateEvidence.length,
  complexFootprints: complexEstateFootprints.length,
  unresolvedEvidenceItems: batchOneEstateEvidence.filter(
    (item) => item.confidence === "unresolved",
  ).length,
  nextPriorityTargets: estateResearchTargets
    .filter((target) => target.status === "needs_primary_sources")
    .map((target) => target.modernEstateName),
};
