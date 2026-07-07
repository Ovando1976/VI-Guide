import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Clipboard,
  ClipboardList,
  Compass,
  Hotel,
  Mail,
  Map,
  MapPin,
  Phone,
  Plane,
  Rocket,
  Search,
  Ship,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createMerchantLead } from "../lib/firestore/merchantLeads";

type BookingCategory = "hotel" | "vacation_rental" | "boat_charter" | "tour";

type BookingRequest = {
  id: string;
  category: BookingCategory;
  guestName: string;
  phone: string;
  email: string;
  island: string;
  preferredArea: string;
  dates: string;
  partySize: string;
  budget: string;
  notes: string;
  createdAt: string;
};

const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";

const categories: Record<
  BookingCategory,
  {
    label: string;
    icon: LucideIcon;
    headline: string;
    pitch: string;
    partnerPitch: string[];
    visitorNeed: string[];
  }
> = {
  hotel: {
    label: "Hotels & Resorts",
    icon: Hotel,
    headline: "Send hotels qualified guest inquiries.",
    pitch:
      "Visitors already using the map and mobility tools can request rooms, packages, concierge help, and transportation support.",
    partnerPitch: [
      "Direct booking inquiry capture",
      "Guest intent from map and trip planning",
      "Concierge-ready visitor context",
      "Ride handoff from hotel to destination",
      "Partner listing and featured placement",
    ],
    visitorNeed: [
      "Where should I stay?",
      "How do I get around?",
      "What is near the property?",
      "Can someone help me plan the trip?",
    ],
  },
  vacation_rental: {
    label: "Villas / Airbnb-Type Rentals",
    icon: BedDouble,
    headline: "Give villas and short-term rentals a direct inquiry channel.",
    pitch:
      "Vacation rental hosts can receive direct guest inquiries with island, dates, party size, area preference, and transportation needs.",
    partnerPitch: [
      "Direct inquiry form for villas and rentals",
      "Map placement near beaches and attractions",
      "Transportation handoff for guests",
      "Local experience recommendations",
      "Partner directory listing",
    ],
    visitorNeed: [
      "Which area should I book?",
      "Is this close to beaches or town?",
      "How will I get from the airport?",
      "Can I plan activities nearby?",
    ],
  },
  boat_charter: {
    label: "Boat Charters",
    icon: Ship,
    headline: "Turn visitor trip planning into charter inquiries.",
    pitch:
      "Boat companies can capture visitors looking for private charters, island hopping, snorkel trips, sunset cruises, and group outings.",
    partnerPitch: [
      "Charter inquiry capture",
      "Party size and date preference",
      "Featured offer placement",
      "Pickup and meeting point clarity",
      "Map-to-booking conversion",
    ],
    visitorNeed: [
      "Can we book a boat day?",
      "Where do we meet?",
      "How many people can go?",
      "Can we connect this to our hotel or taxi pickup?",
    ],
  },
  tour: {
    label: "Tours & Experiences",
    icon: Compass,
    headline: "Send tour operators visitors ready to book.",
    pitch:
      "Tour and experience operators can receive inquiries from visitors already exploring attractions, beaches, historic sites, and day plans.",
    partnerPitch: [
      "Tour inquiry capture",
      "Day-plan saves",
      "Directions and ride handoff",
      "Featured experience placement",
      "Partner proof dashboard",
    ],
    visitorNeed: [
      "What should we do today?",
      "How do we get there?",
      "Can we book it fast?",
      "What fits our schedule?",
    ],
  },
};

const islands = ["St. Thomas", "St. John", "St. Croix", "Water Island"];

