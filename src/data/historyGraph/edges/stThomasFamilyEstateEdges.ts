import type { HistoryEdge } from "../historyGraphTypes";
import { createConfidence } from "../ingestion/assertionEngine";

const source = {
  sourceDocumentId: "doc:research:st-thomas-family-estates-network",
  sourceCollection: "St. Thomas Estate Ownership Research Pass",
  confidence: createConfidence("high"),
};

const probable = { ...source, confidence: createConfidence("probable") };
const unresolved = { ...source, confidence: createConfidence("unresolved") };

export const stThomasFamilyEstateEdges: HistoryEdge[] = [
  {
    id: "edge:tutu:consolidated:annas-retreat",
    type: "CONSOLIDATED_INTO",
    sourceNodeId: "estate:tutu",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: { claim: "Tutu was one of the three plantations deeded under Anna's Retreat." },
    evidence: [source],
  },
  {
    id: "edge:tabor:consolidated:annas-retreat",
    type: "CONSOLIDATED_INTO",
    sourceNodeId: "estate:tabor",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: { claim: "Tabor was one of the three plantations deeded under Anna's Retreat." },
    evidence: [source],
  },
  {
    id: "edge:harmonie:consolidated:annas-retreat",
    type: "CONSOLIDATED_INTO",
    sourceNodeId: "estate:harmonie",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: { claim: "Harmoni/Harmonie was one of the three plantations deeded under Anna's Retreat." },
    evidence: [source],
  },
  {
    id: "edge:pogy:sells:annas-retreat:1813",
    type: "SELLS",
    sourceNodeId: "person:pogy:octavius",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: { buyer: "person:schifter:erasmus-frederick", requiresPrimaryDeed: true },
    evidence: [probable],
  },
  {
    id: "edge:schifter:purchases:annas-retreat:1813",
    type: "PURCHASES",
    sourceNodeId: "person:schifter:erasmus-frederick",
    targetNodeId: "estate-complex:annas-retreat",
    effectiveFrom: "1813",
    properties: { seller: "person:pogy:octavius", requiresPrimaryDeed: true },
    evidence: [probable],
  },
  {
    id: "edge:magens:purchases:zufriedenheit:1817",
    type: "PURCHASES",
    sourceNodeId: "person:magens:arve-petersen",
    targetNodeId: "estate:zufriedenheit",
    effectiveFrom: "1817",
    properties: { claim: "Arve Petersen Magens purchased Zufriedenheit." },
    evidence: [source],
  },
  {
    id: "edge:van-beverhoudt:joannes:krum-bay:1749",
    type: "SELLS",
    sourceNodeId: "person:van-beverhoudt:joannes",
    targetNodeId: "estate:krum-bay",
    effectiveFrom: "1749",
    properties: { claim: "Earlier conveyance by Joannes van Beverhoudt appears in later Moravian title paper." },
    evidence: [probable],
  },
  {
    id: "edge:van-beverhoudt:peter:savan:1786",
    type: "SELLS",
    sourceNodeId: "person:van-beverhoudt:peter-clausen",
    targetNodeId: "place:savan-cemetery-parcel",
    effectiveFrom: "1786",
    properties: { claim: "Peter Clausen van Beverhoudt deed Savan land to Moravian Brethren." },
    evidence: [source],
  },
  {
    id: "edge:dewindt:pieter:unmatched-stt",
    type: "OWNS",
    sourceNodeId: "person:dewindt:pieter",
    targetNodeId: "estate:unmatched-dewindt-st-thomas",
    effectiveFrom: "1700",
    properties: { requiresArchivalTarget: true },
    evidence: [probable],
  },
  {
    id: "edge:pentz:requires-target",
    type: "REQUIRES_ARCHIVAL_TARGET",
    sourceNodeId: "family:pentz",
    targetNodeId: "estate:unmatched-pentz-st-thomas",
    properties: { claim: "No secure St. Thomas estate chain found yet." },
    evidence: [unresolved],
  },
];
