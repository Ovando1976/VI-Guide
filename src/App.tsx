import React, { useState, useEffect } from "react";
import {
  Routes,
  Route,
  useLocation,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { auth, db } from "./firebase";
import {
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  UserProfile,
  BeachDoc,
  PlaceDoc,
  EventDoc,
  IslandCode,
  AIDocument,
  IslandDoc,
} from "./types";

import { MobileShell } from "./components/app-shell/MobileShell";
import Explore from "./components/Explore";
import Beaches from "./components/Beaches";
import Eat from "./components/Eat";
import Events from "./components/Events";
import Community from "./components/Community";
import Concierge from "./components/Concierge";
import Mobility from "./components/Mobility";
import Documents from "./components/Documents";
import Profile from "./components/Profile";
import MerchantDashboard from "./components/MerchantDashboard";
import ListingDetail from "./components/ListingDetail";
import EventDetail from "./components/EventDetail";
import ErrorBoundary from "./components/ErrorBoundary";
import { FeaturedSection } from "./components/FeaturedSection";
import CruisePlanner from "./components/CruisePlanner";
import Maps from "./components/Maps";
import PlatformStats from "./components/PlatformStats";
import { seedBeaches } from "./seedBeaches";

import { seedMapData } from "./seedMapData";
import { AnimatePresence, motion } from "motion/react";
import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { isIslandCode } from "./lib/utils/islands";
import { getIslands } from "./lib/firestore/islands";

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [islands, setIslands] = useState<IslandDoc[]>([]);
  const [selectedListing, setSelectedListing] = useState<
    BeachDoc | PlaceDoc | null
  >(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDoc | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(
    null
  );
  const [activeAgent, setActiveAgent] = useState<"concierge" | "operator">(
    "concierge"
  );
  const [seedStatus, setSeedStatus] = useState("");
  const [seeding, setSeeding] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const islandParam = searchParams.get("island");
  const exploreQueryParam = searchParams.get("q") ?? "";
  const selectedIsland = isIslandCode(islandParam)
    ? islandParam
    : DEFAULT_ISLAND;

  const isAdmin =
    profile?.role === "admin" ||
    user?.email?.toLowerCase() === "ovandorawlins@gmail.com";

  useEffect(() => {
    setActiveAgent(
      profile?.role === "merchant" || profile?.role === "admin"
        ? "operator"
        : "concierge"
    );
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
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const docRef = doc(db, "users", firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        const newProfile: UserProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || "Guest",
          photoURL: firebaseUser.photoURL || "",
          role:
            firebaseUser.email?.toLowerCase() === "ovandorawlins@gmail.com"
              ? "admin"
              : "user",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        await setDoc(docRef, newProfile);
        setProfile(newProfile);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;

    async function loadIslands() {
      try {
        const data = await getIslands();
        setIslands(data);
      } catch (error) {
        console.error("Error loading islands:", error);
      }
    }

    loadIslands();
  }, [loading]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();

    try {
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Login failed:", error);
      setSeedStatus(
        `Login failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleLogout = () => auth.signOut();

  const handleSelectDocument = (doc: AIDocument) => {
    setSelectedDocument(doc);
    navigate("/docs");
  };

  const handleSeedFirebase = async () => {
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
      setSeedStatus("Firebase seeded successfully. Open Live Map.");
      const refreshed = await getIslands();
      setIslands(refreshed);
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
  };

  if (loading) {
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

  return (
    <MobileShell isMerchant={profile?.role === "merchant"}>
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
                      Beaches, food, history, events, cruise planning, and
                      island discovery in one place.
                    </p>

                    <PlatformStats />

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <button
                        onClick={user ? handleSeedFirebase : handleLogin}
                        disabled={seeding}
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-emerald-950 disabled:opacity-50"
                      >
                        {!user
                          ? "Sign In to Seed"
                          : seeding
                          ? "Seeding..."
                          : "Seed Firebase"}
                      </button>

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
    </MobileShell>
  );
}
