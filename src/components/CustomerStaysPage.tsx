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
  Waves,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
  enrichedCustomerBookingCatalog,
  type CustomerBookingCategory,
  type CustomerBookingRecord,
} from "../data/customerBookingCatalog";
import { generatedCustomerBookingCatalog } from "../data/customerBookingCatalog.generated";

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
  category: CustomerBookingCategory;
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
  requestedPartnerId?: string;
  requestedPartnerName?: string;
  createdAt: string;
};

const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";
const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";

const categoryMeta: Record<
  CustomerBookingCategory,
  {
    label: string;
    customerLabel: string;
    icon: LucideIcon;
    short: string;
  }
> = {
  hotel: {
    label: "Hotel",
    customerLabel: "Hotels",
    icon: Hotel,
    short: "Hotels with local planning and transportation help.",
  },
  resort: {
    label: "Resort",
    customerLabel: "Resorts",
    icon: Building2,
    short: "Full-service stays, beaches, dining, and concierge support.",
  },
  villa: {
    label: "Villa",
    customerLabel: "Villas",
    icon: BedDouble,
    short: "Private villas for families, groups, and longer stays.",
  },
  airbnb_operator: {
    label: "Airbnb-Style Rental",
    customerLabel: "Airbnb-Style Rentals",
    icon: BedDouble,
    short: "Vacation rental inquiries with pickup and area guidance.",
  },
  boat_charter: {
    label: "Boat Charter",
    customerLabel: "Boat Charters",
    icon: Ship,
    short: "Private boat days, snorkel trips, and sunset cruises.",
  },
  tour_operator: {
    label: "Tour Operator",
    customerLabel: "Tours",
    icon: Compass,
    short: "Island tours, historical routes, beach days, and guided plans.",
  },
  excursion_company: {
    label: "Excursion",
    customerLabel: "Excursions",
    icon: Waves,
    short: "Water activities, family experiences, and custom island days.",
  },
};

const islands = ["St. Thomas", "St. John", "St. Croix", "Water Island"];

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

function partnerToCatalogRecord(partner: BookingPartner): CustomerBookingRecord {
  return {
    id: `partner-${partner.id}`,
    businessName: partner.businessName,
    category: partner.category,
    island: partner.island as CustomerBookingRecord["island"],
    area: partner.island,
    headline: partner.bookingOffer || `${partner.businessName} direct booking inquiry`,
    description:
      partner.notes ||
      "Active VI Guide booking partner. Request details, availability guidance, and travel coordination.",
    bestFor: ["Direct booking", "Local planning", "Transportation help"],
    bookingOffer: partner.bookingOffer || "Request booking information and local travel help.",
    mobilityNote: "Can connect with airport, ferry, hotel, beach, and attraction transportation.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    website: partner.website,
    phone: partner.phone,
    verificationStatus: "partner_confirmed",
  };
}

function categoryLabel(category: string) {
  return categoryMeta[category as CustomerBookingCategory]?.customerLabel || "Booking";
}

