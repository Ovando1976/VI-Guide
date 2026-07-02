import { useNavigate } from "react-router-dom";
import {
  Archive,
  BookOpen,
  Camera,
  Crown,
  Landmark,
  Map,
  MapPinned,
  Search,
  ShipWheel,
  Sparkles,
  Clock3,
} from "lucide-react";

const historyModules = [
  {
    title: "Timeline",
    subtitle: "Explore VI history by era, event, and place.",
    path: "/history/timeline",
    icon: Clock3,
  },
  {
    title: "Governors",
    subtitle: "Danish West Indies governors and administrations.",
    path: "/history/governors",
    icon: Crown,
  },
  {
    title: "Archives",
    subtitle: "Danish archives, NARA records, maps, and documents.",
    path: "/history/archives",
    icon: Archive,
  },
  {
    title: "Historic Maps",
    subtitle: "Historic map layers, old place names, and gazetteer evidence.",
    path: "/history/maps",
    icon: Map,
  },
  {
    title: "Historic Sites",
    subtitle: "Forts, churches, estates, ruins, and protected sites.",
    path: "/map?filter=history",
    icon: Landmark,
  },
  {
    title: "Geographic Dictionary",
    subtitle: "Search historical place names and dictionary entries.",
    path: "/dictionary",
    icon: BookOpen,
  },
  {
    title: "Gallery",
    subtitle: "Historic images, documents, scans, and visual records.",
    path: "/history/gallery",
    icon: Camera,
  },
  {
    title: "Atlas",
    subtitle: "Open the Territory Atlas and explore linked history.",
    path: "/map",
    icon: MapPinned,
  },
];

export default function HistoryPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-[#061016] px-4 py-6 pb-28 text-white">
      <section className="mx-auto max-w-7xl">
        <header className="overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.04] shadow-2xl">
          <div className="relative p-8 sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.34),transparent_45%),radial-gradient(circle_at_15%_20%,rgba(245,158,11,0.18),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98))]" />

            <div className="relative z-10 max-w-4xl">
              <div className="grid h-16 w-16 place-items-center rounded-3xl bg-emerald-300 text-slate-950 shadow-xl">
                <ShipWheel className="h-8 w-8" />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.34em] text-emerald-300">
                VI Guide History
              </p>

              <h1 className="mt-3 font-serif text-5xl font-black leading-none tracking-[-0.05em] sm:text-7xl">
                Historical Atlas
              </h1>

              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-white/65 sm:text-base">
                Explore the people, places, maps, archives, estates, governors,
                and historic records that shaped the Virgin Islands.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/history/governors")}
                  className="rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-slate-950 shadow-xl transition hover:bg-white"
                >
                  Open Governors
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/history/timeline")}
                  className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-black text-white shadow-xl transition hover:bg-white/15"
                >
                  View Timeline
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {historyModules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.title}
                type="button"
                onClick={() => navigate(module.path)}
                className="group rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 text-left shadow-xl transition hover:-translate-y-1 hover:bg-white/10 hover:shadow-2xl"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-emerald-300 transition group-hover:bg-emerald-300 group-hover:text-slate-950">
                  <Icon className="h-6 w-6" />
                </div>

                <h2 className="mt-5 text-xl font-black">{module.title}</h2>

                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {module.subtitle}
                </p>
              </button>
            );
          })}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 shadow-xl">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
              <Sparkles className="h-4 w-4" />
              Connected History Engine
            </p>

            <h2 className="mt-3 text-3xl font-black">Ask the island’s past</h2>

            <p className="mt-3 text-sm leading-relaxed text-white/60">
              The History section connects governors, estates, historic sites,
              dictionary entries, archive records, old maps, images, and the
              Territory Atlas into one searchable knowledge system.
            </p>

            <button
              type="button"
              onClick={() => navigate("/concierge?context=history")}
              className="mt-5 rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300"
            >
              Ask AI About History
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-6 shadow-xl">
            <p className="flex items-center gap-2 text-sm font-black text-emerald-300">
              <Search className="h-4 w-4" />
              Quick Searches
            </p>

            <div className="mt-4 grid gap-2">
              {[
                "Estate Nazareth history",
                "Danish governors",
                "Fort Christian",
                "Transfer Day",
                "Bovoni dictionary records",
              ].map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() =>
                    navigate(`/concierge?context=${encodeURIComponent(query)}`)
                  }
                  className="rounded-2xl bg-white/10 px-4 py-3 text-left text-sm font-bold text-white/75 transition hover:bg-white/15"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
