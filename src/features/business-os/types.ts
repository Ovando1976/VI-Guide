import type { User } from "firebase/auth";

import type { UserProfile } from "../../types";
import type { BusinessCustomer } from "./customers";
import type { Business, BusinessLead, LeadSource } from "../../types/business";
import type {
  BusinessAnalytics,
  BusinessLeadStatus,
} from "../../lib/firestore/businesses";
import type {
  BusinessAppointment,
  BusinessNotification,
  BusinessTask,
  BusinessTimelineEvent,
} from "./firestore";
import type {
  BusinessEstimate,
  BusinessInvoice,
  BusinessPayment,
} from "./money";
import type { BusinessJob } from "./jobs";

export type MerchantDashboardProps = {
  user: User | null;
  profile: UserProfile | null;
};

export type LeadSourceKey = LeadSource | "unknown";

export type LeadSourceStat = {
  source: LeadSourceKey;
  label: string;
  count: number;
  percentage: number;
};

export type BusinessForecast = {
  averageLeadValue: number;
  projectedMonthlyRevenue: number;
  projectedYearlyRevenue: number;
  conservativeRevenue: number;
  likelyRevenue: number;
  upsideRevenue: number;
};

export type BusinessHealth = {
  score: number;
  tone: "good" | "warning" | "danger";
};

export type BusinessTotals = {
  profileViews: number;
  websiteClicks: number;
  phoneClicks: number;
  directionRequests: number;
  leadCount: number;
  totalActions: number;
};

export type BusinessOSData = {
  businesses: Business[];
  analytics: BusinessAnalytics[];
  leads: BusinessLead[];
  customers: BusinessCustomer[];
  tasks: BusinessTask[];
  appointments: BusinessAppointment[];
  timeline: BusinessTimelineEvent[];
  notifications: BusinessNotification[];
  jobs?: BusinessJob[];
  estimates: BusinessEstimate[];
  invoices: BusinessInvoice[];
  payments: BusinessPayment[];

  businessById: Map<string, Business>;
  analyticsByBusiness: Map<string, BusinessAnalytics>;

  totals: BusinessTotals;
  leadStats: Record<BusinessLeadStatus, number>;
  sourceStats: LeadSourceStat[];

  featuredCount: number;
  claimableCount: number;
  winRate: number;

  forecast: BusinessForecast;
  health: BusinessHealth;
};