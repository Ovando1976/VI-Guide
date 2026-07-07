import { FormEvent, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarDays,
  Car,
  CheckCircle2,
  Compass,
  ExternalLink,
  Hotel,
  Mail,
  Map,
  MapPin,
  Phone,
  Ship,
  Sparkles,
  Star,
  Users,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  enrichedCustomerBookingCatalog,
  type CustomerBookingCategory,
  type CustomerBookingRecord,
} from "../data/customerBookingCatalog";
import { generatedCustomerBookingCatalog } from "../data/customerBookingCatalog.generated";
import {
  accommodationSlug,
  saveAccommodationMapFocus,
  saveAccommodationToTripPlan,
} from "../lib/accommodations/customerAccommodationActions";

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
  phone: string;
  email: string;
  website: string;
  status: BookingPartnerStatus;
  bookingOffer: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";
const BOOKING_REQUESTS_KEY = "viNavigatorDirectBookingRequests";

const categoryMeta: Record<
  CustomerBookingCategory,
  {
    label: string;
    icon: LucideIcon;
  }
> = {
  hotel: { label: "Hotel", icon: Hotel },
  resort: { label: "Resort", icon: Building2 },
  villa: { label: "Villa", icon: BedDouble },
  airbnb_operator: { label: "Vacation Rental", icon: BedDouble },
  boat_charter: { label: "Boat Charter", icon: Ship },
  tour_operator: { label: "Tour", icon: Compass },
  excursion_company: { label: "Excursion", icon: Waves },
};

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

function partnerToRecord(partner: BookingPartner): CustomerBookingRecord {
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
    image: "/images/accommodations/_pending/hero.svg",
    imageAlt: `${partner.businessName} accommodation image`,
    imageSourceName: "Partner listing",
    imageSourceUrl: partner.website,
    imageStatus: "partner_supplied",
    website: partner.website,
    phone: partner.phone,
    sourceName: "VI Guide active partner listing",
    sourceUrl: partner.website,
    lastVerified: new Date().toISOString().slice(0, 10),
    inventoryScope: "single_property",
    verificationStatus: "partner_confirmed",
  };
}

