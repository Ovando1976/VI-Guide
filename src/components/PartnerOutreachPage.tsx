import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BedDouble,
  Building2,
  CheckCircle2,
  Clipboard,
  Hotel,
  Mail,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  enrichedCustomerBookingCatalog,
  type CustomerBookingRecord,
} from "../data/customerBookingCatalog";
import { generatedCustomerBookingCatalog } from "../data/customerBookingCatalog.generated";
import {
  accommodationSlug,
  createPartnerPageFromRecord,
  readAccommodationPartnerPages,
  writeAccommodationPartnerPages,
} from "../lib/accommodations/accommodationPartnerPages";

type OutreachStatus =
  | "not_contacted"
  | "contacted"
  | "demo_scheduled"
  | "interested"
  | "active_partner"
  | "declined_removed";

const STATUS_KEY = "viNavigatorAccommodationOutreachStatuses";
const NOTES_KEY = "viNavigatorAccommodationOutreachNotes";

const statusLabels: Record<OutreachStatus, string> = {
  not_contacted: "Not Contacted",
  contacted: "Contacted",
  demo_scheduled: "Demo Scheduled",
  interested: "Interested",
  active_partner: "Active Partner",
  declined_removed: "Declined / Removed",
};

const statusOrder: OutreachStatus[] = [
  "not_contacted",
  "contacted",
  "demo_scheduled",
  "interested",
  "active_partner",
  "declined_removed",
];

