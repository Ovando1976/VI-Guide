import type { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, MapPin, Navigation, Search, X } from "lucide-react";
import { cn } from "../../lib/utils";

export type EstateOption = {
  id: string;
  name: string;
  island?: string;
  quarter?: string;
  taxiZoneId?: string | null;
};

export type SearchResultItem = {
  key: string;
  label: string;
  subtitle: string;
  kind?: "estate" | "parcel" | "place" | "area";
  raw: unknown;
};

type PickerTarget = "pickup" | "dropoff" | null;

export default function SmartLocationPicker({
  pickup,
  dropoff,
  pickupBadge,
  dropoffBadge,
  pickupEstate,
  dropoffEstate,
  estateOptions = [],
  searchQuery,
  searchingFor,
  results = [],
  onPickupChange,
  onDropoffChange,
  onFocusPickup,
  onFocusDropoff,
  onSearchChange,
  onCloseSearch,
  onSelectResult,
  onSelectPickupEstate,
  onSelectDropoffEstate,
}: {
  pickup: string;
  dropoff: string;
  pickupBadge?: string;
  dropoffBadge?: string;
  pickupEstate?: string;
  dropoffEstate?: string;
  estateOptions?: EstateOption[];
  searchQuery: string;
  searchingFor: PickerTarget;
  results?: SearchResultItem[];
  onPickupChange: (value: string) => void;
  onDropoffChange: (value: string) => void;
  onFocusPickup: () => void;
  onFocusDropoff: () => void;
  onSearchChange: (value: string) => void;
  onCloseSearch: () => void;
  onSelectResult: (item: SearchResultItem) => void;
  onSelectPickupEstate?: (estate: EstateOption) => void;
  onSelectDropoffEstate?: (estate: EstateOption) => void;
}) {
  const activeValue = searchingFor === "pickup" ? pickup : dropoff;
  const q = searchQuery.trim().toLowerCase();

  const filteredEstates = estateOptions
    .filter((estate) => {
      if (!q) return true;

      return [estate.name, estate.quarter, estate.island, estate.taxiZoneId]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q));
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  function openPickup() {
    onFocusPickup();
    onSearchChange(pickup);
  }

  function openDropoff() {
    onFocusDropoff();
    onSearchChange(dropoff);
  }

  function changePickup(value: string) {
    onPickupChange(value);
    onSearchChange(value);
  }

  function changeDropoff(value: string) {
    onDropoffChange(value);
    onSearchChange(value);
  }

  function selectEstate(estate: EstateOption) {
    if (searchingFor === "pickup") {
      onPickupChange(estate.name);
      onSelectPickupEstate?.(estate);
    }

    if (searchingFor === "dropoff") {
      onDropoffChange(estate.name);
      onSelectDropoffEstate?.(estate);
    }

    onSearchChange("");
    onCloseSearch();
  }

  function selectResult(item: SearchResultItem) {
    onSelectResult(item);
    onSearchChange("");
    onCloseSearch();
  }

  return (
    <section className="relative rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
      <div className="space-y-4">
        <LocationInput
          icon={<MapPin size={18} />}
          accentClass="text-turquoise"
          label="Pickup Estate / Location"
          placeholder="Select pickup estate or type location..."
          value={pickup}
          badge={pickupBadge || pickupEstate}
          active={searchingFor === "pickup"}
          onFocus={openPickup}
          onChange={changePickup}
        />

        <LocationInput
          icon={<Navigation size={18} />}
          accentClass="text-coral"
          label="Destination Estate / Location"
          placeholder="Select destination estate or type location..."
          value={dropoff}
          badge={dropoffBadge || dropoffEstate}
          active={searchingFor === "dropoff"}
          onFocus={openDropoff}
          onChange={changeDropoff}
        />
      </div>

      <AnimatePresence>
        {searchingFor && (
          <motion.div
            key={searchingFor}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-4 top-full z-50 mt-3 overflow-hidden rounded-[1.75rem] border border-stone-100 bg-white text-ink shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-stone-100 p-4">
              <Search size={18} className="text-stone-400" />

              <input
                autoFocus
                type="text"
                placeholder={
                  searchingFor === "pickup"
                    ? "Search pickup estate..."
                    : "Search destination estate..."
                }
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                className="flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-stone-400"
              />

              <button
                type="button"
                onClick={() => {
                  onSearchChange("");
                  onCloseSearch();
                }}
                className="grid h-8 w-8 place-items-center rounded-full bg-stone-100 text-stone-500"
              >
                <X size={16} />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto p-2">
              <div className="sticky top-0 z-10 bg-white px-4 py-2">
                <p className="text-[9px] font-black uppercase tracking-[0.24em] text-stone-400">
                  Estates
                </p>
              </div>

              {filteredEstates.length > 0 ? (
                filteredEstates.map((estate) => (
                  <button
                    key={estate.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectEstate(estate)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-stone-50",
                      activeValue === estate.name && "bg-turquoise/10"
                    )}
                  >
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-turquoise/10 text-turquoise">
                      <MapPin size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black text-ink">
                        {estate.name}
                      </p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-stone-400">
                        {estate.quarter || estate.island || "Estate"}
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-sm font-serif italic text-stone-400">
                  No estate found.
                </div>
              )}

              {results.length > 0 ? (
                <>
                  <div className="sticky top-0 z-10 mt-2 bg-white px-4 py-2">
                    <p className="text-[9px] font-black uppercase tracking-[0.24em] text-stone-400">
                      Places & Landmarks
                    </p>
                  </div>

                  {results.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectResult(item)}
                      className="flex w-full items-center gap-4 rounded-2xl p-4 text-left transition hover:bg-stone-50"
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-coral/10 text-coral">
                        {item.kind === "parcel" ? (
                          <Navigation size={18} />
                        ) : (
                          <MapPin size={18} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-black text-ink">
                          {item.label}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-widest text-stone-400">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  ))}
                </>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function LocationInput({
  icon,
  accentClass,
  label,
  placeholder,
  value,
  badge,
  active,
  onFocus,
  onChange,
}: {
  icon: ReactNode;
  accentClass: string;
  label: string;
  placeholder: string;
  value: string;
  badge?: string;
  active: boolean;
  onFocus: () => void;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 pl-2 text-[9px] font-black uppercase tracking-[0.24em] text-white/45">
        {label}
      </p>

      <div className="relative">
        <div
          className={cn(
            "absolute left-4 top-1/2 z-10 -translate-y-1/2",
            accentClass
          )}
        >
          {icon}
        </div>

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onFocus={onFocus}
          onClick={onFocus}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full rounded-2xl border bg-white px-12 py-4 pr-32 text-sm font-semibold text-ink placeholder:text-stone-400 shadow-xl outline-none transition",
            active
              ? "border-turquoise ring-4 ring-turquoise/20"
              : "border-white/10 focus:ring-4 focus:ring-turquoise/20"
          )}
        />

        {badge ? (
          <span className="absolute right-12 top-1/2 max-w-24 -translate-y-1/2 truncate rounded-full bg-turquoise/10 px-2 py-1 text-[8px] font-bold uppercase tracking-widest text-turquoise">
            {badge}
          </span>
        ) : null}

        <button
          type="button"
          onClick={onFocus}
          className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-stone-100 text-stone-500"
        >
          <ChevronDown
            size={16}
            className={cn("transition", active ? "rotate-180" : "")}
          />
        </button>
      </div>
    </div>
  );
}