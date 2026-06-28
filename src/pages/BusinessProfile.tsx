// src/pages/BusinessProfile.tsx
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Car,
  CheckCircle2,
  Clock,
  Crown,
  ExternalLink,
  Globe,
  ImageIcon,
  Mail,
  MapPin,
  MapPinned,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Tags,
} from "lucide-react";

import {
  createBusinessLead,
  getBusinessBySlug,
  trackBusinessEvent,
} from "../lib/firestore/businesses";
import type { Business, LeadSource } from "../types/business";

type BusinessRecord = Business & {
  coverImage?: string;
  gallery?: string[];
  hours?: Record<string, string>;
  logo?: string;
  amenities?: string[];
  tags?: string[];
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
};

const dayOrder = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

function label(value?: string) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function safeImage(value?: string) {
  let image = value?.trim();
  if (!image || image.includes("undefined") || image.includes("null")) return "";
  if (image.startsWith("images/")) image = `/${image}`;
  if (image.startsWith("public/")) image = image.replace(/^public/, "");
  return image;
}

function categoryFallbackImage(category?: string) {
  switch (category) {
    case "restaurant":
    case "grocery":
      return "/images/business/restaurants.jpg";
    case "hotel":
    case "villa":
      return "/images/business/hotels.jpg";
    case "taxi":
    case "ferry":
    case "airport":
    case "transportation":
      return "/images/business/taxi.jpg";
    case "car_rental":
      return "/images/business/car-rental.jpg";
    case "charter":
    case "fishing":
    case "watersports":
    case "marina":
      return "/images/business/charters.jpg";
    default:
      return "/images/business/business-directory.jpg";
  }
}

function getHeroImage(business: BusinessRecord) {
  return (
    safeImage(business.coverImage) ||
    safeImage(business.imageUrl) ||
    categoryFallbackImage(business.category)
  );
}

function getGalleryImages(business: BusinessRecord) {
  return Array.from(
    new Set(
      [
        getHeroImage(business),
        safeImage(business.coverImage),
        safeImage(business.imageUrl),
        ...(business.gallery ?? []).map(safeImage),
      ].filter(Boolean),
    ),
  ).slice(0, 12);
}

