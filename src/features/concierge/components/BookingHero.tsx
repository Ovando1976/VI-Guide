import {
  CalendarDays,
  Car,
  Landmark,
  Route,
  Star,
  type LucideIcon,
} from "lucide-react";

import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import { getHistoricSiteOffer } from "../../../data/revenue/historicSiteOffers";
import type { BookingOption } from "../conciergeTypes";
import { getImage } from "../conciergeUtils";

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
