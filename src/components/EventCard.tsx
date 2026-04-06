import React from 'react';
import { EventDoc } from '../types';
import { Calendar, MapPin, Clock, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface EventCardProps {
  event: EventDoc;
  onClick: (event: EventDoc) => void;
  variant?: 'featured' | 'compact';
  className?: string;
}

export default function EventCard({ event, onClick, variant = 'compact', className }: EventCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(event)}
      className={cn(
        "relative overflow-hidden rounded-[2.5rem] bg-white border border-stone-100 shadow-2xl shadow-stone-200/50 cursor-pointer group",
        isFeatured ? "w-80 h-[28rem]" : "w-full",
        className
      )}
    >
      <div className={cn(
        "relative overflow-hidden",
        isFeatured ? "h-full" : "h-64"
      )}>
        <motion.img 
          src={event.coverImage} 
          alt={event.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-black/20" />
        
        {/* Date Badge */}
        <div className="absolute top-6 left-6 flex flex-col items-center justify-center w-14 h-16 glass text-ink rounded-2xl shadow-xl">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-turquoise">{format(new Date(event.startAt), 'MMM')}</span>
          <span className="text-2xl font-serif italic leading-none">{format(new Date(event.startAt), 'd')}</span>
        </div>

        {/* Category Badge */}
        {event.category && (
          <div className="absolute top-6 right-6">
            <div className="px-4 py-2 glass text-ink rounded-full text-[9px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-turquoise animate-pulse" />
              {event.category.replace('_', ' ')}
            </div>
          </div>
        )}

        {/* Content Overlay for Featured */}
        {isFeatured && (
          <div className="absolute bottom-0 left-0 right-0 p-8 text-white space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-turquoise" />
              <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-turquoise">{event.venueName || 'USVI'}</p>
            </div>
            <h3 className="text-3xl font-serif italic leading-tight">{event.title}</h3>
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-turquoise" />
                {format(new Date(event.startAt), 'h:mm a')}
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-turquoise" />
                {event.islandCode.replace('_', ' ')}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content for Compact */}
      {!isFeatured && (
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-6 h-px bg-turquoise" />
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400">{event.venueName || 'USVI'}</p>
              </div>
              <h3 className="text-2xl font-serif italic text-ink leading-tight group-hover:text-ocean transition-colors">{event.title}</h3>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-turquoise bg-turquoise/5 px-3 py-1.5 rounded-full border border-turquoise/10">
              <MapPin size={12} />
              {event.islandCode.split('_')[1]}
            </div>
          </div>
          
          <p className="text-sm text-stone-500 line-clamp-2 font-serif italic leading-relaxed">
            {event.description}
          </p>
          
          <div className="flex items-center gap-6 pt-6 border-t border-stone-100">
            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
              <Clock size={14} className="text-turquoise" />
              {format(new Date(event.startAt), 'h:mm a')}
            </div>
            {event.price && (
              <div className="flex items-center gap-2 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                <Tag size={14} className="text-turquoise" />
                {event.price}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
