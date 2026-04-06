import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PlaceDoc, IslandCode } from '../types';
import { getPlacesByCategory } from '../lib/firestore/places';
import { isIslandCode } from '../lib/utils/islands';
import { Utensils, Star, MapPin } from 'lucide-react';
import { motion } from 'motion/react';

interface EatProps {
  onSelectPlace: (place: PlaceDoc) => void;
}

export default function Eat({ onSelectPlace }: EatProps) {
  const [searchParams] = useSearchParams();
  const [places, setPlaces] = useState<PlaceDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const islandParam = searchParams.get('island');
  const islandCode = isIslandCode(islandParam) ? islandParam : 'st_thomas';

  useEffect(() => {
    async function loadPlaces() {
      setLoading(true);
      try {
        const data = await getPlacesByCategory('restaurant', islandCode);
        setPlaces(data);
      } catch (error) {
        console.error('Error loading restaurants:', error);
      } finally {
        setLoading(false);
      }
    }
    loadPlaces();
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
          <Utensils className="w-5 h-5" />
          <span className="text-sm font-bold uppercase tracking-widest">Dining</span>
        </div>
        <h1 className="text-3xl font-bold text-zinc-900">Local Flavors</h1>
        <p className="text-zinc-500 mt-1">The best spots to eat on {islandCode.replace('_', ' ')}</p>
      </header>

      <div className="grid gap-6">
        {places.map((place) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => onSelectPlace(place)}
            className="group relative bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer border border-zinc-100"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={place.coverImage || 'https://picsum.photos/seed/food/800/600'}
                alt={place.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-zinc-900 shadow-sm">
                {place.priceTier}
              </div>
            </div>

            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-zinc-900">{place.title}</h3>
                {place.rating && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">{place.rating}</span>
                  </div>
                )}
              </div>
              
              <p className="text-zinc-500 text-sm line-clamp-2 mb-4">
                {place.shortDescription || place.description}
              </p>

              <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{place.areaSlug?.replace('-', ' ')}</span>
                </div>
                {place.tags?.[0] && (
                  <span className="px-2 py-0.5 bg-zinc-100 rounded-md uppercase tracking-wider">
                    {place.tags[0]}
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
