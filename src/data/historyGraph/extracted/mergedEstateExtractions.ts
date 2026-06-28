import { generatedEstateExtractions } from "./generatedEstateExtractions.ts";
import { stThomasEstateExtractions } from "./stThomasEstateExtractions.ts";

export const mergedEstateExtractions = [
  ...generatedEstateExtractions.filter(
    (record) =>
      !stThomasEstateExtractions.some(
        (override) => override.estateCanonicalId === record.estateCanonicalId,
      ),
  ),
  ...stThomasEstateExtractions,
];
