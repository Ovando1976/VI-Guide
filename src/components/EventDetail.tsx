import React from 'react';
import { EventDoc } from '../types';
import { motion } from 'motion/react';
import { Calendar, MapPin, Tag, X, ChevronLeft, Share2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface EventDetailProps {
  event: EventDoc;
  onClose: () => void;
}

export default function EventDetail({ event, onClose }: EventDetailProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-sand overflow-y-auto no-scrollbar"
    >
      {/* Hero Image */}
      <div className="relative h-[65vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          src={event.coverImage || `https://picsum.photos/seed/${event.title}/1920/1080`} 
          alt={event.title}
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
          <button className="w-14 h-14 glass rounded-full flex items-center justify-center text-ink hover:bg-white transition-all shadow-2xl">
            <Share2 size={22} />
          </button>
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
              {event.category?.replace('_', ' ') || 'Island Event'}
            </p>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-6xl md:text-8xl font-serif italic leading-[0.85] text-ink tracking-tight"
          >
            {event.title}
          </motion.h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-3 gap-20">
        <div className="lg:col-span-2 space-y-16">
          <section className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-px bg-turquoise" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">The Occasion</h2>
            </div>
            <p className="text-2xl md:text-3xl text-ink/80 leading-relaxed font-serif italic">
              {event.description}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-white rounded-[2.5rem] space-y-4 border border-stone-100 shadow-2xl shadow-stone-200/50">
              <div className="flex items-center gap-3 text-turquoise">
                <Calendar size={20} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Date</span>
              </div>
              <p className="text-xl font-serif italic text-ink">{format(new Date(event.startAt), 'MMMM d, yyyy')}</p>
            </div>
            <div className="p-8 bg-white rounded-[2.5rem] space-y-4 border border-stone-100 shadow-2xl shadow-stone-200/50">
              <div className="flex items-center gap-3 text-turquoise">
                <Clock size={20} />
                <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Time</span>
              </div>
              <p className="text-xl font-serif italic text-ink">{format(new Date(event.startAt), 'h:mm a')}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 p-8 bg-white rounded-[2.5rem] border border-stone-100 shadow-2xl shadow-stone-200/50">
            <div className="w-14 h-14 bg-sand rounded-2xl flex items-center justify-center text-turquoise shadow-inner">
              <MapPin size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-stone-400">Venue</p>
              <p className="text-xl font-serif italic text-ink">{event.venueName || 'St. Thomas'}</p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <button className="w-full bg-ink text-white py-6 rounded-2xl text-[10px] font-bold uppercase tracking-[0.3em] shadow-2xl shadow-ink/20 hover:bg-ocean transition-all active:scale-[0.98]">
            Add to Calendar
          </button>
          
          <div className="p-8 glass rounded-[2.5rem] space-y-6 border border-white">
            <h3 className="text-lg font-serif italic text-ink">Need assistance?</h3>
            <p className="text-[11px] text-ink/60 font-bold uppercase tracking-widest leading-relaxed">Our AI Concierge can help you plan your trip around this event.</p>
            <button className="text-[10px] font-bold uppercase tracking-[0.3em] text-turquoise hover:text-ocean transition-colors flex items-center gap-2">
              Ask Concierge
              <ChevronLeft size={14} className="rotate-180" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
