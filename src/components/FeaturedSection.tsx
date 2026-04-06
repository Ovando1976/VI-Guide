import React, { useState, useEffect } from 'react';
import { BeachDoc, PlaceDoc, IslandCode } from '../types';
import { getFeaturedListings } from '../lib/firestore/featured';
import { BeachCard } from './cards/BeachCard';
import { PlaceCard } from './cards/PlaceCard';
import SectionHeader from './SectionHeader';
import { motion } from 'motion/react';

export function FeaturedSection({ 
  selectedIsland, 
  onSelectListing 
}: { 
  selectedIsland: IslandCode;
  onSelectListing: (listing: BeachDoc | PlaceDoc) => void 
}) {
  const [featured, setFeatured] = useState<(BeachDoc | PlaceDoc)[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      setLoading(true);
      const data = await getFeaturedListings(selectedIsland);
      setFeatured(data);
      setLoading(false);
    };
    fetchFeatured();
  }, [selectedIsland]);

  if (loading) return null;
  if (featured.length === 0) return null;

  return (
    <section className="px-6 mb-12">
      <SectionHeader 
        title="Handpicked Gems" 
        subtitle="Featured Discoveries" 
        className="mb-8"
      />
      
      <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6">
        {featured.map((item, idx) => (
          <motion.div 
            key={item.slug}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="w-[280px] shrink-0"
          >
            {'category' in item ? (
              <PlaceCard place={item} onClick={onSelectListing} />
            ) : (
              <BeachCard beach={item} onClick={onSelectListing} />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
