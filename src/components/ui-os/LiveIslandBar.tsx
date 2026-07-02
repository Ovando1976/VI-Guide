import { CalendarDays, Car, Ship, Sun, Waves } from "lucide-react";

const items = [
  { label: "Weather", value: "84°", icon: Sun },
  { label: "Cruise", value: "3 Ships", icon: Ship },
  { label: "Beaches", value: "Excellent", icon: Waves },
  { label: "Events", value: "6 Today", icon: CalendarDays },
  { label: "Taxi", value: "Live", icon: Car },
];

export function LiveIslandBar() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {items.map(({ label, value, icon: Icon }) => (
        <div
          key={label}
          className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-xl backdrop-blur"
        >
          <Icon className="h-5 w-5 text-emerald-300" />
          <p className="mt-3 text-lg font-black text-white">{value}</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}