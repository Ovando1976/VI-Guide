import type { HistoryNode } from "../historyGraphTypes";

export const pogyClusterNodes: HistoryNode[] = [
  {
    id: "person:pogy:octavius",
    type: "person",
    label: "Octavius Pogy",
    properties: {
      familyName: "Pogy",
      aliases: ["Octavius Pogh"],
      researchRole: "Reported 1813 grantor/seller of Anna's Retreat complex",
    },
    evidence: [],
  },
  {
    id: "person:pogy:mariette-henriette",
    type: "person",
    label: "Mariette Henriette Pogy",
    properties: {
      familyName: "Pogy",
      status: "minor in 1817 legal notice",
    },
    evidence: [],
  },
  {
    id: "person:goldmann:christian",
    type: "person",
    label: "Christian Goldmann",
    properties: {
      researchRole: "Guardian / curator for Mariette Henriette Pogy",
    },
    evidence: [],
  },
  {
    id: "person:schifter:erasmus-frederick",
    type: "person",
    label: "Erasmus Frederick Schifter",
    properties: {
      familyName: "Schifter",
      researchRole: "Reported 1813 grantee/buyer of Anna's Retreat complex",
    },
    evidence: [],
  },
  {
    id: "estate:tutu",
    type: "estate",
    label: "Tutu",
    properties: {
      island: "st_thomas",
      quarter: "East End / New Quarter",
      status: "older component plantation",
    },
    evidence: [],
  },
  {
    id: "estate:tabor",
    type: "estate",
    label: "Tabor",
    properties: {
      island: "st_thomas",
      quarter: "East End / New Quarter",
      status: "component plantation",
    },
    evidence: [],
  },
  {
    id: "estate:harmonie",
    type: "estate",
    label: "Harmonie",
    properties: {
      island: "st_thomas",
      quarter: "East End / New Quarter",
      aliases: ["Harmoni", "Harmony"],
      status: "component plantation",
    },
    evidence: [],
  },
  {
    id: "estate-complex:annas-retreat",
    type: "estate",
    label: "Anna's Retreat",
    properties: {
      island: "st_thomas",
      aliases: ["Annas Retreat", "Tutu", "Anna's Retreat oder Tutu"],
      status: "merged estate complex",
      componentEstates: ["Tutu", "Tabor", "Harmonie"],
    },
    evidence: [],
  },
  {
    id: "doc:legal-notice:annas-retreat:1817",
    type: "source_document",
    label: "1817 legal notice: Tutu, Tabor, and Harmonie now called Anna's Retreat",
    properties: {
      year: 1817,
      sourceType: "legal_notice",
      language: "German",
    },
    evidence: [],
  },
  {
    id: "doc:nrhp:tutu-plantation-house:1976",
    type: "source_document",
    label: "1976 NRHP nomination: Tutu Plantation House",
    properties: {
      year: 1976,
      sourceType: "national_register",
    },
    evidence: [],
  },
];
