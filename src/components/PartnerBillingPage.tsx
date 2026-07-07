import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  BedDouble,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Hotel,
  Mail,
  Phone,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  readAccommodationPartnerPages,
  type AccommodationPartnerPage,
} from "../lib/accommodations/accommodationPartnerPages";

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

type BillingStatus =
  | "not_started"
  | "trial"
  | "invoice_sent"
  | "paid"
  | "overdue"
  | "paused"
  | "cancelled";

type BillingPartner = {
  id: string;
  businessName: string;
  category: string;
  island: string;
  phone: string;
  email: string;
  website: string;
  source: "accommodation_page" | "booking_partner";
  sourceStatus: string;
};

const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";
const BILLING_STATUS_KEY = "viNavigatorPartnerBillingStatuses";
const BILLING_AMOUNT_KEY = "viNavigatorPartnerBillingAmounts";
const BILLING_NOTE_KEY = "viNavigatorPartnerBillingNotes";
const BILLING_DATE_KEY = "viNavigatorPartnerBillingDates";

const statusLabels: Record<BillingStatus, string> = {
  not_started: "Not Started",
  trial: "Trial",
  invoice_sent: "Invoice Sent",
  paid: "Paid",
  overdue: "Overdue",
  paused: "Paused",
  cancelled: "Cancelled",
};

const statusOrder: BillingStatus[] = [
  "not_started",
  "trial",
  "invoice_sent",
  "paid",
  "overdue",
  "paused",
  "cancelled",
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

function moneyNumber(value: string) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function billingPartnersFromPages(pages: AccommodationPartnerPage[]): BillingPartner[] {
  return pages
    .filter((page) =>
      ["active_partner", "claim_requested", "paused"].includes(page.pageStatus)
    )
    .map((page) => ({
      id: `accommodation-${page.sourceRecordId}`,
      businessName: page.businessName,
      category: page.category,
      island: page.island,
      phone: page.partnerContactPhone || page.phone,
      email: page.partnerContactEmail || page.bookingEmail || page.email,
      website: page.website,
      source: "accommodation_page" as const,
      sourceStatus: page.pageStatus,
    }));
}

function billingPartnersFromBookingPartners(partners: BookingPartner[]): BillingPartner[] {
  return partners
    .filter((partner) =>
      ["active_partner", "won", "pilot", "demo_done", "contacted"].includes(partner.status)
    )
    .map((partner) => ({
      id: `booking-${partner.id}`,
      businessName: partner.businessName,
      category: partner.category,
      island: partner.island,
      phone: partner.phone,
      email: partner.email,
      website: partner.website,
      source: "booking_partner" as const,
      sourceStatus: partner.status,
    }));
}

function defaultAmountForPartner(partner: BillingPartner) {
  if (partner.sourceStatus === "pilot" || partner.sourceStatus === "claim_requested") return "0";
  return "49";
}

function invoiceText(partner: BillingPartner, amount: string) {
  return `Hi ${partner.businessName} team,

Thank you for reviewing VI Guide.

Your founding partner plan is ready:

Partner: ${partner.businessName}
Island: ${partner.island}
Category: ${partner.category}
Monthly founding partner rate: $${amount || "49"}/mo

This includes:
- Public partner profile
- Booking inquiry routing
- Visitor discovery placement
- Transportation / mobility connection
- Monthly lead and activity tracking

Please confirm the best billing contact and whether you want to start as active, pilot, or paused.

Thanks,
VI Guide`;
}

function copyText(value: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    navigator.clipboard.writeText(value);
  }
}

