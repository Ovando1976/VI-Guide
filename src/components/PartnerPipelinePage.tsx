import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  CalendarCheck,
  CheckCircle2,
  Clipboard,
  Crown,
  Mail,
  Phone,
  Rocket,
  Search,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { subscribeToMerchantLeads } from "../lib/firestore/merchantLeads";

type PipelineStatus = "new" | "contacted" | "demo_scheduled" | "won" | "lost";

type Prospect = {
  placeName?: string;
  placeType?: string;
  total?: number;
  directions?: number;
  dayPlans?: number;
  rides?: number;
  taps?: number;
  estimatedValue?: number;
};

type PipelineLead = {
  id: string;
  businessName: string;
  contactName: string;
  phone: string;
  email: string;
  tier: string;
  planName: string;
  planPrice: number;
  notes: string;
  source: string;
  prospect: Prospect | null;
  createdAt: string;
};

const CLOSE_LEADS_KEY = "viNavigatorPartnerCloseLeads";
const STATUS_KEY = "viNavigatorPartnerPipelineStatuses";

const statusLabels: Record<PipelineStatus, string> = {
  new: "New",
  contacted: "Contacted",
  demo_scheduled: "Demo Scheduled",
  won: "Won",
  lost: "Lost",
};

const statusIcons: Record<PipelineStatus, LucideIcon> = {
  new: Sparkles,
  contacted: Phone,
  demo_scheduled: CalendarCheck,
  won: CheckCircle2,
  lost: XCircle,
};

const statusClasses: Record<PipelineStatus, string> = {
  new: "bg-blue-50 text-blue-800",
  contacted: "bg-amber-50 text-amber-800",
  demo_scheduled: "bg-purple-50 text-purple-800",
  won: "bg-emerald-50 text-emerald-800",
  lost: "bg-red-50 text-red-800",
};

const tierMeta: Record<string, { label: string; price: number; icon: LucideIcon }> = {
  starter: { label: "Starter", price: 49, icon: Store },
  growth: { label: "Growth", price: 99, icon: Rocket },
  pro: { label: "Pro", price: 199, icon: Crown },
};

function safeReadJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function readLocalCloseLeads(): PipelineLead[] {
  const local = safeReadJson<any[]>(CLOSE_LEADS_KEY, []);

  return local.map((item) => normalizeLead(item, "local_close"));
}

function readStatuses(): Record<string, PipelineStatus> {
  return safeReadJson<Record<string, PipelineStatus>>(STATUS_KEY, {});
}

function writeStatuses(statuses: Record<string, PipelineStatus>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
}

function parsePrice(value: unknown, tier: string) {
  if (typeof value === "number") return value;

  const parsed = Number(String(value || "").replace(/[^0-9.]/g, ""));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;

  return tierMeta[tier]?.price || 99;
}

function normalizeTier(value: unknown) {
  const text = String(value || "growth").toLowerCase();

  if (text.includes("pro")) return "pro";
  if (text.includes("starter")) return "starter";
  if (text.includes("growth")) return "growth";

  return text in tierMeta ? text : "growth";
}

function normalizeLead(raw: any, fallbackSource = "merchant_leads"): PipelineLead {
  const tier = normalizeTier(raw.tier || raw.plan || raw.planName);
  const meta = tierMeta[tier] || tierMeta.growth;
  const prospect = raw.prospect || null;

  return {
    id: String(raw.id || raw.localEventId || `pipeline-${Date.now()}-${Math.random()}`),
    businessName: String(
      raw.businessName ||
        raw.partnerName ||
        prospect?.placeName ||
        raw.placeName ||
        "Unnamed business"
    ),
    contactName: String(raw.contactName || raw.visitorName || ""),
    phone: String(raw.phone || raw.visitorPhone || ""),
    email: String(raw.email || raw.visitorEmail || ""),
    tier,
    planName: String(raw.plan || raw.planName || meta.label),
    planPrice: parsePrice(raw.planPrice || raw.price, tier),
    notes: String(raw.notes || raw.message || ""),
    source: String(raw.source || fallbackSource),
    prospect,
    createdAt: String(raw.createdAt || new Date().toISOString()),
  };
}

