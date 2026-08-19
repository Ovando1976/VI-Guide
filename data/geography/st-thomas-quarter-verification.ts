import type { QuarterAssignment } from "@/types/usvi";

/** Evidence-backed St. Thomas quarter assignments. Parcel-specific: never infer an estate-wide quarter from one record. */
export type StThomasQuarterEvidence = { estateName: string; parcelId: string; assignment: QuarterAssignment };

const GVI_PROPERTY_SOURCE = "https://dpp.vi.gov/wp-content/uploads/2016/03/Copy-of-Government-Properties-Territorial.pdf";
const DPNR_SMITH_BAY_SOURCE = "https://dpnr.vi.gov/press_releases/public-hearing-on-proposed-zoning-map-amendment-to-the-virgin-islands-official-district-maps/";
const LEGISLATURE_SMITH_BAY_SOURCE = "https://legvi.org/committeemeetings/Session/March%2018%2C%202026/Bills/36-0267.pdf";
const VIHFA_LAND_SOURCE = "https://vihfa.gov/housing-development/land-parcel-inventory/";
const DPNR_CABLE_LANDING_SOURCE = "https://dpnr.vi.gov/wp-content/uploads/2024/10/STT-CABLE-LANDING-CZM-FINAL-PACKAGE.pdf";
const LTG_PARCEL_LAYER_SOURCE = "https://services3.arcgis.com/UfiM23HwAqZRk1vw/ArcGIS/rest/services/USVI_PARCELS_GIP/FeatureServer/0";
const VIHA_2026_SOURCE = "https://legvi.org/committeemeetings/Budget%2C%20Appropriations%20and%20Finance/FY%202026%20Budget%20Hearings/07-21-2025%20VIHA%20VIHFA%20EDA%20WMA/VI%20Housing%20Authority/Post%20Audit%20Analysis/VIHA%20FY%202026.pdf";
const ST_JOSEPH_ROSENDAHL_SOURCE = "https://legvi.org/committeemeetings/Zoning/STT-CCZP0003-25%204I%20Rem%20and%204J%20Rem%20St%20Joseph%20n%20Rosendahl/5.%20Development%20Authorization/Order%20-%20Adjudication%20Signed.pdf";

const evidence = (estateName: string, parcelId: string, quarterName: string, source: string, sourceRecord: string, notes: string): StThomasQuarterEvidence => ({ estateName, parcelId, assignment: { quarterName, status: "verified", source, sourceRecord, parcelId, notes } });

