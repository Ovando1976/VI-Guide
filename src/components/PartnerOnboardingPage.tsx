import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  Crown,
  Globe,
  Image,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Save,
  Sparkles,
  Store,
  Upload,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { createMerchantLead } from "../lib/firestore/merchantLeads";

type PartnerProspect = {
  id?: string;
  businessName?: string;
  contactName?: string;
  phone?: string;
  email?: string;
  tier?: string;
  planName?: string;
  planPrice?: number;
  notes?: string;
  prospect?: {
    placeName?: string;
    placeType?: string;
    total?: number;
    directions?: number;
    dayPlans?: number;
    rides?: number;
    taps?: number;
    estimatedValue?: number;
  } | null;
};

type PartnerListing = {
  id: string;
  businessName: string;
  category: string;
  plan: string;
  status: "draft" | "active" | "featured";
  phone: string;
  email: string;
  website: string;
  address: string;
  offer: string;
  description: string;
  contactName: string;
  createdAt: string;
  updatedAt: string;
};

const SELECTED_KEY = "viNavigatorSelectedPartnerOnboarding";
const LISTINGS_KEY = "viNavigatorPartnerListings";
const CLOSE_LEADS_KEY = "viNavigatorPartnerCloseLeads";

const planOptions = [
  { id: "starter", name: "Starter", price: "$49/mo", icon: Store },
  { id: "growth", name: "Growth", price: "$99/mo", icon: Rocket },
  { id: "pro", name: "Pro", price: "$199/mo", icon: Crown },
];

const statusOptions = [
  { id: "draft", name: "Draft", description: "Saved but not live yet." },
  { id: "active", name: "Active", description: "Visible as a claimed listing." },
  { id: "featured", name: "Featured", description: "Promoted placement on the map." },
] as const;

function safeReadJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "") as T;
  } catch {
    return fallback;
  }
}

function readSelectedProspect(): PartnerProspect | null {
  return safeReadJson<PartnerProspect | null>(SELECTED_KEY, null);
}

function readListings(): PartnerListing[] {
  return safeReadJson<PartnerListing[]>(LISTINGS_KEY, []);
}

