import type { HistoricSite } from "./types";

type HistoricSiteCorrection = Partial<
  Pick<
    HistoricSite,
    | "aliases"
    | "description"
    | "shortDescription"
    | "tags"
    | "nrhpOtherNames"
  >
>;

/**
 * Small, explicit corrections for source records whose imported text was
 * damaged or assigned to the wrong island. Keeping these corrections outside
 * the source snapshot preserves provenance while ensuring every public
 * Historic/Heritage surface reads the corrected record.
 */
export const HISTORIC_SITE_CORRECTIONS: Readonly<
  Record<string, HistoricSiteCorrection>
> = Object.freeze({
  "barracks-no-2": {
    aliases: ["Enlisted Men's Barracks No. 2", "Submarine Base Building 18"],
    nrhpOtherNames: [
      "Enlisted Men's Barracks No. 2",
      "Submarine Base Building 18",
    ],
  },
  "evelyn-e-marcelli-elementary-school": {
    aliases: [
      "Marine and Strangers' Hospital",
      "Backerdahl Home",
      "Tailtal Home",
      "George Washington Elementary School",
    ],
    nrhpOtherNames: [
      "Marine and Strangers' Hospital",
      "Backerdahl Home",
      "Tailtal Home",
      "George Washington Elementary School",
    ],
  },
  "bethlehem-sugar-factory": {
    description:
      "Bethlehem Sugar Factory is a historic ruin and heritage site on St. Croix, U.S. Virgin Islands.",
    shortDescription:
      "Bethlehem Sugar Factory is a historic ruin and heritage site on St. Croix.",
    tags: ["ruin", "STX", "historic", "usvi", "stx"],
  },
});

export const HISTORIC_SITE_CORRECTION_IDS = Object.freeze(
  Object.keys(HISTORIC_SITE_CORRECTIONS),
);

export function applyHistoricSiteCorrection(site: HistoricSite): HistoricSite {
  const correction = HISTORIC_SITE_CORRECTIONS[site.id];
  return correction ? { ...site, ...correction } : site;
}
