import { useEffect, useMemo, useState, type ComponentType } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import {
  Car,
  CheckCircle2,
  Clock,
  DollarSign,
  Mail,
  RefreshCw,
  Save,
  User,
  X,
} from "lucide-react";

import { db } from "../../firebase";

type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "booked"
  | "completed"
  | "cancelled";

type TourLead = {
  id: string;
  siteId?: string;
  siteName?: string;
  island?: string;
  intent?: "tour" | "ride" | "bundle";
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  guestCount?: number | null;
  preferredDate?: string | null;
  pickupLocation?: string | null;
  specialRequests?: string | null;
  userId?: string | null;
  estimatedValue?: number;
  source?: string;
  status?: LeadStatus;
  createdAt?: { seconds?: number };
  updatedAt?: unknown;
};

const STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "quoted",
  "booked",
  "completed",
  "cancelled",
];

function islandLabel(value?: string) {
  if (value === "st_thomas" || value === "stt") return "St. Thomas";
  if (value === "st_john" || value === "stj") return "St. John";
  if (value === "st_croix" || value === "stx") return "St. Croix";
  if (value === "water_island" || value === "wat") return "Water Island";
  return value || "USVI";
}

function formatDate(lead: TourLead) {
  if (!lead.createdAt?.seconds) return "Recently";
  return new Date(lead.createdAt.seconds * 1000).toLocaleString();
}

