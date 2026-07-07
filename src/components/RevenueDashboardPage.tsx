import { useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  Banknote,
  BedDouble,
  Building2,
  CheckCircle2,
  ClipboardList,
  Hotel,
  Inbox,
  LineChart,
  Mail,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { readAccommodationPartnerPages } from "../lib/accommodations/accommodationPartnerPages";
import BusinessRouteTestButtons from "./BusinessRouteTestButtons";

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

const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";
const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";
const STATUS_KEY = "viNavigatorBookingInboxStatuses";
const VALUE_KEY = "viNavigatorBookingInboxValues";

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
    const parsed = JSON.parse(
      window.localStorage.getItem(key) || "{}"
    ) as Record<string, string>;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function moneyNumber(value: string) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

function requestKey(request: BookingRequest, index: number) {
  return request.id || `${request.createdAt}-${index}`;
}

function formatMoney(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function partnerMonthlyValue(status: string) {
  if (["active_partner", "won"].includes(status)) return 49;
  if (status === "pilot") return 0;
  return 0;
}

export default function RevenueDashboardPage() {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const requests = readArray<BookingRequest>(BOOKING_REQUESTS_KEY);
    const bookingPartners = readArray<BookingPartner>(BOOKING_PARTNERS_KEY);
    const partnerPages = readAccommodationPartnerPages();
    const statuses = readRecord(STATUS_KEY);
    const values = readRecord(VALUE_KEY);

    const enrichedRequests = requests.map((request, index) => {
      const key = requestKey(request, index);
      const status = statuses[key] || "new";
      const value = moneyNumber(values[key]);

      return {
        key,
        request,
        status,
        value,
      };
    });

    const booked = enrichedRequests.filter((item) => item.status === "booked");
    const open = enrichedRequests.filter(
      (item) => !["booked", "lost"].includes(item.status)
    );
    const quoted = enrichedRequests.filter((item) => item.status === "quoted");
    const lost = enrichedRequests.filter((item) => item.status === "lost");

    const activeAccommodationPages = partnerPages.filter((page) =>
      ["active_partner", "won"].includes(page.pageStatus)
    );

    const activeBookingPartners = bookingPartners.filter((partner) =>
      ["active_partner", "won", "pilot"].includes(partner.status)
    );

    const monthlyPartnerRevenue =
      activeAccommodationPages.reduce(
        (sum, page) => sum + partnerMonthlyValue(page.pageStatus),
        0
      ) +
      activeBookingPartners.reduce(
        (sum, partner) => sum + partnerMonthlyValue(partner.status),
        0
      );

    const bookedValue = booked.reduce((sum, item) => sum + item.value, 0);
    const quotedValue = quoted.reduce((sum, item) => sum + item.value, 0);
    const openValue = open.reduce((sum, item) => sum + item.value, 0);

    const referralEstimate = bookedValue * 0.1;
    const annualizedMrr = monthlyPartnerRevenue * 12;

    return {
      requests,
      enrichedRequests,
      open,
      booked,
      quoted,
      lost,
      bookingPartners,
      partnerPages,
      activeAccommodationPages,
      activeBookingPartners,
      monthlyPartnerRevenue,
      annualizedMrr,
      bookedValue,
      quotedValue,
      openValue,
      referralEstimate,
    };
  }, []);

  const topOpportunities = data.enrichedRequests
    .filter((item) => item.status !== "lost")
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const activePartners = [
    ...data.activeAccommodationPages.map((page) => ({
      id: page.id,
      name: page.businessName,
      type: page.category,
      island: page.island,
      status: page.pageStatus,
      source: "Accommodation page",
    })),
    ...data.activeBookingPartners.map((partner) => ({
      id: partner.id,
      name: partner.businessName,
      type: partner.category,
      island: partner.island,
      status: partner.status,
      source: "Booking partner pipeline",
    })),
  ];

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <BusinessRouteTestButtons />
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-6 text-white shadow-2xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <BadgeDollarSign className="h-4 w-4" />
                Revenue Dashboard
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
                Track booking revenue, partner MRR, and closeable opportunities.
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-bold leading-7 text-white/70">
                This ties the hotel, villa, charter, tour, partner-page, and
                booking-inbox system into one money view.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[520px]">
              <HeroStat
                label="Monthly partner revenue"
                value={formatMoney(data.monthlyPartnerRevenue)}
                icon={Banknote}
              />
              <HeroStat
                label="Booked value"
                value={formatMoney(data.bookedValue)}
                icon={CheckCircle2}
              />
              <HeroStat
                label="Referral estimate"
                value={formatMoney(data.referralEstimate)}
                icon={BadgeDollarSign}
              />
              <HeroStat
                label="Annualized MRR"
                value={formatMoney(data.annualizedMrr)}
                icon={TrendingUp}
              />
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
                <QuickButton
                  label="Partner Outreach"
                  icon={Mail}
                  onClick={() => navigate("/partner-outreach")}
                />
                <QuickButton
                  label="Booking Inbox"
                  icon={Inbox}
                  onClick={() => navigate("/booking-inbox")}
                />
                <QuickButton
                  label="Hotels / Stays"
                  icon={Hotel}
                  onClick={() => navigate("/hotels")}
                />
                <QuickButton
                  label="Partner Manager"
                  icon={BedDouble}
                  onClick={() => navigate("/accommodation-partner")}
                />
                <QuickButton
                  label="Booking Partners"
                  icon={Building2}
                  onClick={() => navigate("/booking-partners")}
                />
                <QuickButton
                  label="Meeting Mode"
                  icon={Sparkles}
                  onClick={() => navigate("/meeting-mode")}
                />
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Funnel
              </p>

              <div className="mt-4 grid gap-3">
                <Metric label="Total inquiries" value={data.requests.length} />
                <Metric label="Open pipeline" value={data.open.length} />
                <Metric label="Quoted" value={data.quoted.length} />
                <Metric label="Booked" value={data.booked.length} />
                <Metric label="Lost" value={data.lost.length} />
                <Metric label="Active partners" value={activePartners.length} />
              </div>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="grid gap-4 md:grid-cols-3">
              <ValueCard
                label="Open pipeline value"
                value={formatMoney(data.openValue)}
                helper="Estimated value across open requests."
                icon={LineChart}
              />
              <ValueCard
                label="Quoted value"
                value={formatMoney(data.quotedValue)}
                helper="Requests currently marked quoted."
                icon={ClipboardList}
              />
              <ValueCard
                label="Partner pages"
                value={data.partnerPages.length}
                helper="Accommodation partner page records."
                icon={Users}
              />
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Top opportunities
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Booking requests by value
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/booking-inbox")}
                  className="rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                >
                  Open Inbox
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {topOpportunities.length ? (
                  topOpportunities.map((item) => (
                    <article
                      key={item.key}
                      className="rounded-2xl bg-stone-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                            {item.status.replace("_", " ")} ·{" "}
                            {item.request.island || "Island"}
                          </p>
                          <h3 className="mt-1 text-xl font-black">
                            {item.request.requestedPartnerName ||
                              item.request.preferredArea ||
                              "Booking inquiry"}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-stone-500">
                            {item.request.guestName || "Guest"} ·{" "}
                            {item.request.dates || "Dates not provided"}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-5 py-4 text-right">
                          <p className="text-2xl font-black">
                            {formatMoney(item.value)}
                          </p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
                            Est. value
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    icon={Search}
                    title="No valued opportunities yet"
                    text="Add estimated booking values in the Booking Inbox."
                  />
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Active partners
                  </p>
                  <h2 className="mt-2 text-3xl font-black">
                    Partner revenue base
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/accommodation-partner")}
                  className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Add / Manage Partner
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {activePartners.length ? (
                  activePartners.map((partner) => (
                    <article
                      key={`${partner.source}-${partner.id}`}
                      className="rounded-2xl bg-stone-50 p-4"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                            {partner.type} · {partner.island}
                          </p>
                          <h3 className="mt-1 text-xl font-black">
                            {partner.name}
                          </h3>
                          <p className="mt-1 text-sm font-bold text-stone-500">
                            {partner.source} ·{" "}
                            {partner.status.replace("_", " ")}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-5 py-4 text-right">
                          <p className="text-2xl font-black">$49</p>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
                            Target MRR
                          </p>
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <EmptyState
                    icon={Users}
                    title="No active partners yet"
                    text="Approve accommodation partner pages or move booking partners to active."
                  />
                )}
              </div>
            </section>
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

function ValueCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-[2.25rem] bg-white p-5 shadow-xl">
      <Icon className="h-7 w-7 text-emerald-700" />
      <p className="mt-5 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
        {helper}
      </p>
    </article>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
      <Icon className="mx-auto h-10 w-10 text-emerald-700" />
      <p className="mt-3 text-lg font-black">{title}</p>
      <p className="mt-2 text-sm font-bold text-stone-500">{text}</p>
    </div>
  );
}
