import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, BeachDoc, PlaceDoc, EventDoc, IslandCode, AIDocument, IslandDoc } from './types';
import { MobileShell } from './components/app-shell/MobileShell';
import { HomeHero } from './components/app-shell/HomeHero';
import Explore from './components/Explore';
import Beaches from './components/Beaches';
import Eat from './components/Eat';
import Events from './components/Events';
import Community from './components/Community';
import Concierge from './components/Concierge';
import Mobility from './components/Mobility';
import Documents from './components/Documents';
import Profile from './components/Profile';
import MerchantDashboard from './components/MerchantDashboard';
import ListingDetail from './components/ListingDetail';
import EventDetail from './components/EventDetail';
import ErrorBoundary from './components/ErrorBoundary';
import { FeaturedSection } from './components/FeaturedSection';
import { AnimatePresence } from 'motion/react';
import { DEFAULT_ISLAND } from './lib/constants/islands';
import { isIslandCode } from './lib/utils/islands';
import { getIslands } from './lib/firestore/islands';
import { motion } from 'motion/react';
import { seedCanonicalData } from './seed';

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
  const [selectedListing, setSelectedListing] = useState<BeachDoc | PlaceDoc | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDoc | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(null);
  const [activeAgent, setActiveAgent] = useState<'concierge' | 'operator'>('concierge');
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const islandParam = searchParams.get('island');
  const selectedIsland = isIslandCode(islandParam) ? islandParam : DEFAULT_ISLAND;

  useEffect(() => {
    // Set agent based on user role or context
    if (profile?.role === 'merchant' || profile?.role === 'admin') {
      setActiveAgent('operator');
    } else {
      setActiveAgent('concierge');
    }
  }, [profile]);

  useEffect(() => {
    if (loading) return;

    async function loadIslands() {
      try {
        const data = await getIslands();
        if (data.length === 0) {
          // Only attempt seeding if user is admin
          const isHardcodedAdmin = user?.email === 'OvandoRawlins@gmail.com';
          const isProfileAdmin = profile?.role === 'admin';
          
          if (isHardcodedAdmin || isProfileAdmin) {
            console.log('No islands found, seeding canonical data...');
            await seedCanonicalData();
            const refreshedData = await getIslands();
            setIslands(refreshedData);
          } else {
            console.log('No islands found. Waiting for admin to seed.');
          }
        } else {
          setIslands(data);
        }
      } catch (error) {
        console.error('Error loading islands:', error);
      }
    }
    loadIslands();
  }, [loading, profile, user]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const docRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'Guest',
            photoURL: firebaseUser.photoURL || '',
            role: 'user',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          try {
            await setDoc(docRef, newProfile);
            setProfile(newProfile);
          } catch (error) {
            console.error('Error creating profile:', error);
          }
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = () => auth.signOut();

  const handleSelectIsland = (code: IslandCode) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('island', code);
    navigate(`?${newParams.toString()}`, { replace: true });
  };

  const handleSelectDocument = (doc: AIDocument) => {
    setSelectedDocument(doc);
    navigate('/docs');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-stone-50">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <MobileShell 
      isMerchant={profile?.role === 'merchant'}
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={
            <>
              <HomeHero 
                islands={islands}
                selectedIsland={selectedIsland}
                onSelectIsland={handleSelectIsland}
              />
              <div className="mt-12">
                <FeaturedSection 
                  selectedIsland={selectedIsland}
                  onSelectListing={setSelectedListing}
                />
                <Explore 
                  selectedIsland={selectedIsland}
                  onSelectListing={setSelectedListing} 
                />
              </div>
            </>
          } />
          
          <Route path="/beaches" element={
            <Beaches onSelectBeach={setSelectedListing} />
          } />

          <Route path="/eat" element={
            <Eat onSelectPlace={setSelectedListing} />
          } />

          <Route path="/events" element={
            <Events 
              selectedIsland={selectedIsland}
              onSelectEvent={setSelectedEvent} 
            />
          } />

          <Route path="/mobility" element={
            <Mobility 
              selectedIsland={selectedIsland}
              user={user}
            />
          } />

          <Route path="/community" element={
            <Community 
              selectedIsland={selectedIsland}
              user={profile}
            />
          } />

          <Route path="/concierge" element={
            <Concierge 
              user={user} 
              profile={profile}
              contextListing={selectedListing}
              onSelectListing={setSelectedListing}
              agentId={activeAgent}
            />
          } />

          <Route path="/docs" element={
            <Documents 
              user={user} 
              profile={profile} 
              initialDocument={selectedDocument}
              onClearInitial={() => setSelectedDocument(null)}
            />
          } />

          <Route path="/profile" element={
            <Profile 
              user={user} 
              profile={profile} 
              onLogout={handleLogout} 
              onLogin={handleLogin} 
              onSelectListing={setSelectedListing}
              onSelectDocument={handleSelectDocument}
            />
          } />

          <Route path="/merchant" element={
            <MerchantDashboard user={user} profile={profile} />
          } />
        </Routes>
      </AnimatePresence>

      {/* Overlays */}
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
