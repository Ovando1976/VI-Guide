import { Search, X } from "lucide-react";

type Props = {
  search: string;
  setSearch: (value: string) => void;
};

export default function MapSearchBar({ search, setSearch }: Props) {
  return (
    <div className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-white/15 bg-slate-950/70 px-4 shadow-inner">
      <Search className="h-5 w-5 shrink-0 text-white/75" />

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search places, estates, businesses, parcels..."
        className="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/38"
      />

      {search ? (
        <button type="button" onClick={() => setSearch("")}>
          <X className="h-5 w-5 text-white/70" />
        </button>
      ) : (
        <Search className="h-5 w-5 text-emerald-300" />
      )}
    </div>
  );
}