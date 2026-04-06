import React from 'react';
import { Route, Routes } from 'react-router-dom';
import type { User } from 'firebase/auth';
import type { AIDocument, BeachDoc, EventDoc, IslandCode, IslandDoc, PlaceDoc, UserProfile } from '../types';
import { HomeHero } from '../components/app-shell/HomeHero';
import { HomeCommandCenter } from '../components/app-shell/HomeCommandCenter';
import { FeaturedSection } from '../components/FeaturedSection';
import Explore from '../components/Explore';
import Beaches from '../components/Beaches';
import Eat from '../components/Eat';
import Events from '../components/Events';
import Mobility from '../components/Mobility';
import Community from '../components/Community';
import Concierge from '../components/Concierge';
import Documents from '../components/Documents';
import Profile from '../components/Profile';
import MerchantDashboard from '../components/MerchantDashboard';
import { ProtectedRoute } from './ProtectedRoute';

interface AppRoutesProps {
  locationKey: string;
  islands: IslandDoc[];
  selectedIsland: IslandCode;
  exploreQueryParam: string;
  conciergePromptParam: string;
  selectedDocument: AIDocument | null;
  selectedListing: BeachDoc | PlaceDoc | null;
  user: User | null;
  profile: UserProfile | null;
  activeAgent: 'concierge' | 'operator';
  onSelectIsland: (code: IslandCode) => void;
  onHeroSearch: (query: string) => void;
  onHomeAction: (action: 'explore' | 'build_day' | 'concierge' | 'mobility' | 'plans') => void;
  onSelectListing: (listing: BeachDoc | PlaceDoc | EventDoc | null) => void;
  onSelectEvent: (event: EventDoc | null) => void;
  onSelectDocument: (doc: AIDocument) => void;
  onClearInitialDocument: () => void;
  onLogin: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export function AppRoutes({
  locationKey,
  islands,
  selectedIsland,
  exploreQueryParam,
  conciergePromptParam,
  selectedDocument,
  selectedListing,
  user,
  profile,
  activeAgent,
  onSelectIsland,
  onHeroSearch,
  onHomeAction,
  onSelectListing,
  onSelectEvent,
  onSelectDocument,
  onClearInitialDocument,
  onLogin,
  onLogout,
}: AppRoutesProps) {
  return (
    <Routes key={locationKey}>
      <Route
        path="/"
        element={
          <>
            <HomeHero islands={islands} selectedIsland={selectedIsland} onSelectIsland={onSelectIsland} onSearch={onHeroSearch} />
            <HomeCommandCenter selectedIsland={selectedIsland} onAction={onHomeAction} />
            <div className="mt-12" id="explore">
              <FeaturedSection selectedIsland={selectedIsland} onSelectListing={(listing) => onSelectListing(listing)} />
              <Explore selectedIsland={selectedIsland} initialSearchQuery={exploreQueryParam} onSelectListing={(listing) => onSelectListing(listing)} />
            </div>
          </>
        }
      />
      <Route path="/beaches" element={<Beaches onSelectBeach={(listing) => onSelectListing(listing)} />} />
      <Route path="/explore" element={<Explore selectedIsland={selectedIsland} initialSearchQuery={exploreQueryParam} onSelectListing={(listing) => onSelectListing(listing)} />} />
      <Route path="/eat" element={<Eat onSelectPlace={(listing) => onSelectListing(listing)} />} />
      <Route path="/events" element={<Events selectedIsland={selectedIsland} onSelectEvent={onSelectEvent} />} />
      <Route path="/mobility" element={<Mobility selectedIsland={selectedIsland} user={user} />} />
      <Route path="/community" element={<Community selectedIsland={selectedIsland} user={profile} />} />
      <Route path="/concierge" element={<Concierge user={user} profile={profile} contextListing={selectedListing} onSelectListing={(listing) => onSelectListing(listing)} agentId={activeAgent} initialPrompt={conciergePromptParam} />} />
      <Route
        path="/docs"
        element={
          <ProtectedRoute user={user}>
            <Documents user={user} profile={profile} initialDocument={selectedDocument} onClearInitial={onClearInitialDocument} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/plans"
        element={
          <ProtectedRoute user={user}>
            <Documents user={user} profile={profile} initialDocument={selectedDocument} onClearInitial={onClearInitialDocument} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <Profile
            user={user}
            profile={profile}
            onLogout={onLogout}
            onLogin={onLogin}
            onSelectListing={(listing) => onSelectListing(listing)}
            onSelectDocument={onSelectDocument}
          />
        }
      />
      <Route
        path="/merchant"
        element={
          <ProtectedRoute user={user}>
            <MerchantDashboard user={user} profile={profile} />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
