import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Clipboard,
  Crown,
  Mail,
  RefreshCw,
  Search,
} from "lucide-react";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";

import { db } from "../../firebase";

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
  status?: string;
  priority?: string;
  leadSummary?: string;
  createdAt?: any;
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

export default function PropertyReportLeadsPage() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<LeadRecord, "id">),
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
        lead.notes,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [leads, search]);

  async function copyLead(lead: LeadRecord) {
    const summary =
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
        `Tier: ${clean(lead.tier)}`,
        "",
        "Notes:",
        clean(lead.notes),
      ].join("\n");

    await navigator.clipboard.writeText(summary);
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
                Review incoming paid report requests, copy the lead summary, and follow up.
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
          <div className="rounded-[2rem] border border-red-300/20 bg-red-300/10 p-5 text-sm leading-7 text-red-50/80">
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
          {filtered.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-950">
                      {clean(lead.tier, "tier")}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                      {clean(lead.status, "new")}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/60">
                      {clean(lead.priority, "normal")}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-black text-white">
                    {clean(lead.propertyName, "Unnamed property")}
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {clean(lead.purpose)} · {clean(lead.island)} · {formatDate(lead.createdAt)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => void copyLead(lead)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black text-white hover:bg-white/15"
                  >
                    <Clipboard className="h-4 w-4" />
                    Copy
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <Info icon={Building2} label="Requester" value={`${clean(lead.name)} · ${clean(lead.email)}`} />
                <Info icon={Clipboard} label="Parcel / address" value={`${clean(lead.parcelId)} · ${clean(lead.address)}`} />
                <Info icon={Mail} label="Phone" value={clean(lead.phone)} />
              </div>

              {lead.notes ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    Notes
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/70">{lead.notes}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
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
