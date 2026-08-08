import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { Compass, MapPinned, Navigation, Route, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { MapIntelligenceBridge } from "@/components/intelligence/map-intelligence-bridge";
import { MapEntityContextBar } from "@/components/map/map-entity-context-bar";
import { TerrainDefaultController } from "@/components/map/terrain-default-controller";
import { LiveCatalogSync } from "@/components/territory/live-catalog-sync";
import { LivingMapBridge } from "@/components/workspace/living-map-bridge";
import { LivingMapDock } from "@/components/workspace/living-map-dock";
import { UnifiedMapWorkspaceBar } from "@/components/workspace/unified-map-workspace-bar";
import { UnifiedWorkspaceProvider } from "@/components/workspace/unified-workspace-controller";

const ExplorerMapScreen = dynamic(
  () =>
    import("@/components/explorer/explorer-map-screen").then(
      (module) => module.ExplorerMapScreen,
    ),
  { ssr: false },
);

const MAP_MODES = ["Places", "Beaches", "Stays", "History", "Rides"] as const;

export default function MapPage() {
  return (
    <UnifiedWorkspaceProvider>
      <div className="map-customer-page min-h-screen bg-[#f4f1e8] pb-28 text-[#043331]">
        <TerrainDefaultController />

        <div className="px-4 pt-5 sm:px-6 lg:pt-8">
          <ViPublicHeader
            actionHref="/concierge?open=true&prompt=Help%20me%20explore%20the%20Virgin%20Islands%20from%20the%20Living%20Map"
            actionLabel="Ask Concierge"
            actionIcon={Sparkles}
            secondaryHref="/trips"
            secondaryLabel="My Trip"
          />
        </div>

        <section className="mx-auto mt-5 max-w-[1680px] px-4 sm:px-6">
          <div className="map-experience-hero relative isolate overflow-hidden rounded-[34px] border border-white/10 bg-[#043331] px-6 py-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.2)] sm:px-8 sm:py-9 lg:px-10">
            <div className="absolute inset-0 -z-20 bg-[url('/images/usvi-harbor-hero.jpg')] bg-cover bg-[center_52%] opacity-35" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,36,35,.98)_0%,rgba(3,51,49,.9)_44%,rgba(3,51,49,.54)_72%,rgba(3,51,49,.34)_100%)]" />
            <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-[#f5c451]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f8d77c]">
                  <MapPinned className="h-4 w-4" /> VI Guide Living Map
                </div>
                <h1 className="vi-display mt-4 max-w-4xl text-4xl font-black leading-[.92] tracking-[-.055em] sm:text-5xl lg:text-6xl">
                  See the islands as a <span className="text-[#7ce0d4]">connected day.</span>
                </h1>
                <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/68 sm:text-base sm:leading-7">
                  Discover a place, understand what is around it, save it to your trip, plan the route, and ask Concierge without leaving the map context.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {MAP_MODES.map((mode) => (
                    <span
                      key={mode}
                      className="rounded-full border border-white/12 bg-white/[.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-white/72 backdrop-blur"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 lg:max-w-[360px] lg:justify-end">
                <Link
                  href="#territory-workspace"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] shadow-[0_12px_30px_rgba(245,196,81,.2)] transition hover:-translate-y-0.5"
                >
                  <Compass className="h-4 w-4" /> Explore now
                </Link>
                <Link
                  href="/mobility"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.08] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:bg-white/[.13]"
                >
                  <Navigation className="h-4 w-4 text-[#7ce0d4]" /> Plan a ride
                </Link>
                <Link
                  href="/planner"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.08] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:bg-white/[.13]"
                >
                  <Route className="h-4 w-4 text-[#7ce0d4]" /> Plan itinerary
                </Link>
              </div>
            </div>
          </div>
        </section>

        <style>{`
          .map-customer-page main {
            padding-bottom: 10rem !important;
          }

          @media (min-width: 701px) and (max-width: 1180px) {
            .map-customer-page div:has(> .leaflet-container) {
              height: 620px !important;
            }

            .map-customer-page .leaflet-container {
              height: 620px !important;
            }

            body:has(.map-customer-page) .app-nav {
              width: min(610px, calc(100vw - 40px));
              bottom: max(18px, env(safe-area-inset-bottom));
            }
          }

          @media (max-width: 700px) {
            .map-customer-page main {
              padding-bottom: 9rem !important;
            }
          }
        `}</style>

        <Suspense fallback={null}>
          <UnifiedMapWorkspaceBar />
          <LivingMapBridge />
          <LivingMapDock />
          <LiveCatalogSync />
          <MapIntelligenceBridge />
          <MapEntityContextBar />
        </Suspense>
        <ExplorerMapScreen />
      </div>
    </UnifiedWorkspaceProvider>
  );
}