function readRecord(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeRecord(key: string, value: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function catalogRecords(): CustomerBookingRecord[] {
  const combined: CustomerBookingRecord[] = [
    ...generatedCustomerBookingCatalog,
    ...enrichedCustomerBookingCatalog,
  ];

  const seen = new Set<string>();

  return combined.filter((record) => {
    const key = `${record.category}-${record.island}-${record.businessName}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function categoryIcon(category: string): LucideIcon {
  if (category.includes("villa") || category.includes("rental")) return BedDouble;
  if (category.includes("hotel") || category.includes("resort")) return Hotel;
  return Building2;
}

function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
}

function pitchFor(record: CustomerBookingRecord) {
  return `Hi ${record.businessName} team,

I'm building VI Guide, a Virgin Islands visitor platform that helps travelers discover where to stay, what to do, and how to get around.

We created a provisional listing for ${record.businessName} using public business information. We would like to invite you to review it, approve your official photos/copy, and decide whether you want to become a founding accommodation partner.

If you want to partner, we keep your page active and route relevant booking inquiries to you.
If you do not want to participate, we will remove the listing completely.

Your page:
${typeof window !== "undefined" ? window.location.origin : ""}/hotels/${accommodationSlug(record)}

Would you like to review the page or schedule a quick demo?

Thanks,
VI Guide`;
}

export default function PartnerOutreachPage() {
  const navigate = useNavigate();

  const records = useMemo(() => catalogRecords(), []);
  const [statuses, setStatuses] = useState<Record<string, string>>(() => readRecord(STATUS_KEY));
  const [notes, setNotes] = useState<Record<string, string>>(() => readRecord(NOTES_KEY));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OutreachStatus | "all">("all");

  const visibleRecords = useMemo(() => {
    const search = query.trim().toLowerCase();

    return records.filter((record) => {
      const status = (statuses[record.id] || "not_contacted") as OutreachStatus;

      const matchesStatus = statusFilter === "all" || status === statusFilter;
      const matchesSearch =
        !search ||
        record.businessName.toLowerCase().includes(search) ||
        record.island.toLowerCase().includes(search) ||
        record.area.toLowerCase().includes(search) ||
        record.category.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [query, records, statusFilter, statuses]);

  const stats = useMemo(() => {
    const values = records.map((record) => (statuses[record.id] || "not_contacted") as OutreachStatus);

    return {
      total: records.length,
      contacted: values.filter((status) => status !== "not_contacted").length,
      interested: values.filter((status) => status === "interested").length,
      active: values.filter((status) => status === "active_partner").length,
      removed: values.filter((status) => status === "declined_removed").length,
    };
  }, [records, statuses]);

  const updateStatus = (record: CustomerBookingRecord, status: OutreachStatus) => {
    const nextStatuses = { ...statuses, [record.id]: status };
    setStatuses(nextStatuses);
    writeRecord(STATUS_KEY, nextStatuses);

    if (status === "declined_removed") {
      const existing = readAccommodationPartnerPages();
      const removedPage = {
        ...createPartnerPageFromRecord(record),
        pageStatus: "removed" as const,
        updatedAt: new Date().toISOString(),
      };

      writeAccommodationPartnerPages([
        removedPage,
        ...existing.filter((page) => page.sourceRecordId !== record.id),
      ]);
    }

    if (status === "active_partner") {
      const existing = readAccommodationPartnerPages();
      const activePage = {
        ...createPartnerPageFromRecord(record),
        pageStatus: "active_partner" as const,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      writeAccommodationPartnerPages([
        activePage,
        ...existing.filter((page) => page.sourceRecordId !== record.id),
      ]);
    }
  };

  const updateNote = (recordId: string, value: string) => {
    const next = { ...notes, [recordId]: value };
    setNotes(next);
    writeRecord(NOTES_KEY, next);
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 pt-5">
        <button
          type="button"
          onClick={() => window.location.assign("/partner-desk")}
          className="mb-5 flex w-full items-center justify-between rounded-[2rem] bg-[#ffcf32] px-6 py-5 text-left text-ink shadow-xl active:scale-95"
        >
          <span>
            <span className="block text-xs font-black uppercase tracking-[0.22em] text-emerald-900">
              Organized partner app
            </span>
            <span className="mt-1 block text-2xl font-black">Partner Desk</span>
            <span className="mt-1 block text-sm font-bold text-stone-700">
              Manage profile, leads, review status, billing, and partner workflow.
            </span>
          </span>
          <span className="text-2xl font-black">→</span>
        </button>
      </section>


      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Send className="h-4 w-4" />
                Partner Outreach
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Contact each accommodation and decide who stays in the catalog.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                Use this page to contact hotels, villas, charters, and tour operators. If they partner, keep them. If they decline, remove them.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
              <HeroStat label="Targets" value={stats.total} icon={Users} />
              <HeroStat label="Contacted" value={stats.contacted} icon={Mail} />
              <HeroStat label="Active" value={stats.active} icon={CheckCircle2} />
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Quick open
              </p>

              <div className="mt-4 grid gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/partner-billing")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Partner Billing
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/booking-inbox")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Booking Inbox
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/meeting-mode")}
                  className="rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Meeting Mode
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/accommodation-partner")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Partner Page Manager
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/revenue-dashboard")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Revenue Dashboard
                </button>
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Filters
              </p>

              <label className="relative mt-4 block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search partner targets..."
                  className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
                />
              </label>

              <div className="mt-4 grid gap-2">
                {(["all", ...statusOrder] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl px-4 py-3 text-left text-xs font-black uppercase tracking-[0.14em] active:scale-95 ${
                      statusFilter === status
                        ? "bg-emerald-950 text-white"
                        : "bg-stone-50 text-stone-600"
                    }`}
                  >
                    {status === "all" ? "All" : statusLabels[status]}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Outreach queue
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {visibleRecords.length} partner targets
                </h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/hotels")}
                className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                View Public Catalog
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {visibleRecords.map((record) => (
                <OutreachCard
                  key={record.id}
                  record={record}
                  status={(statuses[record.id] || "not_contacted") as OutreachStatus}
                  note={notes[record.id] || ""}
                  onStatus={(status) => updateStatus(record, status)}
                  onNote={(value) => updateNote(record.id, value)}
                  onOpen={() => navigate(`/hotels/${accommodationSlug(record)}`)}
                />
              ))}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function OutreachCard({
  record,
  status,
  note,
  onStatus,
  onNote,
  onOpen,
}: {
  record: CustomerBookingRecord;
  status: OutreachStatus;
  note: string;
  onStatus: (status: OutreachStatus) => void;
  onNote: (value: string) => void;
  onOpen: () => void;
}) {
  const Icon = categoryIcon(record.category);

  return (
    <article className="overflow-hidden rounded-[2rem] bg-stone-50 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative h-56 bg-emerald-950 lg:h-full">
          <img
            src={record.image}
            alt={record.imageAlt || `${record.businessName} accommodation image`}
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
            {statusLabels[status]}
          </div>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                  <Icon className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                    {record.category} · {record.island}
                  </p>
                  <h3 className="mt-1 text-2xl font-black">{record.businessName}</h3>
                </div>
              </div>

              <p className="mt-4 text-sm font-bold leading-7 text-stone-600">
                {record.headline}
              </p>

              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-stone-400">
                {record.area}
              </p>
            </div>

            <div className="grid gap-2 md:w-[260px]">
              <button
                type="button"
                onClick={() => copyText(pitchFor(record))}
                className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
              >
                <Clipboard className="mr-2 inline h-4 w-4" />
                Copy Email Pitch
              </button>

              <button
                type="button"
                onClick={onOpen}
                className="rounded-2xl bg-stone-200 px-4 py-3 text-sm font-black text-ink active:scale-95"
              >
                Open Public Page
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <select
              value={status}
              onChange={(event) => onStatus(event.target.value as OutreachStatus)}
              className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black outline-none"
            >
              {statusOrder.map((item) => (
                <option key={item} value={item}>
                  {statusLabels[item]}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => onStatus("active_partner")}
              className="rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
            >
              <ShieldCheck className="mr-2 inline h-4 w-4" />
              Make Active
            </button>

            <button
              type="button"
              onClick={() => onStatus("declined_removed")}
              className="rounded-2xl bg-red-100 px-4 py-3 text-sm font-black text-red-700 active:scale-95"
            >
              <Trash2 className="mr-2 inline h-4 w-4" />
              Declined / Remove
            </button>
          </div>

          <textarea
            value={note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="Outreach notes..."
            className="mt-4 min-h-24 w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
          />

          {status === "declined_removed" ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-black text-red-700">
              <XCircle className="mr-2 inline h-4 w-4" />
              This business is marked removed. Customer catalog override will hide it.
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function HeroStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-4 text-ink">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 truncate text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
