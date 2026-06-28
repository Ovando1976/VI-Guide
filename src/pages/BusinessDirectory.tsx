import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Car,
  Crown,
  Fish,
  Hotel,
  MapPin,
  Sailboat,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Utensils,
  Waves,
} from "lucide-react";

import { getBusinesses } from "../lib/firestore/businesses";
import type { Business, BusinessCategory } from "../types/business";

const categories: Array<{
  value: "all" | BusinessCategory;
  label: string;
  icon: typeof Building2;
}> = [
  { value: "all", label: "All", icon: Building2 },
  { value: "restaurant", label: "Restaurants", icon: Utensils },
  { value: "hotel", label: "Hotels", icon: Hotel },
  { value: "villa", label: "Villas", icon: Hotel },
  { value: "car_rental", label: "Car Rentals", icon: Car },
  { value: "taxi", label: "Taxi", icon: Car },
  { value: "charter", label: "Charters", icon: Sailboat },
  { value: "fishing", label: "Fishing", icon: Fish },
  { value: "dive_shop", label: "Dive Shops", icon: Waves },
  { value: "watersports", label: "Watersports", icon: Waves },
  { value: "retail", label: "Retail", icon: ShoppingBag },
  { value: "grocery", label: "Grocery", icon: ShoppingBag },
  { value: "real_estate", label: "Real Estate", icon: Building2 },
  { value: "contractor", label: "Contractors", icon: Building2 },
  { value: "service", label: "Services", icon: Building2 },
];

