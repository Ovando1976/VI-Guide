// src/App.tsx
import React, { Suspense, lazy, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import VisitorHome from "./components/VisitorHome";
import ErrorBoundary from "./components/ErrorBoundary";
import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { isIslandCode } from "./lib/utils/islands";
import type {
  AIDocument,
  BeachDoc,
  EventDoc,
  IslandCode,
  PlaceDoc,
} from "./types";
import EstateDetailPage from "./pages/estates/EstateDetailPage";
import EstateHistoryPage from "./pages/estates/EstateHistoryPage";
import EstateArchivesPage from "./pages/estates/EstateArchivesPage";

const Explore = lazy(() => import("./components/Explore"));
const Beaches = lazy(() => import("./components/Beaches"));
const Eat = lazy(() => import("./components/Eat"));
const Events = lazy(() => import("./components/Events"));
const Mobility = lazy(() => import("./components/Mobility"));
const Concierge = lazy(() => import("./components/Concierge"));
const Documents = lazy(() => import("./components/Documents"));
const Profile = lazy(() => import("./components/Profile"));
const MerchantDashboard = lazy(() => import("./components/MerchantDashboard"));
const CruisePlanner = lazy(() => import("./components/CruisePlanner"));
const Maps = lazy(() => import("./components/Maps"));
const HistoryKnowledgePage = lazy(() => import("./components/HistoryKnowledgePage"));
const GovernorsPage = lazy(() => import("./components/history/GovernorsPage"));

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
      {/* ADDED WRAPPER: This ensures text is visible on your dark background */}
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

      <Route path="/merchant" element={<MerchantDashboard user={null} profile={null} />} />
      <Route path="/cruise" element={<CruisePlanner />} />

      <Route path="/history" element={<HistoryKnowledgePage />} />
      <Route path="/history/knowledge" element={<Navigate to="/history" replace />} />
      <Route path="/history/timeline" element={<HistoryKnowledgePage />} />
      <Route path="/history/governors" element={<GovernorsPage />} />
      <Route path="/history/*" element={<Navigate to="/history" replace />} />

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