function isPartnerCloseLead(raw: any) {
  return (
    String(raw.source || "").includes("partner_close") ||
    String(raw.action || "") === "partner_close_form" ||
    String(raw.partnerId || "").startsWith("close-")
  );
}

function buildFollowUp(lead: PipelineLead) {
  const value = Number(lead.prospect?.estimatedValue || 0).toLocaleString();
  const actions = Number(lead.prospect?.total || 0).toLocaleString();

  return `Hi ${lead.contactName || "there"} — this is Ovando with VI Guide.

I wanted to follow up about ${lead.businessName} becoming a Founding Partner.

In our demo, your business/place is connected to visitor intent:
- ${actions} tracked visitor actions
- ${lead.prospect?.directions || 0} direction clicks
- ${lead.prospect?.dayPlans || 0} day-plan saves
- ${lead.prospect?.rides || 0} ride-request starts
- Estimated visitor value: $${value}

The recommended plan is ${lead.planName} at $${lead.planPrice}/mo.

The goal is simple: turn map discovery into more calls, visits, ride requests, and bookings.`;
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "Recently";
  return new Date(parsed).toLocaleDateString();
}

export default function PartnerPipelinePage() {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<PipelineLead[]>(() => readLocalCloseLeads());
  const [statuses, setStatuses] = useState<Record<string, PipelineStatus>>(() => readStatuses());
  const [query, setQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<PipelineStatus | "all">("all");
  const [copiedId, setCopiedId] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToMerchantLeads(
      (items: any[]) => {
        const firestoreCloseLeads = items
          .filter(isPartnerCloseLead)
          .map((item) => normalizeLead(item, "merchant_leads"));

        const localCloseLeads = readLocalCloseLeads();

        const combined = [...firestoreCloseLeads, ...localCloseLeads];
        const seen = new Set<string>();

        setLeads(
          combined.filter((lead) => {
            const key = lead.id || `${lead.businessName}-${lead.createdAt}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
        );
      },
      () => {
        setLeads(readLocalCloseLeads());
      }
    );

    return () => unsubscribe();
  }, []);

  const enriched = useMemo(() => {
    return leads.map((lead) => ({
      ...lead,
      status: statuses[lead.id] || "new",
    }));
  }, [leads, statuses]);

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    return enriched.filter((lead) => {
      const matchesStatus = selectedStatus === "all" || lead.status === selectedStatus;
      const matchesText =
        !text ||
        lead.businessName.toLowerCase().includes(text) ||
        lead.contactName.toLowerCase().includes(text) ||
        lead.email.toLowerCase().includes(text) ||
        lead.phone.toLowerCase().includes(text) ||
        lead.planName.toLowerCase().includes(text);

      return matchesStatus && matchesText;
    });
  }, [enriched, query, selectedStatus]);

  const forecast = useMemo(() => {
    const openRevenue = enriched
      .filter((lead) => lead.status !== "lost")
      .reduce((sum, lead) => sum + lead.planPrice, 0);

    const wonRevenue = enriched
      .filter((lead) => lead.status === "won")
      .reduce((sum, lead) => sum + lead.planPrice, 0);

    const pipelineValue = enriched
      .filter((lead) => lead.status !== "lost")
      .reduce((sum, lead) => sum + Number(lead.prospect?.estimatedValue || 0), 0);

    return {
      total: enriched.length,
      openRevenue,
      wonRevenue,
      pipelineValue,
      won: enriched.filter((lead) => lead.status === "won").length,
    };
  }, [enriched]);

  const updateStatus = (id: string, status: PipelineStatus) => {
    setStatuses((current) => {
      const next = { ...current, [id]: status };
      writeStatuses(next);
      return next;
    });
  };

  const copyFollowUp = async (lead: PipelineLead) => {
    try {
      await navigator.clipboard.writeText(buildFollowUp(lead));
      setCopiedId(lead.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setCopiedId("");
    }
  };

  const startOnboarding = (lead: PipelineLead) => {
    window.localStorage.setItem("viNavigatorOnboardingPartnerLead", JSON.stringify(lead));
    navigate("/partner-onboarding");
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Users className="h-4 w-4" />
                Partner Pipeline
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Manage the first 25 business partners.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Track partner close leads from Business Proof, move them through
                the sales process, and forecast monthly recurring revenue.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/business-proof")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Business Proof
              </button>
              <button
                onClick={() => navigate("/partner-close")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Add Partner Lead
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-5">
            <HeroStat label="Leads" value={forecast.total} icon={Users} />
            <HeroStat label="Won" value={forecast.won} icon={CheckCircle2} />
            <HeroStat label="Open MRR" value={`$${forecast.openRevenue.toLocaleString()}`} icon={BadgeDollarSign} />
            <HeroStat label="Won MRR" value={`$${forecast.wonRevenue.toLocaleString()}`} icon={TrendingUp} />
            <HeroStat label="Intent value" value={`$${forecast.pipelineValue.toLocaleString()}`} icon={Sparkles} />
          </div>
        </div>

        <section className="mt-6 rounded-[2.25rem] bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Sales board
              </p>
              <h2 className="mt-2 text-3xl font-black">Partner follow-up list</h2>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search leads..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700 md:w-72"
                />
              </label>

              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as PipelineStatus | "all")}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
              >
                <option value="all">All statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="demo_scheduled">Demo Scheduled</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {filtered.length === 0 ? (
              <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
                <Users className="mx-auto h-9 w-9 text-emerald-700" />
                <p className="mt-3 text-xl font-black">No partner leads yet</p>
                <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                  Go to Business Proof, select a prospect, then close/save a partner lead.
                </p>
              </div>
            ) : (
              filtered.map((lead) => {
                const StatusIcon = statusIcons[lead.status];
                const TierIcon = tierMeta[lead.tier]?.icon || Rocket;

                return (
                  <article key={lead.id} className="rounded-[2rem] bg-stone-50 p-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses[lead.status]}`}>
                            <StatusIcon className="h-3.5 w-3.5" />
                            {statusLabels[lead.status]}
                          </span>

                          <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                            <TierIcon className="h-3.5 w-3.5 text-emerald-700" />
                            {lead.planName} · ${lead.planPrice}/mo
                          </span>
                        </div>

                        <h3 className="mt-3 text-2xl font-black">{lead.businessName}</h3>

                        <div className="mt-2 grid gap-1 text-sm font-bold text-stone-600 md:grid-cols-3">
                          <p>{lead.contactName || "No contact name yet"}</p>
                          <p>{lead.phone || "No phone yet"}</p>
                          <p>{lead.email || "No email yet"}</p>
                        </div>

                        <p className="mt-3 line-clamp-2 text-sm font-bold leading-6 text-stone-500">
                          {lead.notes || "No notes yet."}
                        </p>

                        <div className="mt-4 grid grid-cols-4 gap-2 md:max-w-xl">
                          <MiniStat label="Actions" value={lead.prospect?.total || 0} />
                          <MiniStat label="Directions" value={lead.prospect?.directions || 0} />
                          <MiniStat label="Plans" value={lead.prospect?.dayPlans || 0} />
                          <MiniStat label="Rides" value={lead.prospect?.rides || 0} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <select
                          value={lead.status}
                          onChange={(event) => updateStatus(lead.id, event.target.value as PipelineStatus)}
                          className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="demo_scheduled">Demo Scheduled</option>
                          <option value="won">Won</option>
                          <option value="lost">Lost</option>
                        </select>

                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={lead.phone ? `tel:${lead.phone}` : undefined}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </a>

                          <a
                            href={lead.email ? `mailto:${lead.email}?subject=VI Guide Founding Partner&body=${encodeURIComponent(buildFollowUp(lead))}` : undefined}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </a>
                        </div>

                        <button
                          type="button"
                          onClick={() => copyFollowUp(lead)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
                        >
                          {copiedId === lead.id ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                          {copiedId === lead.id ? "Copied" : "Copy Follow-Up"}
                        </button>

                        <button
                          type="button"
                          onClick={() => startOnboarding(lead)}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-turquoise px-4 py-3 text-sm font-black text-ink active:scale-95"
                        >
                          Onboard Partner
                          <ArrowRight className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate("/partner-close")}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                        >
                          New Close
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-3xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center">
      <p className="text-xl font-black">{Number(value || 0).toLocaleString()}</p>
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-stone-400">
        {label}
      </p>
    </div>
  );
}
