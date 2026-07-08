import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Hotel,
  Inbox,
  Mail,
  Phone,
  Search,
  Send,
  Ship,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  readAccommodationPartnerPages,
  type AccommodationPartnerPage,
} from "../lib/accommodations/accommodationPartnerPages";

type BookingRequest = {
  id: string;
  category: string;
  guestName: string;
  phone: string;
  email: string;
  island: string;
  preferredArea: string;
  dates: string;
  partySize: string;
  budget: string;
  notes: string;
  requestedPartnerId?: string;
  requestedPartnerName?: string;
  createdAt: string;
};

type BookingInboxStatus =
  | "new"
  | "assigned"
  | "partner_contacted"
  | "guest_contacted"
  | "quoted"
  | "booked"
  | "lost";

type BookingPartner = {
  id: string;
  businessName: string;
  category: string;
  island: string;
  phone: string;
  email: string;
  website: string;
  status: string;
  bookingOffer: string;
};

type PartnerOption = {
  id: string;
  businessName: string;
  category: string;
  island: string;
  email: string;
  phone: string;
  source: "accommodation_page" | "booking_partner";
};

const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";
const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";
const STATUS_KEY = "viNavigatorBookingInboxStatuses";
const ASSIGNMENT_KEY = "viNavigatorBookingInboxAssignments";
const VALUE_KEY = "viNavigatorBookingInboxValues";
const NOTE_KEY = "viNavigatorBookingInboxNotes";

const statusLabels: Record<BookingInboxStatus, string> = {
  new: "New",
  assigned: "Assigned",
  partner_contacted: "Partner Contacted",
  guest_contacted: "Guest Contacted",
  quoted: "Quoted",
  booked: "Booked",
  lost: "Lost",
};

const statusOrder: BookingInboxStatus[] = [
  "new",
  "assigned",
  "partner_contacted",
  "guest_contacted",
  "quoted",
  "booked",
  "lost",
];

