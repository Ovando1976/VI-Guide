import { ArrowLeft, CarFront, ShieldCheck, Sparkles } from "lucide-react";

type MobilityHeroProps = {
  onBack?: () => void;
};

export default function MobilityHero({ onBack }: MobilityHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-3xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.28),transparent_45%),linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))]" />

      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mb-5 inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.25em] text-white/80"
            >
              <ArrowLeft size={16} />
              Back
            </button>
          ) : null}

          <p className="text-xs font-black uppercase tracking-[0.35em] text-turquoise">
            VI Mobility
          </p>

          <h1 className="mt-3 text-5xl font-serif text-white">
            Territory Mobility
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/65">
            Book island transportation with estate, parcel, ferry, airport,
            cruise, comfort, and official tariff intelligence.
          </p>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <HeroStat icon={<CarFront size={18} />} label="Licensed rides" />
            <HeroStat icon={<ShieldCheck size={18} />} label="Tariff aware" />
            <HeroStat icon={<Sparkles size={18} />} label="Visitor easy" />
          </div>
        </div>
      </div>
    </header>
  );
}

function HeroStat({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 p-4">
      <div className="mb-2 text-turquoise">{icon}</div>
      <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70">
        {label}
      </p>
    </div>
  );
}