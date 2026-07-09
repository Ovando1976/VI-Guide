// src/App.tsx

import React, { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import type { User } from "firebase/auth";
function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-8 text-center">
      <div className="rounded-[2rem] bg-white/80 px-8 py-6 shadow-xl">
        <p className="font-serif text-xl italic text-stone-500">
          Loading island tools…
        </p>
      </div>
    </div>
  );
}

import type {
  AIDocument,
  BeachDoc,
  EventDoc,
  IslandCode,
  IslandDoc,
  PlaceDoc,
  UserProfile,
} from "./types";

import ErrorBoundary from "./components/ErrorBoundary";
import { MobileShell } from "./components/app-shell/MobileShell";
import VisitorHome from "./components/VisitorHome";

import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { isIslandCode } from "./lib/utils/islands";
const Explore = lazy(() => import("./components/Explore"));
const Beaches = lazy(() => import("./components/Beaches"));
const Eat = lazy(() => import("./components/Eat"));
const VIConnect = lazy(() => import("./components/VIConnect"));
const CruisePlanner = lazy(() => import("./components/CruisePlanner"));
const Maps = lazy(() => import("./components/Maps"));
const Events = lazy(() => import("./components/Events"));
const MobilityDispatchDemo = lazy(() => import("./components/MobilityDispatchDemo"));
const Mobility = lazy(() => import("./components/Mobility"));
const Community = lazy(() => import("./components/Community"));
const Concierge = lazy(() => import("./components/Concierge"));
const Documents = lazy(() => import("./components/Documents"));
const Profile = lazy(() => import("./components/Profile"));
const AdminLeadsDashboard = lazy(() => import("./components/AdminLeadsDashboard"));
const DemoHub = lazy(() => import("./components/DemoHub"));
const PartnersPage = lazy(() => import("./components/PartnersPage"));
const MerchantDemoDashboard = lazy(() => import("./components/MerchantDemoDashboard"));
const MerchantDashboard = lazy(() => import("./components/MerchantDashboard"));
const ListingDetail = lazy(() => import("./components/ListingDetail"));
const EventDetail = lazy(() => import("./components/EventDetail"));
const PlatformStats = lazy(() => import("./components/PlatformStats"));

const ADMIN_EMAILS = new Set(["ovandorawlins@gmail.com"]);


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
  const [islands, setIslands] = useState<IslandDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedListing, setSelectedListing] = useState<
    BeachDoc | PlaceDoc | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDoc | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(
    null
  );

  const [seedStatus, setSeedStatus] = useState("");
  const [seeding, setSeeding] = useState(false);

  const islandParam = searchParams.get("island");
  const selectedIsland: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : DEFAULT_ISLAND;

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;

    const timer = window.setTimeout(() => {
      import("./lib/appAuth")
        .then((authModule) => {
          if (cancelled) return;

          authModule.completeRedirectSignIn().catch((error) => {
            console.error("Redirect login failed:", error);
            setSeedStatus(error instanceof Error ? error.message : "Login failed.");
          });

          unsubscribe = authModule.startAppAuth({
            setUser,
            setProfile,
          });
        })
        .catch((error) => {
          console.warn("Firebase auth module failed to load:", error);
        });
    }, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    import("./lib/firestore/islands")
      .then(({ getIslands }) => getIslands())
      .then(setIslands)
      .catch((error) => console.error("Island load failed:", error));
  }, []);

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase();
    return (
      profile?.role === "admin" || Boolean(email && ADMIN_EMAILS.has(email))
    );
  }, [profile, user]);

  const activeAgent =
    profile?.role === "merchant" || profile?.role === "admin"
      ? "operator"
      : "concierge";

const handleLogin = useCallback(async () => {
    await import("./lib/appAuth").then((authModule) =>
      authModule.signInWithGoogle()
    );
  }, []);

  const handleLogout = useCallback(() => {
    void import("./lib/appAuth").then((authModule) =>
      authModule.signOutOfApp()
    );
  }, []);

  const handleSelectDocument = useCallback(
    (document: AIDocument) => {
      setSelectedDocument(document);
      navigate("/docs");
    },
    [navigate]
  );

  const handleSeedFirebase = useCallback(async () => {
    if (seeding) return;

    if (!user) {
      await handleLogin();
      return;
    }

    if (!isAdmin) {
      setSeedStatus("Only an admin account can seed Firebase.");
      return;
    }

    setSeeding(true);
    setSeedStatus("Seeding Firebase...");

    try {
      const [{ seedMapData }, { seedBeaches }] = await Promise.all([
        import("./seedMapData"),
        import("./seedBeaches"),
      ]);

      await seedMapData();
      await seedBeaches();

    
      const { getIslands } = await import("./lib/firestore/islands");
      const refreshedIslands = await getIslands();
      setIslands(refreshedIslands);

      setSeedStatus("Firebase seeded successfully.");
    } catch (error) {
      console.error("Seed failed:", error);
      setSeedStatus(error instanceof Error ? error.message : "Seed failed.");
    } finally {
      setSeeding(false);
    }
  }, [handleLogin, isAdmin, seeding, user]);

  if (loading) {
    return <AppLoader />;
  }

  return (
    <MobileShell isMerchant={profile?.role === "merchant"}>
      <AnimatePresence mode="wait">
        <Suspense fallback={<RouteLoadingFallback />}><Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <VisitorHome
                selectedIsland={selectedIsland}
                onNavigate={navigate}
                onSelectListing={setSelectedListing}
              />
            }
          />

          <Route
            path="/explore"
            element={
              <Explore
                selectedIsland={selectedIsland}
                onSelectListing={setSelectedListing}
              />
            }
          />

          <Route
            path="/beaches"
            element={<Beaches onSelectBeach={setSelectedListing} />}
          />
          <Route path="/cruise" element={<CruisePlanner />} />
          <Route
            path="/map"
            element={<Maps selectedIsland={selectedIsland} user={user} />}
          />
          <Route
            path="/eat"
            element={<Eat onSelectPlace={setSelectedListing} />}
          />

          <Route
            path="/history"
            element={
              <Explore
                selectedIsland={selectedIsland}
                initialSearchQuery="history"
                onSelectListing={setSelectedListing}
              />
            }
          />

          <Route
            path="/events"
            element={
              <Events
                selectedIsland={selectedIsland}
                onSelectEvent={setSelectedEvent}
              />
            }
          />
          <Route
            path="/connect"
            element={<VIConnect selectedIsland={selectedIsland} user={user} />}
          />

          <Route path="/mobility/dispatch" element={<MobilityDispatchDemo />} />

          <Route
            path="/mobility"
            element={<Mobility selectedIsland={selectedIsland} user={user} />}
          />

          <Route
            path="/community"
            element={
              <Community selectedIsland={selectedIsland} user={profile} />
            }
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
                onLogout={handleLogout}
                onLogin={handleLogin}
                onSelectListing={setSelectedListing}
                onSelectDocument={handleSelectDocument}
              />
            }
          />

          <Route path="/admin/leads" element={<AdminLeadsDashboard />} />

          <Route path="/demo" element={<DemoHub />} />

          <Route path="/partners" element={<PartnersPage />} />

          <Route path="/merchant/demo" element={<MerchantDemoDashboard />} />

          <Route
            path="/merchant"
            element={<MerchantDashboard user={user} profile={profile} />}
          />
        </Routes></Suspense>
      </AnimatePresence>

      <AnimatePresence>
        {selectedListing && (
          <ListingDetail
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
          />
        )}

        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
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
        transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
        className="h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent"
      />
    </div>
  );
}
