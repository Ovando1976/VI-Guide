import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Anchor,
  ArrowRight,
  BadgeDollarSign,
  BedDouble,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Clipboard,
  Compass,
  Hotel,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Ship,
  Sparkles,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type BookingPartnerCategory =
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
  category: BookingPartnerCategory;
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

const BOOKING_PARTNERS_KEY = "viNavigatorBookingPartners";

const statuses: { id: BookingPartnerStatus; label: string }[] = [
  { id: "target", label: "Target" },
  { id: "contacted", label: "Contacted" },
  { id: "demo_done", label: "Demo Done" },
  { id: "pilot", label: "Pilot" },
  { id: "active_partner", label: "Active Partner" },
  { id: "won", label: "Won" },
  { id: "paused", label: "Paused" },
];

const statusClass: Record<BookingPartnerStatus, string> = {
  target: "bg-stone-100 text-stone-700",
  contacted: "bg-blue-50 text-blue-800",
  demo_done: "bg-purple-50 text-purple-800",
  pilot: "bg-amber-50 text-amber-800",
  active_partner: "bg-turquoise text-ink",
  won: "bg-emerald-50 text-emerald-800",
  paused: "bg-red-50 text-red-800",
};

const categories: Record<
  BookingPartnerCategory,
  { label: string; icon: LucideIcon; defaultOffer: string; defaultPlan: string }