export default function CustomerAccommodationDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const recordSlug = location.pathname.split("/").filter(Boolean).at(-1) || "";

  const records = useMemo<CustomerBookingRecord[]>(() => {
    const partnerRecords = safeReadPartners()
      .filter((partner) => ["active_partner", "won", "pilot"].includes(partner.status))
      .map(partnerToRecord);

    const combined: CustomerBookingRecord[] = [
      ...partnerRecords,
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
  }, []);

  const record = records.find(
    (item) => item.id === recordSlug || slug(item.businessName) === recordSlug
  );

  const [requests, setRequests] = useState<BookingRequest[]>(() => safeReadRequests());
  const [guestName, setGuestName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dates, setDates] = useState("");
  const [partySize, setPartySize] = useState("");
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState(record ? `I am interested in ${record.businessName}.` : "");
  const [saved, setSaved] = useState(false);
  const [planned, setPlanned] = useState(false);

  if (!record) {
    return (
      <main className="min-h-screen bg-[#f8f0da] px-5 py-10 text-ink">
        <section className="mx-auto max-w-3xl rounded-[2.5rem] bg-white p-8 text-center shadow-xl">
          <Hotel className="mx-auto h-12 w-12 text-emerald-700" />
          <h1 className="mt-4 text-3xl font-black">Accommodation not found</h1>
          <p className="mt-2 text-sm font-bold text-stone-500">
            This stay may have been removed from the catalog.
          </p>
          <button
            type="button"
            onClick={() => navigate("/hotels")}
            className="mt-6 rounded-2xl bg-turquoise px-6 py-4 text-sm font-black text-ink"
          >
            Back to Stays
          </button>
        </section>
      </main>
    );
  }

  const meta = categoryMeta[record.category];
  const Icon = meta.icon;

  const relatedRecords = records
    .filter((item) => item.id !== record.id)
    .filter(
      (item) =>
        item.island === record.island ||
        item.category === record.category
    )
    .slice(0, 4);

  const addToPlan = () => {
    saveAccommodationToTripPlan(record);
    setPlanned(true);
    window.setTimeout(() => setPlanned(false), 1600);
  };

  const openMap = () => {
    saveAccommodationMapFocus(record);
    navigate("/map");
  };

  const submitInquiry = (event: FormEvent) => {
    event.preventDefault();

    const request: BookingRequest = {
      id: `customer-booking-${Date.now()}`,
      category: record.category,
      guestName: guestName.trim() || "Guest inquiry",
      phone: phone.trim(),
      email: email.trim(),
      island: record.island,
      preferredArea: `${record.businessName} · ${record.area}`,
      dates: dates.trim(),
      partySize: partySize.trim(),
      budget: budget.trim(),
      notes: notes.trim(),
      requestedPartnerId: record.id,
      requestedPartnerName: record.businessName,
      createdAt: new Date().toISOString(),
    };

    const next = [request, ...requests].slice(0, 500);
    setRequests(next);
    safeWriteRequests(next);

    setSaved(true);
    setGuestName("");
    setPhone("");
    setEmail("");
    setDates("");
    setPartySize("");
    setBudget("");
    setNotes(`I am interested in ${record.businessName}.`);

    window.setTimeout(() => setSaved(false), 1800);
  };

  const imageBadge =
    record.imageStatus === "verified"
      ? "Verified photo"
      : record.imageStatus === "partner_supplied"
        ? "Partner photo"
        : record.imageStatus === "official_public_candidate"
          ? "Official photo"
          : "Image pending";

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="relative min-h-[72vh] overflow-hidden bg-ink text-white">
        <img
          src={record.image}
          alt={record.imageAlt || `${record.businessName} accommodation image`}
          className="absolute inset-0 h-full w-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/20 to-[#f8f0da]" />

        <div className="relative z-10 mx-auto flex min-h-[72vh] max-w-7xl flex-col justify-between px-5 py-8">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigate("/hotels")}
              className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-ink shadow-xl backdrop-blur active:scale-95"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => navigate("/mobility")}
                className="rounded-full bg-white/90 px-5 py-4 text-sm font-black text-ink shadow-xl active:scale-95"
              >
                Ride
              </button>
              <button
                type="button"
                onClick={openMap}
                className="grid h-14 w-14 place-items-center rounded-full bg-white/90 text-ink shadow-xl active:scale-95"
              >
                <Map className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="max-w-5xl pb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
              <Icon className="h-4 w-4" />
              {meta.label}
            </div>

            <h1 className="mt-6 max-w-4xl font-serif text-5xl italic leading-none md:text-7xl">
              {record.businessName}
            </h1>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-white/85">
              <span className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-300 text-yellow-300" />
                Booking inquiry
              </span>
              <span className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-turquoise" />
                {record.island}
              </span>
              <span>{record.area}</span>
            </div>

            <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-white/90">
              {record.headline}
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 mx-auto -mt-10 max-w-5xl px-4">
        <div className="grid grid-cols-3 gap-3 rounded-[2rem] bg-white/90 p-3 shadow-2xl backdrop-blur">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: window.innerHeight * 0.7, behavior: "smooth" })}
            className="rounded-2xl bg-stone-100 px-4 py-4 text-sm font-black text-ink active:scale-95"
          >
            Details
          </button>

          <button
            type="button"
            onClick={addToPlan}
            className="rounded-2xl bg-emerald-950 px-4 py-4 text-sm font-black text-white active:scale-95"
          >
            {planned ? "Added" : "+ Plan"}
          </button>

          <button
            type="button"
            onClick={openMap}
            className="rounded-2xl bg-[#ffcf32] px-4 py-4 text-sm font-black text-ink active:scale-95"
          >
            Map
          </button>
        </div>
      </section>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 px-4 lg:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <section className="rounded-[2.5rem] bg-white p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-turquoise" />
              <p className="text-xs font-black uppercase tracking-[0.24em] text-stone-400">
                The experience
              </p>
            </div>

            <p className="mt-6 font-serif text-3xl italic leading-tight text-ink md:text-4xl">
              {record.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {record.bestFor.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-stone-100 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-stone-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <InfoCard icon={MapPin} label="Location" value={`${record.area}, ${record.island}`} />
            <InfoCard icon={Car} label="Mobility" value={record.mobilityNote} />
            <InfoCard icon={Sparkles} label="Image status" value={imageBadge} />
          </section>

          <section className="rounded-[2.5rem] bg-white p-6 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Booking note
            </p>
            <h2 className="mt-2 text-3xl font-black">{record.bookingOffer}</h2>
            <p className="mt-4 text-sm font-bold leading-7 text-stone-500">
              VI Guide connects the stay or experience inquiry with local trip planning,
              transportation, ferry timing, beach routing, tours, and partner follow-up.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {record.website ? (
                <a
                  href={record.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-4 text-sm font-black text-white active:scale-95"
                >
                  Official Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}

              {record.phone ? (
                <a
                  href={`tel:${record.phone}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-5 py-4 text-sm font-black text-ink active:scale-95"
                >
                  Call
                  <Phone className="h-4 w-4" />
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => navigate("/mobility")}
                className="inline-flex items-center gap-2 rounded-2xl bg-turquoise px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                Plan Ride
                <Car className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={openMap}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#ffcf32] px-5 py-4 text-sm font-black text-ink active:scale-95"
              >
                View Map
                <Map className="h-4 w-4" />
              </button>
            </div>
          </section>

          {relatedRecords.length ? (
            <section className="rounded-[2.5rem] bg-white p-6 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Related options
              </p>
              <h2 className="mt-2 text-3xl font-black">
                More stays and experiences
              </h2>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {relatedRecords.map((item) => {
                  const RelatedIcon = categoryMeta[item.category].icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(`/hotels/${accommodationSlug(item)}`)}
                      className="overflow-hidden rounded-[2rem] bg-stone-50 text-left shadow-sm active:scale-95"
                    >
                      <div className="h-32 bg-emerald-950">
                        <img
                          src={item.image}
                          alt={item.imageAlt || `${item.businessName} accommodation image`}
                          className="h-full w-full object-cover opacity-80"
                          loading="lazy"
                        />
                      </div>

                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                            <RelatedIcon className="h-5 w-5" />
                          </div>

                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                              {categoryMeta[item.category].label} · {item.island}
                            </p>
                            <p className="mt-1 text-lg font-black text-ink">
                              {item.businessName}
                            </p>
                            <p className="mt-1 text-xs font-bold text-stone-500">
                              {item.area}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <form onSubmit={submitInquiry} className="rounded-[2.5rem] bg-white p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Direct inquiry
            </p>
            <h2 className="mt-2 text-3xl font-black">Request this option</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
              Send your dates, group size, budget, and notes. This saves into the booking inbox flow.
            </p>

            <div className="mt-5 grid gap-3">
              <Field label="Name" value={guestName} onChange={setGuestName} icon={Users} />
              <Field label="Phone" value={phone} onChange={setPhone} icon={Phone} />
              <Field label="Email" value={email} onChange={setEmail} icon={Mail} type="email" />
              <Field label="Dates" value={dates} onChange={setDates} icon={CalendarDays} />
              <Field label="Guests" value={partySize} onChange={setPartySize} icon={Users} />
              <Field label="Budget" value={budget} onChange={setBudget} icon={BadgeDollarSign} />

              <label>
                <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Notes
                </span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="mt-2 min-h-28 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95"
            >
              {saved ? <CheckCircle2 className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
              {saved ? "Inquiry Sent" : "Send Booking Inquiry"}
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[2rem] bg-white p-5 shadow-xl">
      <Icon className="h-6 w-6 text-emerald-700" />
      <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-stone-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black leading-6 text-ink">{value}</p>
    </div>
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
