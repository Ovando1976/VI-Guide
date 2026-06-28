import { CalendarDays, Car, ShipWheel, Sparkles } from "lucide-react";

const items = [
  {
    label: "Events Today",
    value: "14",
    icon: CalendarDays,
  },
  {
    label: "Cruise Activity",
    value: "2 Ships",
    icon: ShipWheel,
  },
  {
    label: "Ride Planning",
    value: "Ready",
    icon: Car,
  },
  {
    label: "Island AI",
    value: "Online",
    icon: Sparkles,
  },
];

export default function TodaySection() {
  return (
    <section className="mt-6">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
        Today
      </p>

      <h2 className="mt-1 text-3xl font-black">Island status</h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-[1.5rem] bg-white p-4 shadow-lg"
            >
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                <Icon className="h-5 w-5" />
              </div>

              <p className="mt-4 text-2xl font-black">{item.value}</p>
              <p className="mt-1 text-xs font-bold text-stone-500">
                {item.label}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}