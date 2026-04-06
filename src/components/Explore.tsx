import React, { useState, useEffect } from 'react';
import { IslandCode, BeachDoc, PlaceDoc, EventDoc } from '../types';
import { Search, Info, Waves, Utensils, ShoppingBag, Landmark, Compass, ShoppingCart, List, Map as MapIcon, X, Calendar as CalendarIcon } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { BeachCard } from './cards/BeachCard';
import { PlaceCard } from './cards/PlaceCard';
import { EventCard } from './cards/EventCard';
import { getBeachesByIsland } from '../lib/firestore/beaches';
import { getPlacesByCategory } from '../lib/firestore/places';
import { getUpcomingEvents } from '../lib/firestore/events';
import { ISLAND_CENTERS } from '../lib/constants/islands';
import { format } from 'date-fns';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const CATEGORIES = [
  { id: 'beach', label: 'Beaches', icon: Waves, color: 'bg-blue-500' },
  { id: 'restaurant', label: 'Dining', icon: Utensils, color: 'bg-orange-500' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'bg-purple-500' },
  { id: 'attraction', label: 'Sights', icon: Landmark, color: 'bg-emerald-500' },
  { id: 'excursion', label: 'Tours', icon: Compass, color: 'bg-indigo-500' },
  { id: 'provisioning', label: 'Grocery', icon: ShoppingCart, color: 'bg-amber-500' },
  { id: 'event', label: 'Events', icon: CalendarIcon, color: 'bg-rose-500' },
];