> = {
  hotel: {
    label: "Hotel",
    icon: Hotel,
    defaultOffer: "Direct booking inquiry + concierge mobility handoff",
    defaultPlan: "$199/mo + booking/referral upside",
  },
  resort: {
    label: "Resort",
    icon: Building2,
    defaultOffer: "Featured lodging placement + guest planning flow",
    defaultPlan: "$299/mo + preferred partner placement",
  },
  villa: {
    label: "Villa",
    icon: BedDouble,
    defaultOffer: "Villa inquiry capture + map placement",
    defaultPlan: "$99/mo + direct booking referral",
  },
  airbnb_operator: {
    label: "Airbnb-Type Operator",
    icon: BedDouble,
    defaultOffer: "Rental inquiry capture + airport/ride planning",
    defaultPlan: "$99/mo + lead fee",
  },
  boat_charter: {
    label: "Boat Charter",
    icon: Ship,
    defaultOffer: "Charter inquiry capture + visitor day-plan placement",
    defaultPlan: "$149/mo + charter referral",
  },
  tour_operator: {
    label: "Tour Operator",
    icon: Compass,
    defaultOffer: "Tour inquiry capture + itinerary saves",
    defaultPlan: "$99/mo + booking referral",
  },
  excursion_company: {
    label: "Excursion Company",
    icon: Anchor,
    defaultOffer: "Experience placement + ride/directions handoff",
    defaultPlan: "$99/mo + referral fee",
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

function safeWritePartners(partners: BookingPartner[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOOKING_PARTNERS_KEY, JSON.stringify(partners));
}

function statusLabel(status: BookingPartnerStatus) {
  return statuses.find((item) => item.id === status)?.label || status;
}

function categoryLabel(category: BookingPartnerCategory) {
  return categories[category]?.label || "Booking Partner";
}

function buildFollowUp(partner: BookingPartner) {
  return `Hi ${partner.contactName || "there"} — this is Ovando with VI Guide.

I wanted to follow up about adding ${partner.businessName} to our direct booking pilot.

The idea:
We are building a Virgin Islands visitor platform that helps hotels, villas, Airbnb-style rental operators, boat charters, tours, and excursions receive direct booking inquiries from visitors already using the map, itinerary, and mobility tools.

Proposed offer:
${partner.bookingOffer || categories[partner.category].defaultOffer}

Suggested partner model:
${partner.plan || categories[partner.category].defaultPlan}

Current status:
${statusLabel(partner.status)}

Next follow-up:
${partner.nextFollowUp || "Schedule a short demo and confirm pilot interest."}

Notes:
${partner.notes || "No notes yet."}

Demo links to show:
- Direct Booking: /direct-booking
- Meeting Mode: /meeting-mode
- Partner Directory: /partner-directory
- Map: /map`;
}

function currency(value: number) {
  return `$${Number(value || 0).toLocaleString()}`;
}

export default function BookingPartnersPage() {
  const navigate = useNavigate();

  const [partners, setPartners] = useState<BookingPartner[]>(() => safeReadPartners());
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingPartnerStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<BookingPartnerCategory | "all">("all");
  const [copiedId, setCopiedId] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState<BookingPartnerCategory>("hotel");
  const [island, setIsland] = useState("St. Thomas");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [plan, setPlan] = useState(categories.hotel.defaultPlan);
  const [bookingOffer, setBookingOffer] = useState(categories.hotel.defaultOffer);
  const [commission, setCommission] = useState("10% referral or agreed lead fee");
  const [monthlyValue, setMonthlyValue] = useState("149");
  const [notes, setNotes] = useState("");
  const [nextFollowUp, setNextFollowUp] = useState("");

  const rows = useMemo(() => {
    const search = query.trim().toLowerCase();

    return partners.filter((partner) => {
      const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || partner.category === categoryFilter;
      const matchesSearch =
        !search ||
        partner.businessName.toLowerCase().includes(search) ||
        partner.contactName.toLowerCase().includes(search) ||
        partner.island.toLowerCase().includes(search) ||
        categoryLabel(partner.category).toLowerCase().includes(search);

      return matchesStatus && matchesCategory && matchesSearch;
    });
  }, [categoryFilter, partners, query, statusFilter]);

  const stats = useMemo(() => {
    const open = partners.filter((partner) => !["won", "paused"].includes(partner.status));
    const pilots = partners.filter((partner) => partner.status === "pilot").length;
    const active = partners.filter((partner) =>
      ["active_partner", "won"].includes(partner.status)
    ).length;
    const potential = open.reduce((sum, partner) => sum + Number(partner.monthlyValue || 0), 0);
    const wonValue = partners
      .filter((partner) => partner.status === "won" || partner.status === "active_partner")
      .reduce((sum, partner) => sum + Number(partner.monthlyValue || 0), 0);

    return {
      total: partners.length,
      open: open.length,
      pilots,
      active,
      potential,
      wonValue,
    };
  }, [partners]);

  const syncPartners = (next: BookingPartner[]) => {
    setPartners(next);
    safeWritePartners(next);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();

    const now = new Date().toISOString();
    const newPartner: BookingPartner = {
      id: `booking-partner-${Date.now()}`,
      businessName: businessName.trim() || `${categoryLabel(category)} Prospect`,
      category,
      island,
      contactName: contactName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      status: "target",
      plan: plan.trim() || categories[category].defaultPlan,
      bookingOffer: bookingOffer.trim() || categories[category].defaultOffer,
      commission: commission.trim(),
      monthlyValue: Number(monthlyValue || 0),
      notes: notes.trim(),
      nextFollowUp: nextFollowUp.trim(),
      createdAt: now,
      updatedAt: now,
    };

    syncPartners([newPartner, ...partners].slice(0, 500));

    setBusinessName("");
    setContactName("");
    setPhone("");
    setEmail("");
    setWebsite("");
    setNotes("");
    setNextFollowUp("");
  };

  const updatePartner = <K extends keyof BookingPartner>(
    id: string,
    key: K,
    value: BookingPartner[K]
  ) => {
    const now = new Date().toISOString();
    const next = partners.map((partner) =>
      partner.id === id ? { ...partner, [key]: value, updatedAt: now } : partner
    );
    syncPartners(next);
  };

  const removePartner = (id: string) => {
    syncPartners(partners.filter((partner) => partner.id !== id));
  };

  const copyFollowUp = async (partner: BookingPartner) => {
    try {
      await navigator.clipboard.writeText(buildFollowUp(partner));
      setCopiedId(partner.id);
      window.setTimeout(() => setCopiedId(""), 1500);
    } catch {
      setCopiedId("");
    }
  };

  const changeCategory = (nextCategory: BookingPartnerCategory) => {
    setCategory(nextCategory);
    setPlan(categories[nextCategory].defaultPlan);
    setBookingOffer(categories[nextCategory].defaultOffer);
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <BedDouble className="h-4 w-4" />
                Booking Partner Pipeline
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Track every hotel, villa, rental, charter, and tour lead.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Use this when walking into lodging businesses, Airbnb-style
                operators, boat charter companies, and experience providers.
                Track the pitch, contact, offer, follow-up, and revenue model.
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
                onClick={() => navigate("/direct-booking")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Direct Booking
              </button>
              <button
                onClick={() => navigate("/meeting-mode")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Meeting Mode
              </button>
              <button
                onClick={() => navigate("/partner-onboarding")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Onboard Partner
              </button>
              <button
                onClick={() => navigate("/partner-directory")}
                className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white active:scale-95"
              >
                Directory
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-6">
            <HeroStat label="Targets" value={stats.total} icon={Users} />
            <HeroStat label="Open" value={stats.open} icon={Sparkles} />
            <HeroStat label="Pilots" value={stats.pilots} icon={CalendarCheck} />
            <HeroStat label="Active" value={stats.active} icon={CheckCircle2} />
            <HeroStat label="Open value" value={`${currency(stats.potential)}/mo`} icon={BadgeDollarSign} />
            <HeroStat label="Active value" value={`${currency(stats.wonValue)}/mo`} icon={Store} />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[390px_1fr]">
          <aside className="space-y-5">
            <form onSubmit={submit} className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                  <Plus className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Add walk-in target
                  </p>
                  <h2 className="text-2xl font-black">Booking partner</h2>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <Field label="Business name" value={businessName} onChange={setBusinessName} icon={Building2} />

                <label>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Category
                  </span>
                  <select
                    value={category}
                    onChange={(event) => changeCategory(event.target.value as BookingPartnerCategory)}
                    className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-black outline-none focus:border-emerald-700"
                  >
                    {(Object.keys(categories) as BookingPartnerCategory[]).map((key) => (
                      <option key={key} value={key}>
                        {categories[key].label}
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

                <Field label="Contact name" value={contactName} onChange={setContactName} icon={Users} />
                <Field label="Phone" value={phone} onChange={setPhone} icon={Phone} />
                <Field label="Email" value={email} onChange={setEmail} icon={Mail} type="email" />
                <Field label="Website" value={website} onChange={setWebsite} icon={Store} />
                <Field label="Monthly value" value={monthlyValue} onChange={setMonthlyValue} icon={BadgeDollarSign} type="number" />
                <Field label="Commission / referral" value={commission} onChange={setCommission} icon={BadgeDollarSign} />
                <Field label="Plan" value={plan} onChange={setPlan} icon={Clipboard} />
                <Field label="Booking offer" value={bookingOffer} onChange={setBookingOffer} icon={Sparkles} />
                <Field label="Next follow-up" value={nextFollowUp} onChange={setNextFollowUp} icon={CalendarCheck} />

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
                Add Booking Partner
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          </aside>

          <div className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                    Walk-in sales board
                  </p>
                  <h2 className="mt-2 text-3xl font-black">Booking partner targets</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
                  <label className="relative block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search partners..."
                      className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-11 pr-4 text-sm font-bold outline-none focus:border-emerald-700"
                    />
                  </label>

                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as BookingPartnerStatus | "all")}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                  >
                    <option value="all">All statuses</option>
                    {statuses.map((status) => (
                      <option key={status.id} value={status.id}>
                        {status.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value as BookingPartnerCategory | "all")}
                    className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                  >
                    <option value="all">All categories</option>
                    {(Object.keys(categories) as BookingPartnerCategory[]).map((key) => (
                      <option key={key} value={key}>
                        {categories[key].label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {rows.length === 0 ? (
                  <div className="rounded-[2rem] bg-stone-50 p-8 text-center">
                    <BedDouble className="mx-auto h-9 w-9 text-emerald-700" />
                    <p className="mt-3 text-lg font-black">No booking partners yet</p>
                    <p className="mt-1 text-sm font-bold text-stone-500">
                      Add the first hotel, villa, Airbnb operator, boat charter, or tour company.
                    </p>
                  </div>
                ) : (
                  rows.map((partner) => {
                    const CategoryIcon = categories[partner.category].icon;

                    return (
                      <article key={partner.id} className="rounded-[2rem] bg-stone-50 p-4">
                        <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
                          <div>
                            <div className="flex flex-col gap-4 md:flex-row md:items-start">
                              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-950 text-turquoise">
                                <CategoryIcon className="h-7 w-7" />
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap gap-2">
                                  <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClass[partner.status]}`}>
                                    {statusLabel(partner.status)}
                                  </span>
                                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                    {categoryLabel(partner.category)} · {partner.island}
                                  </span>
                                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                                    {currency(partner.monthlyValue)}/mo
                                  </span>
                                </div>

                                <h3 className="mt-3 text-2xl font-black">{partner.businessName}</h3>

                                <div className="mt-2 flex flex-wrap gap-2 text-xs font-black text-stone-500">
                                  {partner.contactName ? <span>{partner.contactName}</span> : null}
                                  {partner.phone ? <span>· {partner.phone}</span> : null}
                                  {partner.email ? <span>· {partner.email}</span> : null}
                                </div>

                                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                                  <InfoCard title="Offer" text={partner.bookingOffer} />
                                  <InfoCard title="Plan / Commission" text={`${partner.plan} · ${partner.commission}`} />
                                </div>

                                <p className="mt-3 rounded-2xl bg-white p-4 text-sm font-bold leading-6 text-stone-600">
                                  {partner.notes || "No notes yet."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <select
                              value={partner.status}
                              onChange={(event) =>
                                updatePartner(partner.id, "status", event.target.value as BookingPartnerStatus)
                              }
                              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                            >
                              {statuses.map((status) => (
                                <option key={status.id} value={status.id}>
                                  {status.label}
                                </option>
                              ))}
                            </select>

                            <input
                              value={partner.nextFollowUp}
                              onChange={(event) =>
                                updatePartner(partner.id, "nextFollowUp", event.target.value)
                              }
                              placeholder="Next follow-up"
                              className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold outline-none focus:border-emerald-700"
                            />

                            <textarea
                              value={partner.notes}
                              onChange={(event) => updatePartner(partner.id, "notes", event.target.value)}
                              placeholder="Notes"
                              className="min-h-24 w-full rounded-2xl border border-stone-200 bg-white p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <a
                                href={partner.phone ? `tel:${partner.phone}` : undefined}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                              >
                                <Phone className="h-4 w-4" />
                                Call
                              </a>

                              <a
                                href={
                                  partner.email
                                    ? `mailto:${partner.email}?subject=VI Guide Direct Booking Pilot&body=${encodeURIComponent(
                                        buildFollowUp(partner)
                                      )}`
                                    : undefined
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink active:scale-95"
                              >
                                <Mail className="h-4 w-4" />
                                Email
                              </a>
                            </div>

                            <button
                              type="button"
                              onClick={() => copyFollowUp(partner)}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
                            >
                              {copiedId === partner.id ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                <Clipboard className="h-4 w-4" />
                              )}
                              {copiedId === partner.id ? "Copied" : "Copy Follow-Up"}
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => navigate("/direct-booking")}
                                className="rounded-2xl bg-turquoise px-4 py-3 text-sm font-black text-ink active:scale-95"
                              >
                                Demo Booking
                              </button>

                              <button
                                type="button"
                                onClick={() => removePartner(partner.id)}
                                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 active:scale-95"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })
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

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-stone-400">
        {title}
      </p>
      <p className="mt-2 text-sm font-bold leading-6 text-stone-700">
        {text || "Not set yet."}
      </p>
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
      <p className="mt-4 truncate text-2xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </p>
    </div>
  );
}
