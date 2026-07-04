import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clipboard,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  Mail,
  PackageCheck,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase";

type LeadStatus = "new" | "contacted" | "quoted" | "paid" | "delivered" | "closed";
type PropertyReportTier = "starter" | "full" | "premium";

type LeadRecord = {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  island?: string;
  propertyName?: string;
  parcelId?: string;
  address?: string;
  purpose?: string;
  tier?: string;
  notes?: string;
  status?: LeadStatus | string;
  priority?: string;
  leadSummary?: string;
  reportUrl?: string;
  internalNotes?: string;
  deliveredAt?: any;
  updatedAt?: any;
  createdAt?: any;
};

type LeadDeliveryDraft = {
  reportUrl: string;
  internalNotes: string;
};

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "quoted", label: "Quoted" },
  { value: "paid", label: "Paid" },
  { value: "delivered", label: "Delivered" },
  { value: "closed", label: "Closed" },
];

const TIER_DETAILS: Record<PropertyReportTier, { label: string; price: string }> = {
  starter: {
    label: "Starter Property Snapshot",
    price: "$49",
  },
  full: {
    label: "Full Property History Report",
    price: "$149",
  },
  premium: {
    label: "Premium Research Packet",
    price: "$299+",
  },
};

const PAYMENT_LINKS: Record<PropertyReportTier, string> = {
  starter: String(import.meta.env.VITE_PROPERTY_REPORT_STARTER_PAYMENT_URL || ""),
  full: String(import.meta.env.VITE_PROPERTY_REPORT_FULL_PAYMENT_URL || ""),
  premium: String(import.meta.env.VITE_PROPERTY_REPORT_PREMIUM_PAYMENT_URL || ""),
};

