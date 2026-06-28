import { archiveKnowledgeSource } from "./archiveKnowledgeSource";
import { dictionaryKnowledgeSource } from "./dictionaryKnowledgeSource";
import { estateKnowledgeSource } from "./estateKnowledgeSource";
import { historicSiteKnowledgeSource } from "./historicSiteKnowledgeSource";
import { geographicKnowledgeSource } from "./geographicSource";
import { createFutureKnowledgeSource } from "./futureSource";
import type { KnowledgeSourceAdapter } from "./types";

export const conciergeKnowledgeSources: KnowledgeSourceAdapter[] = [
  archiveKnowledgeSource,
  dictionaryKnowledgeSource,
  estateKnowledgeSource,
  historicSiteKnowledgeSource,
  geographicKnowledgeSource,
  createFutureKnowledgeSource("business", "Businesses"),
  createFutureKnowledgeSource("event", "Events"),
  createFutureKnowledgeSource("parcel", "Parcels"),
  createFutureKnowledgeSource("route", "Routes"),
];

export type {
  KnowledgeSourceAdapter,
  KnowledgeSourceInput,
  KnowledgeSourceResult,
} from "./types";
