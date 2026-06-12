import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  GoogleAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithRedirect,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { auth, db } from "./firebase";
import type {
  AIDocument,
  BeachDoc,
  EventDoc,
  IslandDoc,
  PlaceDoc,
  UserProfile,
} from "./types";

import { MobileShell } from "./components/app-shell/MobileShell";
import ErrorBoundary from "./components/ErrorBoundary";
import { FeaturedSection } from "./components/FeaturedSection";
import PlatformStats from "./components/PlatformStats";

import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { getIslands } from "./lib/firestore/islands";
import { isIslandCode } from "./lib/utils/islands";
import { seedMapData } from "./seedMapData";
import { seedBeaches } from "./seedBeaches";

const Explore = lazy(() => import("./components/Explore"));
const Beaches = lazy(() => import("./components/Beaches"));
const Eat = lazy(() => import("./components/Eat"));
const Events = lazy(() => import("./components/Events"));
const Community = lazy(() => import("./components/Community"));
const Concierge = lazy(() => import("./components/Concierge"));
const Mobility = lazy(() => import("./components/Mobility"));
const Documents = lazy(() => import("./components/Documents"));
const Profile = lazy(() => import("./components/Profile"));
const MerchantDashboard = lazy(() => import("./components/MerchantDashboard"));
const ListingDetail = lazy(() => import("./components/ListingDetail"));
const EventDetail = lazy(() => import("./components/EventDetail"));
const CruisePlanner = lazy(() => import("./components/CruisePlanner"));
const Maps = lazy(() => import("./components/Maps"));

const ADMIN_EMAILS = new Set(["ovandorawlins@gmail.com"]);

function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={
        fullScreen
          ? "flex h-screen w-screen items-center justify-center bg-stone-50"
          : "flex min-h-[50vh] items-center justify-center"
      }
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "linear" }}
        className="h-10 w-10 rounded-full border-4 border-emerald-600 border-t-transparent"
      />
    </div>
  );
}

function createUserProfile(firebaseUser: User): UserProfile {
  const email = firebaseUser.email?.toLowerCase() ?? "";

  return {
    uid: firebaseUser.uid,
    email,
    displayName: firebaseUser.displayName || "Guest",
    photoURL: firebaseUser.photoURL || "",
    role: ADMIN_EMAILS.has(email) ? "admin" : "user",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <AppContent />
      </Suspense>
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
  const [loading, setLoading] = useState(true);

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
  const exploreQueryParam = searchParams.get("q") ?? "";

  const selectedIsland = useMemo(
    () => (isIslandCode(islandParam) ? islandParam : DEFAULT_ISLAND),
    [islandParam]
  );

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase() ?? "";
    return profile?.role === "admin" || ADMIN_EMAILS.has(email);
  }, [profile, user]);

  const activeAgent = useMemo<"concierge" | "operator">(() => {
    return profile?.role === "merchant" || profile?.role === "admin"
      ? "operator"
      : "concierge";
  }, [profile]);

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login failed:", error);
      setSeedStatus(
        `Redirect login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (!firebaseUser) {
          setProfile(null);
          return;
        }

        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
          return;
        }

        const newProfile = createUserProfile(firebaseUser);
        await setDoc(userRef, newProfile);
        setProfile(newProfile);
      } catch (error) {
        console.error("Auth/profile load failed:", error);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    let cancelled = false;

    async function loadIslandData() {
      try {
        const data = await getIslands();
        if (!cancelled) setIslands(data);
      } catch (error) {
        console.error("Error loading islands:", error);
      }
    }

    loadIslandData();

    return () => {
      cancelled = true;
    };
  }, [loading]);

  const handleLogin = useCallback(async () => {
    try {
      await signInWithRedirect(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed:", error);
      setSeedStatus(
        `Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await auth.signOut();
    setSelectedListing(null);
    setSelectedEvent(null);
    setSelectedDocument(null);
    navigate("/");
  }, [navigate]);

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
      await seedMapData();
      await seedBeaches();

      const refreshedIslands = await getIslands();
      setIslands(refreshedIslands);
      setSeedStatus("Firebase seeded successfully.");
    } catch (error) {
      console.error("Seed Firebase failed:", error);
      setSeedStatus(
        `Seed failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSeeding(false);
    }
  }, [handleLogin, isAdmin, seeding, user]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <MobileShell isMerchant={profile?.role === "merchant"}>
      <Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/"
              element={
                <>
                  <section className="px-4 pt-6">
                    <div className="rounded-3xl bg-emerald-950 p-5 text-white shadow-xl">
                      <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                        VI Navigator Alpha
                      </p>

                      <h1 className="mt-2 text-2xl font-bold">
                        The digital guide to the Virgin Islands.
                      </h1>

                      <p className="mt-2 text-sm text-emerald-50">
                        Beaches, food, history, events, cruise planning, maps,
                        mobility, and island discovery in one place.
                      </p>

                      <PlatformStats />

                      <div className="mt-5 grid grid-cols-2 gap-3">
                        {isAdmin && (
                          <button
                            onClick={handleSeedFirebase}
                            disabled={seeding}
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 disabled:opacity-50"
                          >
                            {seeding ? "Seeding..." : "Seed Firebase"}
                          </button>
                        )}

                        {!user && (
                          <button
                            onClick={handleLogin}
                            className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950"
                          >
                            Sign In
                          </button>
                        )}

                        <button
                          onClick={() => navigate("/beaches")}
                          className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950"
                        >
                          Beaches
                        </button>

                        <button
                          onClick={() => navigate("/cruise")}
                          className="rounded-2xl bg-amber-300 px-4 py-3 text-sm font-bold text-stone-950"
                        >
                          Cruise Visitor
                        </button>

                        <button
                          onClick={() => navigate("/events")}
                          className="rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white"
                        >
                          Events
                        </button>

                        <button
                          onClick={() => navigate("/map")}
                          className="col-span-2 rounded-2xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white"
                        >
                          Live Map
                        </button>

                        {seedStatus && (
                          <div className="col-span-2 rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-bold text-emerald-100">
                            {seedStatus}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>

                  <div className="mt-12" id="explore">
                    <FeaturedSection
                      selectedIsland={selectedIsland}
                      onSelectListing={setSelectedListing}
                    />

                    <Explore
                      selectedIsland={selectedIsland}
                      initialSearchQuery={exploreQueryParam}
                      onSelectListing={setSelectedListing}
                    />
                  </div>
                </>
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
              path="/events"
              element={
                <Events
                  selectedIsland={selectedIsland}
                  onSelectEvent={setSelectedEvent}
                />
              }
            />

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

            <Route
              path="/merchant"
              element={<MerchantDashboard user={user} profile={profile} />}
            />
          </Routes>
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
      </Suspense>
    </MobileShell>
  );
}