export default function CustomerStaysPage() {
  const navigate = useNavigate();

  const [partners] = useState<BookingPartner[]>(() => safeReadPartners());
  const [requests, setRequests] = useState<BookingRequest[]>(() => safeReadRequests());

  const [selectedCategory, setSelectedCategory] = useState<CustomerBookingCategory | "all">("all");
  const [selectedIsland, setSelectedIsland] = useState("all");
  const [query, setQuery] = useState("");

  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [inquiryCategory, setInquiryCategory] = useState<CustomerBookingCategory>("hotel");
  const [island, setIsland] = useState("St. Thomas");
  const [preferredArea, setPreferredArea] = useState("");
  const [dates, setDates] = useState("");
  const [partySize, setPartySize] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [requestedPartner, setRequestedPartner] = useState<CustomerBookingRecord | null>(null);
  const [saved, setSaved] = useState(false);

  const records = useMemo<CustomerBookingRecord[]>(() => {
    const activePartnerRecords = partners
      .filter((partner) => ["active_partner", "won", "pilot"].includes(partner.status))
      .map(partnerToCatalogRecord);

    const combined: CustomerBookingRecord[] = [...activePartnerRecords, ...generatedCustomerBookingCatalog, ...enrichedCustomerBookingCatalog];
    const seen = new Set<string>();

    return combined.filter((record) => {
      const key = `${record.category}-${record.island}-${record.businessName}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [partners]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: records.length };

    for (const record of records) {
      counts[record.category] = (counts[record.category] || 0) + 1;
    }

    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const search = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesCategory =
        selectedCategory === "all" || record.category === selectedCategory;
      const matchesIsland = selectedIsland === "all" || record.island === selectedIsland;
      const matchesSearch =
        !search ||
        record.businessName.toLowerCase().includes(search) ||
        record.area.toLowerCase().includes(search) ||
        record.island.toLowerCase().includes(search) ||
        record.headline.toLowerCase().includes(search) ||
        record.description.toLowerCase().includes(search) ||
        record.bestFor.join(" ").toLowerCase().includes(search);

      return matchesCategory && matchesIsland && matchesSearch;
    });
  }, [query, records, selectedCategory, selectedIsland]);

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
      requestedPartnerId: requestedPartner?.id,
      requestedPartnerName: requestedPartner?.businessName,
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
    setRequestedPartner(null);

    window.setTimeout(() => setSaved(false), 1800);
  };

  const chooseRecord = (record: CustomerBookingRecord) => {
    setRequestedPartner(record);
    setInquiryCategory(record.category);
    setIsland(record.island);
    setPreferredArea(`${record.businessName} · ${record.area}`);
    setNotes(`I am interested in ${record.businessName}. ${record.bookingOffer}`);
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
                Browse production-ready lodging and experience options across
                the Virgin Islands, then send one direct inquiry with your dates,
                group size, island, budget, and transportation needs.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <HeroMini label="Options" value={records.length} />
                <HeroMini label="Islands" value="4" />
                <HeroMini label="Inquiry" value="Direct" />
              </div>

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

              {requestedPartner ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    Selected option
                  </p>
                  <p className="mt-1 text-lg font-black">{requestedPartner.businessName}</p>
                  <p className="mt-1 text-sm font-bold text-stone-600">
                    {requestedPartner.area} · {requestedPartner.island}
                  </p>
                </div>
              ) : null}

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
                    onChange={(event) =>
                      setInquiryCategory(event.target.value as CustomerBookingCategory)
                    }
                    className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-black outline-none focus:border-emerald-700"
                  >
                    {(Object.keys(categoryMeta) as CustomerBookingCategory[]).map((key) => (
                      <option key={key} value={key}>
                        {categoryMeta[key].customerLabel}
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

        <section className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
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
                  count={categoryCounts.all || 0}
                  onClick={() => setSelectedCategory("all")}
                />

                {(Object.keys(categoryMeta) as CustomerBookingCategory[]).map((key) => {
                  const item = categoryMeta[key];

                  return (
                    <FilterButton
                      key={key}
                      active={selectedCategory === key}
                      icon={item.icon}
                      label={item.customerLabel}
                      count={categoryCounts[key] || 0}
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

                <div className="grid gap-3 md:grid-cols-[1fr_170px]">
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

              {filteredRecords.length === 0 ? (
                <div className="mt-5 rounded-[2rem] bg-stone-50 p-8 text-center">
                  <Search className="mx-auto h-9 w-9 text-emerald-700" />
                  <p className="mt-3 text-lg font-black">No matches yet</p>
                  <p className="mt-1 text-sm font-bold text-stone-500">
                    Try all islands or all categories.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {filteredRecords.map((record) => {
                    const item = categoryMeta[record.category];
                    const Icon = item.icon;

                    return (
                      <article
                        key={record.id}
                        className="overflow-hidden rounded-[2rem] bg-stone-50 shadow-sm"
                      >
                        <div className="relative h-36 bg-emerald-950">
                          <img
                            src={record.image}
                            alt={record.imageAlt || `${record.businessName} accommodation image`}
                            className="h-full w-full object-cover opacity-70"
                            loading="lazy"
                          />
                          <div className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
                            {record.imageStatus === "verified"
                              ? "Verified photo"
                              : record.imageStatus === "partner_supplied"
                                ? "Partner photo"
                                : record.imageStatus === "official_public_candidate"
                                  ? "Official photo"
                                : record.verificationStatus === "partner_confirmed"
                                  ? "Partner"
                                  : "Image pending"}
                          </div>
                        </div>

                        <div className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                              <Icon className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                {item.customerLabel} · {record.island}
                              </p>
                              <h3 className="mt-1 text-2xl font-black">
                                {record.businessName}
                              </h3>
                              <p className="mt-1 text-xs font-black text-stone-500">
                                {record.area}
                              </p>
                            </div>
                          </div>

                          <p className="mt-4 text-sm font-bold leading-6 text-stone-700">
                            {record.headline}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {record.bestFor.slice(0, 4).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-stone-500"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          <p className="mt-3 text-sm font-bold leading-6 text-stone-500">
                            {record.mobilityNote}
                          </p>

                          <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {record.phone ? (
                              <a
                                href={`tel:${record.phone}`}
                                className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-black text-ink"
                              >
                                Call
                              </a>
                            ) : null}
                            {record.website ? (
                              <a
                                href={record.website}
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
                            onClick={() => chooseRecord(record)}
                            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-turquoise px-4 py-3 text-sm font-black text-ink active:scale-95"
                          >
                            Request This Option
                            <ArrowRight className="h-4 w-4" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.5rem] bg-white/10 p-4">
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  icon: Icon,
  label,
  count,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black active:scale-95 ${
        active ? "bg-emerald-950 text-white" : "bg-stone-50 text-ink hover:bg-stone-100"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className={`h-5 w-5 ${active ? "text-turquoise" : "text-emerald-700"}`} />
        {label}
      </span>

      <span
        className={`rounded-full px-2 py-1 text-[10px] ${
          active ? "bg-white/15 text-white" : "bg-white text-stone-500"
        }`}
      >
        {count}
      </span>
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
