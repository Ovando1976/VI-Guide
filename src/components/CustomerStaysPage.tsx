import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Compass,
  Hotel,
  Mail,
  MapPin,
  Phone,
  Search,
  Ship,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type StayCategory =
  | "hotel"
  | "resort"
  | "villa"
  | "airbnb_operator"
  | "boat_charter"
  | "tour_operator"
  | "excursion_company";

type BookingPartnerStatus =
  | "target"
  | "contacted"
  | "demo_done"
  | "pilot"
  | "active_partner"
  | "won"
  | "paused";

type BookingPartner = {
  id: string;
  businessName: string;
  category: StayCategory;
  island: string;
  contactName: string;
  phone: string;
  email: string;
  website: string;
  status: BookingPartnerStatus;
  plan: string;
  bookingOffer: string;
  commission: string;
  monthlyValue: number;
  notes: string;
  nextFollowUp: string;
  createdAt: string;
  updatedAt: string;
};

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
  createdAt: string;
};

const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";
const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";

const categories: Record<
  StayCategory,
  {
    label: string;
    customerLabel: string;
    icon: LucideIcon;
    description: string;
  }
> = {
  hotel: {
    label: "Hotel",
    customerLabel: "Hotels",
    icon: Hotel,
    description: "Find hotel stays with local discovery, mobility, and concierge support.",
  },
  resort: {
    label: "Resort",
    customerLabel: "Resorts",
    icon: Building2,
    description: "Explore resort stays with nearby beaches, dining, tours, and transportation.",
  },
  villa: {
    label: "Villa",
    customerLabel: "Villas",
    icon: BedDouble,
    description: "Request villas and private stays by island, area, dates, and group size.",
  },
  airbnb_operator: {
    label: "Airbnb-Type Rental",
    customerLabel: "Airbnb-Style Rentals",
    icon: BedDouble,
    description: "Find vacation rental options with airport pickup and local planning help.",
  },
  boat_charter: {
    label: "Boat Charter",
    customerLabel: "Boat Charters",
    icon: Ship,
    description: "Request private boat days, snorkel trips, sunset cruises, and island hopping.",
  },
  tour_operator: {
    label: "Tour Operator",
    customerLabel: "Tours",
    icon: Compass,
    description: "Book tours, cultural experiences, historic sites, and island activities.",
  },
  excursion_company: {
    label: "Excursion",
    customerLabel: "Excursions",
    icon: Compass,
    description: "Plan experiences, pickups, routes, and activities around your stay.",
  },
};

const islands = ["St. Thomas", "St. John", "St. Croix", "Water Island"];