export const ST_THOMAS_QUARTER_EVIDENCE: readonly StThomasQuarterEvidence[] = [
  ...[["87","Smith Bay 87 East End Qtr"],["94-1","Smith Bay 94-1 East End Qtr"],["98-5","Smith Bay 98-5 Eastend Qtr"],["98-8-1A & 98-8-1B","Smith Bay 98-8-1A & 1B East End Quarter"],["57B-19","Smith Bay 57B-19 East End Qtr"],["19K","19K Estate Smith Bay Nos. 1, 2 & 3 East End Qtr"]].map(([p,r]) => evidence("Smith Bay", p, "East End Quarter", GVI_PROPERTY_SOURCE, r, "Government of the Virgin Islands property inventory legal description.")),
  evidence("Smith Bay", "19-C-A & 19-C-B", "East End Quarter", DPNR_SMITH_BAY_SOURCE, "GDP-24-1", "DPNR identifies both parcels as Estate Smith Bay, Nos. 1, 2 & 3 East End Quarter."),
  evidence("Smith Bay", "19-2-111", "East End Quarter", LEGISLATURE_SMITH_BAY_SOURCE, "Bill No. 36-0267", "36th Legislature legal description."),
  evidence("Mariendahl", "10-36", "Red Hook Quarter", VIHFA_LAND_SOURCE, "10-36 Mariendahl NO.4 Red Hook Quarter", "VIHFA land inventory legal address."),
  evidence("Bordeaux", "122", "West End Quarter", VIHFA_LAND_SOURCE, "122 Bordeaux West End Quarter", "VIHFA land inventory legal address."),
  evidence("Bordeaux", "117", "West End Quarter", VIHFA_LAND_SOURCE, "Bordeaux 117 121 & 122 West End Quarter", "VIHFA land inventory legal address."),
  evidence("Bordeaux", "121", "West End Quarter", VIHFA_LAND_SOURCE, "Bordeaux 117 121 & 122 West End Quarter", "VIHFA land inventory legal address."),
  evidence("Bordeaux", "120-B", "West End Quarter", VIHFA_LAND_SOURCE, "Bordeaux 119 & 120 REM. West End Quarter", "VIHFA land inventory legal address."),
  evidence("Bordeaux", "120-A", "West End Quarter", VIHFA_LAND_SOURCE, "Bordeaux 119 & 120 REM. West End Quarter", "VIHFA land inventory legal address."),
  evidence("Annas Fancy", "130A-130K", "Kronprinsens Quarter", VIHFA_LAND_SOURCE, "130A Through 130K Anna Fancy Kronprinsens Quarter", "Preserve Danish/legal quarter name; presentation may alias Crown Prince Quarter."),
  evidence("Altona & Welgunst", "178-240", "Kronprinsens Quarter", VIHFA_LAND_SOURCE, "178-240 Altona & Welgunst kronprindsens Quarter", "VIHFA land inventory legal address; spelling retained as source evidence."),
  evidence("Hospital Ground", "303B-2", "Kings Quarter", VIHFA_LAND_SOURCE, "Hospital Ground 303B-2 Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Hospital Ground", "A-8", "Kings Quarter", VIHFA_LAND_SOURCE, "Hospital Ground PCL A-8 Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Madamberg", "1A", "King Quarter", VIHFA_LAND_SOURCE, "Madamberg 1A King Quarter", "Normalize King/Kings only at presentation time."),
  evidence("Madamberg", "5", "King Quarter", VIHFA_LAND_SOURCE, "Madamberg 5 King Quarter", "VIHFA land inventory legal address."),
  evidence("Taarneberg", "15B", "Kings Quarter", VIHFA_LAND_SOURCE, "15B Taarneberg Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Taarneberg", "16", "Kings Quarter", VIHFA_LAND_SOURCE, "16 Taarneberg Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Taarneberg", "20A", "Kings Quarter", VIHFA_LAND_SOURCE, "20A Taarneberg Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Taarneberg", "26A,102,104", "Kings Quarter", VIHFA_LAND_SOURCE, "26A,102,104 Taarneberg Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Taarneberg", "8", "Kings Quarter", VIHFA_LAND_SOURCE, "8 Taarneberg Kings Quarter", "VIHFA land inventory legal address."),
  evidence("Donoe", "2-REM", "New Quarter", VIHFA_LAND_SOURCE, "2 Rem Donoe NO. 2A New Quarter", "VIHFA land inventory legal address."),
  evidence("Donoe", "2J-36", "New Quarter", VIHFA_LAND_SOURCE, "2 Rem Donoe NO. 2A New Quarter", "VIHFA parcel inventory record."),
  evidence("Donoe", "2J-25", "New Quarter", VIHFA_LAND_SOURCE, "2 Rem Donoe NO. 2A New Quarter", "VIHFA parcel inventory record."),
  evidence("Donoe", "2J-24", "New Quarter", VIHFA_LAND_SOURCE, "2 Rem Donoe NO. 2A New Quarter", "VIHFA parcel inventory record."),
  evidence("Fortuna", "3C-B", "West End Quarter", VIHFA_LAND_SOURCE, "3C Fortuna No.8 Westend Quarter", "VIHFA land inventory legal address."),
  evidence("Fortuna", "3C-C-1", "West End Quarter", VIHFA_LAND_SOURCE, "3C Fortuna No.8 Westend Quarter", "VIHFA land inventory legal address."),
  evidence("Petersborg", "10-2-10", "Great Northside Quarter", DPNR_CABLE_LANDING_SOURCE, "PETERSBORG 10-2-10 GT. NORTHSIDE", "Tax Assessor material reproduced in DPNR CZM application."),
  evidence("Petersborg", "10-2-9", "Great Northside Quarter", DPNR_CABLE_LANDING_SOURCE, "PETERBORG 10-2-9 GREAT NORTHSIDE QTR", "Tax Assessor legal description; spelling variant retained."),
  evidence("Petersborg", "10-2-8", "Great Northside Quarter", DPNR_CABLE_LANDING_SOURCE, "PETERBORG 10-2-8 GREAT NORTHSIDE QUARTER", "Tax Assessor legal description."),
  evidence("Little St James Island", "A, B & C", "Red Hook Quarter", LTG_PARCEL_LAYER_SOURCE, "A B & C LITTLE ST JAMES ISLAND 6B RED HOOK QTR", "Authorized Lieutenant Governor Cadastre/Tax Assessor parcel record."),
  evidence("Bovoni", "Bldg A, Apt 25 & 26", "Frenchman Bay Quarter", VIHA_2026_SOURCE, "Estate Bovoni Centers, Bldg No. A, Apt 25 & 26, Nos. 1 & 2 Frenchman Bay Quarter, St. Thomas", "VIHA FY2026 property schedule."),
  evidence("Annas Retreat", "173-339", "New Quarter", VIHA_2026_SOURCE, "173-339 Anna's Retreat, No. 1 New Quarter St Thomas", "VIHA FY2026 property schedule."),
  evidence("St Joseph & Rosendahl", "4J", "Great Northside Quarter", ST_JOSEPH_ROSENDAHL_SOURCE, "Parcel 4J Estate St Joseph & Rosendahl No 4 Great Northside Quarter St Thomas", "Superior Court adjudication legal property description."),
] as const;

export function quarterEvidenceForEstate(estateName: string): readonly StThomasQuarterEvidence[] {
  const normalized = estateName.trim().toLowerCase();
  return ST_THOMAS_QUARTER_EVIDENCE.filter((record) => record.estateName.toLowerCase() === normalized);
}
