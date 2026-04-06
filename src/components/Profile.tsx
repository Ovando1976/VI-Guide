import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, UserRole, BeachDoc, PlaceDoc, AIDocument, UserMemory, CommunityPost } from '../types';
import { Link } from 'react-router-dom';
import { LogOut, Settings, Heart, Bell, Shield, HelpCircle, ChevronRight, User as UserIcon, MapPin, FileText, Brain, MessageSquare, Trash2, BarChart3, Database } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { seedCanonicalData } from '../seed';

export default function Profile({ 
  user, 
  profile, 
  onLogout, 
  onLogin,
  onSelectListing,
  onSelectDocument
}: { 
  user: User | null; 
  profile: UserProfile | null; 
  onLogout: () => void;
  onLogin: () => void;
  onSelectListing?: (listing: BeachDoc | PlaceDoc) => void;
  onSelectDocument?: (doc: AIDocument) => void;
}) {
  const [favorites, setFavorites] = useState<(BeachDoc | PlaceDoc)[]>([]);
  const [documents, setDocuments] = useState<AIDocument[]>([]);
  const [memories, setMemories] = useState<UserMemory[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  
  const [loadingFavs, setLoadingFavs] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [loadingMemories, setLoadingMemories] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [activeSection, setActiveSection] = useState<string | null>(null);

  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadFavorites() {
      if (!profile?.favorites || profile.favorites.length === 0) {
        setFavorites([]);
        return;
      }
      setLoadingFavs(true);
      try {
        const favs: (BeachDoc | PlaceDoc)[] = [];
        const beachesRef = collection(db, 'beaches');
        const qBeaches = query(beachesRef, where('slug', 'in', profile.favorites));
        const beachSnap = await getDocs(qBeaches);
        favs.push(...beachSnap.docs.map(d => ({ id: d.id, ...d.data() } as BeachDoc)));

        const placesRef = collection(db, 'places');
        const qPlaces = query(placesRef, where('slug', 'in', profile.favorites));
        const placeSnap = await getDocs(qPlaces);
        favs.push(...placeSnap.docs.map(d => ({ id: d.id, ...d.data() } as PlaceDoc)));
        setFavorites(favs);
      } catch (error) {
        console.error('Error loading favorites:', error);
      } finally {
        setLoadingFavs(false);
      }
    }

    async function loadDocuments() {
      setLoadingDocs(true);
      try {
        const q = query(
          collection(db, 'documents'),
          where('userId', '==', user?.uid),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        setDocuments(snap.docs.map(d => ({ id: d.id, ...d.data() } as AIDocument)));
      } catch (error) {
        console.error('Error loading documents:', error);
      } finally {
        setLoadingDocs(false);
      }
    }

    async function loadMemories() {
      setLoadingMemories(true);
      try {
        const q = query(
          collection(db, 'user_memories'),
          where('userId', '==', user?.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const snap = await getDocs(q);
        setMemories(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserMemory)));
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setLoadingMemories(false);
      }
    }

    async function loadPosts() {
      setLoadingPosts(true);
      try {
        const q = query(
          collection(db, 'community_posts'),
          where('authorId', '==', user?.uid),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as CommunityPost)));
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoadingPosts(false);
      }
    }

    if (activeSection === 'favorites') loadFavorites();
    if (activeSection === 'documents') loadDocuments();
    if (activeSection === 'memories') loadMemories();
    if (activeSection === 'posts') loadPosts();

  }, [user, profile?.favorites, activeSection]);

  if (!user) {
    return (
      <div className="p-12 text-center space-y-10 bg-sand min-h-screen flex flex-col justify-center">
        <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto text-stone-200 shadow-2xl shadow-stone-200/50">
          <UserIcon size={48} />
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-serif italic text-ink">Join Territory OS</h2>
          <p className="text-stone-500 text-sm leading-relaxed max-w-xs mx-auto font-serif italic">Your personal operating layer for the US Virgin Islands. Save favorites, manage documents, and connect with the community.</p>
        </div>
        <button 
          onClick={onLogin}
          className="w-full bg-ink text-white py-5 rounded-2xl font-bold text-[10px] uppercase tracking-[0.3em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-colors"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  const toggleRole = async () => {
    if (!user || !profile) return;
    const newRole: UserRole = profile.role === 'merchant' ? 'user' : 'merchant';
    const docRef = doc(db, 'users', user.uid);
    await updateDoc(docRef, { role: newRole });
    window.location.reload();
  };

  return (
    <div className="p-8 space-y-12 bg-sand min-h-screen pb-32">
      {/* Profile Header */}
      <div className="flex flex-col items-center text-center space-y-8 pt-12">
        <div className="relative group">
          <div className="absolute inset-0 bg-turquoise/10 rounded-full blur-3xl group-hover:blur-[100px] transition-all duration-1000" />
          <div className="relative z-10 p-2 bg-white rounded-[4rem] shadow-2xl">
            <img 
              src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`} 
              alt={user.displayName || ''} 
              className="w-40 h-40 rounded-[3.5rem] object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-2 -right-2 bg-ink text-turquoise p-4 rounded-[1.5rem] border-8 border-sand shadow-2xl z-20"
          >
            <Shield size={24} />
          </motion.div>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-5xl font-serif italic text-ink tracking-tight">{user.displayName}</h2>
            <p className="micro-label">{user.email}</p>
          </div>
          <button 
            onClick={toggleRole}
            className="inline-flex items-center gap-3 px-8 py-3 bg-white border border-stone-100 text-ink text-[10px] font-bold uppercase tracking-[0.3em] rounded-full shadow-sm hover:bg-ink hover:text-turquoise transition-all active:scale-95"
          >
            <div className={cn("w-2 h-2 rounded-full animate-pulse", profile?.role === 'merchant' ? "bg-turquoise" : "bg-ocean")} />
            {profile?.role === 'merchant' ? 'Operator' : 'Resident'} Mode
          </button>
        </div>
      </div>

      {/* Menu Sections */}
      <div className="space-y-16">
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-px bg-turquoise/30" />
            <h3 className="micro-label">My Territory</h3>
          </div>
          
          <div className="bento-grid">
            <div className="col-span-1 md:col-span-6">
              <div className="bento-card h-full flex flex-col justify-between group cursor-pointer" onClick={() => setActiveSection(activeSection === 'favorites' ? null : 'favorites')}>
                <div className="flex justify-between items-start">
                  <div className="w-14 h-14 bg-coral/10 rounded-2xl flex items-center justify-center text-coral group-hover:bg-coral group-hover:text-white transition-all">
                    <Heart size={24} />
                  </div>
                  <ChevronRight size={20} className={cn("text-stone-200 transition-all", activeSection === 'favorites' && "rotate-90 text-coral")} />
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-serif italic text-ink">Saved Places</h4>
                  <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">{favorites.length} items</p>
                </div>
              </div>
            </div>

            {(profile?.role === 'merchant' || profile?.role === 'admin') && (
              <div className="col-span-1 md:col-span-6">
                <Link to="/merchant" className="block h-full">
                  <div className="bento-card h-full flex flex-col justify-between group bg-ink border-none">
                    <div className="flex justify-between items-start">
                      <div className="w-14 h-14 bg-turquoise/20 rounded-2xl flex items-center justify-center text-turquoise group-hover:bg-turquoise group-hover:text-ink transition-all">
                        <BarChart3 size={24} />
                      </div>
                      <ChevronRight size={20} className="text-turquoise/40 group-hover:text-turquoise transition-all" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl font-serif italic text-white">Operator Hub</h4>
                      <p className="text-[10px] text-turquoise/60 font-bold uppercase tracking-widest">Management Suite</p>
                    </div>
                  </div>
                </Link>
              </div>
            )}

            <div className="col-span-1 md:col-span-4">
              <div className="bento-card h-full flex flex-col justify-between group cursor-pointer" onClick={() => setActiveSection(activeSection === 'documents' ? null : 'documents')}>
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center text-ocean group-hover:bg-ocean group-hover:text-white transition-all">
                  <FileText size={20} />
                </div>
                <h4 className="text-xl font-serif italic text-ink">Documents</h4>
              </div>
            </div>

            <div className="col-span-1 md:col-span-4">
              <div className="bento-card h-full flex flex-col justify-between group cursor-pointer" onClick={() => setActiveSection(activeSection === 'memories' ? null : 'memories')}>
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all">
                  <Brain size={20} />
                </div>
                <h4 className="text-xl font-serif italic text-ink">AI Memories</h4>
              </div>
            </div>

            <div className="col-span-1 md:col-span-4">
              <div className="bento-card h-full flex flex-col justify-between group cursor-pointer" onClick={() => setActiveSection(activeSection === 'posts' ? null : 'posts')}>
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <MessageSquare size={20} />
                </div>
                <h4 className="text-xl font-serif italic text-ink">My Posts</h4>
              </div>
            </div>
          </div>

          {/* Expanded Section Content */}
          <AnimatePresence>
            {activeSection && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-xl space-y-6">
                  {activeSection === 'favorites' && (
                    <div className="space-y-4">
                      {loadingFavs ? (
                        <div className="text-center py-12 micro-label animate-pulse">Loading favorites...</div>
                      ) : favorites.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {favorites.map(fav => (
                            <div 
                              key={fav.slug}
                              onClick={() => onSelectListing?.(fav)}
                              className="flex items-center gap-4 bg-sand/30 p-4 rounded-2xl border border-stone-50 cursor-pointer hover:bg-white hover:shadow-xl transition-all group"
                            >
                              <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 shadow-inner">
                                <img src={fav.coverImage} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-1">
                                <h4 className="text-xl font-serif italic text-ink truncate">{fav.title}</h4>
                                <div className="flex items-center gap-2 text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                                  <MapPin size={12} className="text-turquoise" />
                                  <span>{fav.islandCode.replace('_', ' ')}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-stone-400 font-serif italic">No favorites saved yet.</div>
                      )}
                    </div>
                  )}
                  {/* ... other sections ... */}
                  {activeSection === 'documents' && (
                    <div className="space-y-3">
                      {loadingDocs ? (
                        <div className="text-center py-12 micro-label animate-pulse">Loading documents...</div>
                      ) : documents.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {documents.map(doc => (
                            <div 
                              key={doc.id}
                              onClick={() => onSelectDocument?.(doc)}
                              className="bg-sand/30 p-5 rounded-2xl border border-stone-50 hover:bg-white hover:shadow-xl transition-all cursor-pointer group"
                            >
                              <h4 className="text-sm font-bold text-ink group-hover:text-turquoise transition-colors">{doc.title}</h4>
                              <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-2">
                                {format(doc.updatedAt, 'MMM d, yyyy')}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-stone-400 font-serif italic">No documents created yet.</div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <div className="w-12 h-px bg-turquoise/30" />
            <h3 className="micro-label">Settings & Security</h3>
          </div>
          <div className="bento-grid">
            <div className="col-span-1 md:col-span-3">
              <MenuButton icon={<Bell size={20} className="text-ocean" />} label="Alerts" />
            </div>
            <div className="col-span-1 md:col-span-3">
              <MenuButton icon={<Settings size={20} className="text-stone-400" />} label="Prefs" />
            </div>
            <div className="col-span-1 md:col-span-3">
              <MenuButton icon={<HelpCircle size={20} className="text-turquoise" />} label="Help" />
            </div>
            <div className="col-span-1 md:col-span-3">
              <MenuButton icon={<Shield size={20} className="text-emerald-usvi" />} label="Privacy" />
            </div>
          </div>
        </section>

        {(profile?.role === 'admin' || user?.email === 'OvandoRawlins@gmail.com') && (
          <section className="space-y-6">
            <div className="flex items-center gap-4 px-2">
              <div className="w-12 h-px bg-coral/30" />
              <h3 className="micro-label text-coral">Admin Controls</h3>
            </div>
            <button 
              disabled={isSeeding}
              onClick={async () => {
                setIsSeeding(true);
                try {
                  await seedCanonicalData();
                  window.location.reload();
                } catch (error) {
                  console.error('Seeding failed:', error);
                  setIsSeeding(false);
                }
              }}
              className="w-full flex items-center justify-center gap-4 py-6 text-ink font-bold text-[10px] uppercase tracking-[0.4em] bg-white border border-stone-100 rounded-[2rem] shadow-xl hover:bg-sand transition-all active:scale-95 disabled:opacity-50"
            >
              <Database size={20} className={cn("text-coral", isSeeding && "animate-spin")} />
              {isSeeding ? 'Seeding Territory Data...' : 'Seed Canonical Data'}
            </button>
          </section>
        )}

        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-4 py-6 text-coral font-bold text-[10px] uppercase tracking-[0.4em] bg-white border border-stone-100 rounded-[2rem] shadow-xl hover:bg-coral hover:text-white transition-all active:scale-95"
        >
          <LogOut size={20} />
          Sign Out of Territory OS
        </button>
      </div>

      <div className="text-center py-12">
        <p className="text-[9px] text-stone-300 uppercase tracking-[0.5em] font-bold">Territory OS v1.2.0</p>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-6 hover:bg-sand/50 transition-all border-b border-stone-50 last:border-0 group"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-stone-50 flex items-center justify-center group-hover:bg-white group-hover:shadow-lg transition-all">
          {icon}
        </div>
        <span className="text-sm font-bold uppercase tracking-widest text-ink/70 group-hover:text-ink transition-colors">{label}</span>
      </div>
      <ChevronRight size={18} className="text-stone-200 group-hover:text-turquoise group-hover:translate-x-1 transition-all" />
    </button>
  );
}
