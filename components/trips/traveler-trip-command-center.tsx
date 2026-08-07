"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BedDouble,
  CalendarDays,
  CheckCircle2,
  Compass,
  CreditCard,
  Map,
  Navigation,
  RefreshCw,
  Route,
  Sparkles,
  Users,
} from "lucide-react";

import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  TRACKED_BOOKINGS_UPDATED_EVENT,
  readTrackedBookings,
  type TrackedBooking,
} from "@/lib/booking/booking-tracker";
import {
  bookingHref,
  summarizeTravelerTrip,
  travelerBookingStatusLabel,
  type TravelerAdvisorTrip,
  type TravelerCommerceBooking,
  type TravelerStayRequest,
  type TravelerTripActionTone,
} from "@/lib/traveler-trip-command";

const ISLAND_LABELS = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

export function TravelerTripCommandCenter({
  travelerName,
  bookings,
  stayRequests,
  advisorTrips,
}: {
  travelerName?: string | null;
  bookings: TravelerCommerceBooking[];
  stayRequests: TravelerStayRequest[];
  advisorTrips: TravelerAdvisorTrip[];
}) {
  const router = useRouter();
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [trackedBookings, setTrackedBookings] = useState<TrackedBooking[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    function refreshLocalTrip() {
      setPlans(readJourneyPlans());
      setTrackedBookings(readTrackedBookings());
    }

    function handleStorage(event: StorageEvent) {
      if (
        !event.key ||
        event.key === "vi-guide.intelligence.saved-plans" ||
        event.key === "vi-guide.commerce-bookings.v1"
      ) {
        refreshLocalTrip();
      }
    }

    refreshLocalTrip();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshLocalTrip);
    window.addEventListener(TRACKED_BOOKINGS_UPDATED_EVENT, refreshLocalTrip);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refreshLocalTrip);
      window.removeEventListener(TRACKED_BOOKINGS_UPDATED_EVENT, refreshLocalTrip);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const journeyStopCount = useMemo(
    () => plans.reduce((total, plan) => total + plan.plan.length, 0),
    [plans],
  );
  const summary = useMemo(
    () =>
      summarizeTravelerTrip({
        bookings,
        advisorTrips,
        stayRequests,
        journeyPlanCount: plans.length,
        journeyStopCount,
      }),
    [advisorTrips, bookings, journeyStopCount, plans.length, stayRequests],
  );
  const accountReferences = useMemo(
    () => new Set(bookings.map((booking) => booking.reference)),
    [bookings],
  );
  const deviceOnlyBookings = trackedBookings.filter(
    (booking) => !accountReferences.has(booking.reference),
  );

  function refreshServerData() {
    setRefreshing(true);
    router.refresh();
    window.setTimeout(() => setRefreshing(false), 900);
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[34px] border border-white/70 bg-[#043331] text-white shadow-[0_28px_80px_rgba(4,51,49,.2)]">
        <div className="grid lg:grid-cols-[1.2fr_.8fr]">
          <div className="bg-[radial-gradient(circle_at_top_left,rgba(245,196,81,.24),transparent_36%),linear-gradient(145deg,#043331,#075e58)] p-6 sm:p-8 lg:p-10">
            <div className="text-[10px] font-black uppercase tracking-[.24em] text-[#f5c451]">
              My VI Guide Trip
            </div>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-5xl">
              {travelerName ? `${firstName(travelerName)}, your trip is connected.` : "Your trip is connected."}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/68">
              Itinerary, advisor plans, booking requests, payments, stays, rides, and Concierge now live in one traveler workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <QuickLink href="/planner" label="Open itinerary" icon={Route} />
              <QuickLink href="/map" label="Open map" icon={Map} />
              <QuickLink href="/mobility" label="Get a ride" icon={Navigation} />
              <QuickLink href="/concierge" label="Ask Concierge" icon={Sparkles} />
            </div>
          </div>

          <div className="bg-white p-5 text-[#043331] sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                  Next best action
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                  {summary.nextAction.label}
                </h2>
              </div>
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${toneClass(summary.nextAction.tone)}`}
              >
                {summary.nextAction.tone === "amber" ? (
                  <CreditCard className="h-5 w-5" />
                ) : summary.nextAction.tone === "rose" ? (
                  <Sparkles className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </span>
            </div>
            <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
              {summary.nextAction.detail}
            </p>
            <Link
              href={summary.nextAction.href}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#f5b942] px-5 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] transition hover:bg-[#ffca55]"
            >
              {summary.nextAction.cta}
            </Link>
            <button
              type="button"
              onClick={refreshServerData}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-slate-600"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh trip status
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Itinerary" value={String(plans.length)} detail={`${journeyStopCount} saved stops`} />
        <Metric label="Active bookings" value={String(summary.activeBookings)} detail="requests in motion" />
        <Metric
          label="Payment required"
          value={String(summary.paymentRequired)}
          detail={summary.paymentRequired ? "action needed" : "nothing due"}
          tone={summary.paymentRequired ? "amber" : "default"}
        />
        <Metric
          label="Confirmed"
          value={String(summary.confirmedBookings)}
          detail={summary.paidAmountCents ? `${formatMoney(summary.paidAmountCents)} paid` : "trip anchors"}
          tone="emerald"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <TripSection
          eyebrow="Itinerary"
          title="My Trip"
          actionHref="/planner"
          actionLabel="Open planner"
        >
          {plans.length ? (
            <div className="space-y-3">
              {plans.slice(0, 4).map((plan) => (
                <Link
                  key={plan.id}
                  href="/planner"
                  className="block rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4 transition hover:border-teal-500/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-black text-[#043331]">{plan.title}</p>
                      <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-teal-700" />
                        {formatDate(plan.date)} · {ISLAND_LABELS[plan.island]}
                      </p>
                    </div>
                    <StatusPill
                      label={`${plan.plan.length} ${plan.plan.length === 1 ? "stop" : "stops"}`}
                      tone={plan.status === "ready" ? "emerald" : "teal"}
                    />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Route}
              title="No itinerary saved yet"
              detail="Save places from Explore or ask Concierge to help build your first island day."
              href="/places"
              cta="Explore places"
            />
          )}
        </TripSection>

        <TripSection
          eyebrow="Bookings & payments"
          title="Reservations"
          actionHref="/bookings"
          actionLabel="Booking status"
        >
          {bookings.length ? (
            <div className="space-y-3">
              {bookings.slice(0, 6).map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : deviceOnlyBookings.length ? (
            <div className="space-y-3">
              <p className="text-xs font-semibold leading-5 text-slate-500">
                These bookings are remembered on this device. Open a booking to refresh its current server status.
              </p>
              {deviceOnlyBookings.slice(0, 4).map((booking) => (
                <Link
                  key={booking.reference}
                  href={bookingHref(booking.reference)}
                  className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4"
                >
                  <div>
                    <p className="font-black text-[#043331]">{booking.listingName}</p>
                    <p className="mt-1 font-mono text-[9px] font-bold text-slate-400">
                      {booking.reference}
                    </p>
                  </div>
                  <StatusPill label={travelerBookingStatusLabel(booking.status)} tone={bookingTone(booking.status)} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BadgeCheck}
              title="No connected bookings yet"
              detail="Bookable stays, tours, and experiences will appear here as soon as you submit a VI Guide request."
              href="/experiences"
              cta="Browse bookable experiences"
            />
          )}
        </TripSection>

        <TripSection
          eyebrow="Travel Advisor"
          title="Advisor planning"
          actionHref="/trip-planning"
          actionLabel="Plan with an advisor"
        >
          {advisorTrips.length ? (
            <div className="space-y-3">
              {advisorTrips.slice(0, 4).map((trip) => (
                <article
                  key={trip.id}
                  className="rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusPill label={advisorStatusLabel(trip.status)} tone={advisorTone(trip.status)} />
                    <span className="font-mono text-[9px] font-bold text-slate-400">{trip.reference}</span>
                  </div>
                  <h3 className="mt-3 font-black text-[#043331]">
                    {trip.proposalTitle || "USVI trip planning request"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {trip.arrival && trip.departure
                      ? `${formatDate(trip.arrival)} – ${formatDate(trip.departure)}`
                      : trip.island
                        ? ISLAND_LABELS[trip.island]
                        : "Virgin Islands planning"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {trip.proposalHref ? (
                      <Link
                        href={trip.proposalHref}
                        className="inline-flex min-h-9 items-center rounded-full bg-[#043331] px-3 text-[9px] font-black uppercase tracking-[.12em] text-white"
                      >
                        Review proposal
                      </Link>
                    ) : null}
                    <Link
                      href={`/concierge?prompt=${encodeURIComponent(`Help me continue planning request ${trip.reference}.`)}`}
                      className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-[.12em] text-[#043331]"
                    >
                      Ask Concierge
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="Want a human-guided plan?"
              detail="Send your dates, interests, pace, and budget into the Travel Advisor workflow without exposing personal information in the itinerary URL."
              href="/trip-planning"
              cta="Start trip planning"
            />
          )}
        </TripSection>

        <TripSection
          eyebrow="Stays"
          title="Accommodation requests"
          actionHref="/accommodations"
          actionLabel="Find a stay"
        >
          {stayRequests.length ? (
            <div className="space-y-3">
              {stayRequests.slice(0, 4).map((stay) => (
                <Link
                  key={stay.requestId}
                  href={`/accommodations/${encodeURIComponent(stay.staySlug)}`}
                  className="block rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-[#043331]">{stay.stayName}</p>
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-slate-500">
                        <CalendarDays className="h-3.5 w-3.5 text-teal-700" />
                        {formatDate(stay.checkIn)} – {formatDate(stay.checkOut)}
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Users className="h-3.5 w-3.5 text-teal-700" />
                        {stay.adults + stay.children} guests · {stay.rooms} {stay.rooms === 1 ? "room" : "rooms"}
                      </p>
                    </div>
                    <StatusPill label={stayStatusLabel(stay.status)} tone={stayTone(stay.status)} />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BedDouble}
              title="No separate stay requests"
              detail="Accommodation booking requests submitted through the unified booking flow appear in Reservations above."
              href="/accommodations"
              cta="Browse stays"
            />
          )}
        </TripSection>
      </div>

      <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">Trip tools</p>
            <h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#043331]">Move through VI Guide without losing context.</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <ToolLink href="/places" icon={Compass} label="Explore" detail="Discover the next stop" />
          <ToolLink href="/map" icon={Map} label="Living Map" detail="See trip context spatially" />
          <ToolLink href="/planner" icon={Route} label="Planner" detail="Edit the itinerary" />
          <ToolLink href="/mobility" icon={Navigation} label="Mobility" detail="Plan or request a ride" />
          <ToolLink href="/concierge" icon={Sparkles} label="Concierge" detail="Get local help" />
        </div>
      </section>
    </div>
  );
}

function BookingCard({ booking }: { booking: TravelerCommerceBooking }) {
  return (
    <Link
      href={bookingHref(booking.reference)}
      className="block rounded-[22px] border border-slate-200 bg-[#fbfaf6] p-4 transition hover:border-teal-500/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-black text-[#043331]">{booking.listingName}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {ISLAND_LABELS[booking.island]} · {formatDate(booking.startDate)}
            {booking.endDate ? ` – ${formatDate(booking.endDate)}` : ""}
          </p>
          <p className="mt-2 font-mono text-[9px] font-bold text-slate-400">{booking.reference}</p>
        </div>
        <StatusPill label={travelerBookingStatusLabel(booking.status)} tone={bookingTone(booking.status)} />
      </div>
      {booking.status === "payment_required" && booking.depositAmountCents > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-900">
          {formatMoney(booking.depositAmountCents)} deposit ready for secure checkout
        </div>
      ) : booking.paidAmountCents > 0 ? (
        <div className="mt-3 text-xs font-black text-emerald-700">
          {formatMoney(booking.paidAmountCents)} paid
        </div>
      ) : null}
    </Link>
  );
}

function TripSection({
  eyebrow,
  title,
  actionHref,
  actionLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  actionHref: string;
  actionLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">{eyebrow}</p>
          <h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#043331]">{title}</h2>
        </div>
        <Link
          href={actionHref}
          className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-slate-200 bg-[#fbfaf6] px-3 text-[9px] font-black uppercase tracking-[.12em] text-[#043331]"
        >
          {actionLabel}
        </Link>
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = "default",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "default" | "amber" | "emerald";
}) {
  return (
    <div className={`rounded-[24px] border p-5 ${metricClass(tone)}`}>
      <p className="text-[9px] font-black uppercase tracking-[.16em] opacity-65">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-.05em]">{value}</p>
      <p className="mt-1 text-xs font-bold opacity-65">{detail}</p>
    </div>
  );
}

function QuickLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Route }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-white/[.14]"
    >
      <Icon className="h-3.5 w-3.5 text-[#7ce0d4]" /> {label}
    </Link>
  );
}

function ToolLink({ href, icon: Icon, label, detail }: { href: string; icon: typeof Route; label: string; detail: string }) {
  return (
    <Link href={href} className="rounded-[20px] border border-slate-200 bg-[#fbfaf6] p-4 transition hover:border-teal-500/50">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-3 text-sm font-black text-[#043331]">{label}</p>
      <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">{detail}</p>
    </Link>
  );
}

function EmptyState({ icon: Icon, title, detail, href, cta }: { icon: typeof Route; title: string; detail: string; href: string; cta: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-slate-300 bg-[#fbfaf6] p-5">
      <Icon className="h-6 w-6 text-teal-700" />
      <p className="mt-3 text-sm font-black text-[#043331]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{detail}</p>
      <Link href={href} className="mt-4 inline-flex min-h-9 items-center rounded-full bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.12em] text-white">
        {cta}
      </Link>
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "neutral" | "teal" | "amber" | "emerald" | "rose" }) {
  const className =
    tone === "amber"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : tone === "emerald"
        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
        : tone === "rose"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : tone === "teal"
            ? "border-teal-200 bg-teal-50 text-teal-800"
            : "border-slate-200 bg-slate-100 text-slate-700";
  return <span className={`shrink-0 rounded-full border px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.1em] ${className}`}>{label}</span>;
}

function bookingTone(status: TravelerCommerceBooking["status"]): "neutral" | "teal" | "amber" | "emerald" | "rose" {
  if (status === "payment_required") return "amber";
  if (status === "confirmed" || status === "completed") return "emerald";
  if (status === "declined" || status === "cancelled") return "rose";
  if (status === "requested" || status === "reviewing" || status === "paid") return "teal";
  return "neutral";
}

function advisorStatusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function advisorTone(status: string): "neutral" | "teal" | "amber" | "emerald" | "rose" {
  if (status === "booked") return "emerald";
  if (status === "closed") return "neutral";
  if (status === "new") return "amber";
  return "teal";
}

function stayStatusLabel(status: string) {
  if (status === "pending_property_confirmation") return "Pending confirmation";
  if (status === "reviewing") return "Under review";
  if (status === "confirmed") return "Confirmed";
  if (status === "declined") return "Unavailable";
  if (status === "cancelled") return "Cancelled";
  return status.replaceAll("_", " ") || "Status unavailable";
}

function stayTone(status: string): "neutral" | "teal" | "amber" | "emerald" | "rose" {
  if (status === "pending_property_confirmation") return "amber";
  if (status === "reviewing") return "teal";
  if (status === "confirmed") return "emerald";
  if (status === "declined") return "rose";
  return "neutral";
}

function toneClass(tone: TravelerTripActionTone) {
  if (tone === "amber") return "bg-amber-50 text-amber-700";
  if (tone === "emerald") return "bg-emerald-50 text-emerald-700";
  if (tone === "rose") return "bg-rose-50 text-rose-700";
  return "bg-teal-50 text-teal-700";
}

function metricClass(tone: "default" | "amber" | "emerald") {
  if (tone === "amber") return "border-amber-200 bg-amber-50 text-amber-900";
  if (tone === "emerald") return "border-emerald-200 bg-emerald-50 text-emerald-900";
  return "border-slate-200 bg-white text-[#043331]";
}

function formatDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (!Number.isFinite(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function firstName(value: string) {
  return value.trim().split(/\s+/)[0]?.slice(0, 60) || "Traveler";
}