export default function Explore({ 
  selectedIsland, 
  onSelectListing 
}: { 
  selectedIsland: IslandCode;
  onSelectListing: (listing: BeachDoc | PlaceDoc | EventDoc) => void 
}) {
  const [beaches, setBeaches] = useState<BeachDoc[]>([]);
  const [places, setPlaces] = useState<PlaceDoc[]>([]);
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedMarker, setSelectedMarker] = useState<BeachDoc | PlaceDoc | EventDoc | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch Beaches for selected island
      const islandBeaches = await getBeachesByIsland(selectedIsland);
      setBeaches(islandBeaches);

      // Fetch Events
      const upcomingEvents = await getUpcomingEvents(selectedIsland);
      setEvents(upcomingEvents);

      // Fetch Places for selected island
      if (selectedCategory !== 'all' && selectedCategory !== 'beach' && selectedCategory !== 'event') {
        const categoryPlaces = await getPlacesByCategory(selectedCategory as any, selectedIsland);
        setPlaces(categoryPlaces);
      } else {
        setPlaces([]);
      }
    };

    fetchData();
  }, [selectedIsland, selectedCategory]);

  const filteredItems = [
    ...(selectedCategory === 'all' || selectedCategory === 'beach' ? beaches : []),
    ...(selectedCategory === 'all' || selectedCategory === 'event' ? events : []),
    ...places
  ].filter(item => 
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24">
      {/* Search & View Toggle */}
      <div className="px-8 mb-16 space-y-8">
        <div className="flex justify-between items-center">
          <div className="flex bg-sand/50 p-1.5 rounded-2xl backdrop-blur-3xl border border-white/20 shadow-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-3",
                viewMode === 'list' ? "bg-white text-ink shadow-2xl" : "text-stone-400 hover:text-ink"
              )}
            >
              <List size={16} />
              Archive
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.3em] transition-all flex items-center gap-3",
                viewMode === 'map' ? "bg-white text-ink shadow-2xl" : "text-stone-400 hover:text-ink"
              )}
            >
              <MapIcon size={16} />
              Satellite
            </button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-turquoise/20 to-ocean/20 rounded-[2.5rem] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
          <div className="relative">
            <Search className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-stone-300 group-focus-within:text-turquoise transition-colors" />
            <input
              type="text"
              placeholder="Search the territory..."
              className="w-full pl-18 pr-8 py-6 bg-white border border-stone-100 rounded-[2.5rem] focus:ring-4 focus:ring-turquoise/5 focus:border-turquoise transition-all text-lg outline-none shadow-2xl shadow-stone-200/40 font-serif italic"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-8 mb-20">
        <div className="flex gap-8 overflow-x-auto no-scrollbar pb-6 px-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={cn(
              "flex flex-col items-center gap-4 shrink-0 transition-all active:scale-95 group",
              selectedCategory === 'all' ? "opacity-100" : "opacity-40 grayscale hover:opacity-60"
            )}
          >
            <div className={cn(
              "w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-700 relative overflow-hidden",
              selectedCategory === 'all' 
                ? "bg-ink text-turquoise scale-110 rotate-3 shadow-turquoise/20" 
                : "bg-white border border-stone-100 group-hover:border-turquoise/30"
            )}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Compass className="w-10 h-10 relative z-10" />
            </div>
            <span className="micro-label">Discovery</span>
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "flex flex-col items-center gap-4 shrink-0 transition-all active:scale-95 group",
                selectedCategory === cat.id ? "opacity-100" : "opacity-40 grayscale hover:opacity-60"
              )}
            >
              <div className={cn(
                "w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-2xl transition-all duration-700 relative overflow-hidden",
                selectedCategory === cat.id 
                  ? "bg-turquoise text-white scale-110 -rotate-3 shadow-turquoise/30" 
                  : "bg-white border border-stone-100 group-hover:border-turquoise/30"
              )}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <cat.icon className="w-10 h-10 relative z-10" />
              </div>
              <span className="micro-label">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-8 space-y-12">
        {viewMode === 'map' ? (
          <div className="relative aspect-[4/5] bg-stone-100 rounded-[3rem] border border-white overflow-hidden shadow-2xl shadow-stone-200/50">
            {!hasValidKey ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-8 bg-sand/80 backdrop-blur-xl">
                <div className="w-20 h-20 bg-turquoise/10 text-turquoise rounded-full flex items-center justify-center shadow-inner">
                  <Info size={32} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-serif italic text-ink">Maps API Key Required</h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto font-serif italic">To enable the interactive map, please add your Google Maps Platform API key as a secret.</p>
                </div>
                <button 
                  onClick={() => setViewMode('list')}
                  className="px-10 py-4 bg-ink text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-colors"
                >
                  Back to List View
                </button>
              </div>
            ) : (
              <APIProvider apiKey={API_KEY} version="weekly">
                <Map
                  defaultCenter={ISLAND_CENTERS[selectedIsland]}
                  defaultZoom={12}
                  mapId="VI_EXPLORER_MAP"
                  {...({ internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'] } as any)}
                  className="w-full h-full"
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                >
                  {filteredItems.map(item => (
                    <MapMarker 
                      key={item.id || item.slug} 
                      item={item} 
                      onClick={() => setSelectedMarker(item)}
                      isSelected={selectedMarker?.id === item.id || selectedMarker?.slug === item.slug}
                    />
                  ))}
                </Map>

                {/* Floating Selected Card */}
                {selectedMarker && (
                  <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-8 left-8 right-8 glass rounded-[2.5rem] shadow-2xl border border-white p-5 flex gap-5 items-center z-10"
                  >
                    <div className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 shadow-2xl bg-stone-100 border-2 border-white">
                      <img 
                        src={selectedMarker.coverImage} 
                        alt="" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <h4 className="font-serif italic text-2xl truncate leading-tight text-ink">{selectedMarker.title}</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-px bg-turquoise" />
                        <p className="text-[9px] text-stone-500 uppercase tracking-[0.3em] font-bold">
                          {'category' in selectedMarker ? selectedMarker.category : 
                           'startAt' in selectedMarker ? `Event • ${format(selectedMarker.startAt, 'MMM d')}` : 'Beach'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={() => onSelectListing(selectedMarker)}
                        className="bg-ink text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-ink/20 active:scale-95 transition-all hover:bg-ocean"
                      >
                        Details
                      </button>
                    </div>
                    <button 
                      onClick={() => setSelectedMarker(null)}
                      className="absolute -top-3 -right-3 w-10 h-10 bg-white rounded-full shadow-2xl flex items-center justify-center text-stone-400 hover:text-ink border border-stone-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </motion.div>
                )}
              </APIProvider>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12">
            {filteredItems.map(item => {
              if ('category' in item && !('startAt' in item)) {
                return <PlaceCard key={item.slug} place={item as PlaceDoc} onClick={onSelectListing} />;
              } else if ('startAt' in item) {
                return <EventCard key={item.id} event={item as EventDoc} onClick={onSelectListing} />;
              } else {
                return <BeachCard key={item.slug} beach={item as BeachDoc} onClick={onSelectListing} />;
              }
            })}
            {filteredItems.length === 0 && (
              <div className="py-32 text-center space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-inner">
                <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
                  <Compass size={40} />
                </div>
                <p className="text-stone-400 font-serif italic text-xl">No discoveries found in this category.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MapMarker({ item, onClick, isSelected }: { item: BeachDoc | PlaceDoc | EventDoc; onClick: () => void; isSelected: boolean }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  
  const isEvent = 'startAt' in item;
  const isBeach = !('category' in item) && !isEvent;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={item.coordinates || { lat: 0, lng: 0 }}
      onClick={onClick}
      title={item.title}
    >
      <Pin 
        background={isSelected ? "#10b981" : isEvent ? "#f43f5e" : isBeach ? "#3b82f6" : "#1c1917"} 
        glyphColor="#fff" 
        borderColor={isSelected ? "#fff" : "#1c1917"}
        scale={isSelected ? 1.2 : 1}
      >
        {isEvent && <CalendarIcon size={12} className="text-white" />}
      </Pin>
    </AdvancedMarker>
  );
}