function safeReadRequests(): BookingRequest[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKING_REQUESTS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWriteRequests(requests: BookingRequest[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOOKING_REQUESTS_KEY, JSON.stringify(requests));
}

function categoryLabel(category: BookingCategory) {
  return categories[category]?.label || "Direct Booking";
}

function buildPartnerPitch(category: BookingCategory) {
  const item = categories[category];

  return `VI Guide Direct Booking Flow

Category: ${item.label}

The pitch:
${item.pitch}

What partners get:
- ${item.partnerPitch.join("\n- ")}

Why it matters:
Visitors are already using the map, trip planning, and mobility tools. Direct booking lets hotels, villas, boat charters, and experience operators receive qualified inquiries instead of only passive listing views.

Suggested offer:
Join the first territory-wide direct booking pilot.`;
}

export default function DirectBookingHub() {
  const navigate = useNavigate();

  const [category, setCategory] = useState<BookingCategory>("hotel");
  const [requests, setRequests] = useState<BookingRequest[]>(() => safeReadRequests());
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [island, setIsland] = useState("St. Thomas");
  const [preferredArea, setPreferredArea] = useState("");
  const [dates, setDates] = useState("");
  const [partySize, setPartySize] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const active = categories[category];
  const ActiveIcon = active.icon;

  const stats = useMemo(() => {
    const activeRequests = requests.filter((request) => request.category === category);
    return {
      total: requests.length,
      currentCategory: activeRequests.length,
      lodging: requests.filter(
        (request) => request.category === "hotel" || request.category === "vacation_rental"
      ).length,
      charters: requests.filter((request) => request.category === "boat_charter").length,
    };
  }, [category, requests]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const now = new Date().toISOString();

    const request: BookingRequest = {
      id: `booking-${Date.now()}`,
      category,
      guestName: guestName.trim() || "Guest inquiry",
      phone: phone.trim(),
      email: email.trim(),
      island,
      preferredArea: preferredArea.trim(),
      dates: dates.trim(),
      partySize: partySize.trim(),
      budget: budget.trim(),
      notes: notes.trim(),
      createdAt: now,
    };

    const next = [request, ...requests].slice(0, 300);
    setRequests(next);
    safeWriteRequests(next);

    try {
      await createMerchantLead({
        partnerId: `direct-booking-${category}`,
        partnerName: categoryLabel(category),
        action: "direct_booking_request" as any,
        source: "direct_booking_hub",
        visitorName: request.guestName,
        visitorPhone: request.phone,
        visitorEmail: request.email,
        message: `Direct booking inquiry for ${categoryLabel(category)}. Island: ${request.island}. Area: ${request.preferredArea}. Dates: ${request.dates}. Party: ${request.partySize}. Budget: ${request.budget}. Notes: ${request.notes}`,
        category: request.category,
        bookingRequest: request,
        localEventId: request.id,
      } as any);
    } catch (error) {
      console.warn("Direct booking Firestore write failed; saved locally.", error);
    }

    setSaved(true);
    setGuestName("");
    setPhone("");
    setEmail("");
    setPreferredArea("");
    setDates("");
    setPartySize("");
    setBudget("");
    setNotes("");

    window.setTimeout(() => setSaved(false), 1800);
  };

  const copyPitch = async () => {
    try {
      await navigator.clipboard.writeText(buildPartnerPitch(category));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <BadgeDollarSign className="h-4 w-4" />
                Direct Booking Engine
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Walk into hotels, villas, and boat charters with a booking flow.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                This page shows partners how VI Guide can capture direct booking
                inquiries from visitors already using the map, itinerary, and
                mobility tools.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:w-[430px]">
              <button
                onClick={() => navigate("/hotels")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Customer Page
              </button>

              <button
                onClick={() => navigate("/booking-partners")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Booking Partners
              </button>

              <button
                onClick={() => navigate("/partner-onboarding")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Onboard Partner
              </button>
              <button
                onClick={() => navigate("/partner-directory")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Directory
              </button>
              <button
                onClick={() => navigate("/meeting-mode")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Meeting Mode
              </button>
              <button
                onClick={() => navigate("/map")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Map
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <HeroStat label="Booking requests" value={stats.total} icon={ClipboardList} />
            <HeroStat label="Selected category" value={stats.currentCategory} icon={ActiveIcon} />
            <HeroStat label="Lodging leads" value={stats.lodging} icon={Hotel} />
            <HeroStat label="Charter leads" value={stats.charters} icon={Anchor} />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Partner type
              </p>

              <div className="mt-4 grid gap-2">
                {(Object.keys(categories) as BookingCategory[]).map((key) => {
                  const item = categories[key];
                  const Icon = item.icon;
                  const activeCategory = key === category;

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black active:scale-95 ${
                        activeCategory
                          ? "bg-emerald-950 text-white"
                          : "bg-stone-50 text-ink hover:bg-stone-100"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${activeCategory ? "text-turquoise" : "text-emerald-700"}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <ActiveIcon className="h-9 w-9 text-turquoise" />
              <h2 className="mt-4 text-3xl font-black">{active.label}</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                {active.pitch}
              </p>

              <button
                type="button"
                onClick={copyPitch}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                {copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Partner Pitch"}
              </button>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Sales story
              </p>
              <h2 className="mt-2 text-4xl font-black leading-tight">
                {active.headline}
              </h2>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <PitchList title="What partners get" items={active.partnerPitch} icon={Rocket} />
                <PitchList title="What visitors need" items={active.visitorNeed} icon={Search} />
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <form onSubmit={submit} className="rounded-[2.25rem] bg-white p-5 shadow-xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                  Visitor booking inquiry
                </p>
                <h2 className="mt-2 text-3xl font-black">Capture a direct request</h2>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <Field label="Guest name" value={guestName} onChange={setGuestName} icon={Users} />
                  <Field label="Phone" value={phone} onChange={setPhone} icon={Phone} />
                  <Field label="Email" value={email} onChange={setEmail} icon={Mail} type="email" />

                  <label>
                    <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                      Island
                    </span>
                    <select
                      value={island}
                      onChange={(event) => setIsland(event.target.value)}
                      className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-black outline-none focus:border-emerald-700"
                    >
                      {islands.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>

                  <Field label="Preferred area" value={preferredArea} onChange={setPreferredArea} icon={MapPin} />
                  <Field label="Dates / timing" value={dates} onChange={setDates} icon={CalendarDays} />
                  <Field label="Party size" value={partySize} onChange={setPartySize} icon={Users} />
                  <Field label="Budget / range" value={budget} onChange={setBudget} icon={BadgeDollarSign} />
                </div>

                <div className="mt-5">
                  <label className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Example: 6 guests, wants private boat day, staying near Red Hook, needs pickup guidance..."
                    className="mt-2 min-h-32 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95"
                >
                  {saved ? <CheckCircle2 className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                  {saved ? "Request Saved" : "Save Direct Booking Request"}
                </button>
              </form>

              <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
                <Sparkles className="h-9 w-9 text-turquoise" />
                <h2 className="mt-4 text-3xl font-black">Walk-in pitch</h2>
                <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                  We are building a territory-wide visitor platform. Your business
                  can receive direct booking inquiries from people already planning
                  where to stay, what to do, and how to get around.
                </p>

                <div className="mt-5 grid gap-3">
                  <Step icon={Map} title="Visitor discovers" text="They find places on the VI Guide map." />
                  <Step icon={Plane} title="Visitor plans" text="They choose dates, group size, area, and needs." />
                  <Step icon={Car} title="Mobility connects" text="Ride request and pickup context can connect to the booking." />
                  <Step icon={Store} title="Partner receives" text="The hotel, villa, boat, or tour partner gets the inquiry." />
                </div>
              </section>
            </section>

            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Recent direct booking requests
                  </p>
                  <h2 className="mt-2 text-3xl font-black">Inquiry board</h2>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/partner-pipeline")}
                  className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Partner Pipeline
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {requests.length === 0 ? (
                  <div className="rounded-[2rem] bg-stone-50 p-6 text-center">
                    <ClipboardList className="mx-auto h-8 w-8 text-emerald-700" />
                    <p className="mt-3 text-lg font-black">No booking requests yet</p>
                    <p className="mt-1 text-sm font-bold text-stone-500">
                      Save a direct booking inquiry to show partners how the flow works.
                    </p>
                  </div>
                ) : (
                  requests.slice(0, 8).map((request) => (
                    <article key={request.id} className="rounded-[1.75rem] bg-stone-50 p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                            {categoryLabel(request.category)} · {request.island}
                          </p>
                          <h3 className="mt-1 text-xl font-black">{request.guestName}</h3>
                          <p className="mt-1 text-sm font-bold text-stone-500">
                            {request.dates || "Dates TBD"} · {request.partySize || "Party TBD"} · {request.budget || "Budget TBD"}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          {request.phone ? (
                            <a
                              href={`tel:${request.phone}`}
                              className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-ink"
                            >
                              Call
                            </a>
                          ) : null}
                          {request.email ? (
                            <a
                              href={`mailto:${request.email}`}
                              className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-ink"
                            >
                              Email
                            </a>
                          ) : null}
                        </div>
                      </div>

                      <p className="mt-3 text-sm font-bold leading-6 text-stone-600">
                        {request.notes || "No notes added."}
                      </p>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  icon: Icon,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon: LucideIcon;
  type?: string;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 py-4 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
        />
      </div>
    </label>
  );
}

function PitchList({
  title,
  items,
  icon: Icon,
}: {
  title: string;
  items: string[];
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[1.75rem] bg-stone-50 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-lg font-black">{title}</p>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <p className="text-sm font-bold leading-6 text-stone-700">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step({
  icon: Icon,
  title,
  text,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-turquoise text-ink">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-black">{title}</h3>
          <p className="mt-1 text-sm font-bold leading-6 text-white/60">{text}</p>
        </div>
      </div>
    </div>
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
      <p className="mt-4 truncate text-3xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