function clean(value: unknown, fallback = "Not provided") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function formatDate(value: any) {
  if (!value) return "No date";
  if (typeof value?.toDate === "function") return value.toDate().toLocaleString();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function normalizeTier(value: unknown): PropertyReportTier {
  const tier = String(value ?? "").toLowerCase();

  if (tier.includes("premium")) return "premium";
  if (tier.includes("full")) return "full";
  return "starter";
}

function getTierDetails(lead: LeadRecord) {
  return TIER_DETAILS[normalizeTier(lead.tier)];
}

function getPaymentLink(lead: LeadRecord) {
  return PAYMENT_LINKS[normalizeTier(lead.tier)];
}

function buildLeadSummary(lead: LeadRecord) {
  const tier = getTierDetails(lead);

  return (
    lead.leadSummary ||
    [
      "VI Guide Property Report Lead",
      "",
      `Name: ${clean(lead.name)}`,
      `Email: ${clean(lead.email)}`,
      `Phone: ${clean(lead.phone)}`,
      `Island: ${clean(lead.island)}`,
      `Property: ${clean(lead.propertyName)}`,
      `Parcel ID: ${clean(lead.parcelId)}`,
      `Address / Area: ${clean(lead.address)}`,
      `Purpose: ${clean(lead.purpose)}`,
      `Tier: ${tier.label} — ${tier.price}`,
      `Status: ${clean(lead.status, "new")}`,
      `Priority: ${clean(lead.priority, "normal")}`,
      "",
      "Notes:",
      clean(lead.notes),
    ].join("\n")
  );
}

function buildReviewEmailBody(lead: LeadRecord) {
  return [
    `Hi ${clean(lead.name, "there")},`,
    "",
    `Thank you for requesting a VI Guide property history report for ${clean(
      lead.propertyName,
      "your property",
    )}.`,
    "",
    "We received your request and will review the property details, available map references, old place names, archive leads, and historical context.",
    "",
    "Next step: we will confirm the scope, delivery timeline, and payment option before beginning the report.",
    "",
    "Request summary:",
    buildLeadSummary(lead),
    "",
    "Best,",
    "VI Guide",
  ].join("\n");
}


function buildReportOutline(lead: LeadRecord) {
  const tier = getTierDetails(lead);

  return [
    `# VI Guide Property History Report`,
    ``,
    `## Property`,
    `Property / estate name: ${clean(lead.propertyName)}`,
    `Island: ${clean(lead.island)}`,
    `Parcel ID: ${clean(lead.parcelId)}`,
    `Address / area: ${clean(lead.address)}`,
    ``,
    `## Client Request`,
    `Client: ${clean(lead.name)}`,
    `Email: ${clean(lead.email)}`,
    `Phone: ${clean(lead.phone)}`,
    `Purpose: ${clean(lead.purpose)}`,
    `Package: ${tier.label} — ${tier.price}`,
    ``,
    `## Executive Summary`,
    `Write a plain-English summary of what is known about this property, its historic name, island context, estate or parcel relationship, and why it matters.`,
    ``,
    `## Historical Identity`,
    `- Historic estate / place names:`,
    `- Alternate spellings:`,
    `- Quarter / district:`,
    `- Related nearby places:`,
    ``,
    `## Map and Geography Notes`,
    `- Modern location:`,
    `- Historic map references:`,
    `- Parcel / boundary notes:`,
    `- Neighboring estates or landmarks:`,
    ``,
    `## Archive Leads`,
    `- Danish West Indies records:`,
    `- Rigsarkivet references:`,
    `- NARA / local archive references:`,
    `- Deeds, tax, probate, church, census, or land list leads:`,
    ``,
    `## Ownership / Use Timeline`,
    `| Period | Person / Entity | Evidence | Notes |`,
    `|---|---|---|---|`,
    `| Unknown | Unknown | Needs research | Add findings here |`,
    ``,
    `## Findings`,
    `1. `,
    `2. `,
    `3. `,
    ``,
    `## Recommended Next Research`,
    `- `,
    `- `,
    `- `,
    ``,
    `## Customer Notes`,
    `${clean(lead.notes)}`,
    ``,
    `## Internal Fulfillment Notes`,
    `${clean(lead.internalNotes)}`,
    ``,
    `---`,
    `Prepared by VI Guide`,
  ].join("\n");
}


function buildDeliveryEmailBody(lead: LeadRecord) {
  const tier = getTierDetails(lead);
  const reportUrl = clean(lead.reportUrl, "");

  return [
    `Hi ${clean(lead.name, "there")},`,
    ``,
    `Your VI Guide property history report for ${clean(
      lead.propertyName,
      "your property",
    )} is ready.`,
    ``,
    `Package: ${tier.label}`,
    `Price: ${tier.price}`,
    ``,
    reportUrl === "Not provided"
      ? `Report link: I will send the report link separately.`
      : `Report link:\n${reportUrl}`,
    ``,
    `Please review it and let us know if you need a follow-up research packet, map export, archive lookup, or expanded ownership timeline.`,
    ``,
    `Best,`,
    `VI Guide`,
  ].join("\n");
}

function buildPaymentEmailBody(lead: LeadRecord) {
  const tier = getTierDetails(lead);
  const paymentLink = getPaymentLink(lead);

  return [
    `Hi ${clean(lead.name, "there")},`,
    "",
    `We reviewed your property report request for ${clean(
      lead.propertyName,
      "your property",
    )}.`,
    "",
    `Recommended package: ${tier.label}`,
    `Price: ${tier.price}`,
    "",
    paymentLink
      ? `You can complete payment here:\n${paymentLink}`
      : "Payment link: I will send the secure payment link separately.",
    "",
    "Once payment is confirmed, we will begin preparing the property history report.",
    "",
    "Request summary:",
    buildLeadSummary(lead),
    "",
    "Best,",
    "VI Guide",
  ].join("\n");
}

export default function PropertyReportLeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [deliveryDrafts, setDeliveryDrafts] = useState<Record<string, LeadDeliveryDraft>>({});
  const [error, setError] = useState("");
  const hasAnyPaymentLink = Object.values(PAYMENT_LINKS).some(Boolean);

  async function loadLeads() {
    setLoading(true);
    setError("");

    try {
      const leadsQuery = query(
        collection(db, "propertyReportLeads"),
        orderBy("createdAt", "desc"),
        limit(50),
      );

      const snapshot = await getDocs(leadsQuery);

      setLeads(
        snapshot.docs.map((leadDoc) => ({
          id: leadDoc.id,
          ...(leadDoc.data() as Omit<LeadRecord, "id">),
        })),
      );
    } catch (err) {
      console.error("Failed to load property report leads", err);
      setError("Could not load leads. Check Firestore read rules.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLeads();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;

    return leads.filter((lead) =>
      [
        lead.name,
        lead.email,
        lead.phone,
        lead.island,
        lead.propertyName,
        lead.parcelId,
        lead.address,
        lead.purpose,
        lead.tier,
        lead.status,
        lead.priority,
        lead.reportUrl,
        lead.internalNotes,
        lead.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [leads, search]);

  const counts = useMemo(() => {
    return STATUS_OPTIONS.reduce<Record<LeadStatus, number>>(
      (acc, option) => {
        acc[option.value] = leads.filter(
          (lead) => (lead.status || "new") === option.value,
        ).length;
        return acc;
      },
      {
        new: 0,
        contacted: 0,
        quoted: 0,
        paid: 0,
        delivered: 0,
        closed: 0,
      },
    );
  }, [leads]);

  async function copyLead(lead: LeadRecord) {
    await navigator.clipboard.writeText(buildLeadSummary(lead));
  }



  async function copyDeliveryEmail(lead: LeadRecord) {
    await navigator.clipboard.writeText(buildDeliveryEmailBody(lead));
  }

  async function copyReportOutline(lead: LeadRecord) {
    await navigator.clipboard.writeText(buildReportOutline(lead));
  }

  async function copyPaymentRequest(lead: LeadRecord) {
    await navigator.clipboard.writeText(buildPaymentEmailBody(lead));
  }

  async function updateLeadStatus(lead: LeadRecord, status: LeadStatus) {
    setUpdatingId(lead.id);
    setError("");

    try {
      await updateDoc(doc(db, "propertyReportLeads", lead.id), {
        status,
        updatedAt: serverTimestamp(),
      });

      setLeads((current) =>
        current.map((item) => (item.id === lead.id ? { ...item, status } : item)),
      );
    } catch (err) {
      console.error("Failed to update lead status", err);
      setError("Could not update lead status. Check Firestore update rules.");
    } finally {
      setUpdatingId("");
    }
  }


  function getDeliveryDraft(lead: LeadRecord): LeadDeliveryDraft {
    return (
      deliveryDrafts[lead.id] || {
        reportUrl: clean(lead.reportUrl, ""),
        internalNotes: clean(lead.internalNotes, ""),
      }
    );
  }

  function updateDeliveryDraft(
    leadId: string,
    field: keyof LeadDeliveryDraft,
    value: string,
  ) {
    setDeliveryDrafts((current) => ({
      ...current,
      [leadId]: {
        reportUrl: current[leadId]?.reportUrl || "",
        internalNotes: current[leadId]?.internalNotes || "",
        [field]: value,
      },
    }));
  }

  async function saveDeliveryWorkspace(lead: LeadRecord) {
    const draft = getDeliveryDraft(lead);
    const reportUrl = draft.reportUrl.trim();
    const internalNotes = draft.internalNotes.trim();

    setUpdatingId(lead.id);
    setError("");

    try {
      await updateDoc(doc(db, "propertyReportLeads", lead.id), {
        reportUrl,
        internalNotes,
        updatedAt: serverTimestamp(),
      });

      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id ? { ...item, reportUrl, internalNotes } : item,
        ),
      );
    } catch (err) {
      console.error("Failed to save delivery workspace", err);
      setError("Could not save delivery details. Check Firestore update rules.");
    } finally {
      setUpdatingId("");
    }
  }

  async function markLeadDelivered(lead: LeadRecord) {
    const draft = getDeliveryDraft(lead);
    const reportUrl = draft.reportUrl.trim();
    const internalNotes = draft.internalNotes.trim();
    const deliveredAt = new Date().toISOString();

    setUpdatingId(lead.id);
    setError("");

    try {
      await updateDoc(doc(db, "propertyReportLeads", lead.id), {
        status: "delivered",
        reportUrl,
        internalNotes,
        deliveredAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setLeads((current) =>
        current.map((item) =>
          item.id === lead.id
            ? {
                ...item,
                status: "delivered",
                reportUrl,
                internalNotes,
                deliveredAt,
              }
            : item,
        ),
      );
    } catch (err) {
      console.error("Failed to mark lead delivered", err);
      setError("Could not mark this lead delivered. Check Firestore update rules.");
    } finally {
      setUpdatingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#05060a] pb-[calc(96px+env(safe-area-inset-bottom))] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(251,191,36,0.2),transparent_32%),linear-gradient(135deg,#020617,#080811_55%,#1c1206)] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => navigate("/history")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white/75 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to History
          </button>

          <div className="mt-7 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-black/25 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">
                <Crown className="h-3.5 w-3.5" />
                Internal Sales Inbox
              </div>

              <h1 className="mt-5 font-serif text-4xl font-black leading-none tracking-[-0.055em] sm:text-6xl">
                Property Report Leads
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
                Review incoming report requests, send the right payment request,
                update the sales status, and track delivery.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5 text-right shadow-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/40">
                Captured leads
              </p>
              <p className="mt-2 text-4xl font-black text-white">
                {leads.length.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {STATUS_OPTIONS.map((option) => (
              <div
                key={option.value}
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
              >
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                  {option.label}
                </p>
                <p className="mt-1 text-2xl font-black text-white">
                  {counts[option.value].toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {!hasAnyPaymentLink ? (
            <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-50/80">
              Payment links are not configured yet. Add Stripe or checkout URLs
              to <code className="rounded bg-black/30 px-1">.env.local</code>.
              Payment email drafts will still work and say the secure link will
              be sent separately.
            </div>
          ) : null}
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-white/10 bg-[#05060a]/92 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row">
          <label className="relative block flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, island, property, parcel..."
              className="w-full rounded-2xl border border-white/10 bg-white/[0.07] py-4 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-amber-300/50"
            />
          </label>

          <button
            type="button"
            onClick={() => void loadLeads()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-4 text-sm font-black text-white hover:bg-white/15"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6">
        {error ? (
          <div className="mb-4 rounded-[2rem] border border-red-300/20 bg-red-300/10 p-5 text-sm leading-7 text-red-50/80">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-white/55">
            Loading property report leads...
          </div>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center text-white/55">
            No property report leads found yet.
          </div>
        ) : null}

        <div className="grid gap-4">
          {filtered.map((lead) => {
            const tier = getTierDetails(lead);
            const paymentLink = getPaymentLink(lead);
            const deliveryDraft = getDeliveryDraft(lead);
            const activeReportUrl = deliveryDraft.reportUrl.trim();

            const reviewEmailHref = lead.email
              ? `mailto:${lead.email}?subject=${encodeURIComponent(
                  `VI Guide Property Report: ${clean(lead.propertyName, "your property")}`,
                )}&body=${encodeURIComponent(buildReviewEmailBody(lead))}`
              : "";

            const paymentEmailHref = lead.email
              ? `mailto:${lead.email}?subject=${encodeURIComponent(
                  `Payment link: ${tier.label} for ${clean(
                    lead.propertyName,
                    "your property",
                  )}`,
                )}&body=${encodeURIComponent(buildPaymentEmailBody(lead))}`
              : "";

            return (
              <article
                key={lead.id}
                className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="gold">
                        {tier.label} · {tier.price}
                      </Badge>
                      <Badge>{clean(lead.status, "new")}</Badge>
                      <Badge>{clean(lead.priority, "normal")}</Badge>
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-white">
                      {clean(lead.propertyName, "Unnamed property")}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {clean(lead.purpose)} · {clean(lead.island)} ·{" "}
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {reviewEmailHref ? (
                      <a
                        href={reviewEmailHref}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                      >
                        <Mail className="h-4 w-4" />
                        Review reply
                      </a>
                    ) : null}

                    {paymentEmailHref ? (
                      <a
                        href={paymentEmailHref}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-amber-200"
                      >
                        <CreditCard className="h-4 w-4" />
                        Payment email
                      </a>
                    ) : null}

                    {paymentLink ? (
                      <a
                        href={paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open link
                      </a>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void copyPaymentRequest(lead)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                    >
                      <Clipboard className="h-4 w-4" />
                      Copy payment
                    </button>

                    <button
                      type="button"
                      onClick={() => void copyReportOutline(lead)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                    >
                      <FileText className="h-4 w-4" />
                      Copy report outline
                    </button>

                    <button
                      type="button"
                      onClick={() => void copyDeliveryEmail(lead)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Copy delivery email
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <Info
                    icon={Building2}
                    label="Requester"
                    value={`${clean(lead.name)} · ${clean(lead.email)}`}
                  />
                  <Info
                    icon={Clipboard}
                    label="Parcel / address"
                    value={`${clean(lead.parcelId)} · ${clean(lead.address)}`}
                  />
                  <Info icon={Mail} label="Phone" value={clean(lead.phone)} />
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    <ShieldCheck className="h-4 w-4 text-amber-300" />
                    Sales Status
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((option) => {
                      const active = (lead.status || "new") === option.value;
                      const updating = updatingId === lead.id;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={updating}
                          onClick={() => void updateLeadStatus(lead, option.value)}
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] transition disabled:opacity-50 ${
                            active
                              ? "bg-amber-300 text-zinc-950"
                              : "bg-white/10 text-white/55 hover:bg-white/15 hover:text-white"
                          }`}
                        >
                          {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    <FileText className="h-4 w-4 text-amber-300" />
                    Report Delivery Workspace
                  </p>

                  <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                    <label className="block">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                        Report URL
                      </span>
                      <input
                        value={deliveryDraft.reportUrl}
                        onChange={(event) =>
                          updateDeliveryDraft(lead.id, "reportUrl", event.target.value)
                        }
                        placeholder="Paste Google Drive, PDF, or delivery link..."
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-amber-300/50"
                      />
                    </label>

                    {activeReportUrl ? (
                      <a
                        href={activeReportUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-xs font-black text-white hover:bg-white/15 md:self-end"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open report
                      </a>
                    ) : null}
                  </div>

                  <label className="mt-4 block">
                    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                      <StickyNote className="h-4 w-4 text-amber-300" />
                      Internal Delivery Notes
                    </span>
                    <textarea
                      value={deliveryDraft.internalNotes}
                      onChange={(event) =>
                        updateDeliveryDraft(lead.id, "internalNotes", event.target.value)
                      }
                      rows={4}
                      placeholder="Track research status, missing sources, customer requests, and fulfillment details..."
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-amber-300/50"
                    />
                  </label>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={updatingId === lead.id}
                      onClick={() => void saveDeliveryWorkspace(lead)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15 disabled:opacity-50"
                    >
                      <Save className="h-4 w-4" />
                      Save delivery info
                    </button>

                    <button
                      type="button"
                      disabled={updatingId === lead.id}
                      onClick={() => void markLeadDelivered(lead)}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300 px-4 py-2 text-xs font-black text-zinc-950 hover:bg-amber-200 disabled:opacity-50"
                    >
                      <PackageCheck className="h-4 w-4" />
                      Mark delivered
                    </button>
                  </div>
                </div>

                {lead.notes ? (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                      Notes
                    </p>
                    <p className="mt-2 text-sm leading-7 text-white/70">
                      {lead.notes}
                    </p>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

function Badge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "gold";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
        tone === "gold"
          ? "bg-amber-300 text-zinc-950"
          : "bg-white/10 text-white/60"
      }`}
    >
      {children}
    </span>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <Icon className="h-4 w-4 text-amber-300" />
      <p className="mt-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
        {label}
      </p>
      <p className="mt-1 text-sm leading-6 text-white/70">{value}</p>
    </div>
  );
}
