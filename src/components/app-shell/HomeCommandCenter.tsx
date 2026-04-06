import React from 'react';
import { CloudRain, Compass, Route, Sparkles, FileText, Clock3 } from 'lucide-react';
import type { IslandCode } from '../../types';

interface HomeCommandCenterProps {
  selectedIsland: IslandCode;
  onAction: (action: 'explore' | 'build_day' | 'concierge' | 'mobility' | 'plans') => void;
}

const ISLAND_LABELS: Record<IslandCode, string> = {
  st_thomas: 'St. Thomas',
  st_john: 'St. John',
  st_croix: 'St. Croix',
  water_island: 'Water Island',
};

export function HomeCommandCenter({ selectedIsland, onAction }: HomeCommandCenterProps) {
  const hour = new Date().getHours();
  const dayPart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

  return (
    <section className="px-8 py-10 space-y-6">
      <div className="rounded-[2rem] bg-white border border-stone-100 p-6 shadow-xl">
        <p className="text-[10px] uppercase tracking-[0.35em] text-stone-400 font-bold">Command Center</p>
        <h2 className="mt-2 text-2xl font-serif italic text-ink">
          Good {dayPart} in {ISLAND_LABELS[selectedIsland]}
        </h2>
        <p className="mt-3 text-sm text-stone-500">
          Pick a smart next move. We’ll adapt your recommendations by island context, time window, and travel pace.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <ActionButton icon={Compass} label="Explore now" onClick={() => onAction('explore')} />
          <ActionButton icon={Clock3} label="Build my day" onClick={() => onAction('build_day')} />
          <ActionButton icon={Sparkles} label="Ask concierge" onClick={() => onAction('concierge')} />
          <ActionButton icon={Route} label="Plan mobility" onClick={() => onAction('mobility')} />
          <div className="col-span-2">
            <ActionButton icon={FileText} label="Open shared plans" onClick={() => onAction('plans')} fullWidth />
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] bg-ink text-white p-6 shadow-xl">
        <div className="flex items-center gap-3">
          <CloudRain className="w-5 h-5 text-turquoise" />
          <p className="text-xs uppercase tracking-[0.3em] text-turquoise font-bold">Smart Suggestions</p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-sm text-white/80">
          <Suggestion>Best beach right now based on {dayPart} conditions</Suggestion>
          <Suggestion>Rain-friendly alternatives with short transfer times</Suggestion>
          <Suggestion>Sunset dining picks with nearby transport options</Suggestion>
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  fullWidth,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-left hover:border-turquoise/40 hover:bg-white transition-all ${fullWidth ? 'w-full' : ''}`}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-turquoise" />
        <span className="text-xs uppercase tracking-[0.22em] text-stone-700 font-bold">{label}</span>
      </div>
    </button>
  );
}

function Suggestion({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl bg-white/5 px-3 py-2">{children}</p>;
}
