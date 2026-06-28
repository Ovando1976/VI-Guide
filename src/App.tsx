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
import CruisePlanner from "./components/CruisePlanner";
import Maps from "./components/Maps";
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
    displayName: firebaseUser.displayName ?? "Guest",
    photoURL: firebaseUser.photoURL ?? "",
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

  const islandParam = searchParams.get("island") ?? undefined;
  const selectedIsland: IslandCode = isIslandCode(islandParam)
    ? islandParam
    : DEFAULT_ISLAND;

  const isAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase();
    return profile?.role === "admin" || Boolean(email && ADMIN_EMAILS.has(email));
  }, [profile, user]);

  const activeAgent: "concierge" | "operator" =
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
      setLoading(true);

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

    return () => unsubscribe();
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

  const handleLogout = useCallback(async () => {
    await auth.signOut();
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
      {isAdmin && seedStatus && (
        <div className="mx-4 mt-3 rounded-2xl bg-emerald-950 px-4 py-3 text-center text-xs font-bold text-emerald-50">
          {seedStatus}
        </div>
      )}

      {isAdmin && (
        <div className="mx-4 mt-3">
          <button
            type="button"
            onClick={handleSeedFirebase}
            disabled={seeding}
            className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-black text-stone-950 disabled:opacity-50"
          >
            {seeding ? "Seeding Firebase..." : "Seed Firebase"}
          </button>
        </div>
      )}

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <VisitorHome
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