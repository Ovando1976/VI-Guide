import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clipboard,
  Crown,
  Eye,
  Globe,
  Image,
  Mail,
  MapPin,
  Phone,
  Rocket,
  Search,
  Sparkles,
  Store,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type PartnerListingStatus = "draft" | "active" | "featured";

type PartnerListing = {
  id: string;
  sourceLeadId: string;
  businessName: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  island: string;
  offer: string;
  description: string;
  planTier: string;
  listingStatus: PartnerListingStatus;
  logoUrl: string;
  heroImageUrl: string;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  updatedAt: string;
};

const LISTINGS_KEY = "viNavigatorPartnerListings";

const planMeta: Record<string, { label: string; price: number; icon: LucideIcon }> = {
  starter: { label: "Starter", price: 49, icon: Store },
  growth: { label: "Growth", price: 99, icon: Rocket },
  pro: { label: "Pro", price: 199, icon: Crown },
};

const statusClasses: Record<PartnerListingStatus, string> = {
  draft: "bg-amber-50 text-amber-800",
  active: "bg-emerald-50 text-emerald-800",
  featured: "bg-turquoise text-ink",
};

function safeReadListings(): PartnerListing[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(LISTINGS_KEY) || "[]");
  } catch {
    return [];
  }
}

function safeWriteListings(listings: PartnerListing[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

function planFor(tier: string) {
  return planMeta[tier] || planMeta.growth;
}

function formatDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "Recently";
  return new Date(parsed).toLocaleDateString();
}

function buildListingPitch(listing: PartnerListing) {
  const plan = planFor(listing.planTier);

  return `${listing.businessName} is now part of the VI Guide partner network.

Category: ${listing.category}
Island: ${listing.island}
Area/address: ${listing.address || "Not listed"}
Partner plan: ${plan.label} · $${plan.price}/mo
Listing status: ${listing.listingStatus}

Featured message:
${listing.offer || "No offer listed yet."}

Description:
${listing.description || "No description listed yet."}

Contact:
${listing.phone || "No phone listed"}
${listing.email || "No email listed"}
${listing.website || "No website listed"}`;
}

export default function PartnerDirectoryPage() {
  const navigate = useNavigate();

  const [listings, setListings] = useState<PartnerListing[]>(() => safeReadListings());
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<PartnerListingStatus | "all">("all");
  const [copiedId, setCopiedId] = useState("");

  const categories = useMemo(() => {
    return Array.from(new Set(listings.map((listing) => listing.category).filter(Boolean))).sort();
  }, [listings]);

  const [category, setCategory] = useState("all");

  const filtered = useMemo(() => {
    const text = query.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesText =
        !text ||
        listing.businessName.toLowerCase().includes(text) ||
        listing.category.toLowerCase().includes(text) ||
        listing.island.toLowerCase().includes(text) ||
        listing.offer.toLowerCase().includes(text);

      const matchesStatus = status === "all" || listing.listingStatus === status;
      const matchesCategory = category === "all" || listing.category === category;

      return matchesText && matchesStatus && matchesCategory;
    });
  }, [category, listings, query, status]);

  const stats = useMemo(() => {
    const active = listings.filter((listing) => listing.listingStatus === "active").length;
    const featured = listings.filter((listing) => listing.listingStatus === "featured").length;
    const draft = listings.filter((listing) => listing.listingStatus === "draft").length;
    const mrr = listings.reduce((sum, listing) => sum + planFor(listing.planTier).price, 0);

    return {
      total: listings.length,
      active,
      featured,
      draft,
      mrr,
    };
  }, [listings]);

  const updateStatus = (id: string, nextStatus: PartnerListingStatus) => {
    setListings((current) => {
      const next = current.map((listing) =>
        listing.id === id
          ? {
              ...listing,
              listingStatus: nextStatus,
              updatedAt: new Date().toISOString(),
            }
          : listing
      );

      safeWriteListings(next);
      return next;
    });
  };

  const copyListing = async (listing: PartnerListing) => {
    try {
      await navigator.clipboard.writeText(buildListingPitch(listing));
      setCopiedId(listing.id);
      window.setTimeout(() => setCopiedId(""), 1600);
    } catch {
      setCopiedId("");
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-40 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-[2.75rem] bg-ink p-5 text-white shadow-2xl md:p-8 lg:p-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <BadgeCheck className="h-4 w-4" />
                Partner Directory
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Manage active partner listings.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                This is the fulfillment side of the sales engine: every closed
                partner becomes a listing that can be activated, featured, and
                shown in future map placements.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/partner-onboarding")}
                className="rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Add Listing
              </button>

              <button
                type="button"
                onClick={() => navigate("/partner-pipeline")}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-ink active:scale-95"
              >
                Pipeline
              </button>
            </div>
          </div>

          <div className="mt-7 grid gap-3 md:grid-cols-5">
            <HeroStat label="Listings" value={stats.total} icon={Building2} />
            <HeroStat label="Active" value={stats.active} icon={BadgeCheck} />
            <HeroStat label="Featured" value={stats.featured} icon={Sparkles} />
            <HeroStat label="Drafts" value={stats.draft} icon={Eye} />
            <HeroStat label="MRR" value={`$${stats.mrr.toLocaleString()}`} icon={TrendingUp} />
          </div>
        </div>

        <section className="mt-6 rounded-[2.25rem] bg-white p-5 shadow-xl">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
                Directory
              </p>
              <h2 className="mt-2 text-3xl font-black">Partner listings</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_160px_180px]">
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
                value={status}
                onChange={(event) => setStatus(event.target.value as PartnerListingStatus | "all")}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
              >
                <option value="all">All status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="featured">Featured</option>
              </select>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
              >
                <option value="all">All categories</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            {filtered.length === 0 ? (
              <div className="rounded-[2rem] bg-stone-50 p-8 text-center lg:col-span-2">
                <Store className="mx-auto h-9 w-9 text-emerald-700" />
                <p className="mt-3 text-xl font-black">No partner listings yet</p>
                <p className="mt-2 text-sm font-bold leading-6 text-stone-500">
                  Go to Partner Pipeline, onboard a won lead, then save the partner listing.
                </p>
              </div>
            ) : (
              filtered.map((listing) => {
                const plan = planFor(listing.planTier);
                const PlanIcon = plan.icon;

                return (
                  <article key={listing.id} className="overflow-hidden rounded-[2rem] bg-stone-50 shadow-sm">
                    <div className="grid h-44 place-items-center bg-emerald-950 text-white">
                      {listing.heroImageUrl ? (
                        <img
                          src={listing.heroImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Image className="h-12 w-12 text-turquoise" />
                      )}
                    </div>

                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white shadow-sm">
                          {listing.logoUrl ? (
                            <img
                              src={listing.logoUrl}
                              alt=""
                              className="h-full w-full rounded-2xl object-cover"
                            />
                          ) : (
                            <Store className="h-8 w-8 text-emerald-700" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${statusClasses[listing.listingStatus]}`}>
                              {listing.listingStatus}
                            </span>

                            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-stone-500">
                              <PlanIcon className="h-3.5 w-3.5 text-emerald-700" />
                              {plan.label} · ${plan.price}/mo
                            </span>
                          </div>

                          <h3 className="mt-2 truncate text-2xl font-black">
                            {listing.businessName}
                          </h3>

                          <p className="mt-1 text-sm font-bold text-stone-500">
                            {listing.category} · {listing.island}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">
                          Featured message
                        </p>
                        <p className="mt-1 text-sm font-black leading-6">
                          {listing.offer || "No offer yet."}
                        </p>
                      </div>

                      <p className="mt-4 line-clamp-3 text-sm font-bold leading-6 text-stone-600">
                        {listing.description || "No listing description yet."}
                      </p>

                      <div className="mt-4 grid gap-2 text-sm font-bold text-stone-600 md:grid-cols-2">
                        <ContactRow icon={MapPin} text={listing.address || listing.island} />
                        <ContactRow icon={Phone} text={listing.phone || "No phone"} />
                        <ContactRow icon={Mail} text={listing.email || "No email"} />
                        <ContactRow icon={Globe} text={listing.website || "No website"} />
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-3">
                        <select
                          value={listing.listingStatus}
                          onChange={(event) =>
                            updateStatus(listing.id, event.target.value as PartnerListingStatus)
                          }
                          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-black outline-none focus:border-emerald-700"
                        >
                          <option value="draft">Draft</option>
                          <option value="active">Active</option>
                          <option value="featured">Featured</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => copyListing(listing)}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
                        >
                          {copiedId === listing.id ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clipboard className="h-4 w-4" />
                          )}
                          {copiedId === listing.id ? "Copied" : "Copy"}
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate("/map")}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-turquoise px-4 py-3 text-sm font-black text-ink active:scale-95"
                        >
                          Map
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>

                      <p className="mt-4 text-[10px] font-black uppercase tracking-[0.14em] text-stone-400">
                        Updated {formatDate(listing.updatedAt || listing.createdAt)}
                      </p>
                    </div>
                  </article>
                );
              })
            )}
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
  value: number | string;
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

function ContactRow({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl bg-white px-3 py-2">
      <Icon className="h-4 w-4 shrink-0 text-emerald-700" />
      <span className="truncate">{text}</span>
    </div>
  );
}
