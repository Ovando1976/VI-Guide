// src/App.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Route,
  Routes,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Compass,
  Map,
  Ship,
  Waves,
  CalendarDays,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
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
  IslandCode,
  IslandDoc,
  PlaceDoc,
  UserProfile,
} from "./types";

import ErrorBoundary from "./components/ErrorBoundary";
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
import { FeaturedSection } from "./components/FeaturedSection";
import CruisePlanner from "./components/CruisePlanner";
import Maps from "./components/Maps";
import PlatformStats from "./components/PlatformStats";

import VisitorHome from "./components/VisitorHome";

import { seedBeaches } from "./seedBeaches";
import { seedMapData } from "./seedMapData";
import { DEFAULT_ISLAND } from "./lib/constants/islands";
import { isIslandCode } from "./lib/utils/islands";
import { getIslands } from "./lib/firestore/islands";

const ADMIN_EMAILS = new Set(["ovandorawlins@gmail.com"]);

function createUserProfile(firebaseUser: User): UserProfile {
  const email = firebaseUser.email ?? "";

  return {
    uid: firebaseUser.uid,
    email,
    displayName: firebaseUser.displayName || "Guest",
    photoURL: firebaseUser.photoURL || "",
    role: ADMIN_EMAILS.has(email.toLowerCase()) ? "admin" : "user",
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

  const selectedIsland: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : DEFAULT_ISLAND;

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

  useEffect(() => {
    getRedirectResult(auth).catch((error) => {
      console.error("Redirect login failed:", error);
      setSeedStatus(error instanceof Error ? error.message : "Login failed.");
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
        } else {
          const newProfile = createUserProfile(firebaseUser);
          await setDoc(userRef, newProfile);
          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Auth profile load failed:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (loading) return;

    getIslands()
      .then(setIslands)
      .catch((error) => console.error("Island load failed:", error));
  }, [loading]);

  const handleLogin = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  }, []);

  const handleLogout = useCallback(() => {
    auth.signOut();
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
      await seedMapData();
      await seedBeaches();

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
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <HomeScreen
                user={user}
                isAdmin={isAdmin}
                seeding={seeding}
                seedStatus={seedStatus}
                selectedIsland={selectedIsland}
                exploreQueryParam={exploreQueryParam}
                onSeed={handleSeedFirebase}
                onLogin={handleLogin}
                onNavigate={navigate}
                onSelectListing={setSelectedListing}
              />
            }
          />
          <Route
            path="/"
            element={
              <VisitorHome
                selectedIslandLabel="St. Thomas"
                onNavigate={navigate}
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

function HomeScreen({
  user,
  isAdmin,
  seeding,
  seedStatus,
  selectedIsland,
  exploreQueryParam,
  onSeed,
  onLogin,
  onNavigate,
  onSelectListing,
}: {
  user: User | null;
  isAdmin: boolean;
  seeding: boolean;
  seedStatus: string;
  selectedIsland: IslandCode;
  exploreQueryParam: string;
  onSeed: () => void;
  onLogin: () => void;
  onNavigate: (path: string) => void;
  onSelectListing: (listing: BeachDoc | PlaceDoc) => void;
}) {
  return (
    <>
      <section className="px-4 pt-6">
        <div className="overflow-hidden rounded-[2rem] bg-emerald-950 text-white shadow-2xl">
          <div className="p-5">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">
              VI Navigator
            </p>

            <h1 className="mt-3 text-3xl font-black leading-tight">
              The operating system for island discovery.
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-emerald-50">
              Beaches, dining, history, cruise planning, events, mobility, and
              AI-powered local guidance across the Virgin Islands.
            </p>

            <PlatformStats />

            <div className="mt-6 grid grid-cols-2 gap-3">
              <HomeAction
                icon={Waves}
                label="Beaches"
                onClick={() => onNavigate("/beaches")}
              />
              <HomeAction
                icon={Map}
                label="Live Map"
                onClick={() => onNavigate("/map")}
              />
              <HomeAction
                icon={Ship}
                label="Cruise"
                onClick={() => onNavigate("/cruise")}
              />
              <HomeAction
                icon={CalendarDays}
                label="Events"
                onClick={() => onNavigate("/events")}
              />
              <HomeAction
                icon={Sparkles}
                label="AI Concierge"
                onClick={() => onNavigate("/concierge")}
              />
              <HomeAction
                icon={Compass}
                label="Explore"
                onClick={() => onNavigate("/explore")}
              />

              {isAdmin && (
                <button
                  onClick={user ? onSeed : onLogin}
                  disabled={seeding}
                  className="col-span-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-stone-950 disabled:opacity-50"
                >
                  {seeding ? "Seeding Firebase..." : "Seed Firebase"}
                </button>
              )}

              {seedStatus && (
                <div className="col-span-2 rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-bold text-emerald-100">
                  {seedStatus}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/10 bg-white/5 px-5 py-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
              <ShieldCheck className="h-4 w-4" />
              Curated USVI place data, map-ready coordinates, and local
              discovery.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-10" id="explore">
        <FeaturedSection
          selectedIsland={selectedIsland}
          onSelectListing={onSelectListing}
        />

        <Explore
          selectedIsland={selectedIsland}
          initialSearchQuery={exploreQueryParam}
          onSelectListing={onSelectListing}
        />
      </section>
    </>
  );
}

function HomeAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-2xl bg-white px-4 py-4 text-left text-emerald-950 shadow-lg transition active:scale-[0.98]"
    >
      <Icon className="mb-3 h-6 w-6 text-emerald-700" />
      <span className="text-sm font-black">{label}</span>
    </button>
  );
}
