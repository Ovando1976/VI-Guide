export type LeadSource =
  | "directory"
  | "profile"
  | "map"
  | "concierge"
  | "mobility"
  | "tour";


export type BusinessCategory =
  | "restaurant"
  | "hotel"
  | "villa"
  | "car_rental"
  | "taxi"
  | "tour"
  | "charter"
  | "fishing"
  | "dive_shop"
  | "watersports"
  | "retail"
  | "grocery"
  | "real_estate"
  | "contractor"
  | "service"
  | "transportation"
  | "marina"
  | "ferry"
  | "airport"
  | "cruise_port"
  | "medical"
  | "pharmacy"
  | "marine_service";

export type BusinessClaimStatus = "pending" | "approved" | "rejected";

export interface BusinessClaim {
  id: string;
  businessId: string;
  businessName: string;
  businessSlug: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone?: string;
  claimantRole?: string;
  website?: string;
  message?: string;
  plan?: "Free" | "Featured" | "Premium" | "Enterprise";
  status: BusinessClaimStatus;
  createdAt: number;
  updatedAt: number;
}

export type SubscriptionPlan =
  | "free"
  | "featured"
  | "premium"
  | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due";

export interface Business {
  id: string;
  name: string;
  slug: string;

  category: BusinessCategory;

  description: string;

  island:
    | "st_thomas"
    | "st_john"
    | "st_croix"
    | "water_island";

  estate?: string;
  address?: string;

  phone?: string;
  email?: string;
  website?: string;
  imageUrl?: string;

  featured: boolean;
  premium: boolean;
  verified: boolean;

  claimStatus?: "unclaimed" | "claimed" | "pending";
  source?: string;

  rating?: number;

  coordinates?: {
    lat: number;
    lng: number;
  };
  tags?: string[];
  searchableText?: string;

  createdAt: number;
  updatedAt: number;
}

export interface BusinessSubscription {
  id: string;
  businessId: string;

  plan: SubscriptionPlan;

  status: SubscriptionStatus;

  monthlyPrice: number;

  startedAt: number;
  renewalDate: number;
}

export interface BusinessLead {
  id: string;

  businessId: string;

  userId?: string;

  visitorName: string;
  visitorEmail?: string;
  visitorPhone?: string;

  source: LeadSource;

  message: string;

  status:
    | "new"
    | "contacted"
    | "won"
    | "lost";

  createdAt: number;
  updatedAt?: number;
}

export interface BusinessAnalytics {
  id: string;

  businessId: string;

  profileViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionRequests: number;
  leadCount: number;

  updatedAt: number;
}



