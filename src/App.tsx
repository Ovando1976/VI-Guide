import { useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";

import { auth } from "./firebase";
import type { AIDocument, BeachDoc, EventDoc, IslandCode, PlaceDoc, UserProfile } from "./types";

import ErrorBoundary from "./components/ErrorBoundary";
import { MobileShell } from "./components/app-shell/MobileShell";

import VisitorHome from "./components/VisitorHome";
import Explore from "./components/Explore";
import Beaches from "./components/Beaches";
import Eat from "./components/Eat";
import Events from "./components/Events";
import HistoricSites from "./components/HistoricSites";
import Community from "./components/Community";
import Concierge from "./components/Concierge";
import Mobility from "./components/Mobility";
import Documents from "./components/Documents";
import Profile from "./components/Profile";
import MerchantDashboard from "./components/MerchantDashboard";
import ListingDetail from "./components/ListingDetail";
import EventDetail from "./components/EventDetail";
import CruisePlanner from "./components/CruisePlanner";
import Maps from "./components/Maps";

import TimelinePage from "./pages/history/TimelinePage";
import GalleryPage from "./pages/history/GalleryPage";
import ArchivesPage from "./pages/history/ArchivesPage";

import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { isIslandCode } from "./lib/utils/islands";

type ListingSelection = BeachDoc | PlaceDoc;

const ISLAND_LABELS: Record<IslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

function getProfile(user: User | null): UserProfile | null {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: user.displayName ?? "Guest",
    photoURL: user.photoURL ?? "",
    role: user.email === "ovandorawlins@gmail.com" ? "admin" : "user",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedListing, setSelectedListing] = useState<ListingSelection | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDoc | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(null);

  const islandParam = searchParams.get("island") ?? undefined;

  const selectedIsland: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : DEFAULT_ISLAND;

  const selectedIslandLabel =
    ISLAND_LABELS[selectedIsland] ?? ISLAND_LABELS[DEFAULT_ISLAND];

  const activeAgent = useMemo(() => {
    if (profile?.role === "admin" || profile?.role === "merchant") return "operator";
    return "concierge";
  }, [profile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setProfile(getProfile(firebaseUser));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  function go(path: string) {
    navigate(path);
  }

  function handleLogin() {
    navigate("/concierge");
  }

  function handleLogout() {
    void signOut(auth);
  }

  function handleSelectDocument(document: AIDocument) {
    setSelectedDocument(document);
    navigate("/docs");
  }

  if (loading) return <AppLoader />;

  return (
    <MobileShell isMerchant={profile?.role === "merchant"}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <VisitorHome
                selectedIsland={selectedIsland}
                selectedIslandLabel={selectedIslandLabel}
                onNavigate={go}
                onSelectListing={setSelectedListing}
              />
            }
          />

          <Route
            path="/explore"
            element={
              <Explore
                selectedIsland={selectedIsland}
                onSelectListing={(listing: BeachDoc | PlaceDoc) =>
                  setSelectedListing(listing)
                }
              />
            }
          />

          <Route path="/beaches" element={<Beaches onSelectBeach={setSelectedListing} />} />
          <Route path="/eat" element={<Eat onSelectPlace={setSelectedListing} />} />

          <Route
            path="/events"
            element={
              <Events selectedIsland={selectedIsland} onSelectEvent={setSelectedEvent} />
            }
          />

          <Route path="/cruise" element={<CruisePlanner />} />
          <Route path="/map" element={<Maps selectedIsland={selectedIsland} user={user} />} />

          <Route
            path="/history"
            element={
              <HistoricSites
                selectedIsland="all"
                onSelectSite={(site: PlaceDoc) => setSelectedListing(site)}
              />
            }
          />

          <Route
            path="/history/timeline"
            element={<TimelinePage selectedIsland={selectedIsland} />}
          />

          <Route
            path="/history/gallery"
            element={<GalleryPage selectedIsland={selectedIsland} />}
          />

          <Route
            path="/history/archives"
            element={<ArchivesPage selectedIsland={selectedIsland} />}
          />

          <Route
            path="/mobility"
            element={<Mobility selectedIsland={selectedIsland} user={user} />}
          />

          <Route
            path="/community"
            element={<Community selectedIsland={selectedIsland} user={profile} />}
          />

          <Route
            path="/concierge"
            element={
              <Concierge
                user={user}
                profile={profile}
                contextListing={selectedListing}
                onSelectListing={setSelectedListing}
                agentId={activeAgent}
              />
            }
          />

          <Route
            path="/docs"
            element={
              <Documents
                user={user}
                profile={profile}
                initialDocument={selectedDocument}
                onClearInitial={() => setSelectedDocument(null)}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile
                user={user}
                profile={profile}
                onLogin={handleLogin}
                onLogout={handleLogout}
                onSelectListing={setSelectedListing}
                onSelectDocument={handleSelectDocument}
              />
            }
          />

          <Route path="/merchant" element={<MerchantDashboard user={user} profile={profile} />} />
        </Routes>
      </AnimatePresence>

      <AnimatePresence>
        {selectedListing && (
          <ListingDetail listing={selectedListing} onClose={() => setSelectedListing(null)} />
        )}

        {selectedEvent && (
          <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        )}
      </AnimatePresence>
    </MobileShell>
  );
}

function AppLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-stone-50">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent"
      />
    </div>
  );
}