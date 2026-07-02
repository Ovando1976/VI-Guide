import {
  Archive,
  Bell,
  Bookmark,
  Building2,
  CalendarDays,
  Compass,
  Layers,
  Map,
  MapPin,
  Route,
  Search,
  Umbrella,
  Waves,
} from "lucide-react";

type MapFilter = "all" | "estates" | "places" | "parcels";

type Props = {
  activeFilter: MapFilter;
  showParcels: boolean;
  showEstateLabels: boolean;
  savedCount: number;
  dayPlanCount: number;
  onOpenHistory: () => void;
  onOpenRoutePlanner: () => void;
  onOpenSavedPlaces: () => void;
  onOpenDayPlan: () => void;
  onFilterChange: (filter: MapFilter) => void;
  onToggleParcels: () => void;
  onToggleEstateLabels: () => void;
};

const filterButtons: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "estates", label: "Estates" },
  { id: "places", label: "Places" },
  { id: "parcels", label: "Parcels" },
];

export default function AtlasSidebar({
  activeFilter,
  showParcels,
  showEstateLabels,
  savedCount,
  dayPlanCount,
  onOpenHistory,
  onOpenRoutePlanner,
  onOpenSavedPlaces,
  onOpenDayPlan,
  onFilterChange,
  onToggleParcels,
  onToggleEstateLabels,
}: Props) {
  return (
    <aside className="absolute bottom-6 left-4 top-[150px] z-[830] w-[min(330px,calc(100vw-2rem))] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#07101f]/92 p-5 text-white shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10">
          <Search className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] text-white">
            Atlas Tools
          </p>
          <p className="mt-1 text-xs font-bold text-white/45">
            Filter, browse, route, and save
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {filterButtons.map((button) => (
          <button
            key={button.id}
            type="button"
            onClick={() => onFilterChange(button.id)}
            className={`rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
              activeFilter === button.id
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/10 text-white hover:bg-white/15"
            }`}
          >
            {button.label}
          </button>
        ))}
      </div>

      <div className="mt-7">
        <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.32em] text-white/35">
          Browse
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => onFilterChange("all")}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition ${
              activeFilter === "all"
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-3">
              <Compass className="h-4 w-4" />
              All Places
            </span>
            <span>1,248</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("estates")}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition ${
              activeFilter === "estates"
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-3">
              <MapPin className="h-4 w-4" />
              Estates
            </span>
            <span>420</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("places")}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition ${
              activeFilter === "places"
                ? "bg-emerald-400 text-slate-950"
                : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-3">
              <Waves className="h-4 w-4" />
              Beaches
            </span>
            <span>46</span>
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <Archive className="h-4 w-4" />
              History
            </span>
            <span>328</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("places")}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <Building2 className="h-4 w-4" />
              Businesses
            </span>
            <span>254</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("places")}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <Bell className="h-4 w-4" />
              Events
            </span>
            <span>62</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenHistory}
          className="mt-4 w-full rounded-2xl border border-yellow-300/25 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-100 transition hover:bg-yellow-400 hover:text-slate-950"
        >
          Open History Hub
        </button>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.32em] text-white/35">
          Map Tools
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onOpenRoutePlanner}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition hover:bg-white/10"
          >
            <Route className="h-4 w-4" />
            Route Planner
          </button>

          <button
            type="button"
            onClick={onOpenSavedPlaces}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <Bookmark className="h-4 w-4" />
              Saved Places
            </span>
            <span className="rounded-full bg-emerald-400 px-2 py-1 text-xs text-slate-950">
              {savedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenDayPlan}
            className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition hover:bg-white/10"
          >
            <span className="flex items-center gap-3">
              <CalendarDays className="h-4 w-4" />
              Day Plan
            </span>
            <span className="rounded-full bg-emerald-400 px-2 py-1 text-xs text-slate-950">
              {dayPlanCount}
            </span>
          </button>
        </div>
      </div>

      <div className="mt-7">
        <p className="mb-3 text-[0.68rem] font-black uppercase tracking-[0.32em] text-white/35">
          Layers
        </p>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onToggleParcels}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
              showParcels ? "bg-emerald-400 text-slate-950" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-3">
              <Map className="h-4 w-4" />
              Parcel Layer
            </span>
            <span>{showParcels ? "On" : "Off"}</span>
          </button>

          <button
            type="button"
            onClick={onToggleEstateLabels}
            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
              showEstateLabels ? "bg-emerald-400 text-slate-950" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            <span className="flex items-center gap-3">
              <Layers className="h-4 w-4" />
              Estate Labels
            </span>
            <span>{showEstateLabels ? "On" : "Off"}</span>
          </button>

          <button
            type="button"
            onClick={() => onFilterChange("places")}
            className="flex w-full items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-left text-sm font-black transition hover:bg-white/10"
          >
            <Umbrella className="h-4 w-4" />
            Visitor Places
          </button>
        </div>
      </div>
    </aside>
  );
}
