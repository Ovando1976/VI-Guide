import { CheckCircle2, MapPin, RotateCcw, Sparkles } from "lucide-react";
import type { Trip } from "../../types";

export default function TripCompleteView({
  trip,
  onDone,
}: {
  trip: Trip;
  onDone: () => void;
}) {
  const destination = trip.dropoff?.label || "your destination";

  return (
    <section className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/10 bg-white p-8 text-ink shadow-2xl">
        <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-100 text-emerald-600">
          <CheckCircle2 size={30} />
        </div>

        <h2 className="mt-5 text-4xl font-serif italic text-ink">
          Welcome to {destination}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-stone-500">
          Your ride has been completed successfully. Thank you for using VI Mobility.
        </p>

        <div className="mt-6 rounded-3xl bg-sand/30 p-5">
          <div className="flex items-center gap-3">
            <MapPin className="text-turquoise" size={20} />
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">
                Arrived
              </p>
              <p className="text-sm font-bold text-ink">{destination}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-turquoise/10 bg-turquoise/5 p-5">
          <div className="flex items-center gap-3">
            <Sparkles size={18} className="text-turquoise" />
            <p className="text-xs font-semibold text-stone-700">
              Route history, favorite destinations, and ride preferences can be surfaced here later.
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="w-full rounded-3xl bg-turquoise py-5 text-[10px] font-black uppercase tracking-[0.3em] text-ink shadow-2xl transition hover:bg-white"
      >
        <RotateCcw size={16} className="mx-auto mb-1" />
        Book Another Ride
      </button>
    </section>
  );
}
