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

const GVI_PROPERTY_SOURCE =
  "https://dpp.vi.gov/wp-content/uploads/2016/03/Copy-of-Government-Properties-Territorial.pdf";
const DPNR_SMITH_BAY_SOURCE =
  "https://dpnr.vi.gov/press_releases/public-hearing-on-proposed-zoning-map-amendment-to-the-virgin-islands-official-district-maps/";
const LEGISLATURE_SMITH_BAY_SOURCE =
  "https://legvi.org/committeemeetings/Session/March%2018%2C%202026/Bills/36-0267.pdf";
const VIHFA_LAND_SOURCE =
  "https://vihfa.gov/housing-development/land-parcel-inventory/";
const DPNR_CABLE_LANDING_SOURCE =
  "https://dpnr.vi.gov/wp-content/uploads/2024/10/STT-CABLE-LANDING-CZM-FINAL-PACKAGE.pdf";
const LTG_PARCEL_LAYER_SOURCE =
  "https://services3.arcgis.com/UfiM23HwAqZRk1vw/ArcGIS/rest/services/USVI_PARCELS_GIP/FeatureServer/0";
const VIHA_2026_SOURCE =
  "https://legvi.org/committeemeetings/Budget%2C%20Appropriations%20and%20Finance/FY%202026%20Budget%20Hearings/07-21-2025%20VIHA%20VIHFA%20EDA%20WMA/VI%20Housing%20Authority/Post%20Audit%20Analysis/VIHA%20FY%202026.pdf";
const ST_JOSEPH_ROSENDAHL_SOURCE =
  "https://legvi.org/committeemeetings/Zoning/STT-CCZP0003-25%204I%20Rem%20and%204J%20Rem%20St%20Joseph%20n%20Rosendahl/5.%20Development%20Authorization/Order%20-%20Adjudication%20Signed.pdf";

