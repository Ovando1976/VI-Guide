import {
  Bell,
  CalendarDays,
  Car,
  Compass,
  Landmark,
  Map,
  Search,
  Ship,
  ShoppingBag,
  Utensils,
  Waves,
  Mic,
} from "lucide-react";

type VisitorHomeProps = {
  selectedIslandLabel?: string;
  onNavigate: (path: string) => void;
};

const highlights = [
  {
    label: "Best Beach",
    title: "Magens Bay",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
  },
  {
    label: "Trending Restaurant",
    title: "Oceana",
    image: "/images/places/st-thomas/oceana-restaurant-1.jpg",
  },
  {
    label: "Tonight's Event",
    title: "Village Night",
    image: "/images/places/st-thomas/charlotte-amalie-historic-district-1.jpg",
  },
  {
    label: "Traffic",
    title: "Heavy",
    image: "/images/places/st-thomas/red-hook-marina-1.jpg",
  },
];

const actions = [
  { label: "Beaches", icon: Waves, path: "/beaches" },
  { label: "Dining", icon: Utensils, path: "/eat" },
  { label: "Shopping", icon: ShoppingBag, path: "/explore?category=shopping" },
  { label: "Sights", icon: Landmark, path: "/explore?category=attraction" },
  { label: "Events", icon: CalendarDays, path: "/events" },
  { label: "Mobility", icon: Car, path: "/mobility" },
  { label: "Cruise Planner", icon: Ship, path: "/cruise" },
  { label: "History", icon: Compass, path: "/history" },
];

export default function VisitorHome({
  selectedIslandLabel = "St. Thomas",
  onNavigate,
}: VisitorHomeProps) {
  return (
    <div className="min-h-screen pb-28 text-white">
      <section className="relative overflow-hidden rounded-b-[3rem] bg-emerald-950 px-5 pb-8 pt-8 shadow-2xl">
        <div className="absolute inset-0 opacity-30">
          <img
            src="/images/places/st-thomas/magens-bay-beach-1.jpg"
            alt=""
            className="h-full w-full object-cover"
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-emerald-100">Good Morning,</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight">
                {selectedIslandLabel}
              </h1>
            </div>

            <button className="relative rounded-full bg-white/15 p-3 backdrop-blur">
              <Bell className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold">
                3
              </span>
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-black">🌤️ 84°F</p>
              <p className="text-xs text-emerald-100">Partly cloudy</p>
            </div>

            <div className="text-right">
              <p className="text-3xl font-black">4</p>
              <p className="text-xs text-emerald-100">Cruise ships in port</p>
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-sm font-bold">Today's Highlights</p>
            <div className="grid grid-cols-2 gap-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="relative overflow-hidden rounded-2xl bg-white/10 p-3 shadow-lg backdrop-blur"
                >
                  <img
                    src={item.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover opacity-35"
                  />
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase text-emerald-100">
                      {item.label}
                    </p>
                    <p className="mt-8 text-sm font-black">{item.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigate("/explore")}
            className="mt-6 flex w-full items-center gap-3 rounded-3xl bg-white px-5 py-4 text-left text-stone-500 shadow-xl"
          >
            <Search className="h-5 w-5" />
            <span className="flex-1 text-sm">Search beaches, restaurants, places...</span>
            <Mic className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="grid grid-cols-4 gap-3">
          {actions.map((action) => (
            <button
              key={action.label}
              onClick={() => onNavigate(action.path)}
              className="rounded-3xl bg-white p-4 text-center text-stone-800 shadow-lg active:scale-95"
            >
              <action.icon className="mx-auto h-7 w-7 text-emerald-700" />
              <p className="mt-2 text-[11px] font-bold leading-tight">
                {action.label}
              </p>
            </button>
          ))}
        </div>

        <button
          onClick={() => onNavigate("/map")}
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-3xl bg-emerald-700 px-5 py-5 text-lg font-black shadow-xl"
        >
          <Map className="h-6 w-6" />
          Open Live Island Map
        </button>
      </section>
    </div>
  );
}
