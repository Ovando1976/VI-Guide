import { Car, Compass, Route, Sparkles } from "lucide-react";

type Props = {
  canAddStop: boolean;
  onExplore: () => void;
  onRoute: () => void;
  onRide: () => void;
  onAI: () => void;
  onAddStop: () => void;
};

const VI_LOGO = "/images/virgin_islands_us_round_icon_640.png";

export default function AtlasBottomDock({
  canAddStop,
  onExplore,
  onRoute,
  onRide,
  onAI,
  onAddStop,
}: Props) {
  return (
    <section className="absolute bottom-6 left-1/2 z-[750] hidden -translate-x-1/2 items-center rounded-[2rem] border border-white/10 bg-slate-950/88 p-3 text-white shadow-2xl backdrop-blur-xl md:flex">
      <DockButton icon={<Compass className="h-5 w-5" />} label="Explore" onClick={onExplore} />
      <DockButton icon={<Route className="h-5 w-5" />} label="Route" onClick={onRoute} />

      <button
        type="button"
        onClick={onAddStop}
        disabled={!canAddStop}
        className="mx-4 grid h-20 w-20 place-items-center overflow-hidden rounded-full border-4 border-emerald-300 bg-slate-950 shadow-2xl shadow-emerald-500/30 transition hover:scale-105 disabled:opacity-40"
        aria-label="Add selected place to day plan"
      >
        <img
          src={VI_LOGO}
          alt="Virgin Islands"
          className="h-full w-full object-cover"
        />
      </button>

      <DockButton icon={<Car className="h-5 w-5" />} label="Ride" onClick={onRide} />
      <DockButton icon={<Sparkles className="h-5 w-5" />} label="AI" onClick={onAI} />
    </section>
  );
}

function DockButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid min-w-20 place-items-center gap-1 rounded-2xl px-4 py-3 text-sm font-black text-white/80 transition hover:bg-white/10 hover:text-white"
    >
      {icon}
      {label}
    </button>
  );
}