function prettyLocation(value?: string) {
  if (!value) return "U.S. Virgin Islands";
  return value
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .replace(/\bst\b/gi, "St.")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getLocation(business: BusinessRecord) {
  return prettyLocation(
    business.estate || business.address || label(business.island) || "U.S. Virgin Islands",
  );
}

function directionsUrl(business: BusinessRecord) {
  if (business.coordinates) {
    return `https://www.google.com/maps/search/?api=1&query=${business.coordinates.lat},${business.coordinates.lng}`;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${getLocation(business)} Virgin Islands`,
  )}`;
}

function defaultAmenities(category?: string) {
  if (category === "restaurant") {
    return ["Local dining", "Visitor friendly", "Directions available", "Lead requests"];
  }

  if (category === "taxi" || category === "transportation") {
    return ["Island transport", "Directions available", "Visitor friendly", "Lead requests"];
  }

  if (category === "hotel" || category === "villa") {
    return ["Lodging", "Visitor friendly", "Directions available", "Lead requests"];
  }

  return ["Local business", "Verified listing", "Directions available", "Lead requests"];
}

function normalizeLeadSource(value?: string | null): LeadSource {
  const source = value?.toLowerCase().trim();

  if (source === "map") return "map";
  if (source === "mobility") return "mobility";
  if (source === "concierge") return "concierge";
  if (source === "tour") return "tour";
  if (source === "profile") return "profile";
  if (source === "directory") return "directory";

  return "profile";
}

function buildLeadMessage(input: {
  message: string;
  source: LeadSource;
  ref?: string | null;
  path?: string;
}) {
  const context = [
    `Lead source: ${input.source}`,
    input.ref ? `Referral context: ${input.ref}` : "",
    input.path ? `Page path: ${input.path}` : "",
  ].filter(Boolean);

  return `${input.message.trim()}\n\n---\n${context.join("\n")}`;
}

export default function BusinessProfile() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const leadSource = useMemo(
    () => normalizeLeadSource(searchParams.get("source")),
    [searchParams],
  );
  const leadRef = searchParams.get("ref");

  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [heroBroken, setHeroBroken] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPhone, setVisitorPhone] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBusiness() {
      try {
        setLoading(true);
        setHeroBroken(false);
        setSelectedImage("");
        setSent(false);

        const item = (await getBusinessBySlug(slug)) as BusinessRecord | null;
        if (!active) return;

        setBusiness(item);

        if (item) {
          setSelectedImage(getHeroImage(item));
          void trackBusinessEvent(item.id, "profileViews").catch(console.error);
        }
      } catch (error) {
        console.error("Failed to load business profile:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadBusiness();

    return () => {
      active = false;
    };
  }, [slug]);

  const fallbackImage = business
    ? categoryFallbackImage(business.category)
    : categoryFallbackImage();

  const heroImage = useMemo(() => {
    if (!business) return fallbackImage;
    if (heroBroken) return fallbackImage;
    return selectedImage || getHeroImage(business);
  }, [business, fallbackImage, heroBroken, selectedImage]);

  const galleryImages = useMemo(() => {
    if (!business) return [];
    return getGalleryImages(business);
  }, [business]);

  function openBusinessMap() {
    if (!business) return;

    navigate("/map", {
      state: {
        focusBusiness: {
          id: business.id,
          name: business.name,
          category: business.category,
          lat: business.coordinates?.lat,
          lng: business.coordinates?.lng,
          estate: business.estate,
          island: business.island,
          imageUrl: business.imageUrl,
        },
      },
    });
  }

  function getRideToBusiness() {
    if (!business) return;

    navigate("/mobility", {
      state: {
        dropoff: {
          label: business.name,
          lat: business.coordinates?.lat,
          lng: business.coordinates?.lng,
          businessId: business.id,
          category: business.category,
          estateName: business.estate,
          island: business.island,
        },
      },
    });
  }

  async function submitLead(e: FormEvent) {
    e.preventDefault();
    if (!business || !visitorName.trim() || !message.trim()) return;

    try {
      setSubmitting(true);

      await createBusinessLead({
        businessId: business.id,
        visitorName: visitorName.trim(),
        visitorEmail: visitorEmail.trim() || undefined,
        visitorPhone: visitorPhone.trim() || undefined,
        source: leadSource,
        message: buildLeadMessage({
          message,
          source: leadSource,
          ref: leadRef,
          path: location.pathname + location.search,
        }),
      });

      setSent(true);
      setVisitorName("");
      setVisitorEmail("");
      setVisitorPhone("");
      setMessage("");

      void trackBusinessEvent(business.id, "leadCount").catch(console.error);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#061016] text-white">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-cyan-300 border-t-transparent" />
          <p className="mt-4 font-bold text-white/75">Loading business...</p>
        </div>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#061016] p-6 text-white">
        <button
          type="button"
          onClick={() => navigate("/businesses")}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/10 p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-cyan-300" />
          <h1 className="mt-4 text-3xl font-black">Business not found</h1>
          <p className="mt-2 text-white/65">This listing may have moved.</p>
        </div>
      </main>
    );
  }

  const locationLabel = getLocation(business);
  const amenities = business.amenities?.length
    ? business.amenities
    : defaultAmenities(business.category);

  return (
    <main className="min-h-screen bg-[#061016] pb-40 text-white">
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt=""
          onError={() => setHeroBroken(true)}
          className="h-[20rem] w-full object-cover sm:h-[26rem]"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-[#061016] via-[#061016]/55 to-black/20" />

        <div className="absolute left-5 right-5 top-5 mx-auto flex max-w-6xl items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/businesses")}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-bold backdrop-blur"
          >
            <ArrowLeft className="h-4 w-4" />
            Directory
          </button>

          <Link
            to={`/business-signup?business=${business.slug || business.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 text-sm font-black text-slate-950 shadow-xl"
          >
            <Crown className="h-4 w-4" />
            Claim Listing
          </Link>
        </div>

        <div className="absolute bottom-6 left-5 right-5 mx-auto max-w-6xl">
          <div className="flex items-end gap-4">
            {safeImage(business.logo) ? (
              <img
                src={safeImage(business.logo)}
                alt=""
                className="hidden h-20 w-20 rounded-3xl border border-white/20 bg-white object-cover shadow-2xl sm:block"
              />
            ) : null}

            <div>
              <div className="flex flex-wrap gap-2">
                <Badge cyan>{label(business.category)}</Badge>

                {business.featured || business.premium ? (
                  <Badge yellow>
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                ) : null}

                {business.verified ? (
                  <Badge light>
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </Badge>
                ) : (
                  <Badge light>Basic Listing</Badge>
                )}
              </div>

              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-none tracking-tight sm:text-6xl">
                {business.name}
              </h1>

              <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/75">
                <MapPin className="h-4 w-4 text-emerald-300" />
                {locationLabel}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-y border-white/10 bg-[#061016]/90 px-5 py-3 backdrop-blur">
        <div className="mx-auto grid max-w-6xl grid-cols-3 gap-2 sm:grid-cols-6">
          {business.phone ? (
            <QuickAction
              href={`tel:${business.phone}`}
              icon={<Phone />}
              label="Call"
              onClick={() => void trackBusinessEvent(business.id, "phoneClicks").catch(console.error)}
            />
          ) : null}

          {business.website ? (
            <QuickAction
              href={business.website}
              icon={<Globe />}
              label="Website"
              external
              onClick={() => void trackBusinessEvent(business.id, "websiteClicks").catch(console.error)}
            />
          ) : null}

          <QuickAction
            href={directionsUrl(business)}
            icon={<MapPin />}
            label="Directions"
            external
            onClick={() => void trackBusinessEvent(business.id, "directionRequests").catch(console.error)}
          />

          <button
            type="button"
            onClick={openBusinessMap}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white"
          >
            <MapPinned className="h-4 w-4" />
            View Map
          </button>

          <button
            type="button"
            onClick={getRideToBusiness}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-3 py-3 text-xs font-black text-slate-950"
          >
            <Car className="h-4 w-4" />
            Get Ride
          </button>

          <a
            href="#lead-form"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Message
          </a>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_0.78fr]">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Photo Gallery</h2>
                <p className="mt-1 text-sm text-white/60">Tap a photo to update the hero image.</p>
              </div>
              <ImageIcon className="h-6 w-6 text-cyan-300" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {galleryImages.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => {
                    setHeroBroken(false);
                    setSelectedImage(image);
                  }}
                  className={`overflow-hidden rounded-2xl border bg-slate-950 ${
                    heroImage === image ? "border-cyan-300" : "border-white/10"
                  }`}
                >
                  <img
                    src={image}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = categoryFallbackImage(business.category);
                    }}
                    className="h-24 w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">About</h2>
            <p className="mt-3 leading-relaxed text-white/75">{business.description}</p>
          </Card>

          <Card>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <h2 className="text-xl font-black">Amenities & Features</h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {amenities.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-2xl bg-slate-950/70 px-4 py-3 text-sm font-bold text-white/75"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  {item}
                </div>
              ))}
            </div>
          </Card>

          {business.tags?.length ? (
            <Card>
              <div className="flex items-center gap-2">
                <Tags className="h-5 w-5 text-cyan-300" />
                <h2 className="text-xl font-black">Tags</h2>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {business.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/75"
                  >
                    {label(tag)}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}

          {business.hours && Object.keys(business.hours).length > 0 ? (
            <Card>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-300" />
                <h2 className="text-xl font-black">Business Hours</h2>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                {dayOrder
                  .filter((day) => business.hours?.[day])
                  .map((day) => (
                    <div
                      key={day}
                      className="flex items-center justify-between rounded-2xl bg-slate-950/70 px-4 py-3"
                    >
                      <span className="font-bold text-white/65">{label(day)}</span>
                      <span className="font-black">{business.hours?.[day]}</span>
                    </div>
                  ))}
              </div>
            </Card>
          ) : null}

          {business.coordinates ? (
            <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl">
              <div className="p-5">
                <h2 className="text-xl font-black">Location</h2>
                <p className="mt-2 text-sm text-white/65">
                  {business.coordinates.lat.toFixed(5)}, {business.coordinates.lng.toFixed(5)}
                </p>
              </div>

              <iframe
                title={`${business.name} map`}
                className="h-72 w-full border-0"
                loading="lazy"
                src={`https://www.google.com/maps?q=${business.coordinates.lat},${business.coordinates.lng}&z=15&output=embed`}
              />
            </section>
          ) : null}
        </div>

        <aside className="space-y-5">
          <Card yellow>
            <div className="flex items-start gap-3">
              <Crown className="mt-1 h-6 w-6 text-yellow-200" />
              <div>
                <h2 className="text-xl font-black text-yellow-100">Own this business?</h2>
                <p className="mt-2 text-sm leading-relaxed text-yellow-50/75">
                  Claim this listing to update photos, add contact details, receive leads,
                  and promote your business inside VI Guide.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/business-signup?business=${business.slug || business.id}`}
                    className="inline-flex rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-slate-950"
                  >
                    Claim Listing
                  </Link>

                  <Link
                    to="/merchant-dashboard"
                    className="inline-flex rounded-full bg-white/10 px-5 py-3 text-sm font-black text-white"
                  >
                    Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </Card>

          <form
            id="lead-form"
            onSubmit={submitLead}
            className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl"
          >
            <h2 className="text-xl font-black">Request info</h2>
            <p className="mt-1 text-sm text-white/65">
              Send your message directly through VI Guide. Source: {label(leadSource)}.
            </p>

            {sent ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-400/15 p-3 text-sm font-bold text-emerald-200">
                <CheckCircle2 className="h-4 w-4" />
                Lead sent successfully.
              </div>
            ) : null}

            <input
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="Your name"
              className="mt-4 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
            <input
              value={visitorEmail}
              onChange={(e) => setVisitorEmail(e.target.value)}
              placeholder="Email"
              className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
            <input
              value={visitorPhone}
              onChange={(e) => setVisitorPhone(e.target.value)}
              placeholder="Phone"
              className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you need?"
              rows={4}
              className="mt-3 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-cyan-300"
            />

            <button
              disabled={submitting}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-4 py-3 font-black text-slate-950 disabled:opacity-60"
            >
              <MessageCircle className="h-4 w-4" />
              {submitting ? "Sending..." : "Send lead"}
            </button>
          </form>

          <Card>
            <h2 className="text-xl font-black">Contact Details</h2>

            <div className="mt-4 space-y-3 text-sm">
              {business.phone ? <InfoRow icon={<Phone />} label="Phone" value={business.phone} /> : null}
              {business.website ? <InfoRow icon={<Globe />} label="Website" value={business.website} /> : null}
              {business.email ? <InfoRow icon={<Mail />} label="Email" value={business.email} /> : null}
              <InfoRow
                icon={<MapPin />}
                label={business.address ? "Address" : "Area"}
                value={prettyLocation(business.address || business.estate || business.island)}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-xl font-black">Listing Status</h2>

            <div className="mt-4 space-y-3 text-sm">
              <StatusRow label="Claim status" value={label(business.claimStatus || "unclaimed")} />
              <StatusRow label="Verification" value={business.verified ? "Verified" : "Basic"} />
              <StatusRow
                label="Plan"
                value={business.premium ? "Premium" : business.featured ? "Featured" : "Free"}
              />
            </div>
          </Card>

          <a
            href={directionsUrl(business)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/10 px-5 py-4 text-sm font-black"
          >
            Open in Maps
            <ExternalLink className="h-4 w-4" />
          </a>
        </aside>
      </section>
    </main>
  );
}

function Badge({
  children,
  cyan,
  yellow,
  light,
}: {
  children: ReactNode;
  cyan?: boolean;
  yellow?: boolean;
  light?: boolean;
}) {
  const className = cyan
    ? "bg-cyan-300 text-slate-950"
    : yellow
      ? "bg-yellow-300 text-slate-950"
      : light
        ? "bg-white text-slate-950"
        : "bg-white/10 text-white";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${className}`}
    >
      {children}
    </span>
  );
}

function Card({ children, yellow }: { children: ReactNode; yellow?: boolean }) {
  return (
    <section
      className={`rounded-[2rem] border p-5 shadow-2xl ${
        yellow ? "border-yellow-300/20 bg-yellow-300/10" : "border-white/10 bg-white/[0.06]"
      }`}
    >
      {children}
    </section>
  );
}

function QuickAction({
  href,
  icon,
  label,
  external,
  onClick,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  external?: boolean;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 py-3 text-xs font-black text-white"
    >
      <span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      {label}
    </a>
  );
}

function InfoRow({ icon, label, value }: { icon: ReactNode; label: string; value?: string }) {
  if (!value) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-950/70 px-4 py-3">
      <div className="mt-0.5 text-cyan-300 [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">{label}</p>
        <p className="mt-1 break-words font-bold text-white/80">{value}</p>
      </div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/65">{label}</span>
      <span className="font-black">{value}</span>
    </div>
  );
}