// src/App.tsx
import { Suspense, lazy, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Loader2 } from "lucide-react";

import ErrorBoundary from "./components/ErrorBoundary";
import EnhancedPhotosPage from "./components/history/EnhancedPhotosPage";
import HistoricSiteDetailPage from "./pages/history/HistoricSiteDetailPage";
import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { isIslandCode } from "./lib/utils/islands";
import type {
  AIDocument,
  BeachDoc,
  EventDoc,
  IslandCode,
  PlaceDoc,
} from "./types";

const VisitorHome = lazy(() => import("./components/VisitorHome"));
const Explore = lazy(() => import("./components/Explore"));
const Beaches = lazy(() => import("./components/Beaches"));
const Eat = lazy(() => import("./components/Eat"));
const Events = lazy(() => import("./components/Events"));
const Maps = lazy(() => import("./components/Maps"));
const Mobility = lazy(() => import("./components/Mobility"));
const MobilityDriverPage = lazy(() => import("./pages/driver/MobilityDriverPage"));
const MobilityDispatchPage = lazy(
  () => import("./pages/admin/MobilityDispatchPage"),
);
const DriverConsolePage = lazy(() => import("./pages/driver/DriverConsolePage"));
const Concierge = lazy(() => import("./components/Concierge"));
const Documents = lazy(() => import("./components/Documents"));
const Profile = lazy(() => import("./components/Profile"));
const MerchantDashboard = lazy(() => import("./components/MerchantDashboard"));
const CruisePlanner = lazy(() => import("./components/CruisePlanner"));

const HistoryPage = lazy(() => import("./components/HistoryKnowledgePage"));
const GovernorsPage = lazy(() => import("./components/history/GovernorsPage"));

const PropertyReportRequestPage = lazy(
  () => import("./pages/history/PropertyReportRequestPage"),
);
const PropertyReportLeadsPage = lazy(
  () => import("./pages/admin/PropertyReportLeadsPage"),
);
const PropertyReportTemplatePage = lazy(
  () => import("./pages/admin/PropertyReportTemplatePage"),
);

const EstateDetailPage = lazy(() => import("./pages/estates/EstateDetailPage"));
const EstateHistoryPage = lazy(
  () => import("./pages/estates/EstateHistoryPage"),
);
const EstateArchivesPage = lazy(
  () => import("./pages/estates/EstateArchivesPage"),
);

function PageLoader() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#061016] text-emerald-300">
      <Loader2 className="h-10 w-10 animate-spin" />
    </main>
  );
}

function islandLabel(island: IslandCode) {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  return "Water Island";
}

export default function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#061016] text-white">
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

function AppRoutes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedListing, setSelectedListing] = useState<
    BeachDoc | PlaceDoc | EventDoc | null
  >(null);

  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(
    null,
  );

  const islandParam = searchParams.get("island") ?? undefined;
  const selectedIsland: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : DEFAULT_ISLAND;

  const selectedIslandLabel = islandLabel(selectedIsland);

  return (
    <Routes>
      <Route
        path="/"
        element={
          <VisitorHome
            selectedIsland={selectedIsland}
            selectedIslandLabel={selectedIslandLabel}
            onNavigate={navigate}
          />
        }
      />

      <Route
        path="/explore"
        element={
          <Explore
            selectedIsland={selectedIsland}
            initialSearchQuery={searchParams.get("q") ?? ""}
            onSelectListing={setSelectedListing}
          />
        }
      />

      <Route
        path="/beaches"
        element={<Beaches onSelectBeach={setSelectedListing} />}
      />

      <Route
        path="/eat"
        element={<Eat onSelectPlace={setSelectedListing} />}
      />

      <Route
        path="/events"
        element={
          <Events
            selectedIsland={selectedIsland}
            onSelectEvent={setSelectedListing}
          />
        }
      />

      <Route
        path="/map"
        element={<Maps selectedIsland={selectedIsland} user={null} />}
      />

      <Route
        path="/mobility"
        element={<Mobility selectedIsland={selectedIsland} user={null} />}
      />

      {/* Public/legacy dispatch URL redirects to the real admin route. */}
      <Route
        path="/mobility-dispatch"
        element={<Navigate to="/admin/mobility" replace />}
      />

      <Route
        path="/concierge"
        element={
          <Concierge
            user={null}
            profile={null}
            selectedIsland={selectedIsland}
            contextListing={selectedListing}
            onSelectListing={setSelectedListing}
            agentId="concierge"
          />
        }
      />

      <Route
        path="/docs"
        element={
          <Documents
            user={null}
            profile={null}
            initialDocument={selectedDocument}
            onClearInitial={() => setSelectedDocument(null)}
          />
        }
      />

      <Route
        path="/profile"
        element={
          <Profile
            user={null}
            profile={null}
            onLogin={() => {}}
            onLogout={() => {}}
            onSelectListing={setSelectedListing}
            onSelectDocument={setSelectedDocument}
          />
        }
      />

      <Route
        path="/merchant"
        element={<MerchantDashboard user={null} profile={null} />}
      />

      <Route path="/cruise" element={<CruisePlanner />} />

      <Route path="/history" element={<HistoryPage />} />
      <Route
        path="/history/knowledge"
        element={<Navigate to="/history" replace />}
      />
      <Route
        path="/history/timeline"
        element={<HistoryPage initialView="timeline" />}
      />
      <Route
        path="/history/governors"
        element={<HistoryPage initialView="governors" />}
      />
      <Route path="/history/governors-page" element={<GovernorsPage />} />
      <Route path="/history/enhanced-photos" element={<EnhancedPhotosPage />} />
      <Route path="/history/site/:siteId" element={<HistoricSiteDetailPage />} />
      <Route
        path="/history/property-report"
        element={<PropertyReportRequestPage />}
      />
      <Route path="/history/*" element={<Navigate to="/history" replace />} />

      <Route
        path="/admin"
        element={<Navigate to="/admin/property-report-leads" replace />}
      />
      <Route
        path="/admin/leads"
        element={<Navigate to="/admin/property-report-leads" replace />}
      />
      <Route
        path="/admin/property-report-leads"
        element={<PropertyReportLeadsPage />}
      />
      <Route
        path="/admin/property-report-template"
        element={<PropertyReportTemplatePage />}
      />

      {/* This is the route your dispatch button needs. */}
      <Route path="/admin/mobility" element={<MobilityDispatchPage />} />
              <Route path="/driver/mobility" element={<MobilityDriverPage />} />

      <Route path="/driver" element={<DriverConsolePage />} />

      <Route
        path="/property-report"
        element={<Navigate to="/history/property-report" replace />}
      />
      <Route
        path="/property-report-leads"
        element={<Navigate to="/admin/property-report-leads" replace />}
      />
      <Route
        path="/property-report-template"
        element={<Navigate to="/admin/property-report-template" replace />}
      />

      <Route path="/estates/:geoid" element={<EstateDetailPage />} />
      <Route path="/estates/:geoid/history" element={<EstateHistoryPage />} />
      <Route path="/estates/:geoid/archives" element={<EstateArchivesPage />} />

      <Route
        path="*"
        element={
          <VisitorHome
            selectedIsland={selectedIsland}
            selectedIslandLabel={selectedIslandLabel}
            onNavigate={navigate}
          />
        }
      />
    </Routes>
  );
}