function readArray<T>(key: string): T[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readRecord(key: string): Record<string, string> {
  if (typeof window === "undefined") return {};

  try {
    const parsed = JSON.parse(window.localStorage.getItem(key) || "{}") as Record<string, string>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeRecord(key: string, value: Record<string, string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function moneyNumber(value: string) {
  const number = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function partnerOptionsFromPages(pages: AccommodationPartnerPage[]): PartnerOption[] {
  return pages
    .filter((page) => page.pageStatus === "active_partner" || page.pageStatus === "claim_requested")
    .map((page) => ({
      id: page.sourceRecordId,
      businessName: page.businessName,
      category: page.category,
      island: page.island,
      email: page.bookingEmail || page.partnerContactEmail || page.email,
      phone: page.partnerContactPhone || page.phone,
      source: "accommodation_page" as const,
    }));
}

function partnerOptionsFromBookingPartners(partners: BookingPartner[]): PartnerOption[] {
  return partners.map((partner) => ({
    id: partner.id,
    businessName: partner.businessName,
    category: partner.category,
    island: partner.island,
    email: partner.email,
    phone: partner.phone,
    source: "booking_partner" as const,
  }));
}

function requestKey(request: BookingRequest, index: number) {
  return request.id || `${request.createdAt}-${index}`;
}

function categoryIcon(category: string): LucideIcon {
  if (category.includes("boat") || category.includes("charter")) return Ship;
  if (category.includes("villa") || category.includes("rental")) return BedDouble;
  if (category.includes("hotel") || category.includes("resort")) return Hotel;
  return Building2;
}

export default function BookingInboxPage() {
  const navigate = useNavigate();

  const [requests] = useState<BookingRequest[]>(() => readArray<BookingRequest>(BOOKING_REQUESTS_KEY));
  const [statuses, setStatuses] = useState<Record<string, string>>(() => readRecord(STATUS_KEY));
  const [assignments, setAssignments] = useState<Record<string, string>>(() => readRecord(ASSIGNMENT_KEY));
  const [values, setValues] = useState<Record<string, string>>(() => readRecord(VALUE_KEY));
  const [notes, setNotes] = useState<Record<string, string>>(() => readRecord(NOTE_KEY));

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingInboxStatus | "all">("all");

  const partners = useMemo<PartnerOption[]>(() => {
    const fromPages = partnerOptionsFromPages(readAccommodationPartnerPages());
    const fromPartners = partnerOptionsFromBookingPartners(
      readArray<BookingPartner>(BOOKING_PARTNERS_KEY)
    );

    const seen = new Set<string>();

    return [...fromPages, ...fromPartners].filter((partner) => {
      const key = `${partner.businessName}-${partner.island}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const enrichedRequests = useMemo(() => {
    return requests.map((request, index) => {
      const key = requestKey(request, index);
      const status = (statuses[key] || "new") as BookingInboxStatus;
      const assignedPartnerId = assignments[key] || "";
      const assignedPartner = partners.find((partner) => partner.id === assignedPartnerId);

      return {
        key,
        request,
        status,
        assignedPartnerId,
        assignedPartner,
        value: values[key] || "",
        note: notes[key] || "",
      };
    });
  }, [assignments, notes, partners, requests, statuses, values]);

  const filteredRequests = useMemo(() => {
    const search = query.trim().toLowerCase();

    return enrichedRequests.filter((item) => {
      const request = item.request;

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;

      const matchesSearch =
        !search ||
        request.guestName?.toLowerCase().includes(search) ||
        request.email?.toLowerCase().includes(search) ||
        request.phone?.toLowerCase().includes(search) ||
        request.island?.toLowerCase().includes(search) ||
        request.preferredArea?.toLowerCase().includes(search) ||
        request.requestedPartnerName?.toLowerCase().includes(search) ||
        item.assignedPartner?.businessName.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [enrichedRequests, query, statusFilter]);

  const stats = useMemo(() => {
    const booked = enrichedRequests.filter((item) => item.status === "booked");
    const open = enrichedRequests.filter((item) => !["booked", "lost"].includes(item.status));
    const totalValue = booked.reduce((sum, item) => sum + moneyNumber(item.value), 0);
    const referral = totalValue * 0.1;

    return {
      total: enrichedRequests.length,
      open: open.length,
      booked: booked.length,
      partners: partners.length,
      totalValue,
      referral,
    };
  }, [enrichedRequests, partners]);

  const updateStatus = (key: string, status: BookingInboxStatus) => {
    const next = { ...statuses, [key]: status };
    setStatuses(next);
    writeRecord(STATUS_KEY, next);
  };

  const updateAssignment = (key: string, partnerId: string) => {
    const next = { ...assignments, [key]: partnerId };
    setAssignments(next);
    writeRecord(ASSIGNMENT_KEY, next);

    if (partnerId && (statuses[key] || "new") === "new") {
      updateStatus(key, "assigned");
    }
  };

  const updateValue = (key: string, value: string) => {
    const next = { ...values, [key]: value };
    setValues(next);
    writeRecord(VALUE_KEY, next);
  };

  const updateNote = (key: string, value: string) => {
    const next = { ...notes, [key]: value };
    setNotes(next);
    writeRecord(NOTE_KEY, next);
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Inbox className="h-4 w-4" />
                Booking Inbox
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Route every stay, villa, charter, and tour inquiry.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                Assign customer requests to partners, track follow-up, and turn booking interest into measurable revenue.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:w-[560px]">
              <HeroStat label="Inquiries" value={stats.total} icon={ClipboardList} />
              <HeroStat label="Booked" value={stats.booked} icon={CheckCircle2} />
              <HeroStat label="10% Estimate" value={`$${Math.round(stats.referral).toLocaleString()}`} icon={BadgeDollarSign} />
            </div>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Pipeline
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
                  onClick={() => navigate("/revenue-dashboard")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Revenue Dashboard
                </button>

                <Metric label="Open inquiries" value={stats.open} />
                <Metric label="Partner options" value={stats.partners} />
                <Metric label="Booked value" value={`$${Math.round(stats.totalValue).toLocaleString()}`} />
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/hotels")}
                  className="rounded-2xl bg-turquoise px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Open Customer Stays
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/accommodation-partner")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Open Partner Manager
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/accommodation-review")}
                  className="rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Open Review Queue
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
                  placeholder="Search guest, island, partner..."
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
                  Requests
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {filteredRequests.length} booking inquiries
                </h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/direct-booking")}
                className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Open Direct Booking Hub
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {filteredRequests.length ? (
                filteredRequests.map((item) => (
                  <BookingCard
                    key={item.key}
                    item={item}
                    partners={partners}
                    onStatus={(status) => updateStatus(item.key, status)}
                    onAssign={(partnerId) => updateAssignment(item.key, partnerId)}
                    onValue={(value) => updateValue(item.key, value)}
                    onNote={(value) => updateNote(item.key, value)}
                  />
                ))
              ) : (
                <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
                  <Inbox className="mx-auto h-10 w-10 text-emerald-700" />
                  <p className="mt-3 text-lg font-black">No booking inquiries found</p>
                  <p className="mt-2 text-sm font-bold text-stone-500">
                    Submit a request from /hotels or an accommodation detail page.
                  </p>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
    </main>
  );
}

function BookingCard({
  item,
  partners,
  onStatus,
  onAssign,
  onValue,
  onNote,
}: {
  item: {
    key: string;
    request: BookingRequest;
    status: BookingInboxStatus;
    assignedPartnerId: string;
    assignedPartner?: PartnerOption;
    value: string;
    note: string;
  };
  partners: PartnerOption[];
  onStatus: (status: BookingInboxStatus) => void;
  onAssign: (partnerId: string) => void;
  onValue: (value: string) => void;
  onNote: (value: string) => void;
}) {
  const request = item.request;
  const Icon = categoryIcon(request.category || "");

  return (
    <article className="rounded-[2rem] bg-stone-50 p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_330px]">
        <div>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
              <Icon className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                {request.category || "booking"} · {request.island || "Island not set"}
              </p>

              <h3 className="mt-1 text-2xl font-black">
                {request.requestedPartnerName || request.preferredArea || "Booking inquiry"}
              </h3>

              <p className="mt-1 text-sm font-bold text-stone-500">
                {request.guestName || "Guest"} · {request.dates || "Dates not provided"} · {request.partySize || "Party size not provided"}
              </p>
            </div>
          </div>

          <p className="mt-4 text-sm font-bold leading-7 text-stone-700">
            {request.notes || "No notes provided."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            {request.phone ? (
              <a href={`tel:${request.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink">
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                {request.phone}
              </a>
            ) : null}

            {request.email ? (
              <a href={`mailto:${request.email}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink">
                <Mail className="h-3.5 w-3.5 text-emerald-700" />
                {request.email}
              </a>
            ) : null}

            {request.budget ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink">
                <BadgeDollarSign className="h-3.5 w-3.5 text-emerald-700" />
                {request.budget}
              </span>
            ) : null}

            {request.createdAt ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink">
                <CalendarDays className="h-3.5 w-3.5 text-emerald-700" />
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>

        <div className="rounded-[1.5rem] bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Route inquiry
          </p>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
              Assigned partner
            </span>
            <select
              value={item.assignedPartnerId}
              onChange={(event) => onAssign(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-black outline-none"
            >
              <option value="">Unassigned</option>
              {partners.map((partner) => (
                <option key={`${partner.source}-${partner.id}`} value={partner.id}>
                  {partner.businessName} · {partner.island}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
              Status
            </span>
            <select
              value={item.status}
              onChange={(event) => onStatus(event.target.value as BookingInboxStatus)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-black outline-none"
            >
              {statusOrder.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
              Estimated booking value
            </span>
            <input
              value={item.value}
              onChange={(event) => onValue(event.target.value)}
              placeholder="$1,200"
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-black outline-none"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
              Internal note
            </span>
            <textarea
              value={item.note}
              onChange={(event) => onNote(event.target.value)}
              placeholder="Called partner, waiting on quote..."
              className="mt-2 min-h-24 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-bold leading-6 outline-none"
            />
          </label>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onStatus("partner_contacted")}
              className="rounded-2xl bg-stone-100 px-3 py-3 text-xs font-black text-ink active:scale-95"
            >
              <Send className="mr-1 inline h-3.5 w-3.5" />
              Contacted
            </button>

            <button
              type="button"
              onClick={() => onStatus("booked")}
              className="rounded-2xl bg-emerald-950 px-3 py-3 text-xs font-black text-white active:scale-95"
            >
              <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
              Booked
            </button>

            <button
              type="button"
              onClick={() => onStatus("quoted")}
              className="rounded-2xl bg-turquoise px-3 py-3 text-xs font-black text-ink active:scale-95"
            >
              Quoted
            </button>

            <button
              type="button"
              onClick={() => onStatus("lost")}
              className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-red-700 active:scale-95"
            >
              <XCircle className="mr-1 inline h-3.5 w-3.5" />
              Lost
            </button>
          </div>
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

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl bg-stone-50 p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
    </div>
  );
}
