"use client";

import Link from "next/link";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation,
  RadioTower,
  Route,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import { useUnifiedWorkspace } from "@/components/workspace/unified-workspace-controller";
import {
  createLivingMapFocusDetail,
  dispatchLivingMapFocus,
  type LivingMapFocusItem,
  type LivingMapFocusSource,
} from "@/lib/intelligence/map-focus-events";

function sourceLabel(source: LivingMapFocusSource) {
  if (source === "concierge-response") return "Concierge mapped";
  if (source === "concierge-recommendation") return "Concierge pick";
  if (source === "concierge-itinerary") return "Itinerary stop";
  if (source === "saved-stop") return "Saved stop";
  return "Live map context";
}

function focusItem(item: LivingMapFocusItem, source: LivingMapFocusSource) {
  const detail = createLivingMapFocusDetail([item], source, item.id);
  if (detail) dispatchLivingMapFocus(detail);
}

export function LivingMapDock() {
  const { state, clearLiveFocus } = useUnifiedWorkspace();
  const [expanded, setExpanded] = useState(false);

  const liveItems = useMemo(
    () =>
      (state.liveFocus?.items ?? []).filter(
        (item) => item.island === state.island,
      ),
    [state.island, state.liveFocus],
  );
  const liveIds = useMemo(
    () => new Set(liveItems.map((item) => `${item.island}:${item.id}`)),
    [liveItems],
  );
  const savedItems = useMemo(
    () =>
      state.savedStops
        .filter((item) => item.island === state.island)
        .filter((item) => !liveIds.has(`${item.island}:${item.id}`)),
    [liveIds, state.island, state.savedStops],
  );

  useEffect(() => {
    if (state.liveFocus?.issuedAt) setExpanded(true);
  }, [state.liveFocus?.issuedAt]);

  const hasRoute = Boolean(state.pickupGeoid || state.destinationGeoid);
  const hasContext = Boolean(
    state.selection || hasRoute || liveItems.length || savedItems.length,
  );
  if (!hasContext) return null;

  const selectedName = state.selection?.name ?? "No place selected";
  const routeLabel =
    state.pickupGeoid && state.destinationGeoid
      ? "Route ready"
      : hasRoute
        ? "Route needs one endpoint"
        : "No route yet";
  const primaryLiveItem =
    liveItems.find((item) => item.id === state.liveFocus?.primaryId) ??
    liveItems[0] ??
    null;
  const conciergeParams = new URLSearchParams({ island: state.island });
  const conciergeFocus = state.selection?.name ?? primaryLiveItem?.title;
  if (conciergeFocus) {
    conciergeParams.set(
      "prompt",
      `Help me plan the best next steps around ${conciergeFocus}. Use my current Living Map context, saved stops, and route.`,
    );
  }
  const conciergeHref = `/concierge?${conciergeParams.toString()}`;

  return (
    <aside
      className="pointer-events-none fixed inset-x-3 top-[6.65rem] z-[1320] mx-auto max-w-5xl sm:inset-x-5"
      aria-live="polite"
    >
      <div className="pointer-events-auto ml-auto overflow-hidden rounded-[22px] border border-white/45 bg-[#082c31]/95 text-white shadow-[0_18px_60px_rgba(3,31,34,.3)] backdrop-blur-xl sm:max-w-[720px]">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="flex w-full items-center gap-3 px-3 py-2.5 text-left sm:px-4"
          aria-expanded={expanded}
          aria-controls="living-map-context-content"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] bg-cyan-200 text-[#06343a]">
            <RadioTower size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex min-w-0 items-center gap-2">
              <strong className="truncate text-sm font-black">Living map context</strong>
              {liveItems.length ? (
                <span className="shrink-0 rounded-full bg-[#f5c451] px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-[#4d3500]">
                  {liveItems.length} live
                </span>
              ) : null}
            </span>
            <span className="mt-0.5 flex min-w-0 items-center gap-2 text-[9px] font-bold text-white/48">
              <MapPin size={10} className="shrink-0 text-cyan-200" />
              <span className="truncate">{selectedName}</span>
              <span className="text-white/20">·</span>
              <Navigation size={10} className="shrink-0 text-[#f5c451]" />
              <span className="shrink-0">{routeLabel}</span>
              <span className="text-white/20">·</span>
              <Bookmark size={10} className="shrink-0 text-cyan-200" />
              <span className="shrink-0">{state.savedStops.length} saved</span>
            </span>
          </span>
          {expanded ? (
            <ChevronUp size={17} className="shrink-0 text-white/55" />
          ) : (
            <ChevronDown size={17} className="shrink-0 text-white/55" />
          )}
        </button>

        <div
          id="living-map-context-content"
          className={`grid transition-[grid-template-rows,opacity] duration-300 ${
            expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="max-h-[330px] space-y-3 overflow-y-auto border-t border-white/10 px-3 py-3 sm:px-4">
              {state.liveFocus && liveItems.length ? (
                <section>
                  <div className="flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                      <Sparkles size={11} /> {sourceLabel(state.liveFocus.source)}
                    </div>
                    <button
                      type="button"
                      onClick={clearLiveFocus}
                      className="inline-flex items-center gap-1 rounded-full bg-white/[.07] px-2 py-1 text-[8px] font-black uppercase tracking-[.1em] text-white/48 hover:bg-white/[.12] hover:text-white"
                    >
                      <X size={10} /> Clear
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {liveItems.map((item) => (
                      <FocusChip
                        key={`live:${item.island}:${item.id}`}
                        item={item}
                        active={state.selection?.id === item.id}
                        onClick={() =>
                          focusItem(
                            item,
                            state.liveFocus?.source ?? "map-workspace",
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {savedItems.length ? (
                <section>
                  <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-cyan-100/55">
                    <Bookmark size={11} /> Saved stops on this island
                  </div>
                  <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                    {savedItems.slice(0, 10).map((item) => (
                      <FocusChip
                        key={`saved:${item.island}:${item.id}`}
                        item={item}
                        active={state.selection?.id === item.id}
                        onClick={() => focusItem(item, "saved-stop")}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <StatusCard
                  icon={<MapPin size={14} />}
                  label="Selected"
                  value={selectedName}
                />
                <StatusCard
                  icon={<Route size={14} />}
                  label="Route"
                  value={routeLabel}
                />
                <StatusCard
                  icon={<Bookmark size={14} />}
                  label="My trip"
                  value={`${state.savedStops.length} stops`}
                  className="col-span-2 sm:col-span-1"
                />
              </section>

              <section className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
                <Link
                  href="/trips"
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] bg-[#f5c451] px-3 text-[8px] font-black uppercase tracking-[.13em] text-[#043331] transition hover:bg-[#ffdc76]"
                >
                  <Route size={14} /> Open My Trip
                </Link>
                <Link
                  href={conciergeHref}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[15px] border border-white/12 bg-white/[.07] px-3 text-[8px] font-black uppercase tracking-[.13em] text-white transition hover:bg-white/[.12]"
                >
                  <Sparkles size={14} className="text-cyan-200" /> Ask Concierge
                </Link>
              </section>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function FocusChip({
  item,
  active,
  onClick,
}: {
  item: LivingMapFocusItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-w-[170px] max-w-[230px] rounded-[16px] border px-3 py-2.5 text-left transition ${
        active
          ? "border-[#f5c451]/70 bg-[#f5c451]/15"
          : "border-white/10 bg-white/[.055] hover:border-cyan-200/30 hover:bg-white/[.09]"
      }`}
    >
      <span className="block truncate text-[8px] font-black uppercase tracking-[.14em] text-cyan-100/45">
        {item.kind.replaceAll("_", " ")}
      </span>
      <strong className="mt-1 block truncate text-xs font-black text-white/82">
        {item.title}
      </strong>
      {item.summary ? (
        <span className="mt-1 block line-clamp-1 text-[9px] font-semibold text-white/38">
          {item.summary}
        </span>
      ) : null}
    </button>
  );
}

function StatusCard({
  icon,
  label,
  value,
  className = "",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`rounded-[15px] bg-black/15 px-3 py-2.5 ${className}`}>
      <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.14em] text-white/35">
        <span className="text-cyan-200/65">{icon}</span>
        {label}
      </div>
      <div className="mt-1 truncate text-[10px] font-black text-white/68">
        {value}
      </div>
    </div>
  );
}