import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  MapPin, 
  Users, 
  Briefcase, 
  ChevronRight, 
  Clock, 
  Shield, 
  Star, 
  Navigation, 
  Info, 
  ArrowRight, 
  Plane, 
  Ship, 
  Anchor, 
  Search, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  Trip, 
  TripType, 
  ServiceClass, 
  MobilityIsland, 
  IslandCode, 
  AreaDoc, 
  BeachDoc, 
  PlaceDoc,
  EstateRecord,
  ParcelRecord
} from '../types';
import { createTripRequest, calculateQuote, subscribeToTrip, enrichLocation } from '../lib/firestore/mobility';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { EstateExplorerMap } from '../features/estates/components/estate-explorer-map';

interface MobilityProps {
  selectedIsland: IslandCode;
  user: any;
}

export default function Mobility({ selectedIsland, user }: MobilityProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'quote' | 'tracking'>('request');
  const [pickup, setPickup] = useState<string>('');
  const [dropoff, setDropoff] = useState<string>('');
  const [pickupContext, setPickupContext] = useState<{ lat: number; lng: number; estateName?: string; parcelId?: string } | null>(null);
  const [dropoffContext, setDropoffContext] = useState<{ lat: number; lng: number; estateName?: string; parcelId?: string } | null>(null);
  const [passengers, setPassengers] = useState(1);
  const [luggage, setLuggage] = useState(0);
  const [serviceClass, setServiceClass] = useState<ServiceClass>('shared');
  const [tripType, setTripType] = useState<TripType>('direct');
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<Trip['quote'] | null>(null);
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<(AreaDoc | BeachDoc | PlaceDoc | EstateRecord | ParcelRecord)[]>([]);
  const [searchingFor, setSearchingFor] = useState<'pickup' | 'dropoff' | null>(null);

  const mobilityIsland: MobilityIsland = selectedIsland === 'st_thomas' ? 'stt' : selectedIsland === 'st_john' ? 'stj' : selectedIsland === 'st_croix' ? 'stx' : 'wat';

  // Search logic
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const performSearch = async () => {
      const results: (AreaDoc | BeachDoc | PlaceDoc | EstateRecord | ParcelRecord)[] = [];
      
      // 1. Search Estates (Priority)
      const estatesRef = collection(db, 'estates');
      const qEstates = query(estatesRef, where('island', '==', mobilityIsland), limit(5));
      const estateSnap = await getDocs(qEstates);
      results.push(...estateSnap.docs
        .map(d => ({ ...d.data() } as EstateRecord))
        .filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.aliases.some(a => a.toLowerCase().includes(searchQuery.toLowerCase())))
      );

      // 2. Search Areas
      const areasRef = collection(db, 'areas');
      const qAreas = query(areasRef, where('islandCode', '==', selectedIsland), limit(5));
      const areaSnap = await getDocs(qAreas);
      results.push(...areaSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as AreaDoc))
        .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      // 3. Search Beaches
      const beachesRef = collection(db, 'beaches');
      const qBeaches = query(beachesRef, where('islandCode', '==', selectedIsland), limit(5));
      const beachSnap = await getDocs(qBeaches);
      results.push(...beachSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as BeachDoc))
        .filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      setSearchResults(results.slice(0, 8));
    };

    const debounce = setTimeout(performSearch, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedIsland, mobilityIsland]);

  const handleGetQuote = async () => {
    if (!pickup || !dropoff) return;
    setLoading(true);
    try {
      const q = await calculateQuote({
        island: mobilityIsland,
        tripType,
        passengers,
        luggage,
        serviceClass,
        originZone: pickup,
        destinationZone: dropoff
      });
      setQuote(q);
      setStep('quote');
    } catch (error) {
      console.error('Quote failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestRide = async () => {
    if (!quote || !user) return;
    setLoading(true);
    try {
      // Enrich locations with estate/parcel context
      const enrichedPickup = await enrichLocation({
        label: pickup,
        type: 'custom',
        lat: pickupContext?.lat || 0,
        lng: pickupContext?.lng || 0,
        island: mobilityIsland,
        estateName: pickupContext?.estateName,
        parcelId: pickupContext?.parcelId
      });

      const enrichedDropoff = await enrichLocation({
        label: dropoff,
        type: 'custom',
        lat: dropoffContext?.lat || 0,
        lng: dropoffContext?.lng || 0,
        island: mobilityIsland,
        estateName: dropoffContext?.estateName,
        parcelId: dropoffContext?.parcelId
      });

      const tripId = await createTripRequest({
        riderId: user.uid,
        driverId: null,
        status: 'requested',
        tripType,
        island: mobilityIsland,
        pickup: enrichedPickup,
        dropoff: enrichedDropoff,
        passengers,
        luggage,
        serviceClass,
        quote
      });

      // Subscribe to trip updates
      subscribeToTrip(tripId, (trip) => {
        setActiveTrip(trip);
        setStep('tracking');
      });
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectLocation = (loc: any) => {
    const label = loc.title || loc.name || loc.parcelId;
    const coords = loc.coordinates || loc.centroid || { lat: 0, lng: 0 };
    const estateName = loc.estateName || (loc.geoid ? loc.name : undefined);
    const parcelId = loc.parcelId;

    if (searchingFor === 'pickup') {
      setPickup(label);
      setPickupContext({ ...coords, estateName, parcelId });
    }
    if (searchingFor === 'dropoff') {
      setDropoff(label);
      setDropoffContext({ ...coords, estateName, parcelId });
    }
    setSearchingFor(null);
    setSearchQuery('');
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6 pb-32">
      <header className="space-y-2">
        <h1 className="text-4xl font-serif italic text-ink">Territory Mobility</h1>
        <p className="text-stone-500 text-sm font-serif italic">The island's transportation operating system.</p>
      </header>

      <AnimatePresence mode="wait">
        {step === 'request' && (
          <motion.div 
            key="request"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-3">
              <QuickActionButton 
                icon={<Plane size={20} />} 
                label="Airport" 
                onClick={() => { setTripType('airport'); setDropoff('STT Airport'); }}
              />
              <QuickActionButton 
                icon={<Ship size={20} />} 
                label="Ferry" 
                onClick={() => { setTripType('ferry_transfer'); setDropoff('Red Hook Ferry'); }}
              />
              <QuickActionButton 
                icon={<Anchor size={20} />} 
                label="Cruise" 
                onClick={() => { setTripType('cruise'); setDropoff('Havensight'); }}
              />
            </div>

            {/* Location Inputs */}
            <div className="bg-white rounded-3xl p-6 shadow-xl border border-stone-100 space-y-4 relative">
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 flex justify-center text-turquoise">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      placeholder="Pickup location (Estate, Hotel, Beach...)"
                      value={pickup}
                      onFocus={() => setSearchingFor('pickup')}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-sand/30 rounded-2xl text-sm font-serif italic focus:outline-none focus:ring-2 focus:ring-turquoise/20 transition-all"
                    />
                    {pickupContext?.estateName && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-turquoise/10 text-turquoise px-2 py-1 rounded-full">
                          {pickupContext.estateName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 flex justify-center text-coral">
                    <Navigation size={18} />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text"
                      placeholder="Where to?"
                      value={dropoff}
                      onFocus={() => setSearchingFor('dropoff')}
                      onChange={(e) => setDropoff(e.target.value)}
                      className="w-full pl-10 pr-4 py-4 bg-sand/30 rounded-2xl text-sm font-serif italic focus:outline-none focus:ring-2 focus:ring-turquoise/20 transition-all"
                    />
                    {dropoffContext?.estateName && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                        <span className="text-[8px] font-bold uppercase tracking-widest bg-coral/10 text-coral px-2 py-1 rounded-full">
                          {dropoffContext.estateName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Search Overlay */}
              <AnimatePresence>
                {searchingFor && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute inset-x-0 top-full mt-2 bg-white rounded-3xl shadow-2xl border border-stone-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-stone-50 flex items-center gap-3">
                      <Search size={18} className="text-stone-400" />
                      <input 
                        autoFocus
                        type="text"
                        placeholder="Search estates, landmarks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent text-sm focus:outline-none"
                      />
                      <button onClick={() => setSearchingFor(null)}>
                        <X size={18} className="text-stone-400" />
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto p-2">
                      {searchResults.length > 0 ? (
                        searchResults.map((res) => {
                          const isEstate = 'geoid' in res;
                          const isParcel = 'parcelId' in res;
                          const label = isEstate ? res.name : isParcel ? res.parcelId : ('title' in res ? res.title : res.name);
                          const sublabel = isEstate ? 'Estate' : isParcel ? `Parcel • ${res.estateName}` : ('kind' in res ? res.kind : 'Beach');
                          
                          return (
                            <button
                              key={isEstate ? res.geoid : isParcel ? res.parcelId : ('id' in res ? res.id : res.slug)}
                              onClick={() => selectLocation(res)}
                              className="w-full flex items-center gap-4 p-4 hover:bg-sand/30 rounded-2xl transition-all text-left group"
                            >
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                                isEstate ? "bg-turquoise/10 text-turquoise" : isParcel ? "bg-coral/10 text-coral" : "bg-sand text-stone-400 group-hover:bg-white group-hover:text-turquoise"
                              )}>
                                {isEstate ? <MapPin size={18} /> : isParcel ? <Navigation size={18} /> : <MapPin size={18} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-ink">{label}</p>
                                <p className="text-[10px] text-stone-400 uppercase tracking-widest">{sublabel}</p>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-stone-400 text-sm font-serif italic">
                          {searchQuery.length < 2 ? 'Start typing to search...' : 'No results found.'}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white rounded-3xl p-4 shadow-xl border border-stone-100 space-y-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-stone-500">Estate & parcel precision</h3>
                <p className="text-xs text-stone-500 mt-1">Select a parcel for exact pickup or destination context.</p>
              </div>
              <EstateExplorerMap
                selectedIsland={selectedIsland}
                onUseParcelForRoute={(parcel) => {
                  setDropoff(parcel.label);
                  if (parcel.centroid.lat != null && parcel.centroid.lng != null) {
                    setDropoffContext({
                      lat: parcel.centroid.lat,
                      lng: parcel.centroid.lng,
                      estateName: parcel.estateName ?? undefined,
                      parcelId: parcel.parcelId,
                    });
                  }
                }}
                onAskConcierge={(parcel) => {
                  const params = new URLSearchParams();
                  params.set('island', selectedIsland);
                  params.set('prompt', `Build a realistic day plan starting from parcel ${parcel.parcelId} in ${parcel.estateName ?? 'this estate'}.`);
                  navigate(`/concierge?${params.toString()}`);
                }}
              />
            </div>

            {/* Trip Options */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-3xl p-4 shadow-xl border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-turquoise">
                    <Users size={18} />
                  </div>
                  <span className="text-sm font-bold text-ink">Passengers</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setPassengers(Math.max(1, passengers - 1))}
                    className="w-8 h-8 rounded-lg bg-sand flex items-center justify-center text-ink"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{passengers}</span>
                  <button 
                    onClick={() => setPassengers(Math.min(12, passengers + 1))}
                    className="w-8 h-8 rounded-lg bg-sand flex items-center justify-center text-ink"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 shadow-xl border border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-ocean">
                    <Briefcase size={18} />
                  </div>
                  <span className="text-sm font-bold text-ink">Luggage</span>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setLuggage(Math.max(0, luggage - 1))}
                    className="w-8 h-8 rounded-lg bg-sand flex items-center justify-center text-ink"
                  >
                    -
                  </button>
                  <span className="text-sm font-bold w-4 text-center">{luggage}</span>
                  <button 
                    onClick={() => setLuggage(Math.min(10, luggage + 1))}
                    className="w-8 h-8 rounded-lg bg-sand flex items-center justify-center text-ink"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Service Class Toggle */}
            <div className="bg-white rounded-3xl p-2 shadow-xl border border-stone-100 flex">
              <button 
                onClick={() => setServiceClass('shared')}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  serviceClass === 'shared' ? "bg-ink text-white shadow-lg" : "text-stone-400 hover:text-ink"
                )}
              >
                Shared Ride
              </button>
              <button 
                onClick={() => setServiceClass('private')}
                className={cn(
                  "flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all",
                  serviceClass === 'private' ? "bg-ink text-white shadow-lg" : "text-stone-400 hover:text-ink"
                )}
              >
                Private SUV
              </button>
            </div>

            <button 
              onClick={handleGetQuote}
              disabled={!pickup || !dropoff || loading}
              className="w-full bg-ink text-white py-5 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Calculate Fare'}
            </button>
          </motion.div>
        )}

        {step === 'quote' && quote && (
          <motion.div 
            key="quote"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 space-y-8">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-3xl font-serif italic text-ink">Trip Summary</h3>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{serviceClass} Service • {tripType.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                  <p className="text-4xl font-serif italic text-ink">${quote.total}</p>
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Estimated Total</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-turquoise">
                    <MapPin size={18} />
                  </div>
                  <div className="flex-1 border-b border-stone-50 pb-4">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Pickup</p>
                    <p className="text-sm font-bold text-ink">{pickup}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-coral">
                    <Navigation size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest">Dropoff</p>
                    <p className="text-sm font-bold text-ink">{dropoff}</p>
                  </div>
                </div>
              </div>

              <div className="bg-sand/30 rounded-3xl p-6 space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                  <span>Base Fare</span>
                  <span>${quote.baseFare}</span>
                </div>
                {quote.luggageFee > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    <span>Luggage Fee</span>
                    <span>${quote.luggageFee}</span>
                  </div>
                )}
                {quote.premiumFee > 0 && (
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-stone-500">
                    <span>Private Premium</span>
                    <span>${quote.premiumFee}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 p-4 bg-turquoise/5 rounded-2xl border border-turquoise/10">
                <Shield size={18} className="text-turquoise" />
                <p className="text-[10px] text-turquoise font-bold uppercase tracking-widest">Licensed & Insured Drivers Only</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setStep('request')}
                className="flex-1 bg-white text-ink py-5 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] border border-stone-100 shadow-xl hover:bg-sand transition-all"
              >
                Back
              </button>
              <button 
                onClick={handleRequestRide}
                disabled={loading}
                className="flex-[2] bg-ink text-white py-5 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : 'Request Ride'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 'tracking' && activeTrip && (
          <motion.div 
            key="tracking"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl border border-stone-100 space-y-8 text-center">
              <div className="w-24 h-24 bg-turquoise/10 rounded-full flex items-center justify-center mx-auto text-turquoise">
                <Loader2 className="animate-spin" size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-3xl font-serif italic text-ink">Finding Your Driver</h3>
                <p className="text-stone-500 text-sm font-serif italic">Matching you with the best licensed operator nearby...</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-sand/30 rounded-2xl">
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">Status</p>
                  <p className="text-xs font-bold text-ink uppercase tracking-widest">{activeTrip.status.replace('_', ' ')}</p>
                </div>
                <div className="p-4 bg-sand/30 rounded-2xl">
                  <p className="text-[9px] text-stone-400 font-bold uppercase tracking-widest mb-1">Trip ID</p>
                  <p className="text-xs font-bold text-ink uppercase tracking-widest">#{activeTrip.id.slice(-6)}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => {
                // Cancel logic would go here
                setStep('request');
                setActiveTrip(null);
              }}
              className="w-full bg-white text-coral py-5 rounded-3xl font-bold text-[10px] uppercase tracking-[0.3em] border border-stone-100 shadow-xl hover:bg-coral hover:text-white transition-all"
            >
              Cancel Request
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuickActionButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="bg-white p-4 rounded-3xl shadow-xl border border-stone-100 flex flex-col items-center gap-2 hover:bg-sand transition-all group"
    >
      <div className="w-10 h-10 bg-sand rounded-xl flex items-center justify-center text-stone-400 group-hover:bg-white group-hover:text-turquoise transition-all">
        {icon}
      </div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-ink">{label}</span>
    </button>
  );
}
