import React, { useState, useEffect } from 'react';
import { BeachDoc, PlaceDoc, UserProfile } from '../types';
import { motion } from 'motion/react';
import { MapPin, Star, Phone, Globe, MessageCircle, ChevronLeft, Share2, Heart, Map as MapIcon, Info, Clock, Navigation, Sparkles } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { LocationMap } from './maps/LocationMap';

interface ListingDetailProps {
  listing: BeachDoc | PlaceDoc;
  onClose: () => void;
}

export default function ListingDetail({ listing, onClose }: ListingDetailProps) {
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const isBeach = !('category' in listing);
  const coverImage = listing.coverImage;
  const gallery = listing.gallery || [];
  const tags = listing.tags || [];

  useEffect(() => {
    async function checkFavorite() {
      if (!auth.currentUser) return;
      
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        setProfile(userData);
        setIsFavorite(userData.favorites?.includes(listing.slug) || false);
      }
    }
    checkFavorite();
  }, [listing.slug]);

  const toggleFavorite = async () => {
    if (!auth.currentUser) {
      alert('Please sign in to save favorites!');
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      if (isFavorite) {
        await updateDoc(userRef, {
          favorites: arrayRemove(listing.slug)
        });
        setIsFavorite(false);
      } else {
        await updateDoc(userRef, {
          favorites: arrayUnion(listing.slug)
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const handleSendInquiry = async () => {
    if (!auth.currentUser || !inquiryMessage.trim()) return;

    setIsSubmitting(true);
    try {
      // Find the merchant ID if it's a place
      const merchantId = (listing as any).ownerId || 'admin';
      
      await addDoc(collection(db, 'inquiries'), {
        listingId: listing.id || listing.slug,
        listingName: listing.title,
        merchantId: merchantId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Guest',
        userEmail: auth.currentUser.email || '',
        message: inquiryMessage,
        status: 'new',
        createdAt: Date.now()
      });
      setSubmitted(true);
      setInquiryMessage('');
    } catch (error) {
      console.error('Error sending inquiry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-sand overflow-y-auto no-scrollbar"
    >
      {/* Immersive Hero */}
      <div className="relative h-[75vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src={coverImage} 
          alt={listing.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sand via-transparent to-black/40" />
        
        {/* Top Actions */}
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-50">
          <button 
            onClick={onClose}
            className="w-14 h-14 glass rounded-full flex items-center justify-center text-ink hover:bg-white transition-all shadow-2xl group"
          >
            <ChevronLeft size={28} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div className="flex gap-4">
            <button className="w-14 h-14 glass rounded-full flex items-center justify-center text-ink hover:bg-white transition-all shadow-2xl">
              <Share2 size={22} />
            </button>
            <button 
              onClick={toggleFavorite}
              className={cn(
                "w-14 h-14 glass rounded-full flex items-center justify-center transition-all shadow-2xl",
                isFavorite ? "text-coral bg-white" : "text-ink hover:bg-white"
              )}
            >
              <Heart size={22} className={isFavorite ? "fill-current" : ""} />
            </button>
          </div>
        </div>

        {/* Floating Title Card */}
        <div className="absolute bottom-16 left-8 right-8 space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="inline-block px-4 py-2 glass rounded-full"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-ink">
              {isBeach ? 'The Shoreline' : (listing as PlaceDoc).category}
            </p>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-6xl md:text-8xl font-serif italic leading-[0.85] text-ink tracking-tight"
          >
            {listing.title}
          </motion.h1>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="flex items-center gap-8"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className={cn("fill-coral text-coral", i === 4 && "opacity-30")} />
                ))}
              </div>
              <span className="text-xs font-bold text-ink/60 tracking-widest uppercase">4.9 Rating</span>
            </div>
            <div className="flex items-center gap-2 text-ink/60">
              <MapPin size={16} className="text-turquoise" />
              <span className="text-xs font-bold tracking-widest uppercase">{listing.islandCode.replace('_', ' ')}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-3 gap-20">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-20">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-turquoise" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">The Experience</h2>
            </div>
            <p className="text-2xl md:text-3xl text-ink/80 leading-relaxed font-serif italic">
              {listing.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              {tags.map(tag => (
                <span key={tag} className="px-5 py-2.5 bg-white border border-stone-100 rounded-full text-[10px] font-bold uppercase tracking-widest text-stone-500 shadow-sm">
                  {tag}
                </span>
              ))}
            </div>
          </section>

          {/* Gallery Strip */}
          {gallery.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-px bg-turquoise" />
                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Visuals</h2>
              </div>
              <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-8 px-8">
                {gallery.map((img, idx) => (
                  <motion.div 
                    key={idx} 
                    whileHover={{ scale: 1.02 }}
                    className="shrink-0 w-96 aspect-[3/4] rounded-[3rem] overflow-hidden shadow-2xl shadow-stone-200/50"
                  >
                    <img 
                      src={img} 
                      alt={`${listing.title} gallery ${idx}`} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Map Preview */}
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-turquoise" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Coordinates</h2>
            </div>
            <div className="h-[500px] rounded-[4rem] overflow-hidden border border-white shadow-2xl shadow-stone-200/50">
              <LocationMap coordinates={listing.coordinates} title={listing.title} />
            </div>
          </section>
        </div>

        {/* Sidebar / Actions */}
        <div className="space-y-12">
          {/* Quick Info Card */}
          <div className="bg-white rounded-[3rem] p-10 space-y-10 shadow-2xl shadow-stone-200/50 border border-stone-100">
            {!isBeach && (listing as PlaceDoc).hours && (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Clock size={20} className="text-turquoise" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Availability</span>
                </div>
                <div className="space-y-3">
                  {Object.entries((listing as PlaceDoc).hours || {}).map(([day, time]) => (
                    <div key={day} className="flex justify-between items-center text-[11px]">
                      <span className="text-stone-400 font-bold uppercase tracking-widest">{day}</span>
                      <span className="text-ink font-bold">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <MapPin size={20} className="text-turquoise" />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Location</span>
              </div>
              <p className="text-sm text-ink/60 font-serif italic">
                {listing.islandCode.replace('_', ' ')}
              </p>
            </div>

            <div className="pt-10 border-t border-stone-100 space-y-4">
              {'phone' in listing && listing.phone && (
                <a href={`tel:${listing.phone}`} className="flex items-center justify-center gap-3 w-full py-5 bg-ink text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-colors">
                  <Phone size={18} />
                  Call Now
                </a>
              )}
              {'website' in listing && listing.website && (
                <a href={listing.website} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full py-5 bg-white border border-stone-200 text-ink rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-sand transition-colors">
                  <Globe size={18} />
                  Visit Website
                </a>
              )}
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="bg-ocean text-white rounded-[3rem] p-10 space-y-8 shadow-2xl shadow-ocean/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            
            <div className="space-y-3 relative z-10">
              <h3 className="text-3xl font-serif italic">Plan your visit</h3>
              <p className="text-white/60 text-[11px] font-medium uppercase tracking-widest leading-relaxed">Send a message to get more information or book a service.</p>
            </div>
            
            {submitted ? (
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-8 text-center space-y-4 border border-white/20"
              >
                <div className="w-16 h-16 bg-white text-ocean rounded-full flex items-center justify-center mx-auto shadow-xl">
                  <Sparkles size={32} />
                </div>
                <p className="text-xl font-serif italic">Message Sent!</p>
                <p className="text-[10px] text-white/60 uppercase tracking-widest">We'll get back to you shortly.</p>
              </motion.div>
            ) : (
              <div className="space-y-6 relative z-10">
                <textarea
                  placeholder="Ask about availability, pricing, or special requests..."
                  className="w-full bg-white/10 border border-white/10 rounded-[2rem] p-6 text-sm focus:ring-2 focus:ring-white/20 min-h-[160px] placeholder:text-white/30 outline-none transition-all"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                />
                <button 
                  onClick={handleSendInquiry}
                  disabled={isSubmitting || !inquiryMessage.trim()}
                  className="w-full py-5 bg-white text-ocean rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-sand transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl"
                >
                  {isSubmitting ? 'Sending...' : (
                    <>
                      <MessageCircle size={18} />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
