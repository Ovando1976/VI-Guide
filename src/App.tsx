import React, { useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { IslandCode, BeachDoc, PlaceDoc, EventDoc, AIDocument } from './types';
import { auth } from './firebase';
import { MobileShell } from './components/app-shell/MobileShell';
import ListingDetail from './components/ListingDetail';
import EventDetail from './components/EventDetail';
import ErrorBoundary from './components/ErrorBoundary';
import { AnimatePresence } from 'motion/react';
import { DEFAULT_ISLAND } from './lib/constants/islands';
import { isIslandCode } from './lib/utils/islands';
import { motion } from 'motion/react';
import { useAppBootstrap } from './hooks/useAppBootstrap';
import { AppRoutes } from './app/AppRoutes';

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, profile, loading, islands, activeAgent } = useAppBootstrap();
  const [selectedListing, setSelectedListing] = useState<BeachDoc | PlaceDoc | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventDoc | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<AIDocument | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const islandParam = searchParams.get('island');
  const exploreQueryParam = searchParams.get('q') ?? '';
  const conciergePromptParam = searchParams.get('prompt') ?? '';
  const selectedIsland = isIslandCode(islandParam) ? islandParam : DEFAULT_ISLAND;

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
    navigate('/plans');
  };

  const handleHeroSearch = (query: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', query);
    navigate(`/?${newParams.toString()}#explore`);
  };

  const handleHomeAction = (action: 'explore' | 'build_day' | 'concierge' | 'mobility' | 'plans') => {
    const newParams = new URLSearchParams(searchParams);
    switch (action) {
      case 'explore':
        navigate(`/?${newParams.toString()}#explore`);
        break;
      case 'build_day':
        newParams.set('prompt', `Build me a personalized day plan for ${selectedIsland.replace('_', ' ')}.`);
        navigate(`/concierge?${newParams.toString()}`);
        break;
      case 'concierge':
        navigate(`/concierge?${newParams.toString()}`);
        break;
      case 'mobility':
        navigate(`/mobility?${newParams.toString()}`);
        break;
      case 'plans':
        navigate(`/plans?${newParams.toString()}`);
        break;
    }
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
        <AppRoutes
          locationKey={location.pathname}
          islands={islands}
          selectedIsland={selectedIsland}
          exploreQueryParam={exploreQueryParam}
          conciergePromptParam={conciergePromptParam}
          selectedDocument={selectedDocument}
          selectedListing={selectedListing}
          user={user}
          profile={profile}
          activeAgent={activeAgent}
          onSelectIsland={handleSelectIsland}
          onHeroSearch={handleHeroSearch}
          onHomeAction={handleHomeAction}
          onSelectListing={setSelectedListing}
          onSelectEvent={setSelectedEvent}
          onSelectDocument={handleSelectDocument}
          onClearInitialDocument={() => setSelectedDocument(null)}
          onLogin={handleLogin}
          onLogout={handleLogout}
        />
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
