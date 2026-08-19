import type { QuarterAssignment } from "@/types/usvi";

/**
 * Evidence-backed St. Thomas quarter assignments.
 *
 * IMPORTANT:
 * - These records describe specific parcels/places, not blanket estate-wide rules.
 * - Never infer a quarter for every parcel in an estate from one record.
 * - Tariff identity is resolved independently from quarter/estate geography.
 */
export type StThomasQuarterEvidence = {
  estateName: string;
  parcelId: string;
  assignment: QuarterAssignment;
};

const EAST_END_SOURCE =
  "https://dpp.vi.gov/wp-content/uploads/2016/03/Copy-of-Government-Properties-Territorial.pdf";
const DPNR_SMITH_BAY_SOURCE =
  "https://dpnr.vi.gov/press_releases/public-hearing-on-proposed-zoning-map-amendment-to-the-virgin-islands-official-district-maps/";
const LEGISLATURE_SMITH_BAY_SOURCE =
  "https://legvi.org/lawmakers-vet-territorial-rezonings/";

export const ST_THOMAS_QUARTER_EVIDENCE: readonly StThomasQuarterEvidence[] = [
  {
    estateName: "Smith Bay",
    parcelId: "87",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: EAST_END_SOURCE,
      sourceRecord: "Smith Bay 87 East End Qtr",
      parcelId: "87",
      notes: "Government of the Virgin Islands property inventory legal description.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "94-1",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: EAST_END_SOURCE,
      sourceRecord: "Smith Bay 94-1 East End Qtr",
      parcelId: "94-1",
      notes: "Government of the Virgin Islands property inventory legal description.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "98-5",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: EAST_END_SOURCE,
      sourceRecord: "Smith Bay 98-5 Eastend Qtr",
      parcelId: "98-5",
      notes: "Government property inventory identifies this specific Smith Bay parcel in East End Quarter.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "98-8-1A & 98-8-1B",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: EAST_END_SOURCE,
      sourceRecord: "Smith Bay 98-8-1A & 1B East End Quarter",
      parcelId: "98-8-1A & 98-8-1B",
      notes: "Government property inventory legal description.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "57B-19",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: EAST_END_SOURCE,
      sourceRecord: "Smith Bay 57B-19 East End Qtr",
      parcelId: "57B-19",
      notes: "Government property inventory legal description.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "19K",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: EAST_END_SOURCE,
      sourceRecord: "19K Estate Smith Bay Nos. 1, 2 & 3 East End Qtr",
      parcelId: "19K",
      notes: "Government property inventory legal description.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "19-C-A & 19-C-B",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: DPNR_SMITH_BAY_SOURCE,
      sourceRecord: "GDP-24-1",
      parcelId: "19-C-A & 19-C-B",
      notes: "DPNR zoning hearing identifies both parcels as Estate Smith Bay, Nos. 1, 2 & 3 East End Quarter.",
    },
  },
  {
    estateName: "Smith Bay",
    parcelId: "19-2-111",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: LEGISLATURE_SMITH_BAY_SOURCE,
      sourceRecord: "Bill No. 36-0267",
      parcelId: "19-2-111",
      notes: "36th Legislature record identifies the parcel as Estate Smith Bay, Nos. 1, 2 & 3 East End Quarter.",
    },
  },
] as const;

export function quarterEvidenceForEstate(estateName: string): readonly StThomasQuarterEvidence[] {
  const normalized = estateName.trim().toLowerCase();
  return ST_THOMAS_QUARTER_EVIDENCE.filter(
    (record) => record.estateName.toLowerCase() === normalized,
  );
}