function writeListings(listings: PartnerListing[]) {
  window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

function readCloseLeads(): PartnerProspect[] {
  return safeReadJson<PartnerProspect[]>(CLOSE_LEADS_KEY, []);
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function inferCategory(prospect: PartnerProspect | null) {
  const type = String(prospect?.prospect?.placeType || "").toLowerCase();

  if (type.includes("beach")) return "Beach / Attraction";
  if (type.includes("food") || type.includes("restaurant")) return "Restaurant / Food";
  if (type.includes("transport")) return "Transportation";
  if (type.includes("history")) return "Historic Site";
  if (type.includes("event")) return "Events";
  return "Local Business";
}

export default function PartnerOnboardingPage() {
  const navigate = useNavigate();

  const initialProspect = useMemo(() => readSelectedProspect(), []);
  const closeLeads = useMemo(() => readCloseLeads(), []);
  const [listings, setListings] = useState<PartnerListing[]>(() => readListings());

  const [businessName, setBusinessName] = useState(
    initialProspect?.businessName ||
      initialProspect?.prospect?.placeName ||
      ""
  );
  const [contactName, setContactName] = useState(initialProspect?.contactName || "");
  const [phone, setPhone] = useState(initialProspect?.phone || "");
  const [email, setEmail] = useState(initialProspect?.email || "");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState(inferCategory(initialProspect));
  const [plan, setPlan] = useState(initialProspect?.tier || "growth");
  const [status, setStatus] = useState<PartnerListing["status"]>("draft");
  const [offer, setOffer] = useState("Founding partner placement now available.");
  const [description, setDescription] = useState(
    initialProspect?.notes ||
      "Claimed VI Guide partner listing with map discovery, visitor intent tracking, and ride-request attribution."
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedPlan = planOptions.find((item) => item.id === plan) || planOptions[1];

  const loadProspect = (prospect: PartnerProspect) => {
    setBusinessName(prospect.businessName || prospect.prospect?.placeName || "");
    setContactName(prospect.contactName || "");
    setPhone(prospect.phone || "");
    setEmail(prospect.email || "");
    setCategory(inferCategory(prospect));
    setPlan(prospect.tier || "growth");
    setDescription(
      prospect.notes ||
        "Claimed VI Guide partner listing with map discovery, visitor intent tracking, and ride-request attribution."
    );
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    if (!businessName.trim()) return;

    const now = new Date().toISOString();
    const id = `listing-${slug(businessName)}-${Date.now()}`;

    const listing: PartnerListing = {
      id,
      businessName: businessName.trim(),
      category: category.trim(),
      plan,
      status,
      phone: phone.trim(),
      email: email.trim(),
      website: website.trim(),
      address: address.trim(),
      offer: offer.trim(),
      description: description.trim(),
      contactName: contactName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setSaving(true);

    const next = [listing, ...listings].slice(0, 250);
    writeListings(next);
    setListings(next);

    try {
      await createMerchantLead({
        partnerId: `listing-${slug(listing.businessName)}`,
        partnerName: listing.businessName,
        action: "partner_onboarding_saved" as any,
        source: "partner_onboarding",
        visitorName: listing.contactName || "Partner Contact",
        visitorPhone: listing.phone,
        visitorEmail: listing.email,
        message: `Partner onboarding saved for ${listing.businessName}. Plan: ${selectedPlan.name}. Status: ${listing.status}. Category: ${listing.category}.`,
        plan: selectedPlan.name,
        listingStatus: listing.status,
        category: listing.category,
        website: listing.website,
        address: listing.address,
        offer: listing.offer,
        localEventId: listing.id,
      } as any);
    } catch (error) {
      console.warn("Partner onboarding Firestore write failed; saved locally.", error);
    }

    setSaving(false);
    setSaved(true);
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <button
          type="button"
          onClick={() => navigate("/partner-pipeline")}
          className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black shadow-sm active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Partner Pipeline
        </button>

        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <Store className="h-4 w-4" />
                Partner Onboarding
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Activate the business listing.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                After a partner is sold, use this page to build their claimed
                listing, choose the plan, set the status, and prepare them for
                featured placement on the map.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate("/partner-pipeline")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Pipeline
              </button>
              <button
                onClick={() => navigate("/map")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Open Map
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-4">
            <HeroStat label="Listings" value={listings.length} icon={Store} />
            <HeroStat
              label="Active"
              value={listings.filter((item) => item.status === "active").length}
              icon={CheckCircle2}
            />
            <HeroStat
              label="Featured"
              value={listings.filter((item) => item.status === "featured").length}
              icon={Sparkles}
            />
            <HeroStat label="Selected Plan" value={selectedPlan.name} icon={BadgeDollarSign} />
          </div>
        </div>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
          <aside className="space-y-5">
            <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Closed prospects
              </p>
              <h2 className="mt-2 text-3xl font-black">Load a partner</h2>

              <div className="mt-5 space-y-3">
                {closeLeads.length === 0 ? (
                  <div className="rounded-[2rem] bg-stone-50 p-5 text-sm font-bold leading-6 text-stone-500">
                    No close leads yet. Add one from Partner Close or Partner Pipeline.
                  </div>
                ) : (
                  closeLeads.slice(0, 8).map((lead, index) => (
                    <button
                      key={`${lead.businessName}-${index}`}
                      type="button"
                      onClick={() => loadProspect(lead)}
                      className="w-full rounded-[2rem] bg-stone-50 p-4 text-left transition hover:bg-stone-100 active:scale-[0.99]"
                    >
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                        {lead.tier || "growth"} plan
                      </p>
                      <h3 className="mt-1 text-lg font-black">
                        {lead.businessName || lead.prospect?.placeName || "Unnamed business"}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-stone-500">
                        {lead.contactName || "No contact"} · {lead.phone || "No phone"}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2.25rem] bg-ink p-5 text-white shadow-xl">
              <Upload className="h-8 w-8 text-turquoise" />
              <h2 className="mt-4 text-3xl font-black">Next fulfillment step</h2>
              <p className="mt-3 text-sm font-bold leading-7 text-white/70">
                After saving the listing, collect logo, photos, menu/services,
                hours, booking link, and any founding partner offer.
              </p>
            </section>
          </aside>

          <section className="rounded-[2.25rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Listing setup
            </p>
            <h2 className="mt-2 text-3xl font-black">Business profile</h2>

            <form onSubmit={submit} className="mt-5 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Business name" value={businessName} onChange={setBusinessName} required />
                <Field label="Category" value={category} onChange={setCategory} />
                <Field label="Contact name" value={contactName} onChange={setContactName} />
                <Field label="Phone" value={phone} onChange={setPhone} icon={Phone} />
                <Field label="Email" value={email} onChange={setEmail} type="email" icon={Mail} />
                <Field label="Website" value={website} onChange={setWebsite} icon={Globe} />
              </div>

              <Field label="Address or service area" value={address} onChange={setAddress} icon={MapPin} />

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Plan
                  </p>
                  <div className="mt-2 grid gap-2">
                    {planOptions.map((item) => {
                      const Icon = item.icon;
                      const active = plan === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPlan(item.id)}
                          className={`flex items-center justify-between rounded-2xl p-4 text-left ${
                            active ? "bg-emerald-950 text-white" : "bg-stone-50"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <Icon className={active ? "h-5 w-5 text-turquoise" : "h-5 w-5 text-emerald-700"} />
                            <span className="font-black">{item.name}</span>
                          </span>
                          <span className="font-black">{item.price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                    Listing status
                  </p>
                  <div className="mt-2 grid gap-2">
                    {statusOptions.map((item) => {
                      const active = status === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setStatus(item.id)}
                          className={`rounded-2xl p-4 text-left ${
                            active ? "bg-turquoise text-ink" : "bg-stone-50"
                          }`}
                        >
                          <p className="font-black">{item.name}</p>
                          <p className="mt-1 text-xs font-bold opacity-70">{item.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Featured offer
                </label>
                <input
                  value={offer}
                  onChange={(event) => setOffer(event.target.value)}
                  className="mt-2 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
                  Listing description
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="mt-2 min-h-36 w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold leading-6 outline-none focus:border-emerald-700"
                />
              </div>

              <div className="rounded-[2rem] bg-stone-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-emerald-700">
                    <Image className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black">Logo/photo placeholder</p>
                    <p className="text-xs font-bold leading-5 text-stone-500">
                      For now this tracks that assets are needed. Next pass can add upload fields.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !businessName.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-5 py-4 text-sm font-black text-white shadow-xl active:scale-95 disabled:opacity-50"
              >
                {saved ? <CheckCircle2 className="h-5 w-5" /> : <Save className="h-5 w-5" />}
                {saving ? "Saving..." : saved ? "Listing Saved" : "Save Partner Listing"}
              </button>
            </form>
          </section>
        </section>

        <section className="mt-6 rounded-[2.25rem] bg-white p-5 shadow-xl">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
            Existing listings
          </p>
          <h2 className="mt-2 text-3xl font-black">Onboarded partners</h2>

          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {listings.length === 0 ? (
              <div className="rounded-[2rem] bg-stone-50 p-6 text-sm font-bold text-stone-500">
                No partner listings saved yet.
              </div>
            ) : (
              listings.map((listing) => (
                <div key={listing.id} className="rounded-[2rem] bg-stone-50 p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                    {listing.status} · {listing.plan}
                  </p>
                  <h3 className="mt-1 text-xl font-black">{listing.businessName}</h3>
                  <p className="mt-1 text-xs font-bold text-stone-500">
                    {listing.category}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm font-bold leading-6 text-stone-600">
                    {listing.description}
                  </p>
                </div>
              ))
            )}
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
  type = "text",
  icon: Icon,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  icon?: LucideIcon;
  required?: boolean;
}) {
  return (
    <label>
      <span className="text-xs font-black uppercase tracking-[0.18em] text-stone-500">
        {label}
      </span>
      <div className="relative mt-2">
        {Icon ? (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        ) : null}
        <input
          type={type}
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`w-full rounded-[1.5rem] border border-stone-200 bg-stone-50 p-4 text-sm font-bold outline-none focus:border-emerald-700 ${
            Icon ? "pl-11" : ""
          }`}
        />
      </div>
    </label>
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
