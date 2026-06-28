import { taxiFareRulesSTT } from "./taxiFareRulesSTT";
import { taxiFareRulesSTJ } from "./taxiFareRulesSTJ";
import { taxiFareRulesSTX } from "./taxiFareRulesSTX";
import type { TaxiFareRule } from "../lib/mobility/taxi/types";

export const taxiFareRules: TaxiFareRule[] = [
  ...taxiFareRulesSTT,
  ...taxiFareRulesSTJ,
  ...taxiFareRulesSTX,
];