function label(value?: string) {
  if (!value) return "";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function prettyLocation(value?: string) {
  if (!value) return "Virgin Islands";

  return value
    .replace(/-/g, " ")
    .replace(/_/g, " ")
    .replace(/\bst\b/gi, "St.")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getBusinessImage(business: Business) {
  if (business.imageUrl?.trim()) return business.imageUrl;

  switch (business.category) {
    case "restaurant":
      return "/images/business/restaurants.jpg";
    case "hotel":
      return "/images/business/hotels.jpg";
    case "villa":
      return "/images/business/villas.jpg";
    case "taxi":
      return "/images/business/taxi.jpg";
    case "car_rental":
      return "/images/business/car-rental.jpg";
    case "charter":
      return "/images/business/charters.jpg";
    case "fishing":
      return "/images/business/fishing.jpg";
    case "dive_shop":
      return "/images/business/dive-shop.jpg";
    case "watersports":
      return "/images/business/watersports.jpg";
    case "retail":
      return "/images/business/retail.jpg";
    case "grocery":
      return "/images/business/grocery.jpg";
    case "real_estate":
      return "/images/business/real-estate.jpg";
    case "contractor":
      return "/images/business/contractors.jpg";
    default:
      return "/images/business/business-directory.jpg";
  }
}

function businessLocation(business: Business) {
  return (
    business.estate ||
    business.address ||
    label(business.island) ||
    "Virgin Islands"
  );
}

function isFeaturedBusiness(business: Business) {
  return Boolean(business.featured || business.premium);
}

export default function BusinessDirectory() {
  const navigate = useNavigate();

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | BusinessCategory>("all");

  useEffect(() => {
    let active = true;

    async function loadBusinesses() {
      try {
        setLoading(true);
        setError(null);

        const rows = await getBusinesses();

        if (!active) return;

        setBusinesses(rows);
      } catch (err) {
        console.error("Failed to load businesses:", err);

        if (!active) return;

        setBusinesses([]);
        setError("Could not load businesses from Firebase.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBusinesses();

    return () => {
      active = false;
    };
  }, []);

  const sortedBusinesses = useMemo(() => {
    return [...businesses].sort((a, b) => {
      const aFeatured = isFeaturedBusiness(a) ? 1 : 0;
      const bFeatured = isFeaturedBusiness(b) ? 1 : 0;

      if (aFeatured !== bFeatured) return bFeatured - aFeatured;

      return a.name.localeCompare(b.name);
    });
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const q = search.trim().toLowerCase();

    return sortedBusinesses.filter((business) => {
      const matchesCategory =
        category === "all" || business.category === category;

      const searchable = [
        business.name,
        business.description,
        business.category,
        business.estate,
        business.address,
        business.island,
        business.claimStatus,
        ...(business.tags ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesCategory && (!q || searchable.includes(q));
    });
  }, [sortedBusinesses, category, search]);

  const counts = useMemo(() => {
    return categories.reduce(
      (acc, item) => {
        acc[item.value] =
          item.value === "all"
            ? businesses.length
            : businesses.filter((business) => business.category === item.value)
                .length;

        return acc;
      },
      {} as Record<string, number>,
    );
  }, [businesses]);

  return (
    <main className="min-h-screen bg-[#061016] pb-40 text-white">
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-45"
          style={{
            backgroundImage: `url("/images/business/business-directory.jpg")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/90 to-emerald-950/80" />

        <div className="relative mx-auto max-w-6xl px-5 pb-8 pt-6 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white/85 backdrop-blur transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Home
            </button>

            <Link
              to="/business-signup"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 shadow-lg transition hover:scale-105"
            >
              <Crown className="h-4 w-4" />
              List Business
            </Link>
          </div>

          <div className="mt-10 max-w-2xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              VI Guide Revenue Engine
            </p>

            <h1 className="mt-3 text-5xl font-black leading-none tracking-tight sm:text-6xl">
              Business Directory
            </h1>

            <p className="mt-4 text-base leading-relaxed text-white/75">
              Discover restaurants, hotels, taxis, car rentals, charters, tours,
              contractors, and trusted island businesses.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-black text-white/75">
                {businesses.length} listings
              </span>

              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200">
                Live Firebase Data
              </span>

              {businesses.some(
                (business) => business.claimStatus === "unclaimed",
              ) ? (
                <span className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-xs font-black text-yellow-100">
                  Claimable Listings
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 backdrop-blur md:grid-cols-[1fr_auto]">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-950/70 px-4 py-3">
              <Search className="h-5 w-5 text-cyan-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search businesses, services, estates..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/45"
              />
            </div>

            <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
              {categories.map((item) => {
                const Icon = item.icon;
                const active = category === item.value;
                const count = counts[item.value] ?? 0;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value)}
                    className={`inline-flex whitespace-nowrap rounded-2xl px-4 py-3 text-xs font-black transition ${
                      active
                        ? "bg-cyan-400 text-slate-950"
                        : "bg-slate-950/60 text-white/75 hover:bg-white/15"
                    }`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.label}
                    <span className="ml-2 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center shadow-2xl">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
            <p className="mt-4 font-bold text-white/80">
              Loading businesses...
            </p>
          </div>
        ) : error ? (
          <div className="mb-4 rounded-[2rem] border border-red-300/20 bg-red-500/10 p-4">
            <p className="text-sm font-bold text-red-100">{error}</p>
          </div>
        ) : null}

        {!loading && filteredBusinesses.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-cyan-300" />
            <h2 className="mt-4 text-2xl font-black">No businesses found</h2>
            <p className="mt-2 text-sm text-white/65">
              Try another search or select All.
            </p>
          </div>
        ) : null}

        {!loading && filteredBusinesses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBusinesses.map((business) => (
              <Link
                key={business.id}
                to={`/businesses/${business.slug || business.id}`}
                className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white text-slate-950 shadow-xl transition hover:-translate-y-1 hover:shadow-2xl"
              >
                <div
                  className="relative h-44 bg-cover bg-center"
                  style={{
                    backgroundImage: `url("${getBusinessImage(business)}")`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {isFeaturedBusiness(business) ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-300 px-3 py-1 text-xs font-black text-slate-950">
                        <Star className="h-3 w-3" />
                        Featured
                      </span>
                    ) : null}

                    {business.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-cyan-300 px-3 py-1 text-xs font-black text-slate-950">
                        <ShieldCheck className="h-3 w-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-black text-slate-950">
                        Basic Listing
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                      {label(business.category)}
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-white">
                      {business.name}
                    </h2>
                  </div>
                </div>

                <div className="p-5">
                  <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">
                    {business.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    <span>{prettyLocation(businessLocation(business))}</span>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                      {business.premium
                        ? "Premium Partner"
                        : business.claimStatus === "unclaimed"
                          ? "Unclaimed Listing"
                          : "Local Listing"}
                    </span>

                    <span className="text-sm font-black text-emerald-700 transition group-hover:translate-x-1">
                      View →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}