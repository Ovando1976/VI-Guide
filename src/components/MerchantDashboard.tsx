import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, PlaceDoc, Inquiry, EventDoc, IslandCode, TransitRoute } from '../types';
import { Plus, MessageSquare, TrendingUp, Settings, ChevronRight, Image as ImageIcon, MapPin, Star, Upload, X, Loader2, Edit2, Trash2, Calendar as CalendarIcon, Clock, Globe, Phone, Tag, BarChart3, PieChart as PieChartIcon, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const DUMMY_VISITOR_DATA = [
  { name: 'Jan', visitors: 4000 },
  { name: 'Feb', visitors: 3000 },
  { name: 'Mar', visitors: 2000 },
  { name: 'Apr', visitors: 2780 },
  { name: 'May', visitors: 1890 },
  { name: 'Jun', visitors: 2390 },
];

const DUMMY_TREND_DATA = [
  { name: 'Jan', views: 2400 },
  { name: 'Feb', views: 1398 },
  { name: 'Mar', views: 9800 },
  { name: 'Apr', views: 3908 },
  { name: 'May', views: 4800 },
  { name: 'Jun', views: 3800 },
  { name: 'Jul', views: 4300 },
];

const DUMMY_CATEGORY_DATA = [
  { name: 'Dining', value: 400 },
  { name: 'Tours', value: 300 },
  { name: 'Beaches', value: 300 },
  { name: 'Shopping', value: 200 },
];

const COLORS = ['#10b981', '#0ea5e9', '#f43f5e', '#f59e0b'];

// Merchant-specific extensions
interface MerchantPlace extends PlaceDoc {
  ownerId: string;
}

interface MerchantEvent extends EventDoc {
  organizerId: string;
}

import { getTerritoryIntelligence } from '../lib/usvi/geography';
import { getTerritoryStats } from '../lib/firestore/stats';

export default function MerchantDashboard({ user, profile }: { user: User | null; profile: UserProfile | null }) {
  const [listings, setListings] = useState<MerchantPlace[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [events, setEvents] = useState<MerchantEvent[]>([]);
  const [showAddListing, setShowAddListing] = useState(false);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showAddTransit, setShowAddTransit] = useState(false);
  const [editingListing, setEditingListing] = useState<MerchantPlace | null>(null);
  const [editingEvent, setEditingEvent] = useState<MerchantEvent | null>(null);
  const [editingTransit, setEditingTransit] = useState<TransitRoute | null>(null);
  const [subTab, setSubTab] = useState<'overview' | 'listings' | 'leads' | 'events' | 'intelligence' | 'transit'>('overview');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [transitRoutes, setTransitRoutes] = useState<TransitRoute[]>([]);
  const [territoryStats, setTerritoryStats] = useState<any>(null);

  const geoIntelligence = getTerritoryIntelligence('st_thomas');

  useEffect(() => {
    async function loadStats() {
      const stats = await getTerritoryStats('st_thomas');
      setTerritoryStats(stats);
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'transit_routes'), where('operatorId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransitRoutes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TransitRoute)));
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (editingListing) {
      setExistingImages(editingListing.gallery || []);
      setSelectedImages([]);
    } else {
      setExistingImages([]);
      setSelectedImages([]);
    }
  }, [editingListing]);

  const handleDeleteListing = async (listing: MerchantPlace) => {
    if (!window.confirm(`Are you sure you want to delete "${listing.title}"?`)) return;

    try {
      await deleteDoc(doc(db, 'places', listing.id!));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `places/${listing.id}`);
    }
  };

  const handleDeleteEvent = async (event: MerchantEvent) => {
    if (!window.confirm(`Are you sure you want to delete event "${event.title}"?`)) return;

    try {
      await deleteDoc(doc(db, 'events', event.id!));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `events/${event.id}`);
    }
  };

  const handleDeleteTransit = async (route: TransitRoute) => {
    if (!window.confirm(`Are you sure you want to delete transit route "${route.name}"?`)) return;

    try {
      await deleteDoc(doc(db, 'transit_routes', route.id!));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `transit_routes/${route.id}`);
    }
  };

  useEffect(() => {
    if (!user) return;

    const qListings = query(collection(db, 'places'), where('ownerId', '==', user.uid));
    const unsubscribeListings = onSnapshot(qListings, (snapshot) => {
      const fetchedListings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MerchantPlace));
      setListings(fetchedListings);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'places'));

    const qEvents = query(collection(db, 'events'), where('organizerId', '==', user.uid));
    const unsubscribeEvents = onSnapshot(qEvents, (snapshot) => {
      const fetchedEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MerchantEvent));
      setEvents(fetchedEvents);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'events'));

    return () => {
      unsubscribeListings();
      unsubscribeEvents();
    };
  }, [user]);

  useEffect(() => {
    if (!user || listings.length === 0) {
      setInquiries([]);
      return;
    }

    // Fetch inquiries for all listings owned by this merchant
    const listingIds = listings.map(l => l.id);
    if (listingIds.length === 0) return;

    // We'll fetch all inquiries for now and filter client-side to avoid 'in' query limits
    // In a production app, we'd use a more scalable approach (e.g. cloud functions or denormalization)
    const qInquiries = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));

    const unsubscribeInquiries = onSnapshot(qInquiries, (snapshot) => {
      const allInquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inquiry));
      const merchantInquiries = allInquiries.filter(i => listingIds.includes(i.listingId));
      setInquiries(merchantInquiries);
    });

    return () => unsubscribeInquiries();
  }, [user, listings]);

  return (
    <div className="p-8 space-y-10 bg-sand min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-4xl font-serif italic text-ink">Operator Hub</h2>
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-turquoise" />
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-400">Territory-scale operating layer</p>
          </div>
        </div>
        <button 
          onClick={() => {
            if (subTab === 'events') setShowAddEvent(true);
            else if (subTab === 'transit') setShowAddTransit(true);
            else setShowAddListing(true);
          }}
          className="w-14 h-14 bg-ink text-turquoise rounded-2xl shadow-2xl shadow-ink/20 flex items-center justify-center hover:bg-ocean transition-all active:scale-95"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-stone-200 overflow-x-auto no-scrollbar pb-1">
        {(['overview', 'listings', 'events', 'leads', 'intelligence', 'transit'] as const).map((tab) => (
          <button 
            key={tab}
            onClick={() => setSubTab(tab)}
            className={cn(
              "px-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all whitespace-nowrap rounded-t-xl",
              subTab === tab 
                ? "bg-white text-turquoise border-b-2 border-turquoise shadow-sm" 
                : "text-stone-400 hover:text-ink"
            )}
          >
            {tab === 'transit' ? 'Transit & Logistics' : tab} {tab === 'leads' ? `(${inquiries.filter(i => i.status === 'new').length})` : ''}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {subTab === 'intelligence' && (
          <motion.div 
            key="intelligence"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-4 px-2">
                <div className="w-8 h-px bg-turquoise" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Territory Intelligence</h3>
              </div>
              <p className="text-sm text-stone-500 font-serif italic px-2">Real-time market data and visitor sentiment across the USVI.</p>
            </div>

            {/* Territory Stats */}
            <div className="bento-grid">
              <div className="bento-card col-span-1 md:col-span-4 flex flex-col justify-between h-48">
                <div className="micro-label">Total Quarters</div>
                <div className="text-6xl font-serif italic text-ink">{geoIntelligence.quarters.length}</div>
              </div>
              <div className="bento-card col-span-1 md:col-span-4 flex flex-col justify-between h-48">
                <div className="micro-label">Active Listings</div>
                <div className="text-6xl font-serif italic text-ink">{territoryStats?.activeListings || '...'}</div>
              </div>
              <div className="bento-card col-span-1 md:col-span-4 flex flex-col justify-between h-48">
                <div className="micro-label">Transit Hubs</div>
                <div className="text-6xl font-serif italic text-ink">{territoryStats?.transitHubs || '...'}</div>
              </div>
            </div>

            {/* Charts Section */}
            <div className="bento-grid">
              {/* Visitor Trends */}
              <div className="bento-card col-span-1 md:col-span-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-turquoise" />
                    <h3 className="micro-label text-ink">Visitor Traffic</h3>
                  </div>
                  <TrendingUp size={20} className="text-turquoise" />
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={DUMMY_TREND_DATA}>
                      <defs>
                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#40E0D0" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#40E0D0" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#d1d1d1'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#d1d1d1'}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                      />
                      <Area type="monotone" dataKey="views" stroke="#40E0D0" strokeWidth={4} fillOpacity={1} fill="url(#colorViews)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bento-card col-span-1 md:col-span-4 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-px bg-turquoise" />
                    <h3 className="micro-label text-ink">Interest</h3>
                  </div>
                  <PieChartIcon size={20} className="text-ocean" />
                </div>
                <div className="h-64 w-full flex flex-col items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={DUMMY_CATEGORY_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {DUMMY_CATEGORY_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 w-full">
                    {DUMMY_CATEGORY_DATA.map((entry, index) => (
                      <div key={entry.name} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400">{entry.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-stone-100 shadow-2xl shadow-stone-200/50 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-px bg-turquoise" />
                <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ink">Territory Quarters</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {geoIntelligence.quarters.map(q => (
                  <div key={q} className="p-6 bg-sand rounded-2xl text-center border border-stone-50 hover:border-turquoise/20 transition-colors group">
                    <span className="text-sm font-serif italic text-ink group-hover:text-turquoise transition-colors">{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {subTab === 'overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50 space-y-4">
                <div className="flex items-center gap-3 text-turquoise">
                  <div className="w-10 h-10 rounded-xl bg-sand flex items-center justify-center">
                    <TrendingUp size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Total Views</span>
                </div>
                <div className="text-5xl font-serif italic text-ink">1,284</div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50 space-y-4">
                <div className="flex items-center gap-3 text-coral">
                  <div className="w-10 h-10 rounded-xl bg-coral/5 flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">New Leads</span>
                </div>
                <div className="text-5xl font-serif italic text-ink">{inquiries.filter(i => i.status === 'new').length}</div>
              </div>
            </div>

            {/* Quick Listings Preview */}
            <section className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-px bg-turquoise" />
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Your Listings</h3>
                </div>
                <button onClick={() => setSubTab('listings')} className="text-[10px] font-bold uppercase tracking-widest text-turquoise hover:text-ocean transition-colors">View All</button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {listings.slice(0, 3).map(listing => (
                  <ListingItem 
                    key={listing.id} 
                    listing={listing} 
                    onEdit={() => setEditingListing(listing)}
                    onDelete={() => handleDeleteListing(listing)}
                  />
                ))}
                {listings.length === 0 && (
                  <div className="text-center py-20 bg-white/50 rounded-[2.5rem] border-2 border-dashed border-stone-200 text-stone-400">
                    <p className="text-[11px] font-bold uppercase tracking-widest font-serif italic">No listings yet.</p>
                  </div>
                )}
              </div>
            </section>
          </motion.div>
        )}

        {subTab === 'listings' && (
          <motion.div 
            key="listings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 px-2">
              <div className="w-8 h-px bg-turquoise" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">All Active Listings</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {listings.map(listing => (
                <ListingItem 
                  key={listing.id} 
                  listing={listing} 
                  showDetails 
                  onEdit={() => setEditingListing(listing)}
                  onDelete={() => handleDeleteListing(listing)}
                />
              ))}
              {listings.length === 0 && (
                <div className="text-center py-20 bg-white/50 rounded-[2.5rem] text-stone-400">
                  <p className="font-serif italic">You haven't created any listings yet.</p>
                  <button 
                    onClick={() => setShowAddListing(true)}
                    className="mt-6 text-turquoise font-bold uppercase tracking-widest text-[10px]"
                  >
                    Create your first listing
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {subTab === 'events' && (
          <motion.div 
            key="events"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 px-2">
              <div className="w-8 h-px bg-turquoise" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Your Events</h3>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {events.map(event => (
                <div key={event.id} className="bg-white p-4 rounded-[2rem] border border-stone-100 shadow-2xl shadow-stone-200/50 flex items-center gap-4 group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-50 flex-shrink-0 shadow-inner">
                    <img src={event.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-lg font-serif italic text-ink truncate">{event.title}</h4>
                    <div className="flex items-center gap-2 text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                      <CalendarIcon size={12} className="text-turquoise" />
                      <span>{event.islandCode.replace('_', ' ')} • {format(new Date(event.startAt), 'MMM d')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingEvent(event)}
                      className="w-10 h-10 rounded-xl bg-sand text-stone-400 hover:text-turquoise hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteEvent(event)}
                      className="w-10 h-10 rounded-xl bg-sand text-stone-400 hover:text-coral hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center py-20 bg-white/50 rounded-[2.5rem] text-stone-400">
                  <p className="font-serif italic">You haven't created any events yet.</p>
                  <button 
                    onClick={() => setShowAddEvent(true)}
                    className="mt-6 text-turquoise font-bold uppercase tracking-widest text-[10px]"
                  >
                    Create your first event
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {subTab === 'transit' && (
          <motion.div 
            key="transit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            <div className="flex items-center gap-4 px-2">
              <div className="w-8 h-px bg-turquoise" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-ink">Transit & Logistics</h3>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {transitRoutes.map(route => (
                <div key={route.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-sand rounded-2xl flex items-center justify-center text-ink">
                        {route.type === 'ferry' ? <Waves size={24} className="text-blue-500" /> : <Clock size={24} />}
                      </div>
                      <div>
                        <h4 className="text-xl font-serif italic text-ink">{route.name}</h4>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{route.type} • {route.from} to {route.to}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <select 
                        value={route.status}
                        onChange={(e) => {
                          updateDoc(doc(db, 'transit_routes', route.id), { status: e.target.value, lastUpdated: Date.now() });
                        }}
                        className={cn(
                          "text-[9px] px-4 py-2 rounded-xl font-bold uppercase tracking-widest border-none outline-none",
                          route.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
                          route.status === 'delayed' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        )}
                      >
                        <option value="active">Active</option>
                        <option value="delayed">Delayed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setEditingTransit(route)}
                          className="w-10 h-10 rounded-xl bg-sand text-stone-400 hover:text-turquoise hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteTransit(route)}
                          className="w-10 h-10 rounded-xl bg-sand text-stone-400 hover:text-coral hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">Last Updated: {format(new Date(route.lastUpdated), 'h:mm a')}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-ink">{route.price}</span>
                      <span className="text-[10px] text-stone-400 italic">{route.schedule}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {transitRoutes.length === 0 && (
                <div className="text-center py-32 bg-white/50 rounded-[3rem] border-2 border-dashed border-stone-200">
                  <p className="text-stone-400 font-serif italic text-xl">No transit routes managed yet.</p>
                  <button 
                    onClick={() => setShowAddTransit(true)}
                    className="mt-6 px-10 py-4 bg-ink text-white rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em]"
                  >
                    Add First Route
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {subTab === 'leads' && (
          <motion.div 
            key="leads"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 px-2">
              <div className="w-8 h-px bg-turquoise" />
              <h3 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Customer Inquiries</h3>
            </div>
            <div className="grid grid-cols-1 gap-6">
              {inquiries.map(inquiry => (
                <div key={inquiry.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h4 className="text-xl font-serif italic text-ink">{inquiry.userName}</h4>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">{inquiry.userEmail}</p>
                    </div>
                    <span className={cn(
                      "text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest",
                      inquiry.status === 'new' ? "bg-ocean text-white" : "bg-stone-100 text-stone-400"
                    )}>
                      {inquiry.status}
                    </span>
                  </div>
                  <div className="relative p-6 bg-sand rounded-2xl">
                    <p className="text-sm text-ink/80 italic font-serif leading-relaxed">"{inquiry.message}"</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-stone-50">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-stone-300">{format(new Date(inquiry.createdAt), 'MMM d, h:mm a')}</span>
                    <div className="flex gap-6">
                      <a 
                        href={`mailto:${inquiry.userEmail}?subject=Inquiry regarding ${inquiry.listingName}`}
                        onClick={() => {
                          if (inquiry.status === 'new') {
                            updateDoc(doc(db, 'inquiries', inquiry.id), { status: 'replied' });
                          }
                        }}
                        className="text-[10px] font-bold uppercase tracking-widest text-turquoise hover:text-ocean transition-colors"
                      >
                        Reply
                      </a>
                      {inquiry.status !== 'archived' && (
                        <button 
                          onClick={async () => {
                            try {
                              await updateDoc(doc(db, 'inquiries', inquiry.id), { status: inquiry.status === 'new' ? 'read' : 'archived' });
                            } catch (error) {
                              handleFirestoreError(error, OperationType.UPDATE, `inquiries/${inquiry.id}`);
                            }
                          }}
                          className="text-[10px] font-bold uppercase tracking-widest text-stone-300 hover:text-ink transition-colors"
                        >
                          {inquiry.status === 'new' ? 'Mark Read' : 'Archive'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {inquiries.length === 0 && (
                <div className="text-center py-20 bg-white/50 rounded-[2.5rem] text-stone-400">
                  <p className="font-serif italic">No inquiries yet. Leads will appear here when tourists contact your business.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Listing Modal */}
      {(showAddListing || editingListing) && (
        <div className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-10 space-y-8 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif italic text-ink">{editingListing ? 'Edit Listing' : 'New Listing'}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-turquoise" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Business Details</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddListing(false);
                  setEditingListing(null);
                }} 
                className="w-10 h-10 rounded-full bg-sand text-stone-400 flex items-center justify-center hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              if (uploading) return;
              
              const formData = new FormData(e.currentTarget);
              setUploading(true);

              try {
                // Upload new images
                const newImageUrls = await Promise.all(
                  selectedImages.map(async (file) => {
                    const fileExtension = file.name.split('.').pop();
                    const fileName = `${Math.random().toString(36).substring(7)}.${fileExtension}`;
                    const storageRef = ref(storage, `listings/${user?.uid}/${Date.now()}-${fileName}`);
                    const snapshot = await uploadBytes(storageRef, file);
                    return getDownloadURL(snapshot.ref);
                  })
                );

                const finalImages = [...existingImages, ...newImageUrls];
                
                // If no images at all, use a placeholder
                if (finalImages.length === 0) {
                  finalImages.push(`https://picsum.photos/seed/${Math.random()}/800/600`);
                }

                const listingData = {
                  title: formData.get('title'),
                  slug: (formData.get('title') as string).toLowerCase().replace(/\s+/g, '-'),
                  category: formData.get('category'),
                  islandCode: formData.get('islandCode') || 'st_thomas',
                  description: formData.get('description'),
                  shortDescription: formData.get('shortDescription'),
                  address: formData.get('address'),
                  coordinates: {
                    lat: parseFloat(formData.get('lat') as string) || 18.3434,
                    lng: parseFloat(formData.get('lng') as string) || -64.9313,
                  },
                  ownerId: user?.uid,
                  featured: editingListing?.featured || false,
                  coverImage: finalImages[0] || `https://picsum.photos/seed/${Math.random()}/800/600`,
                  gallery: finalImages.slice(1),
                  updatedAt: Date.now(),
                  phone: formData.get('phone'),
                  website: formData.get('website'),
                  status: 'published'
                };

                if (editingListing) {
                  await updateDoc(doc(db, 'places', editingListing.id!), listingData);
                } else {
                  await addDoc(collection(db, 'places'), {
                    ...listingData,
                    createdAt: Date.now(),
                  });
                }
                
                setShowAddListing(false);
                setEditingListing(null);
                setSelectedImages([]);
              } catch (error) {
                handleFirestoreError(error, editingListing ? OperationType.UPDATE : OperationType.CREATE, editingListing ? `listings/${editingListing.id}` : 'listings');
              } finally {
                setUploading(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Business Name</label>
                  <input 
                    name="title" 
                    required 
                    defaultValue={editingListing?.title}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                    placeholder="e.g. Sapphire Beach Rentals" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Island</label>
                    <select 
                      name="islandCode" 
                      defaultValue={editingListing?.islandCode || 'st_thomas'}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink appearance-none"
                    >
                      <option value="st_thomas">St. Thomas</option>
                      <option value="st_john">St. John</option>
                      <option value="st_croix">St. Croix</option>
                      <option value="water_island">Water Island</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Category</label>
                    <select 
                      name="category" 
                      defaultValue={editingListing?.category}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink appearance-none"
                    >
                      <option value="restaurant">Restaurant</option>
                      <option value="bar">Bar</option>
                      <option value="cafe">Cafe</option>
                      <option value="shopping">Shopping</option>
                      <option value="attraction">Attraction</option>
                      <option value="excursion">Excursion</option>
                      <option value="provisioning">Provisioning</option>
                      <option value="concierge">Concierge</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Short Description</label>
                  <input 
                    name="shortDescription" 
                    defaultValue={editingListing?.shortDescription}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                    placeholder="One sentence summary..." 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Full Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingListing?.description}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink h-32 resize-none" 
                    placeholder="Tell visitors why they should visit..." 
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="space-y-3">
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block px-1">Business Images</label>
                  <div className="grid grid-cols-5 gap-3">
                    {/* Existing Images */}
                    {existingImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-sand group">
                        <img 
                          src={url} 
                          alt="" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button 
                          type="button"
                          onClick={() => setExistingImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-ink/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {/* Newly Selected Images */}
                    {selectedImages.map((file, idx) => (
                      <div key={`new-${idx}`} className="relative aspect-square rounded-xl overflow-hidden bg-sand group">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt="" 
                          className="w-full h-full object-cover opacity-70"
                        />
                        <button 
                          type="button"
                          onClick={() => setSelectedImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-ink/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    {(existingImages.length + selectedImages.length) < 5 && (
                      <label className="aspect-square rounded-xl border-2 border-dashed border-stone-200 flex flex-col items-center justify-center text-stone-400 cursor-pointer hover:bg-sand hover:border-turquoise transition-all">
                        <Upload size={20} />
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setSelectedImages(prev => [...prev, ...files].slice(0, 5 - existingImages.length));
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <p className="text-[9px] text-stone-400 italic">Upload up to 5 high-quality images.</p>
                </div>

                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Address</label>
                  <input 
                    name="address" 
                    required 
                    defaultValue={editingListing?.address}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                    placeholder="e.g. Red Hook, St. Thomas" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Latitude</label>
                    <input 
                      name="lat" 
                      type="number"
                      step="any"
                      defaultValue={editingListing?.coordinates?.lat || 18.3434}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="18.3434" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Longitude</label>
                    <input 
                      name="lng" 
                      type="number"
                      step="any"
                      defaultValue={editingListing?.coordinates?.lng || -64.9313}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="-64.9313" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Phone Number</label>
                    <input 
                      name="phone" 
                      defaultValue={editingListing?.phone}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="e.g. 340-000-0000" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Website</label>
                    <input 
                      name="website" 
                      defaultValue={editingListing?.website}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="https://..." 
                    />
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-ink text-turquoise py-5 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-ink/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-ocean transition-all active:scale-95"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  editingListing ? 'Update Listing' : 'Publish Listing'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* Add/Edit Event Modal */}
      {(showAddEvent || editingEvent) && (
        <div className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-10 space-y-8 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif italic text-ink">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-turquoise" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Event Details</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddEvent(false);
                  setEditingEvent(null);
                }} 
                className="w-10 h-10 rounded-full bg-sand text-stone-400 flex items-center justify-center hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              if (uploading) return;
              
              const formData = new FormData(e.currentTarget);
              setUploading(true);

              try {
                let imageUrl = editingEvent?.coverImage || `https://picsum.photos/seed/${Math.random()}/800/600`;
                
                // Handle single image upload for event
                const imageFile = (e.currentTarget.elements.namedItem('image') as HTMLInputElement).files?.[0];
                if (imageFile) {
                  const fileExtension = imageFile.name.split('.').pop();
                  const fileName = `${Math.random().toString(36).substring(7)}.${fileExtension}`;
                  const storageRef = ref(storage, `events/${user?.uid}/${Date.now()}-${fileName}`);
                  const snapshot = await uploadBytes(storageRef, imageFile);
                  imageUrl = await getDownloadURL(snapshot.ref);
                }

                const eventData = {
                  title: formData.get('title'),
                  slug: (formData.get('title') as string).toLowerCase().replace(/\s+/g, '-'),
                  islandCode: formData.get('islandCode') || 'st_thomas',
                  description: formData.get('description'),
                  venueName: formData.get('venueName'),
                  startAt: new Date(formData.get('startAt') as string).getTime(),
                  coverImage: imageUrl,
                  organizerId: user?.uid,
                  updatedAt: Date.now(),
                  status: 'published'
                };

                if (editingEvent) {
                  await updateDoc(doc(db, 'events', editingEvent.id!), eventData);
                } else {
                  await addDoc(collection(db, 'events'), {
                    ...eventData,
                    createdAt: Date.now(),
                  });
                }
                
                setShowAddEvent(false);
                setEditingEvent(null);
              } catch (error) {
                handleFirestoreError(error, editingEvent ? OperationType.UPDATE : OperationType.CREATE, editingEvent ? `events/${editingEvent.id}` : 'events');
              } finally {
                setUploading(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Event Title</label>
                  <input 
                    name="title" 
                    required 
                    defaultValue={editingEvent?.title}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                    placeholder="e.g. Island Music Night" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Island</label>
                    <select 
                      name="islandCode" 
                      defaultValue={editingEvent?.islandCode || 'st_thomas'}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink appearance-none"
                    >
                      <option value="st_thomas">St. Thomas</option>
                      <option value="st_john">St. John</option>
                      <option value="st_croix">St. Croix</option>
                      <option value="water_island">Water Island</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Venue Name</label>
                    <input 
                      name="venueName" 
                      required 
                      defaultValue={editingEvent?.venueName}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="e.g. Magens Bay" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Start Date & Time</label>
                  <input 
                    name="startAt" 
                    type="datetime-local"
                    required 
                    defaultValue={editingEvent?.startAt ? format(new Date(editingEvent.startAt), "yyyy-MM-dd'T'HH:mm") : ''}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Description</label>
                  <textarea 
                    name="description" 
                    defaultValue={editingEvent?.description}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink h-32 resize-none" 
                    placeholder="Tell people about your event..." 
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Event Image</label>
                  <div className="relative group">
                    <input 
                      name="image" 
                      type="file"
                      accept="image/*"
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                    />
                    {editingEvent?.coverImage && (
                      <div className="mt-3 w-24 h-24 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                        <img src={editingEvent.coverImage} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-ink text-turquoise py-5 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-ink/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-ocean transition-all active:scale-95"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  editingEvent ? 'Update Event' : 'Publish Event'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
      {/* Add/Edit Transit Modal */}
      {(showAddTransit || editingTransit) && (
        <div className="fixed inset-0 z-[100] bg-ink/60 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-lg rounded-t-[3rem] sm:rounded-[3rem] p-10 space-y-8 max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <h3 className="text-2xl font-serif italic text-ink">{editingTransit ? 'Edit Route' : 'New Transit Route'}</h3>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-px bg-turquoise" />
                  <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Logistics Details</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAddTransit(false);
                  setEditingTransit(null);
                }} 
                className="w-10 h-10 rounded-full bg-sand text-stone-400 flex items-center justify-center hover:text-ink transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form className="space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              setUploading(true);

              try {
                const routeData = {
                  name: formData.get('name'),
                  type: formData.get('type'),
                  islandCode: formData.get('islandCode') || 'st_thomas',
                  from: formData.get('from'),
                  to: formData.get('to'),
                  schedule: formData.get('schedule'),
                  price: formData.get('price'),
                  status: formData.get('status') || 'active',
                  operatorId: user?.uid,
                  lastUpdated: Date.now()
                };

                if (editingTransit) {
                  await updateDoc(doc(db, 'transit_routes', editingTransit.id!), routeData);
                } else {
                  await addDoc(collection(db, 'transit_routes'), routeData);
                }
                
                setShowAddTransit(false);
                setEditingTransit(null);
              } catch (error) {
                handleFirestoreError(error, editingTransit ? OperationType.UPDATE : OperationType.CREATE, 'transit_routes');
              } finally {
                setUploading(false);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Route Name</label>
                  <input 
                    name="name" 
                    required 
                    defaultValue={editingTransit?.name}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                    placeholder="e.g. St. Thomas to St. John Ferry" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Type</label>
                    <select 
                      name="type" 
                      defaultValue={editingTransit?.type || 'ferry'}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink appearance-none"
                    >
                      <option value="ferry">Ferry</option>
                      <option value="shuttle">Shuttle</option>
                      <option value="bus">Bus</option>
                      <option value="helicopter">Helicopter</option>
                      <option value="seaplane">Seaplane</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Island</label>
                    <select 
                      name="islandCode" 
                      defaultValue={editingTransit?.islandCode || 'st_thomas'}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink appearance-none"
                    >
                      <option value="st_thomas">St. Thomas</option>
                      <option value="st_john">St. John</option>
                      <option value="st_croix">St. Croix</option>
                      <option value="water_island">Water Island</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">From</label>
                    <input 
                      name="from" 
                      required 
                      defaultValue={editingTransit?.from}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="e.g. Red Hook" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">To</label>
                    <input 
                      name="to" 
                      required 
                      defaultValue={editingTransit?.to}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="e.g. Cruz Bay" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Schedule</label>
                    <input 
                      name="schedule" 
                      required 
                      defaultValue={editingTransit?.schedule}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="e.g. Every hour" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Price</label>
                    <input 
                      name="price" 
                      required 
                      defaultValue={editingTransit?.price}
                      className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink" 
                      placeholder="e.g. $8.15" 
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-2 px-1">Status</label>
                  <select 
                    name="status" 
                    defaultValue={editingTransit?.status || 'active'}
                    className="w-full bg-sand border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-turquoise/20 transition-all text-ink appearance-none"
                  >
                    <option value="active">Active</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-ink text-turquoise py-5 rounded-[2rem] font-bold uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-ink/20 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed hover:bg-ocean transition-all active:scale-95"
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  editingTransit ? 'Update Route' : 'Publish Route'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ListingItem({ 
  listing, 
  showDetails, 
  onEdit, 
  onDelete 
}: { 
  listing: MerchantPlace; 
  showDetails?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="bg-white p-4 rounded-[2rem] border border-stone-100 shadow-2xl shadow-stone-200/50 flex items-center gap-4 group">
      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-stone-50 flex-shrink-0 shadow-inner">
        <img src={listing.coverImage || 'https://picsum.photos/seed/biz/100/100'} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
      </div>
      <div className="flex-1 min-w-0 space-y-1">
        <h4 className="text-lg font-serif italic text-ink truncate">{listing.title}</h4>
        <div className="flex items-center gap-2 text-[9px] text-stone-400 font-bold uppercase tracking-widest">
          <MapPin size={12} className="text-turquoise" />
          <span>{listing.category} • {listing.featured ? 'Featured' : 'Standard'}</span>
        </div>
        {showDetails && (
          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-1 text-[9px] font-bold text-stone-300">
              <Phone size={10} className="text-turquoise" />
              <span>{listing.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-stone-300">
              <MapPin size={10} className="text-turquoise" />
              <span className="truncate max-w-[120px]">{listing.address}</span>
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onEdit && (
          <button 
            onClick={onEdit}
            className="w-10 h-10 rounded-xl bg-sand text-stone-400 hover:text-turquoise hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
          >
            <Edit2 size={18} />
          </button>
        )}
        {onDelete && (
          <button 
            onClick={onDelete}
            className="w-10 h-10 rounded-xl bg-sand text-stone-400 hover:text-coral hover:bg-white hover:shadow-lg transition-all flex items-center justify-center"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
