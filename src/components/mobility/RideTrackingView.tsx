import { Loader2, MessageCircle, Phone, Shield } from "lucide-react";
import type { Trip } from "../../types";

export default function RideTrackingView({
  trip,
  onCancel,
}: {
  trip: Trip;
  onCancel: () => void;
}) {
  const steps = [
    "Request received",
    "Matching licensed operator",
    "Driver assigned",
    "Driver arriving",
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[2.5rem] border border-white/10 bg-white p-8 text-center text-ink shadow-2xl">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-turquoise/10 text-turquoise">
          <Loader2 className="animate-spin" size={48} />
        </div>

        <h2 className="mt-6 text-4xl font-serif italic text-ink">
          Finding your island driver
        </h2>

        <p className="mt-2 text-sm font-serif italic text-stone-500">
          We’re matching you with the best licensed operator nearby.
        </p>

        <div className="mt-8 grid gap-3 text-left">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3 rounded-2xl bg-sand/30 p-4">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-turquoise/10 text-xs font-black text-turquoise">
                {index + 1}
              </div>
              <p className="text-sm font-bold text-ink">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <TrackingCard label="Status" value={trip.status.replace("_", " ")} />
          <TrackingCard label="Trip ID" value={`#${trip.id.slice(-6)}`} />
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex-1 rounded-2xl bg-sand/40 py-4 text-[10px] font-black uppercase tracking-widest text-ink">
            <Phone size={16} className="mx-auto mb-1" />
            Call
          </button>
          <button className="flex-1 rounded-2xl bg-sand/40 py-4 text-[10px] font-black uppercase tracking-widest text-ink">
            <MessageCircle size={16} className="mx-auto mb-1" />
            Message
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-turquoise/10 bg-turquoise/5 p-4 text-left">
          <Shield size={18} className="text-turquoise" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-turquoise">
            Fare and pickup details are saved with your ride request.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="w-full rounded-3xl border border-white/10 bg-white/10 py-5 text-[10px] font-black uppercase tracking-[0.3em] text-coral shadow-xl transition hover:bg-coral hover:text-white"
      >
        Cancel Request
      </button>
    </section>
  );
}

function TrackingCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-sand/30 p-4">
      <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">
        {label}
      </p>
      <p className="text-xs font-bold uppercase tracking-widest text-ink">{value}</p>
    </div>
  );
}