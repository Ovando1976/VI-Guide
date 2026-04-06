import React from 'react';
import { motion } from 'motion/react';

type ExplorerCardProps = {
  onClick?: () => void;
  title: string;
  subtitle?: string;
  image?: string;
  badge?: string;
};

export function ExplorerCard({
  onClick,
  title,
  subtitle,
  image,
  badge,
}: ExplorerCardProps) {
  return (
    <motion.div
      whileHover={{ y: -12 }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-[3.5rem] bg-white/60 backdrop-blur-3xl shadow-2xl shadow-stone-200/40 transition-all cursor-pointer border border-white hover:shadow-turquoise/10 duration-500"
    >
      <div className="aspect-[16/10] md:aspect-[16/9] w-full bg-stone-100 overflow-hidden relative">
        {image ? (
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            src={image}
            alt={title}
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-stone-300 font-serif italic">
            Capturing the territory...
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {badge && (
          <div className="absolute top-6 left-6 z-10">
            <div className="bg-white/90 backdrop-blur-xl px-4 py-2 rounded-2xl text-[9px] font-bold uppercase tracking-[0.3em] text-ink shadow-2xl border border-white/20">
              {badge}
            </div>
          </div>
        )}

        <div className="absolute bottom-6 left-6 right-6 z-10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-3 text-turquoise">
            <div className="w-8 h-px bg-turquoise" />
            <span className="micro-label text-white">Explore Details</span>
          </div>
        </div>
      </div>

      <div className="p-10 space-y-4">
        <div className="flex justify-between items-start gap-4">
          <h3 className="text-3xl font-serif italic text-ink leading-[0.9] tracking-tight group-hover:text-turquoise transition-colors duration-500">
            {title}
          </h3>
          <div className="w-10 h-px bg-stone-100 mt-4 group-hover:w-16 group-hover:bg-turquoise transition-all duration-500" />
        </div>

        {subtitle && (
          <p className="line-clamp-2 text-xs text-stone-500 font-serif italic leading-relaxed tracking-wide opacity-80 group-hover:opacity-100 transition-opacity">
            {subtitle}
          </p>
        )}
      </div>
    </motion.div>
  );
}
