import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  className?: string;
}

export default function SectionHeader({ title, subtitle, onViewAll, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex justify-between items-end mb-8 relative", className)}>
      <div className="flex items-start gap-4">
        <div className="w-px h-12 bg-gradient-to-b from-turquoise to-transparent mt-1" />
        <div>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-[9px] font-bold uppercase tracking-[0.4em] text-turquoise mb-2"
            >
              {subtitle}
            </motion.p>
          )}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-serif italic text-stone-900 leading-none"
          >
            {title}
          </motion.h2>
        </div>
      </div>
      {onViewAll && (
        <motion.button
          whileHover={{ x: 4 }}
          whileTap={{ scale: 0.95 }}
          onClick={onViewAll}
          className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 hover:text-ocean transition-colors group pb-1"
        >
          View All
          <ArrowRight size={14} className="text-stone-300 group-hover:text-ocean transition-colors" />
        </motion.button>
      )}
    </div>
  );
}