export const ST_THOMAS_QUARTER_EVIDENCE: readonly StThomasQuarterEvidence[] = [
  ...[
    ["87", "Smith Bay 87 East End Qtr"],
    ["94-1", "Smith Bay 94-1 East End Qtr"],
    ["98-5", "Smith Bay 98-5 Eastend Qtr"],
    ["98-8-1A & 98-8-1B", "Smith Bay 98-8-1A & 1B East End Quarter"],
    ["57B-19", "Smith Bay 57B-19 East End Qtr"],
    ["19K", "19K Estate Smith Bay Nos. 1, 2 & 3 East End Qtr"],
  ].map(([parcelId, sourceRecord]) => ({
    estateName: "Smith Bay",
    parcelId,
    assignment: {
      quarterName: "East End Quarter",
      status: "verified" as const,
      source: GVI_PROPERTY_SOURCE,
      sourceRecord,
      parcelId,
      notes: "Government of the Virgin Islands property inventory legal description.",
    },
  })),
  {
    estateName: "Smith Bay",
    parcelId: "19-C-A & 19-C-B",
    assignment: {
      quarterName: "East End Quarter",
      status: "verified",
      source: DPNR_SMITH_BAY_SOURCE,
      sourceRecord: "GDP-24-1",
      parcelId: "19-C-A & 19-C-B",
      notes: "DPNR identifies both parcels as Estate Smith Bay, Nos. 1, 2 & 3 East End Quarter.",
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
      notes: "36th Legislature identifies the parcel as Estate Smith Bay, Nos. 1, 2 & 3 East End Quarter.",
    },
  },
  {
    estateName: "Mariendahl",
    parcelId: "10-36",
    assignment: {
      quarterName: "Red Hook Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "10-36 Mariendahl NO.4 Red Hook Quarter",
      parcelId: "10-36",
      notes: "VIHFA land inventory legal address.",
    },
  },
  {
    estateName: "Bordeaux",
    parcelId: "122",
    assignment: {
      quarterName: "West End Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "122 Bordeaux West End Quarter",
      parcelId: "122",
      notes: "VIHFA land inventory legal address.",
    },
  },
  {
    estateName: "Annas Fancy",
    parcelId: "130A-130K",
    assignment: {
      quarterName: "Kronprinsens Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "130A Through 130K Anna Fancy Kronprinsens Quarter",
      parcelId: "130A-130K",
      notes: "VIHFA land inventory preserves the Danish/legal quarter name; display aliases may call this Crown Prince Quarter.",
    },
  },
  {
    estateName: "Hospital Ground",
    parcelId: "303B-2",
    assignment: {
      quarterName: "Kings Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "Hospital Ground 303B-2 Kings Quarter",
      parcelId: "303B-2",
      notes: "VIHFA land inventory legal address.",
    },
  },
  {
    estateName: "Hospital Ground",
    parcelId: "A-8",
    assignment: {
      quarterName: "Kings Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "Hospital Ground PCL A-8 Kings Quarter",
      parcelId: "A-8",
      notes: "VIHFA land inventory legal address.",
    },
  },
  {
    estateName: "Madamberg",
    parcelId: "1A",
    assignment: {
      quarterName: "King Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "Madamberg 1A King Quarter",
      parcelId: "1A",
      notes: "VIHFA inventory lists the estate under its legal parcel description; normalize King/Kings only at presentation time.",
    },
  },
  {
    estateName: "Madamberg",
    parcelId: "5",
    assignment: {
      quarterName: "King Quarter",
      status: "verified",
      source: VIHFA_LAND_SOURCE,
      sourceRecord: "Madamberg 5 King Quarter",
      parcelId: "5",
      notes: "VIHFA land inventory legal address.",
    },
  },
  {
    estateName: "Petersborg",
    parcelId: "10-2-10",
    assignment: {
      quarterName: "Great Northside Quarter",
      status: "verified",
      source: DPNR_CABLE_LANDING_SOURCE,
      sourceRecord: "PETERSBORG 10-2-10 GT. NORTHSIDE",
      parcelId: "10-2-10",
      notes: "Tax Assessor material reproduced in the DPNR CZM application identifies the parcel in Great Northside.",
    },
  },
  {
    estateName: "Petersborg",
    parcelId: "10-2-9",
    assignment: {
      quarterName: "Great Northside Quarter",
      status: "verified",
      source: DPNR_CABLE_LANDING_SOURCE,
      sourceRecord: "PETERBORG 10-2-9 GREAT NORTHSIDE QTR",
      parcelId: "10-2-9",
      notes: "Tax Assessor legal description; spelling variant Peterborg/Petersborg retained as source evidence.",
    },
  },
  {
    estateName: "Petersborg",
    parcelId: "10-2-8",
    assignment: {
      quarterName: "Great Northside Quarter",
      status: "verified",
      source: DPNR_CABLE_LANDING_SOURCE,
      sourceRecord: "PETERBORG 10-2-8 GREAT NORTHSIDE QUARTER",
      parcelId: "10-2-8",
      notes: "Tax Assessor legal description.",
    },
  },
  {
    estateName: "Little St James Island",
    parcelId: "A, B & C",
    assignment: {
      quarterName: "Red Hook Quarter",
      status: "verified",
      source: LTG_PARCEL_LAYER_SOURCE,
      sourceRecord: "A B & C LITTLE ST JAMES ISLAND 6B RED HOOK QTR",
      parcelId: "A, B & C",
      notes: "Quarter is present in the authorized Lieutenant Governor Cadastre/Tax Assessor parcel record.",
    },
  },
  {
    estateName: "Bovoni",
    parcelId: "Bldg A, Apt 25 & 26",
    assignment: {
      quarterName: "Frenchman Bay Quarter",
      status: "verified",
      source: VIHA_2026_SOURCE,
      sourceRecord: "Estate Bovoni Centers, Bldg No. A, Apt 25 & 26, Nos. 1 & 2 Frenchman Bay Quarter, St. Thomas",
      parcelId: "Bldg A, Apt 25 & 26",
      notes: "Virgin Islands Housing Authority FY2026 post-audit property schedule.",
    },
  },
  {
    estateName: "Annas Retreat",
    parcelId: "173-339",
    assignment: {
      quarterName: "New Quarter",
      status: "verified",
      source: VIHA_2026_SOURCE,
      sourceRecord: "173-339 Anna's Retreat, No. 1 New Quarter St Thomas",
      parcelId: "173-339",
      notes: "Virgin Islands Housing Authority FY2026 property schedule.",
    },
  },
  {
    estateName: "St Joseph & Rosendahl",
    parcelId: "4J",
    assignment: {
      quarterName: "Great Northside Quarter",
      status: "verified",
      source: ST_JOSEPH_ROSENDAHL_SOURCE,
      sourceRecord: "Parcel 4J Estate St Joseph & Rosendahl No 4 Great Northside Quarter St Thomas",
      parcelId: "4J",
      notes: "Superior Court adjudication records the legal property description and underlying recorded partition deed.",
    },
  },
] as const;

export function quarterEvidenceForEstate(estateName: string): readonly StThomasQuarterEvidence[] {
  const normalized = estateName.trim().toLowerCase();
  return ST_THOMAS_QUARTER_EVIDENCE.filter(
    (record) => record.estateName.toLowerCase() === normalized,
  );
}
