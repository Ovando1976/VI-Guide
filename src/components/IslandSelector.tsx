import React from 'react';
import { IslandDoc, IslandCode } from '../types';
import { MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface IslandSelectorProps {
  islands: IslandDoc[];
  selectedIsland: IslandCode;
  onSelect: (code: IslandCode) => void;
}

export default function IslandSelector({ islands, selectedIsland, onSelect }: IslandSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const currentIsland = islands.find(i => i.code === selectedIsland);

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 px-6 py-3 bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[2rem] shadow-2xl shadow-stone-200/50 hover:bg-white/60 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-turquoise/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="relative w-10 h-10 rounded-2xl bg-ink text-turquoise flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
          <MapPin size={20} />
        </div>
        <div className="relative text-left">
          <p className="micro-label text-stone-400 mb-1">Territory</p>
          <p className="text-base font-serif italic text-ink leading-none">{currentIsland?.name || 'Select Island'}</p>
        </div>
        <ChevronDown 
          size={18} 
          className={cn(
            "text-stone-300 transition-transform duration-500 ml-2 group-hover:text-turquoise",
            isOpen ? "rotate-180" : "rotate-0"
          )} 
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-md z-[-1]"
            />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute top-full left-0 mt-4 w-80 bg-white/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl shadow-ink/10 border border-white p-3 overflow-hidden"
            >
              <div className="space-y-2">
                {islands.map((island) => (
                  <button
                    key={island.code}
                    onClick={() => {
                      onSelect(island.code);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-4 p-4 rounded-[2rem] transition-all group relative overflow-hidden",
                      selectedIsland === island.code 
                        ? "bg-ink text-white shadow-xl shadow-ink/20" 
                        : "hover:bg-white text-ink border border-transparent hover:border-stone-100"
                    )}
                  >
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white shadow-lg">
                      <img 
                        src={island.heroImage} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="text-left space-y-1">
                      <p className="font-serif italic text-xl leading-tight">{island.name}</p>
                      <p className="micro-label opacity-60">{island.shortName}</p>
                    </div>
                    {selectedIsland === island.code && (
                      <div className="ml-auto w-2.5 h-2.5 rounded-full bg-turquoise shadow-[0_0_15px_rgba(64,224,208,0.6)] animate-pulse" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
