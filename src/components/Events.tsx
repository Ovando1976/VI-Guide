import React, { useState, useEffect } from 'react';
import { EventDoc, IslandCode } from '../types';
import { Calendar as CalendarIcon, Music, Utensils, Trophy, Landmark, List, Map as MapIcon, Info, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { APIProvider, Map, AdvancedMarker, Pin, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import EventCard from './EventCard';
import SectionHeader from './SectionHeader';
import { getUpcomingEvents } from '../lib/firestore/events';
import { ISLAND_CENTERS } from '../lib/constants/islands';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  format,
  isToday
} from 'date-fns';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

const CATEGORIES = [
  { id: 'all', label: 'All', icon: CalendarIcon },
  { id: 'music', label: 'Music', icon: Music },
  { id: 'culture', label: 'Culture', icon: Landmark },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'sports', label: 'Sports', icon: Trophy }
];

export default function Events({ 
  selectedIsland, 
  onSelectEvent 
}: { 
  selectedIsland: IslandCode;
  onSelectEvent: (event: EventDoc) => void 
}) {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'map' | 'calendar'>('list');
  const [selectedMarker, setSelectedMarker] = useState<EventDoc | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setSelectedMarker(null);
    setCurrentPage(1);
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const data = await getUpcomingEvents(selectedIsland, Date.now(), 100);
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [selectedIsland]);

  useEffect(() => {
    setSelectedMarker(null);
    setCurrentPage(1);
  }, [selectedCategory, viewMode]);

  const filteredEvents = events.filter(e => 
    selectedCategory === 'all' || (e.tags && e.tags.includes(selectedCategory)) || e.category === selectedCategory
  );

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="pb-24">
      <header className="px-8 mb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-8">
          <SectionHeader 
            title="Island Events" 
            subtitle="What's Happening" 
          />
          
          <div className="flex bg-sand/50 p-1.5 rounded-2xl backdrop-blur-3xl border border-white/20 shadow-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                viewMode === 'list' ? "bg-white text-ink shadow-sm" : "text-stone-400 hover:text-ink"
              )}
            >
              <List size={14} />
              List
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                viewMode === 'calendar' ? "bg-white text-ink shadow-sm" : "text-stone-400 hover:text-ink"
              )}
            >
              <CalendarIcon size={14} />
              Calendar
            </button>
            <button 
              onClick={() => setViewMode('map')}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                viewMode === 'map' ? "bg-white text-ink shadow-sm" : "text-stone-400 hover:text-ink"
              )}
            >
              <MapIcon size={14} />
              Map
            </button>
          </div>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                "px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap border flex items-center gap-2 shadow-2xl shadow-stone-200/50",
                selectedCategory === cat.id
                  ? "bg-ink border-ink text-white shadow-ink/20"
                  : "bg-white border-stone-100 text-stone-400 hover:border-turquoise/30"
              )}
            >
              <cat.icon size={14} className={selectedCategory === cat.id ? "text-turquoise" : ""} />
              {cat.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-8">
        {loading ? (
          <div className="flex justify-center py-32">
            <div className="w-10 h-10 border-2 border-turquoise border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'map' ? (
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
                  mapId="VI_EVENTS_MAP"
                  {...({ internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'] } as any)}
                  className="w-full h-full"
                  gestureHandling={'greedy'}
                  disableDefaultUI={true}
                >
                  {filteredEvents.filter(e => e.coordinates).map(event => (
                    <EventMapMarker 
                      key={event.slug} 
                      event={event} 
                      onClick={() => setSelectedMarker(event)}
                      isSelected={selectedMarker?.slug === event.slug}
                    />
                  ))}
                </Map>

                {/* Floating Selected Card */}
                <AnimatePresence>
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
                            {new Date(selectedMarker.startAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => onSelectEvent(selectedMarker)}
                          className="bg-ink text-white px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl shadow-ink/20 active:scale-95 transition-all hover:bg-ocean"
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
                </AnimatePresence>
              </APIProvider>
            )}
          </div>
        ) : viewMode === 'calendar' ? (
          <CalendarView events={filteredEvents} onSelectEvent={onSelectEvent} />
        ) : filteredEvents.length === 0 ? (
          <div className="py-32 text-center space-y-6 bg-white rounded-[3rem] border border-stone-100 shadow-inner">
            <div className="w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mx-auto text-stone-200">
              <CalendarIcon size={40} />
            </div>
            <p className="text-stone-400 font-serif italic text-xl">No events found in this category.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 gap-12 stagger-in">
              {paginatedEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={onSelectEvent} 
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-8">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "w-10 h-10 rounded-xl text-[10px] font-bold transition-all",
                        currentPage === page 
                          ? "bg-ink text-white shadow-lg shadow-ink/20" 
                          : "bg-white border border-stone-100 text-stone-400 hover:border-turquoise/30"
                      )}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-ink disabled:opacity-30 disabled:cursor-not-allowed hover:bg-sand transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CalendarView({ events, onSelectEvent }: { events: EventDoc[]; onSelectEvent: (event: EventDoc) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth)),
    end: endOfWeek(endOfMonth(currentMonth))
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/60 backdrop-blur-3xl rounded-[3rem] border border-white shadow-2xl overflow-hidden"
    >
      {/* Calendar Header */}
      <div className="p-8 border-b border-stone-100 flex items-center justify-between bg-sand/30">
        <h3 className="text-3xl font-serif italic text-ink">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={prevMonth}
            className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-ink hover:bg-turquoise hover:text-white transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={nextMonth}
            className="w-12 h-12 bg-white border border-stone-100 rounded-2xl flex items-center justify-center text-ink hover:bg-turquoise hover:text-white transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-stone-100">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-4 text-center">
            <span className="micro-label text-stone-400">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, idx) => {
          const dayEvents = events.filter(e => isSameDay(new Date(e.startAt), day));
          
          return (
            <div 
              key={day.toString()} 
              className={cn(
                "min-h-[140px] p-4 border-r border-b border-stone-50 transition-colors hover:bg-sand/20",
                !isSameMonth(day, currentMonth) && "bg-stone-50/50 opacity-40",
                idx % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={cn(
                  "text-sm font-bold",
                  isToday(day) ? "w-8 h-8 bg-turquoise text-white rounded-full flex items-center justify-center shadow-lg shadow-turquoise/20" : "text-ink"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <button
                    key={event.id}
                    onClick={() => onSelectEvent(event)}
                    className="w-full text-left p-2 rounded-lg bg-sand/50 border border-stone-100 hover:border-turquoise hover:bg-white transition-all group"
                  >
                    <p className="text-[9px] font-serif italic text-ink truncate group-hover:text-turquoise">
                      {event.title}
                    </p>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <p className="text-[8px] font-bold uppercase tracking-widest text-stone-400 pl-2">
                    + {dayEvents.length - 3} more
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function EventMapMarker({ event, onClick, isSelected }: { event: EventDoc; onClick: () => void; isSelected: boolean }) {
  const [markerRef] = useAdvancedMarkerRef();
  
  return (
    <AdvancedMarker
      ref={markerRef}
      position={event.coordinates}
      onClick={onClick}
      title={event.title}
    >
      <Pin 
        background={isSelected ? "#10b981" : "#1c1917"} 
        glyphColor="#fff" 
        borderColor={isSelected ? "#fff" : "#1c1917"}
        scale={isSelected ? 1.2 : 1}
      />
    </AdvancedMarker>
  );
}
