// src/components/ui/Dropdown.tsx
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface DropdownOption {
  label: string;
  value: string;
}

export function Dropdown({ 
  label, 
  options, 
  selected, 
  onSelect 
}: { 
  label: string; 
  options: DropdownOption[]; 
  selected: string; 
  onSelect: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === selected)?.label || label;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.08] px-5 py-4 text-left text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl backdrop-blur-xl transition hover:bg-white/[0.14]"
      >
        {selectedLabel}
        <ChevronDown className={cn("h-4 w-4 text-emerald-300 transition-transform", isOpen && "rotate-180")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-950 p-2 shadow-2xl"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => { onSelect(option.value); setIsOpen(false); }}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-bold transition hover:bg-white/10",
                  selected === option.value ? "bg-emerald-300 text-slate-950" : "text-white"
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
