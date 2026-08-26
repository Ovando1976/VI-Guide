import dynamic from "next/dynamic";
import type { Metadata } from "next";
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

const mapDescription =
  "Explore St. Thomas, St. John, and St. Croix on the USVI Explorer Living Map, then save places, plan routes, connect rides, and keep your trip in context.";

export const metadata: Metadata = {
  title: "Living Map",
  description: mapDescription,
  alternates: { canonical: "/map" },
  openGraph: {
    type: "website",
    siteName: "USVI Explorer",
    title: "Living Map | USVI Explorer",
    description: mapDescription,
    url: "/map",
  },
  twitter: {
    card: "summary",
    title: "Living Map | USVI Explorer",
    description: mapDescription,
  },
};

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
              padding-bottom: calc(5.75rem + env(safe-area-inset-bottom)) !important;
            }

            .map-customer-page .map-experience-hero {
              border-radius: 20px;
              padding: 0.8rem 0.9rem;
            }

            .map-customer-page .territory-map-stage {
              border-radius: 22px !important;
            }

            .map-customer-page .territory-map-stage__header {
              padding: 0.75rem !important;
            }

            .map-customer-page .territory-map-stage__header h2 {
              font-size: 1.2rem !important;
            }

            .map-customer-page .territory-map-stage__canvas {
              min-height: 0 !important;
              padding: 0 !important;
            }

            .map-customer-page .premium-territory-map {
              border-radius: 18px !important;
            }

            .map-customer-page div:has(> .leaflet-container),
            .map-customer-page .leaflet-container {
              height: clamp(600px, calc(100dvh - 105px), 760px) !important;
              min-height: 600px;
            }

            .map-customer-page .premium-territory-map > [class*="inset-x-0"][class*="top-0"] {
              gap: 0.4rem !important;
              padding: 0.7rem !important;
            }

            .map-customer-page .premium-territory-map > [class*="inset-x-0"][class*="top-0"] > div:first-child > div:last-child {
              display: none;
            }

            .map-customer-page .premium-territory-map > [class*="inset-x-0"][class*="top-0"] > div:last-child {
              max-width: 58%;
              gap: 0.25rem !important;
            }

            .map-customer-page .premium-territory-map > [class*="inset-x-0"][class*="top-0"] > div:last-child > span,
            .map-customer-page .premium-territory-map > [class*="inset-x-0"][class*="top-0"] > div:last-child > button {
              min-height: 36px;
              padding: 0.4rem 0.5rem !important;
              font-size: 7px !important;
            }

            .map-customer-page .premium-territory-map > [class*="top-[94px]"] {
              left: 0.5rem !important;
              right: 0.5rem !important;
              top: 4.8rem !important;
              width: auto !important;
              max-width: calc(100% - 1rem) !important;
              overflow: hidden !important;
              flex-direction: row !important;
              align-items: center !important;
              justify-content: flex-start !important;
              gap: 0.35rem !important;
            }

            .map-customer-page .premium-territory-map > [class*="top-[94px]"] > div {
              flex: 1 1 auto;
              min-width: 0;
              max-width: none;
              overflow-x: auto;
              overscroll-behavior-inline: contain;
              -webkit-overflow-scrolling: touch;
              scrollbar-width: none;
              padding-right: 0.35rem;
            }

            .map-customer-page .premium-territory-map > [class*="top-[94px]"] > div::-webkit-scrollbar {
              display: none;
            }

            .map-customer-page .premium-territory-map > [class*="top-[94px]"] > button {
              flex: 0 0 42px;
              width: 42px;
              min-width: 42px;
              max-width: 42px;
              margin-right: 0 !important;
            }

            .map-customer-page .premium-territory-map > [class*="top-[94px]"] button {
              min-height: 40px;
            }

            .map-customer-page .premium-territory-map > [class*="top-[142px]"] {
              left: 0.5rem !important;
              right: 0.5rem !important;
              top: 7.65rem !important;
              padding: 0.35rem !important;
            }

            .map-customer-page .premium-territory-map > [class*="top-[142px]"] button {
              min-height: 40px;
            }

            .map-customer-page .premium-territory-map > [class*="bottom-0"] {
              padding-bottom: 0.5rem !important;
              padding-left: 0.5rem !important;
              padding-right: 0.5rem !important;
            }

            .map-customer-page .premium-territory-map > [class*="bottom-0"] > div {
              max-width: 100%;
              border-radius: 16px !important;
            }

            .map-customer-page .premium-territory-map > [class*="bottom-0"] button {
              min-height: 42px;
            }

            .map-customer-page .premium-territory-map > [class*="bottom-24"] {
              bottom: 4.75rem !important;
              left: 0.5rem !important;
              right: 0.5rem !important;
            }

            .map-customer-page .premium-territory-map > [class*="bottom-24"] a,
            .map-customer-page .premium-territory-map > [class*="bottom-24"] button {
              min-height: 44px;
            }

            .map-customer-page .premium-territory-map .leaflet-bottom.leaflet-right {
              bottom: calc(5rem + env(safe-area-inset-bottom)) !important;
              right: 0.45rem !important;
              top: auto !important;
            }

            .map-customer-page .premium-territory-map .leaflet-control-attribution {
              max-width: min(78vw, 330px);
              margin: 0 !important;
              padding: 2px 5px !important;
              border-radius: 7px 0 0 0;
              background: rgba(255, 255, 255, 0.84) !important;
              font-size: 7px !important;
              line-height: 1.25 !important;
              white-space: normal !important;
              text-align: right;
            }

            .map-customer-page .premium-territory-map .leaflet-control-zoom a {
              width: 42px;
              height: 42px;
              line-height: 42px;
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
