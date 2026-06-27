import type { HistoryNode } from "../historyGraphTypes";

export const stThomasFamilyEstateNodes: HistoryNode[] = [
  { id: "family:dewindt", type: "family", label: "de Windt Family", properties: {}, evidence: [] },
  { id: "family:magens", type: "family", label: "Magens Family", properties: {}, evidence: [] },
  { id: "family:petersen", type: "family", label: "Petersen Family", properties: {}, evidence: [] },
  { id: "family:schifter", type: "family", label: "Schifter Family", properties: {}, evidence: [] },
  { id: "family:pogy", type: "family", label: "Pogy / Pogh Family", properties: {}, evidence: [] },
  { id: "family:van-beverhoudt", type: "family", label: "van Beverhoudt Family", properties: {}, evidence: [] },
  { id: "family:pentz", type: "family", label: "Pentz Family", properties: { status: "unresolved" }, evidence: [] },

  { id: "person:pogy:octavius", type: "person", label: "Octavius Pogy", properties: { aliases: ["Octavius Pogh"] }, evidence: [] },
  { id: "person:schifter:erasmus-frederick", type: "person", label: "Erasmus Frederick Schifter", properties: {}, evidence: [] },
  { id: "person:magens:arve-petersen", type: "person", label: "Arve Petersen Magens", properties: { familyName: "Magens" }, evidence: [] },
  { id: "person:van-beverhoudt:lucas", type: "person", label: "Lucas van Beverhoudt", properties: {}, evidence: [] },
  { id: "person:van-beverhoudt:peter-clausen", type: "person", label: "Peter Clausen van Beverhoudt", properties: {}, evidence: [] },
  { id: "person:van-beverhoudt:joannes", type: "person", label: "Joannes van Beverhoudt", properties: {}, evidence: [] },
  { id: "person:dewindt:pieter", type: "person", label: "Pieter de Wint / de Windt", properties: {}, evidence: [] },

  { id: "estate-complex:annas-retreat", type: "estate", label: "Anna's Retreat / Tutu-Tabor-Harmoni", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:tutu", type: "estate", label: "Tutu", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:tabor", type: "estate", label: "Tabor", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:harmonie", type: "estate", label: "Harmonie / Harmoni", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:zufriedenheit", type: "estate", label: "Zufriedenheit / Magens Bay", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:nisky", type: "estate", label: "Nisky / Mosquito Bay", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:new-herrnhut", type: "estate", label: "New Herrnhut", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:krum-bay", type: "estate", label: "Krum Bay", properties: { island: "st_thomas" }, evidence: [] },
  { id: "place:savan-cemetery-parcel", type: "historical_place", label: "Savan Moravian Cemetery Parcel", properties: { island: "st_thomas" }, evidence: [] },
  { id: "estate:unmatched-dewindt-st-thomas", type: "estate", label: "Unmatched de Windt St. Thomas holdings", properties: { status: "needs land-list extraction" }, evidence: [] },
  { id: "estate:unmatched-pentz-st-thomas", type: "estate", label: "Unmatched Pentz St. Thomas holdings", properties: { status: "unresolved" }, evidence: [] },
];