export default function PartnerBillingPage() {
  const navigate = useNavigate();

  const partners = useMemo(() => {
    const fromPages = billingPartnersFromPages(readAccommodationPartnerPages());
    const fromBooking = billingPartnersFromBookingPartners(
      readArray<BookingPartner>(BOOKING_PARTNERS_KEY)
    );

    const seen = new Set<string>();

    return [...fromPages, ...fromBooking].filter((partner) => {
      const key = `${partner.businessName}-${partner.island}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    readRecord(BILLING_STATUS_KEY)
  );
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    readRecord(BILLING_AMOUNT_KEY)
  );
  const [notes, setNotes] = useState<Record<string, string>>(() =>
    readRecord(BILLING_NOTE_KEY)
  );
  const [dates, setDates] = useState<Record<string, string>>(() =>
    readRecord(BILLING_DATE_KEY)
  );
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BillingStatus | "all">("all");

  const enriched = useMemo(() => {
    return partners.map((partner) => {
      const status = (statuses[partner.id] || "not_started") as BillingStatus;
      const amount = amounts[partner.id] || defaultAmountForPartner(partner);
      const note = notes[partner.id] || "";
      const date = dates[partner.id] || "";

      return {
        partner,
        status,
        amount,
        note,
        date,
      };
    });
  }, [amounts, dates, notes, partners, statuses]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();

    return enriched.filter((item) => {
      const partner = item.partner;

      const matchesStatus = statusFilter === "all" || item.status === statusFilter;
      const matchesSearch =
        !search ||
        partner.businessName.toLowerCase().includes(search) ||
        partner.category.toLowerCase().includes(search) ||
        partner.island.toLowerCase().includes(search) ||
        partner.email.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [enriched, query, statusFilter]);

  const stats = useMemo(() => {
    const paid = enriched.filter((item) => item.status === "paid");
    const invoiceSent = enriched.filter((item) => item.status === "invoice_sent");
    const overdue = enriched.filter((item) => item.status === "overdue");
    const activeBillable = enriched.filter((item) =>
      ["invoice_sent", "paid", "overdue"].includes(item.status)
    );

    const paidMrr = paid.reduce((sum, item) => sum + moneyNumber(item.amount), 0);
    const projectedMrr = activeBillable.reduce(
      (sum, item) => sum + moneyNumber(item.amount),
      0
    );

    return {
      total: enriched.length,
      paid: paid.length,
      invoiceSent: invoiceSent.length,
      overdue: overdue.length,
      paidMrr,
      projectedMrr,
      annualized: projectedMrr * 12,
    };
  }, [enriched]);

  const updateStatus = (partnerId: string, status: BillingStatus) => {
    const next = { ...statuses, [partnerId]: status };
    setStatuses(next);
    writeRecord(BILLING_STATUS_KEY, next);
  };

  const updateAmount = (partnerId: string, amount: string) => {
    const next = { ...amounts, [partnerId]: amount };
    setAmounts(next);
    writeRecord(BILLING_AMOUNT_KEY, next);
  };

  const updateNote = (partnerId: string, note: string) => {
    const next = { ...notes, [partnerId]: note };
    setNotes(next);
    writeRecord(BILLING_NOTE_KEY, next);
  };

  const updateDate = (partnerId: string, date: string) => {
    const next = { ...dates, [partnerId]: date };
    setDates(next);
    writeRecord(BILLING_DATE_KEY, next);
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <CreditCard className="h-4 w-4" />
                Partner Billing
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Turn active partners into monthly revenue.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                Track invoices, founding partner plans, payments, overdue follow-up,
                and monthly recurring revenue.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[540px]">
              <HeroStat label="Projected MRR" value={formatMoney(stats.projectedMrr)} icon={Banknote} />
              <HeroStat label="Paid MRR" value={formatMoney(stats.paidMrr)} icon={CheckCircle2} />
              <HeroStat label="Annualized" value={formatMoney(stats.annualized)} icon={BadgeDollarSign} />
              <HeroStat label="Billable Partners" value={stats.total} icon={Users} />
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
                <QuickButton label="Partner Outreach" icon={Mail} onClick={() => navigate("/partner-outreach")} />
                <QuickButton label="Revenue Dashboard" icon={BadgeDollarSign} onClick={() => navigate("/revenue-dashboard")} />
                <QuickButton label="Booking Inbox" icon={ClipboardList} onClick={() => navigate("/booking-inbox")} />
                <QuickButton label="Partner Manager" icon={BedDouble} onClick={() => navigate("/accommodation-partner")} />
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
                  placeholder="Search billing partners..."
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

            <section className="rounded-[2.25rem] bg-emerald-950 p-5 text-white shadow-xl">
              <Sparkles className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-2xl font-black">Founding offer</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-white/70">
                Start early partners at $49/mo while you prove traffic, booking inquiries,
                and transportation lead flow.
              </p>
            </section>
          </aside>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Billing queue
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  {filtered.length} partner billing records
                </h2>
              </div>

              <button
                type="button"
                onClick={() => navigate("/revenue-dashboard")}
                className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Open Revenue Dashboard
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              {filtered.length ? (
                filtered.map((item) => (
                  <BillingCard
                    key={item.partner.id}
                    item={item}
                    onStatus={(status) => updateStatus(item.partner.id, status)}
                    onAmount={(amount) => updateAmount(item.partner.id, amount)}
                    onNote={(note) => updateNote(item.partner.id, note)}
                    onDate={(date) => updateDate(item.partner.id, date)}
                  />
                ))
              ) : (
                <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
                  <CreditCard className="mx-auto h-10 w-10 text-emerald-700" />
                  <p className="mt-3 text-lg font-black">No billing records found</p>
                  <p className="mt-2 text-sm font-bold text-stone-500">
                    Make partners active from outreach or accommodation review.
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

function BillingCard({
  item,
  onStatus,
  onAmount,
  onNote,
  onDate,
}: {
  item: {
    partner: BillingPartner;
    status: BillingStatus;
    amount: string;
    note: string;
    date: string;
  };
  onStatus: (status: BillingStatus) => void;
  onAmount: (amount: string) => void;
  onNote: (note: string) => void;
  onDate: (date: string) => void;
}) {
  const partner = item.partner;

  return (
    <article className="rounded-[2rem] bg-stone-50 p-4 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div>
          <div className="flex items-start gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
              <Hotel className="h-6 w-6" />
            </div>

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                {partner.category} · {partner.island}
              </p>

              <h3 className="mt-1 text-2xl font-black">{partner.businessName}</h3>

              <p className="mt-1 text-sm font-bold text-stone-500">
                {partner.source.replace("_", " ")} · {partner.sourceStatus.replace("_", " ")}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black">
            {partner.phone ? (
              <a
                href={`tel:${partner.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink"
              >
                <Phone className="h-3.5 w-3.5 text-emerald-700" />
                {partner.phone}
              </a>
            ) : null}

            {partner.email ? (
              <a
                href={`mailto:${partner.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-ink"
              >
                <Mail className="h-3.5 w-3.5 text-emerald-700" />
                {partner.email}
              </a>
            ) : null}
          </div>

          <textarea
            value={item.note}
            onChange={(event) => onNote(event.target.value)}
            placeholder="Billing notes, payment link, contact person, follow-up..."
            className="mt-4 min-h-24 w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
          />
        </div>

        <div className="rounded-[1.5rem] bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Billing controls
          </p>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
              Billing status
            </span>
            <select
              value={item.status}
              onChange={(event) => onStatus(event.target.value as BillingStatus)}
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
              Monthly amount
            </span>
            <input
              value={item.amount}
              onChange={(event) => onAmount(event.target.value)}
              placeholder="49"
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-black outline-none"
            />
          </label>

          <label className="mt-3 block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
              Next follow-up / paid date
            </span>
            <input
              type="date"
              value={item.date}
              onChange={(event) => onDate(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-sm font-black outline-none"
            />
          </label>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onStatus("invoice_sent");
                copyText(invoiceText(partner, item.amount));
              }}
              className="rounded-2xl bg-[#ffcf32] px-3 py-3 text-xs font-black text-ink active:scale-95"
            >
              Copy Invoice
            </button>

            <button
              type="button"
              onClick={() => onStatus("paid")}
              className="rounded-2xl bg-emerald-950 px-3 py-3 text-xs font-black text-white active:scale-95"
            >
              Mark Paid
            </button>

            <button
              type="button"
              onClick={() => onStatus("trial")}
              className="rounded-2xl bg-stone-100 px-3 py-3 text-xs font-black text-ink active:scale-95"
            >
              Trial
            </button>

            <button
              type="button"
              onClick={() => onStatus("overdue")}
              className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-black text-red-700 active:scale-95"
            >
              Overdue
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

function QuickButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-stone-50 px-4 py-3 text-left text-sm font-black text-ink active:scale-95"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-emerald-700" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 text-stone-400" />
    </button>
  );
}
