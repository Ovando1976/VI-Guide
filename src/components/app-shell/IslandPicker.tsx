import React from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { IslandCode } from '../../types';
import { isIslandCode } from '../../lib/utils/islands';
import { MapPin, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ISLANDS: { code: IslandCode; name: string }[] = [
  { code: 'st_thomas', name: 'St. Thomas' },
  { code: 'st_john', name: 'St. John' },
  { code: 'st_croix', name: 'St. Croix' },
  { code: 'water_island', name: 'Water Island' },
];

export function IslandPicker() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const currentIsland = searchParams.get('island');
  const activeIsland = isIslandCode(currentIsland) ? currentIsland : 'st_thomas';
  const activeIslandName = ISLANDS.find(i => i.code === activeIsland)?.name || 'St. Thomas';

  const handleIslandSelect = (code: IslandCode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('island', code);
    navigate(`${location.pathname}?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white text-sm font-medium border border-white/10"
      >
        <MapPin className="w-4 h-4 text-emerald-400" />
        <span>{activeIslandName}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
            >
              <div className="p-2">
                {ISLANDS.map((island) => (
                  <button
                    key={island.code}
                    onClick={() => handleIslandSelect(island.code)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                      activeIsland === island.code
                        ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {island.name}
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
