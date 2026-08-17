import dynamic from "next/dynamic";
import Link from "next/link";
import { Suspense } from "react";
import { MapPinned, Navigation, Route, Sparkles } from "lucide-react";

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
      <div className="map-customer-page min-h-screen bg-[#f4f1e8] pb-20 text-[#043331] md:pb-10">
        <TerrainDefaultController />

        <div className="hidden px-4 pt-5 sm:px-6 md:block lg:pt-8">
          <ViPublicHeader
            actionHref="/concierge?open=true&prompt=Help%20me%20explore%20the%20Virgin%20Islands%20from%20the%20Living%20Map"
            actionLabel="Ask Concierge"
            actionIcon={Sparkles}
            secondaryHref="/trips"
            secondaryLabel="My Trip"
          />
        </div>

        <section className="mx-auto max-w-[1680px] px-3 pt-3 sm:px-6 md:mt-4 md:pt-0">
          <div className="map-experience-hero relative isolate overflow-hidden rounded-[24px] border border-white/10 bg-[#043331] px-4 py-3.5 text-white shadow-[0_16px_45px_rgba(4,51,49,.16)] sm:px-6 md:rounded-[30px] md:px-7 md:py-5">
            <div className="absolute inset-0 -z-20 bg-[url('/images/usvi-harbor-hero.jpg')] bg-cover bg-[center_52%] opacity-35" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(2,36,35,.98)_0%,rgba(3,51,49,.9)_44%,rgba(3,51,49,.54)_72%,rgba(3,51,49,.34)_100%)]" />
            <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center md:gap-4">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[.2em] text-[#f8d77c]">
                  <MapPinned className="h-3.5 w-3.5" /> USVI Explorer · Living Map
                </div>
                <h1 className="vi-display mt-1.5 max-w-4xl text-[1.7rem] font-black leading-[.95] tracking-[-.05em] sm:text-4xl lg:text-5xl">
                  Your island, <span className="text-[#7ce0d4]">ready to explore.</span>
                </h1>
                <p className="mt-1.5 max-w-3xl text-[11px] font-semibold leading-4 text-white/68 sm:mt-2 sm:text-sm sm:leading-6">
                  Tap the map. Then save the stop, plan the route, ride there, or ask Concierge with the place already in context.
                </p>
                <div className="mt-3 hidden flex-wrap gap-1.5 lg:flex">
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

              <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2 md:max-w-[360px] md:justify-end">
                <Link
                  href="#territory-workspace"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#f5c451] px-2.5 text-[8px] font-black uppercase tracking-[.08em] text-[#043331] shadow-[0_12px_30px_rgba(245,196,81,.2)] transition hover:-translate-y-0.5 sm:px-4 sm:text-[9px] sm:tracking-[.12em]"
                >
                  <MapPinned className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Map
                </Link>
                <Link
                  href="/mobility"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/14 bg-white/[.08] px-2.5 text-[8px] font-black uppercase tracking-[.08em] text-white transition hover:bg-white/[.13] sm:px-4 sm:text-[9px] sm:tracking-[.12em]"
                >
                  <Navigation className="h-3.5 w-3.5 text-[#7ce0d4] sm:h-4 sm:w-4" /> Ride
                </Link>
                <Link
                  href="/planner"
                  className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/14 bg-white/[.08] px-2.5 text-[8px] font-black uppercase tracking-[.08em] text-white transition hover:bg-white/[.13] sm:px-4 sm:text-[9px] sm:tracking-[.12em]"
                >
                  <Route className="h-3.5 w-3.5 text-[#7ce0d4] sm:h-4 sm:w-4" /> Plan itinerary
                </Link>
              </div>
            </div>
          </div>
        </section>

        <style>{`
          .map-customer-page main {
            padding-bottom: 4rem !important;
          }

          @media (min-width: 701px) and (max-width: 1180px) {
            .map-customer-page div:has(> .leaflet-container),
            .map-customer-page .leaflet-container {
              height: min(720px, calc(100dvh - 150px)) !important;
              min-height: 600px;
            }
          }

          @media (max-width: 700px) {
            .map-customer-page main {
              padding-bottom: calc(5.25rem + env(safe-area-inset-bottom)) !important;
            }

            .map-customer-page div:has(> .leaflet-container),
            .map-customer-page .leaflet-container {
              height: max(520px, calc(100dvh - 210px)) !important;
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
