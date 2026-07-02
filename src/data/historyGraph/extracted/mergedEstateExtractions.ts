import { generatedEstateExtractions } from "./generatedEstateExtractions";
import { stThomasEstateExtractions } from "./stThomasEstateExtractions";
import type { EstateExtraction } from "./estateExtractionTypes";

const seen = new Set<string>();

export const mergedEstateExtractions: EstateExtraction[] = [
  ...stThomasEstateExtractions,
  ...generatedEstateExtractions,
].filter((item) => {
  const key = item.id || `${item.island || "unknown"}:${item.estateName}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
