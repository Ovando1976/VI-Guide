import dynamic from "next/dynamic";
import { Suspense } from "react";

import { MapIntelligenceBridge } from "@/components/intelligence/map-intelligence-bridge";
import { TerrainDefaultController } from "@/components/map/terrain-default-controller";
import { LiveCatalogSync } from "@/components/territory/live-catalog-sync";

const ExplorerMapScreen = dynamic(
  () =>
    import("@/components/explorer/explorer-map-screen").then(
      (module) => module.ExplorerMapScreen,
    ),
  { ssr: false },
);

export default function MapPage() {
  return (
    <div className="map-customer-page">
      <TerrainDefaultController />
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
        <LiveCatalogSync />
        <MapIntelligenceBridge />
      </Suspense>
      <ExplorerMapScreen />
    </div>
  );
}
