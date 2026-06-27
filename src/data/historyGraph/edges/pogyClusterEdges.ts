import type { HistoryEdge } from "../historyGraphTypes";
import { createConfidence } from "../ingestion/assertionEngine";

const notice1817Evidence = {
  sourceDocumentId: "doc:legal-notice:annas-retreat:1817",
  sourceCollection: "1817 published legal notice",
  confidence: createConfidence("confirmed"),
  extractedTextOriginal:
    "die Plantagen Tutu, Tabor und Harmonie, jetzt genannt Anna's Retreat",
  extractedTextTranslation:
    "the plantations Tutu, Tabor and Harmonie, now called Anna's Retreat",
};

const nrhp1976Evidence = {
  sourceDocumentId: "doc:nrhp:tutu-plantation-house:1976",
  sourceCollection: "National Register nomination for Tutu Plantation House",
  page: "nomination narrative",
  confidence: createConfidence("probable"),
  notes:
    "Reports 1813 deed from Octavius Pogy to Erasmus Frederick Schifter; original deed still required.",
};

export const pogyClusterEdges: HistoryEdge[] = [
  {
    id: "edge:component:tutu:annas-retreat:1817",
    type: "CONSOLIDATED_INTO",
    sourceNodeId: "estate:tutu",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: {
      relationship: "component plantation consolidated into estate complex",
    },
    evidence: [notice1817Evidence],
  },
  {
    id: "edge:component:tabor:annas-retreat:1817",
    type: "CONSOLIDATED_INTO",
    sourceNodeId: "estate:tabor",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: {
      relationship: "component plantation consolidated into estate complex",
    },
    evidence: [notice1817Evidence],
  },
  {
    id: "edge:component:harmonie:annas-retreat:1817",
    type: "CONSOLIDATED_INTO",
    sourceNodeId: "estate:harmonie",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: {
      relationship: "component plantation consolidated into estate complex",
    },
    evidence: [notice1817Evidence],
  },
  {
    id: "edge:sale:pogy:schifter:annas-retreat:1813",
    type: "SELLS",
    sourceNodeId: "person:pogy:octavius",
    targetNodeId: "person:schifter:erasmus-frederick",
    effectiveFrom: "1813",
    properties: {
      assetNodeId: "estate-complex:annas-retreat",
      transaction: "reported deed transfer",
      requiresPrimaryDeed: true,
    },
    evidence: [nrhp1976Evidence],
  },
  {
    id: "edge:guardian:goldmann:mariette-pogy:1817",
    type: "GUARDIAN_OF",
    sourceNodeId: "person:goldmann:christian",
    targetNodeId: "person:pogy:mariette-henriette",
    effectiveFrom: "1817",
    properties: {
      role: "appointed curator / guardian",
    },
    evidence: [
      {
        sourceDocumentId: "doc:legal-notice:annas-retreat:1817",
        sourceCollection: "1817 published legal notice",
        confidence: createConfidence("confirmed"),
        extractedTextOriginal:
          "Christian Goldmann, als bestellten Curator der unmündigen Mariette Henriette Pogy",
        extractedTextTranslation:
          "Christian Goldmann, as appointed guardian of the minor Mariette Henriette Pogy",
      },
    ],
  },
];
