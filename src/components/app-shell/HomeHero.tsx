import React from 'react';
import { motion } from 'motion/react';
import { Compass, Search } from 'lucide-react';
import IslandSelector from '../IslandSelector';
import { IslandCode, IslandDoc } from '../../types';

interface HomeHeroProps {
  islands: IslandDoc[];
  selectedIsland: IslandCode;
  onSelectIsland: (code: IslandCode) => void;
  onSearch?: (query: string) => void;
}

export function HomeHero({ islands, selectedIsland, onSelectIsland, onSearch }: HomeHeroProps) {
  const [query, setQuery] = React.useState('');

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearch?.(trimmed);
  };

  return (
    <section className="relative h-[90vh] w-full overflow-hidden bg-stone-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "linear" }}
          src="https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=2000"
          alt="Trunk Bay, St. John"
          className="h-full w-full object-cover opacity-70"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-sand" />
      </div>

      {/* Top Bar with Island Selector */}
      <div className="absolute top-8 left-6 right-6 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-2xl">
            <Compass className="text-turquoise w-6 h-6" />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-serif italic text-2xl leading-none tracking-tight">VI Explorer</span>
            <span className="text-[8px] text-white/60 font-bold uppercase tracking-[0.3em] mt-1">Premium Guide</span>
          </div>
        </div>
        <IslandSelector 
          islands={islands} 
          selectedIsland={selectedIsland} 
          onSelect={onSelectIsland} 
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-12 h-px bg-turquoise/40" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-turquoise">
              The Official Collection
            </span>
            <div className="w-12 h-px bg-turquoise/40" />
          </div>
          <h1 className="fluid-text text-white font-serif italic">
            Uncover the <br /> 
            <span className="text-turquoise">Untamed</span> Beauty
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-2xl"
        >
          <form className="relative group" onSubmit={submitSearch}>
            <div className="absolute -inset-1 bg-gradient-to-r from-turquoise/50 to-ocean/50 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] overflow-hidden shadow-2xl">
              <Search className="ml-8 h-6 w-6 text-white/40" />
              <input
                type="text"
                placeholder="Search beaches, dining, events..."
                className="h-20 w-full bg-transparent px-6 text-white placeholder:text-white/30 focus:outline-none text-xl font-light"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search across beaches, dining, and events"
              />
              <button
                type="submit"
                className="mr-3 bg-white text-ink px-10 py-4 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest hover:bg-turquoise hover:text-white transition-all active:scale-95"
              >
                Explore
              </button>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-[8px] text-stone-400 font-bold uppercase tracking-[0.4em] [writing-mode:vertical-rl] rotate-180">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-turquoise to-transparent" />
      </motion.div>
    </section>
  );
}
