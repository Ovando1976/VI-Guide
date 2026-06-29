import {
  CalendarDays,
  Car,
  ChevronRight,
  Landmark,
  Route,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import { getHistoricSiteOffer } from "../../data/revenue/historicSiteOffers";
import type { IslandCode } from "../../types";
import { islandLabel, type BookingOption } from "./conciergeUtils";
import type { Listing } from "./conciergeTypes";

export function getTitle(item: Listing): string {
  return String(
    ("title" in item && item.title) ||
      ("name" in item && item.name) ||
      item.id ||
      "Untitled",
  );
}

export function getImage(item: Listing): string {
  const loose = item as Listing & {
    imageUrl?: string;
    coverImage?: string;
    image?: string;
    photoUrl?: string;
    thumbnailUrl?: string;
  };

  return (
    loose.coverImage ||
    loose.imageUrl ||
    loose.image ||
    loose.photoUrl ||
    loose.thumbnailUrl ||
    "/images/placeholder-island.jpg"
  );
}

export function getSourceLabel(item: GeographicIndexItem): string {
  if (item.source === "estate") return "Estate";
  if (item.source === "historicSite") return "Historic Site";
  if (item.source === "archive") return "Archive";
  if (item.source === "dictionary") return "Dictionary";
  if (item.source === "beach") return "Beach";
  return item.category || item.type || "Place";
}

export function BookingHero({
  bookingSite,
  bookingOffer,
  onStartBooking,
}: {
  bookingSite: GeographicIndexItem;
  bookingOffer: ReturnType<typeof getHistoricSiteOffer>;
  onStartBooking: (option: BookingOption) => void;
}) {
  return (
    <section className="border-b border-white/10 bg-white/[0.03] p-6">
      <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
        <div className="overflow-hidden rounded-[2rem] bg-black/30">
          <img
            src={getImage(bookingSite)}
            alt={bookingSite.name}
            className="h-60 w-full object-cover"
          />
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
            Featured Historic Experience
          </p>

          <h2 className="mt-2 text-3xl font-black">
            {bookingOffer?.tourTitle || `${bookingSite.name} Guided Visit`}
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {bookingSite.description ||
              "Explore the history, geography, and local stories connected to this site."}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge icon={Star} text="Visitor Favorite 4.9" />
            <Badge icon={CalendarDays} text="Available Today" />
            <Badge icon={Car} text="Taxi Bundle Ready" />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <BookingButton
              icon={Landmark}
              title={`Tour ${bookingOffer ? `$${bookingOffer.tourPrice}` : ""}`}
              text="Historic walk"
              onClick={() => onStartBooking("tour")}
            />
            <BookingButton
              icon={Car}
              title="Book Ride"
              text="Taxi lead"
              onClick={() => onStartBooking("ride")}
            />
            <BookingButton
              icon={Route}
              title="Bundle"
              text="Tour + taxi"
              onClick={() => onStartBooking("bundle")}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ResultCard({
  item,
  urlIsland,
  navigate,
}: {
  item: GeographicIndexItem;
  urlIsland: IslandCode;
  navigate: (path: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        if (item.source === "beach") {
          navigate(
            `/explore?island=${item.island ?? urlIsland}&q=${encodeURIComponent(
              item.name,
            )}`,
          );
          return;
        }

        if (item.source === "estate") {
          navigate(
            `/estates/${encodeURIComponent(item.estateId || item.id)}?island=${
              item.island ?? urlIsland
            }`,
          );
          return;
        }

        if (item.source === "historicSite") {
          navigate(
            `/historic-sites/${encodeURIComponent(item.id)}?island=${
              item.island ?? urlIsland
            }`,
          );
          return;
        }

        navigate(`/dictionary?q=${encodeURIComponent(item.name)}`);
      }}
      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white p-3 text-left text-slate-950 transition hover:shadow-xl"
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        <img
          src={getImage(item)}
          alt=""
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{item.name}</p>

        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
          {getSourceLabel(item)} · {islandLabel(item.island)}
        </p>

        {item.description ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500">
            {item.description}
          </p>
        ) : null}
      </div>

      <ChevronRight size={16} className="text-slate-300" />
    </button>
  );
}

export function SideAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm font-black text-white/75 transition hover:bg-white/10"
    >
      <Icon className="h-4 w-4 text-emerald-300" />
      {label}
    </button>
  );
}

function Badge({ icon: Icon, text }: { icon: LucideIcon; text: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900">
      <Icon className="h-3.5 w-3.5" />
      {text}
    </span>
  );
}

function BookingButton({
  icon: Icon,
  title,
  text,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl bg-slate-950 p-4 text-left text-white shadow-xl transition hover:bg-emerald-300 hover:text-slate-950 active:scale-[0.98]"
    >
      <Icon className="h-5 w-5" />
      <p className="mt-3 text-sm font-black">{title}</p>
      <p className="mt-1 text-xs opacity-70">{text}</p>
    </button>
  );
}
