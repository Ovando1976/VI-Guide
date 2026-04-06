import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BeachDoc, IslandCode } from '../types';
import { getBeachesByIsland } from '../lib/firestore/beaches';
import { isIslandCode } from '../lib/utils/islands';
import { Palmtree, Star, MapPin, Waves } from 'lucide-react';
import { motion } from 'motion/react';

interface BeachesProps {
  onSelectBeach: (beach: BeachDoc) => void;
}

export default function Beaches({ onSelectBeach }: BeachesProps) {
  const [searchParams] = useSearchParams();
  const [beaches, setBeaches] = useState<BeachDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const islandParam = searchParams.get('island');
  const islandCode = isIslandCode(islandParam) ? islandParam : 'st_thomas';

  useEffect(() => {
    async function loadBeaches() {
      setLoading(true);
      try {
        const data = await getBeachesByIsland(islandCode);
        setBeaches(data);
      } catch (error) {
        console.error('Error loading beaches:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBeaches();
  }, [islandCode]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-zinc-100 animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 pb-32">
      <header className="mb-8">
        <div className="flex items-center gap-2 text-emerald-600 mb-2">
          <Palmtree className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Beaches</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Island Shores</h1>
        <p className="text-zinc-500 mt-1">The most beautiful beaches on {islandCode.replace('_', ' ')}</p>
      </header>

      <div className="grid gap-6">
        {beaches.map((beach) => (
          <motion.div
            key={beach.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => onSelectBeach(beach)}
            className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-zinc-100"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={beach.coverImage || 'https://picsum.photos/seed/beach/800/600'}
                alt={beach.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-emerald-600 shadow-sm flex items-center gap-1">
                <Waves className="w-3 h-3" />
                <span>Swimmable</span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-zinc-900">{beach.title}</h3>
              </div>
              
              <p className="text-zinc-500 text-sm line-clamp-2 mb-4">
                {beach.shortDescription || beach.description}
              </p>

              <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{beach.areaSlug?.replace('-', ' ')}</span>
                </div>
                {beach.tags?.[0] && (
                  <span className="px-2 py-0.5 bg-zinc-100 rounded-md uppercase tracking-wider">
                    {beach.tags[0]}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