async function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new Error("Firestore request timed out"));
      }, ms);
    }),
  ]);
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<TourLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<TourLead | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadLeads() {
  try {
    console.log("db instance:", db);

    const snap = await getDocs(collection(db, "tourLeads"));

    console.log("docs found:", snap.size);

    snap.forEach((doc) => {
      console.log(doc.id, doc.data());
    });

    setLeads(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<TourLead, "id">),
      })),
    );
  } catch (error) {
    console.error("LOAD LEADS ERROR:", error);
  } finally {
    setLoading(false);
  }
}

  async function updateLeadStatus(id: string, status: LeadStatus) {
    try {
      await updateDoc(doc(db, "tourLeads", id), {
        status,
        updatedAt: new Date(),
      });

      setLeads((current) =>
        current.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
      );

      setSelectedLead((current) =>
        current?.id === id ? { ...current, status } : current,
      );
    } catch (error) {
      console.error("Failed to update lead status:", error);
      alert("Status update failed. Check Firestore rules and console.");
    }
  }

  async function updateLeadDetails(id: string, updates: Partial<TourLead>) {
    try {
      await updateDoc(doc(db, "tourLeads", id), {
        ...updates,
        updatedAt: new Date(),
      });

      setLeads((current) =>
        current.map((lead) => (lead.id === id ? { ...lead, ...updates } : lead)),
      );

      setSelectedLead((current) =>
        current?.id === id ? { ...current, ...updates } : current,
      );

      alert("Lead details saved.");
    } catch (error) {
      console.error("Failed to save lead details:", error);
      alert("Save failed. Check Firestore rules and browser console.");
    }
  }

  useEffect(() => {
    void loadLeads();
  }, []);

  const metrics = useMemo(() => {
    const totalValue = leads.reduce(
      (sum, lead) => sum + Number(lead.estimatedValue || 0),
      0,
    );

    return {
      total: leads.length,
      new: leads.filter((lead) => (lead.status || "new") === "new").length,
      booked: leads.filter((lead) => lead.status === "booked").length,
      totalValue,
    };
  }, [leads]);

  return (
    <main className="min-h-screen bg-[#071216] px-4 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-emerald-300">
              VI Guide Revenue
            </p>
            <h1 className="mt-2 font-serif text-4xl font-black">
              Lead Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Track tour, taxi, and bundle requests created from historic sites
              and Concierge booking flows.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadLeads()}
            className="flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#022c22]"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </header>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <Metric icon={User} title="Total Leads" value={metrics.total} />
          <Metric icon={Clock} title="New Leads" value={metrics.new} />
          <Metric icon={CheckCircle2} title="Booked" value={metrics.booked} />
          <Metric icon={DollarSign} title="Estimated Value" value={`$${metrics.totalValue}`} />
        </div>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl">
          <div className="border-b border-white/10 px-6 py-4">
            <h2 className="text-xl font-black">Latest Leads</h2>
          </div>

          {loading ? (
            <div className="p-8 text-white/60">Loading leads...</div>
          ) : loadError ? (
            <div className="p-8">
              <p className="font-bold text-red-200">{loadError}</p>
              <button
                type="button"
                onClick={() => void loadLeads()}
                className="mt-4 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-black text-[#022c22]"
              >
                Try Again
              </button>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-white/60">
              No leads yet. Open Fort Christian, tap Book Tour, then return here.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {leads.map((lead) => (
                <article
                  key={lead.id}
                  className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr_1fr_auto]"
                >
                  <div>
                    <p className="text-lg font-black">
                      {lead.siteName || "Historic Site Lead"}
                    </p>
                    <p className="mt-1 text-sm text-white/55">
                      {islandLabel(lead.island)} · {(lead.intent || "tour").toUpperCase()} · {formatDate(lead)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
                        ${lead.estimatedValue || 0} estimated
                      </span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
                        {lead.source || "historic-site-concierge"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                      Visitor
                    </p>
                    <p className="mt-2 font-bold">
                      {lead.customerName || "Guest Visitor"}
                    </p>

                    {lead.customerEmail ? (
                      <p className="mt-1 flex items-center gap-2 text-sm text-white/55">
                        <Mail className="h-4 w-4" />
                        {lead.customerEmail}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-white/45">
                        No email captured yet
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                      Status
                    </p>
                    <select
                      value={lead.status || "new"}
                      onChange={(event) =>
                        void updateLeadStatus(lead.id, event.target.value as LeadStatus)
                      }
                      className="mt-2 w-full rounded-xl border border-white/10 bg-[#020814] px-3 py-3 text-sm font-bold text-white"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedLead(lead)}
                      className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#071216]"
                    >
                      <Car className="h-4 w-4" />
                      Open
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      {selectedLead ? (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusChange={updateLeadStatus}
          onSave={updateLeadDetails}
        />
      ) : null}
    </main>
  );
}

function Metric({
  icon: Icon,
  title,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[0.07] p-5 shadow-2xl">
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400 text-[#022c22]">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-sm font-bold text-white/55">{title}</p>
      <p className="mt-1 text-3xl font-black">{value}</p>
    </div>
  );
}

function LeadDrawer({
  lead,
  onClose,
  onStatusChange,
  onSave,
}: {
  lead: TourLead;
  onClose: () => void;
  onStatusChange: (id: string, status: LeadStatus) => Promise<void>;
  onSave: (id: string, updates: Partial<TourLead>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: lead.customerName || "",
    customerEmail: lead.customerEmail || "",
    customerPhone: lead.customerPhone || "",
    guestCount: String(lead.guestCount || ""),
    preferredDate: lead.preferredDate || "",
    pickupLocation: lead.pickupLocation || "",
    specialRequests: lead.specialRequests || "",
  });

  async function saveDetails() {
    setSaving(true);

    try {
      await onSave(lead.id, {
        customerName: form.customerName.trim() || null,
        customerEmail: form.customerEmail.trim() || null,
        customerPhone: form.customerPhone.trim() || null,
        guestCount: form.guestCount ? Number(form.guestCount) : null,
        preferredDate: form.preferredDate.trim() || null,
        pickupLocation: form.pickupLocation.trim() || null,
        specialRequests: form.specialRequests.trim() || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <aside className="absolute right-0 top-0 h-full w-full max-w-xl overflow-y-auto bg-[#071216] p-6 pb-32 text-white shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-300">
              Lead Details
            </p>
            <h2 className="mt-2 font-serif text-3xl font-black">
              {lead.siteName || "Historic Site Lead"}
            </h2>
            <p className="mt-2 text-sm text-white/55">
              {islandLabel(lead.island)} · {(lead.intent || "tour").toUpperCase()} · ${lead.estimatedValue || 0}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-black"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
            Status
          </p>

          <select
            value={lead.status || "new"}
            onChange={(event) =>
              void onStatusChange(lead.id, event.target.value as LeadStatus)
            }
            className="mt-3 w-full rounded-xl border border-white/10 bg-[#020814] px-4 py-3 text-sm font-bold text-white"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 grid gap-4">
          <LeadInput label="Full Name" value={form.customerName} onChange={(value) => setForm((f) => ({ ...f, customerName: value }))} />
          <LeadInput label="Email" value={form.customerEmail} onChange={(value) => setForm((f) => ({ ...f, customerEmail: value }))} />
          <LeadInput label="Phone" value={form.customerPhone} onChange={(value) => setForm((f) => ({ ...f, customerPhone: value }))} />
          <LeadInput label="Guests" value={form.guestCount} type="number" onChange={(value) => setForm((f) => ({ ...f, guestCount: value }))} />
          <LeadInput label="Preferred Date" value={form.preferredDate} onChange={(value) => setForm((f) => ({ ...f, preferredDate: value }))} />
          <LeadInput label="Pickup Location" value={form.pickupLocation} onChange={(value) => setForm((f) => ({ ...f, pickupLocation: value }))} />

          <label className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
              Special Requests
            </span>
            <textarea
              value={form.specialRequests}
              onChange={(event) =>
                setForm((f) => ({ ...f, specialRequests: event.target.value }))
              }
              className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-[#020814] px-4 py-3 text-sm font-bold text-white outline-none"
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={saving}
            onClick={() => void saveDetails()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#022c22] disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save Details"}
          </button>

          <button
            type="button"
            onClick={() => void onStatusChange(lead.id, "booked")}
            className="rounded-2xl bg-white px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#071216]"
          >
            Mark Booked
          </button>
        </div>
      </aside>
    </div>
  );
}

function LeadInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 w-full rounded-xl border border-white/10 bg-[#020814] px-4 py-3 text-sm font-bold text-white outline-none"
      />
    </label>
  );
}