const demoPartners: BookingPartner[] = [
  {
    id: "demo-hotel-stt",
    businessName: "Featured St. Thomas Stay",
    category: "hotel",
    island: "St. Thomas",
    contactName: "Reservations",
    phone: "",
    email: "",
    website: "",
    status: "active_partner",
    plan: "",
    bookingOffer: "Hotel stay inquiry with airport pickup and beach day planning.",
    commission: "",
    monthlyValue: 0,
    notes: "Demo listing for customer-facing hotel discovery.",
    nextFollowUp: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-villa-stj",
    businessName: "Featured St. John Villa",
    category: "villa",
    island: "St. John",
    contactName: "Villa Manager",
    phone: "",
    email: "",
    website: "",
    status: "active_partner",
    plan: "",
    bookingOffer: "Villa inquiry with ferry guidance, Jeep rental planning, and beach itinerary.",
    commission: "",
    monthlyValue: 0,
    notes: "Demo listing for villa and vacation rental discovery.",
    nextFollowUp: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "demo-charter",
    businessName: "Private Boat Day Inquiry",
    category: "boat_charter",
    island: "St. Thomas",
    contactName: "Charter Desk",
    phone: "",
    email: "",
    website: "",
    status: "active_partner",
    plan: "",
    bookingOffer: "Private charter inquiry for snorkeling, island hopping, or sunset cruise.",
    commission: "",
    monthlyValue: 0,
    notes: "Demo listing for boat charter lead capture.",
    nextFollowUp: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function safeReadPartners(): BookingPartner[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(BOOKING_PARTNERS_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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

function categoryLabel(category: string) {
  return categories[category as StayCategory]?.customerLabel || "Direct Booking";
}

export default function CustomerStaysPage() {
  const navigate = useNavigate();

  const [partners] = useState<BookingPartner[]>(() => safeReadPartners());
  const [requests, setRequests] = useState<BookingRequest[]>(() => safeReadRequests());

  const [selectedCategory, setSelectedCategory] = useState<StayCategory | "all">("all");
  const [selectedIsland, setSelectedIsland] = useState("all");
  const [query, setQuery] = useState("");

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState<StayCategory>("hotel");
  const [island, setIsland] = useState("St. Thomas");
  const [preferredArea, setPreferredArea] = useState("");
  const [dates, setDates] = useState("");
  const [partySize, setPartySize] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);

  const activePartners = useMemo(() => {
    const realPartners = partners.filter((partner) =>
      ["active_partner", "won", "pilot"].includes(partner.status)
    );

    return realPartners.length ? realPartners : demoPartners;
  }, [partners]);

  const filteredPartners = useMemo(() => {
    const search = query.trim().toLowerCase();

    return activePartners.filter((partner) => {
      const matchesCategory =
        selectedCategory === "all" || partner.category === selectedCategory;
      const matchesIsland =
        selectedIsland === "all" || partner.island === selectedIsland;
      const matchesSearch =
        !search ||
        partner.businessName.toLowerCase().includes(search) ||
        partner.island.toLowerCase().includes(search) ||
        categoryLabel(partner.category).toLowerCase().includes(search) ||
        partner.bookingOffer.toLowerCase().includes(search);

      return matchesCategory && matchesIsland && matchesSearch;
    });
  }, [activePartners, query, selectedCategory, selectedIsland]);

  const submitInquiry = (event: FormEvent) => {
    event.preventDefault();

    const request: BookingRequest = {
      id: `customer-booking-${Date.now()}`,
      category: inquiryCategory,
      guestName: guestName.trim() || "Guest inquiry",
      phone: phone.trim(),
      email: email.trim(),
      island,
      preferredArea: preferredArea.trim(),
      dates: dates.trim(),
      partySize: partySize.trim(),
      budget: budget.trim(),
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [request, ...requests].slice(0, 500);
    setRequests(next);
    safeWriteRequests(next);

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

  const choosePartner = (partner: BookingPartner) => {
    setInquiryCategory(partner.category);
    setIsland(partner.island);
    setPreferredArea(partner.businessName);
    setNotes(`I am interested in ${partner.businessName}. ${partner.bookingOffer}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Sparkles className="h-4 w-4" />
                VI Guide Stays & Experiences
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Find stays, villas, charters, and island experiences.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Request hotels, resorts, villas, Airbnb-style rentals, boat
                charters, and tours with local guidance for transportation,
                areas, beaches, and trip planning.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/map")}
                  className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Explore Map
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/mobility")}
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  Request Ride
                </button>
              </div>
            </div>

            <form onSubmit={submitInquiry} className="rounded-[2rem] bg-white p-5 text-ink">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Direct inquiry
              </p>
              <h2 className="mt-2 text-3xl font-black">Tell us what you need</h2>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <Field label="Name" value={guestName} onChange={setGuestName} icon={Users} />
                <Field label="Phone" value={phone} onChange={setPhone} icon={Phone} />
                <Field label="Email" value={email} onChange={setEmail} icon={Mail} type="email" />

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Looking for
                  </span>
                  <select
                    value={inquiryCategory}
                    onChange={(event) => setInquiryCategory(event.target.value as StayCategory)}
                    className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-black outline-none focus:border-emerald-700"
                  >
                    {(Object.keys(categories) as StayCategory[]).map((key) => (
                      <option key={key} value={key}>
                        {categories[key].customerLabel}
                      </option>
                    ))}
                  </select>
                </label>

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
                <Field label="Dates" value={dates} onChange={setDates} icon={CalendarDays} />
                <Field label="Guests" value={partySize} onChange={setPartySize} icon={Users} />
                <Field label="Budget" value={budget} onChange={setBudget} icon={BadgeDollarSign} />
              </div>

              <label className="mt-4 block">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Example: 4 adults, wants villa near Red Hook, boat charter for one day, needs pickup help..."
                  className="mt-2 min-h-24 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
                />
              </label>

              <button
                type="submit"
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95"
              >
                {saved ? <CheckCircle2 className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                {saved ? "Inquiry Sent" : "Send Booking Inquiry"}
              </button>
            </form>
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[330px_1fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Browse by type
              </p>

              <div className="mt-4 grid gap-2">
                <FilterButton
                  active={selectedCategory === "all"}
                  icon={Star}
                  label="All stays & experiences"
                  onClick={() => setSelectedCategory("all")}
                />

                {(Object.keys(categories) as StayCategory[]).map((key) => {
                  const item = categories[key];

                  return (
                    <FilterButton
                      key={key}
                      active={selectedCategory === key}
                      icon={item.icon}
                      label={item.customerLabel}
                      onClick={() => setSelectedCategory(key)}
                    />
                  );
                })}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <Car className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-2xl font-black">Need a ride?</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-white/70">
                Connect your stay, charter, or tour inquiry with airport,
                ferry, hotel, beach, and attraction transportation.
              </p>
              <button
                type="button"
                onClick={() => navigate("/mobility")}
                className="mt-5 w-full rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Open Mobility
              </button>
            </section>
          </aside>

          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Customer discovery
                  </p>
                  <h2 className="mt-2 text-3xl font-black">Featured booking options</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_160px]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search stays, charters, tours..."
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
                    />
                  </label>

                  <select
                    value={selectedIsland}
                    onChange={(event) => setSelectedIsland(event.target.value)}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                  >
                    <option value="all">All islands</option>
                    {islands.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {filteredPartners.map((partner) => {
                  const item = categories[partner.category];
                  const Icon = item.icon;

                  return (
                    <article
                      key={partner.id}
                      className="rounded-[2rem] bg-stone-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                          <Icon className="h-6 w-6" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                            {item.customerLabel} · {partner.island}
                          </p>
                          <h3 className="mt-1 text-2xl font-black">
                            {partner.businessName}
                          </h3>
                          <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
                            {partner.bookingOffer || item.description}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {partner.phone ? (
                          <a
                            href={`tel:${partner.phone}`}
                            className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-ink"
                          >
                            Call
                          </a>
                        ) : null}
                        {partner.website ? (
                          <a
                            href={partner.website}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-ink"
                          >
                            Website
                          </a>
                        ) : null}
                      </div>

                      <button
                        type="button"
                        onClick={() => choosePartner(partner)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-turquoise px-4 py-3 text-sm font-black text-ink active:scale-95"
                      >
                        Request This Option
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function FilterButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black active:scale-95 ${
        active ? "bg-emerald-950 text-white" : "bg-stone-50 text-ink hover:bg-stone-100"
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? "text-turquoise" : "text-emerald-700"}`} />
      {label}
    </button>
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
