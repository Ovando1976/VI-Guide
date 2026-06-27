export type EvidenceConfidence = "unverified" | "low" | "medium" | "high";

export type EstateEvidenceCitation = {
  archive: string;
  collection?: string;
  series?: string;
  volume?: string;
  page?: string;
  image?: string;
  url?: string;
  note?: string;
};

export type EstateOwnerEvent = {
  year?: number;
  dateText?: string;
  ownerName: string;
  role?: "owner" | "seller" | "buyer" | "mortgagee" | "mortgagor" | "heir" | "tenant" | "unknown";
  evidenceType?: "matrikel" | "deed" | "mortgage" | "probate" | "survey" | "map" | "secondary";
  citation: EstateEvidenceCitation;
  confidence: EvidenceConfidence;
  notes?: string;
};

export type EstateExtractionRecord = {
  estateCanonicalId: string;
  estateName: string;
  island: "st_thomas" | "st_john" | "st_croix" | "water_island";
  status: "open" | "in_progress" | "extracted" | "verified" | "blocked";

  aliases: string[];
  quarter?: string;
  acreage?: string;
  boundaries: string[];
  neighboringEstates: string[];

  ownerChain: EstateOwnerEvent[];
  transferEvidence: EstateOwnerEvent[];

  modernContinuityNotes: string[];
  researchNotes: string[];
  citations: EstateEvidenceCitation[];

  confidence: EvidenceConfidence;
};
