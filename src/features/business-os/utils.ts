import type { Business, BusinessLead } from "../../types/business";
import type { BusinessCustomer } from "./customers";
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
import type { BusinessOSData, LeadSourceKey, LeadSourceStat } from "./types";
import type { BusinessJob } from "./jobs";

const AVERAGE_LEAD_VALUE = 85;

const LEAD_SOURCES: Array<{ source: LeadSourceKey; label: string }> = [
  { source: "directory", label: "Directory Leads" },
  { source: "map", label: "Map Leads" },
  { source: "mobility", label: "Mobility Leads" },
  { source: "concierge", label: "Concierge Leads" },
  { source: "tour", label: "Tour Leads" },
  { source: "profile", label: "Profile Leads" },
  { source: "unknown", label: "Unknown Leads" },
];

export function label(value?: string) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatDate(value?: unknown) {
  if (typeof value === "number") return new Date(value).toLocaleDateString();
  return "Recent";
}

function normalizeLeadSource(value?: string): LeadSourceKey {
  if (!value) return "unknown";

  const source = value.toLowerCase().trim();

  if (source === "directory") return "directory";
  if (source === "profile") return "profile";
  if (source === "map") return "map";
  if (source === "concierge") return "concierge";
  if (source === "mobility") return "mobility";
  if (source === "tour") return "tour";

  return "unknown";
}

function getHealthTone(score: number): "good" | "warning" | "danger" {
  if (score >= 80) return "good";
  if (score >= 55) return "warning";
  return "danger";
}

export function buildBusinessOSData(input: {
  businesses: Business[];
  analytics: BusinessAnalytics[];
  leads: BusinessLead[];
  customers?: BusinessCustomer[];
  tasks?: BusinessTask[];
  jobs?: BusinessJob[];
  estimates?: BusinessEstimate[];
  invoices?: BusinessInvoice[];
  payments?: BusinessPayment[];
  appointments?: BusinessAppointment[];
  timeline?: BusinessTimelineEvent[];
  notifications?: BusinessNotification[];
}): BusinessOSData {
  const {
  businesses =[],
  analytics =[],
  leads =[],
  jobs = [],
  tasks = [],
  customers = [],
  estimates = [],
  invoices = [],
  payments = [],
  appointments = [],
  timeline = [],
  notifications = [],
  } = input;

  const businessById = new Map(businesses.map((business) => [business.id, business]));
  const analyticsByBusiness = new Map(analytics.map((row) => [row.businessId, row]));

  const visibleBusinessIds = new Set(businesses.map((business) => business.id));
  const visibleAnalytics = analytics.filter((row) => visibleBusinessIds.has(row.businessId));

  const totalsBase = visibleAnalytics.reduce(
    (acc, row) => ({
      profileViews: acc.profileViews + (row.profileViews || 0),
      websiteClicks: acc.websiteClicks + (row.websiteClicks || 0),
      phoneClicks: acc.phoneClicks + (row.phoneClicks || 0),
      directionRequests: acc.directionRequests + (row.directionRequests || 0),
      leadCount: acc.leadCount + (row.leadCount || 0),
      totalActions:
        acc.totalActions +
        (row.phoneClicks || 0) +
        (row.websiteClicks || 0) +
        (row.directionRequests || 0),
    }),
    {
      profileViews: 0,
      websiteClicks: 0,
      phoneClicks: 0,
      directionRequests: 0,
      leadCount: 0,
      totalActions: 0,
    },
  );

  const leadStats: Record<BusinessLeadStatus, number> = {
    new: leads.filter((lead) => !lead.status || lead.status === "new").length,
    contacted: leads.filter((lead) => lead.status === "contacted").length,
    won: leads.filter((lead) => lead.status === "won").length,
    lost: leads.filter((lead) => lead.status === "lost").length,
  };

  const realLeadCount = leads.length;
  const totalForPercent = realLeadCount || 1;

  const sourceStats: LeadSourceStat[] = LEAD_SOURCES.map(({ source, label }) => {
    const count = leads.filter((lead) => normalizeLeadSource(lead.source) === source).length;

    return {
      source,
      label,
      count,
      percentage: Math.round((count / totalForPercent) * 100),
    };
  }).filter((item) => item.count > 0 || item.source !== "unknown");

  const featuredCount = businesses.filter((business) => business.featured || business.premium).length;
  const claimableCount = businesses.filter((business) => business.claimStatus === "unclaimed").length;

  const closedLeads = leadStats.won + leadStats.lost;
  const winRate = closedLeads > 0 ? Math.round((leadStats.won / closedLeads) * 100) : 0;

  const openLeads = leadStats.new + leadStats.contacted;

  const conservativeRevenue = leadStats.won * AVERAGE_LEAD_VALUE;
  const likelyRevenue = Math.round((leadStats.won + openLeads * 0.35) * AVERAGE_LEAD_VALUE);
  const upsideRevenue = Math.round((leadStats.won + openLeads * 0.65) * AVERAGE_LEAD_VALUE);

  let healthScore = 45;
  if (businesses.length > 0) healthScore += 10;
  if (totalsBase.profileViews > 0) healthScore += 10;
  if (totalsBase.totalActions > 0 || realLeadCount > 0) healthScore += 10;
  if (leadStats.new === 0 && realLeadCount > 0) healthScore += 10;
  if (winRate >= 25) healthScore += 15;
  if (featuredCount > 0) healthScore += 10;

  healthScore = Math.min(100, healthScore);

  const totals = {
    ...totalsBase,
    leadCount: realLeadCount || totalsBase.leadCount,
    totalActions: totalsBase.totalActions + realLeadCount,
  };

  return {
    tasks,
    jobs,
    customers,
    appointments,
    timeline,
    estimates,
    invoices,
    payments,
    notifications,
    businesses,
    analytics,
    leads,
    businessById,
    analyticsByBusiness,
    totals,
    leadStats,
    sourceStats,
    featuredCount,
    claimableCount,
    winRate,
    forecast: {
      averageLeadValue: AVERAGE_LEAD_VALUE,
      projectedMonthlyRevenue: likelyRevenue,
      projectedYearlyRevenue: likelyRevenue * 12,
      conservativeRevenue,
      likelyRevenue,
      upsideRevenue,
    },
    health: {
      score: healthScore,
      tone: getHealthTone(healthScore),
    },
  };
}