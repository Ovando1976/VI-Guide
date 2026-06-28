import type { ReactNode } from "react";
import { MapPin, Navigation, Shield } from "lucide-react";
import type { ServiceClass, Trip, TripType } from "../../types";

type TariffQuote = Trip["quote"] & {
  pickupZoneName?: string;
  dropoffZoneName?: string;
  reviewStatus?: string;
  assumptions?: string[];
  source?: { label?: string };
};

export default function FarePreviewCard({
  quote,
  pickup,
  dropoff,
  tripType,
  serviceClass,
}: {
  quote: TariffQuote;
  pickup: string;
  dropoff: string;
  tripType: TripType;
  serviceClass: ServiceClass;
}) {
  return (
    <section className="space-y-6 rounded-[2.5rem] border border-white/10 bg-white p-8 text-ink shadow-2xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-turquoise">
            Fare Preview
          </p>
          <h3 className="mt-2 text-3xl font-serif italic text-ink">
            Your island ride
          </h3>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
            {serviceClass} service • {tripType.replace("_", " ")}
          </p>
        </div>

        <div className="text-right">
          <p className="text-5xl font-serif italic text-ink">${quote.total}</p>
          <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
            Estimated Total
          </p>
        </div>
      </div>

      <TripLine icon={<MapPin size={18} />} label="Pickup" value={pickup} />
      <TripLine icon={<Navigation size={18} />} label="Dropoff" value={dropoff} />

      <div className="space-y-3 rounded-3xl bg-sand/30 p-6">
        <FareLine label="Base Fare" value={quote.baseFare} />
        {quote.luggageFee > 0 ? (
          <FareLine label="Luggage Fee" value={quote.luggageFee} />
        ) : null}
        {quote.premiumFee > 0 ? (
          <FareLine label="Premium / After Hours" value={quote.premiumFee} />
        ) : null}
      </div>

      <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-800">
          Official Tariff Layer
        </p>

        <div className="mt-4 grid gap-3 text-xs">
          <InfoRow label="Pickup Zone" value={quote.pickupZoneName || "Not resolved"} />
          <InfoRow label="Dropoff Zone" value={quote.dropoffZoneName || "Not resolved"} />
          <InfoRow label="Status" value={quote.reviewStatus || "needs_review"} />
          <InfoRow label="Source" value={quote.source?.label || "Fallback estimate"} />
        </div>

        {quote.assumptions?.length ? (
          <div className="mt-4 rounded-2xl bg-white/70 p-3">
            {quote.assumptions.map((item) => (
              <p key={item} className="text-xs leading-relaxed text-stone-600">
                • {item}
              </p>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-turquoise/10 bg-turquoise/5 p-4">
        <Shield size={18} className="text-turquoise" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise">
          Licensed & insured drivers only
        </p>
      </div>
    </section>
  );
}

function TripLine({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-sand text-turquoise">
        {icon}
      </div>
      <div className="flex-1 border-b border-stone-100 pb-4">
        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">
          {label}
        </p>
        <p className="text-sm font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}

function FareLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
      <span>{label}</span>
      <span>${value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="font-bold uppercase tracking-widest text-emerald-800">
        {label}
      </span>
      <span className="text-right font-bold text-stone-700">{value}</span>
    </div>
  );
}