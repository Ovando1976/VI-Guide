import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Home, Compass, Sparkles, FileText, Car } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { label: 'Home', href: '/', icon: Home },
  { label: 'Explore', href: '/explore', icon: Compass },
  { label: 'Mobility', href: '/mobility', icon: Car },
  { label: 'AI', href: '/concierge', icon: Sparkles, primary: true },
  { label: 'Plans', href: '/plans', icon: FileText },
];

export function BottomNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const island = searchParams.get('island');

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-12 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto">
        <nav className="bg-white/40 backdrop-blur-3xl border border-white/20 rounded-[3rem] shadow-2xl shadow-ink/10 p-2 flex items-center justify-between relative overflow-hidden">
          {/* Animated Background Glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-turquoise/5 to-transparent pointer-events-none" />
          
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.href;
            const hrefWithIsland = island ? `${item.href}?island=${island}` : item.href;

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  to={hrefWithIsland}
                  className="relative -mt-16 flex flex-col items-center group"
                >
                  <div className="absolute inset-0 bg-turquoise/40 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-500" />
                  <div className={cn(
                    "relative w-20 h-20 rounded-[2.2rem] flex items-center justify-center transition-all duration-500 shadow-2xl",
                    isActive 
                      ? "bg-turquoise text-ink scale-110" 
                      : "bg-ink text-turquoise group-hover:scale-110"
                  )}>
                    <item.icon size={32} className={cn(isActive && "animate-pulse")} />
                  </div>
                  <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 micro-label text-ink opacity-0 group-hover:opacity-100 transition-opacity">
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link
                key={item.href}
                to={hrefWithIsland}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl transition-all active:scale-90 group",
                  isActive ? "text-ink" : "text-stone-400 hover:text-stone-600"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-nav"
                    className="absolute inset-0 bg-white/60 rounded-2xl -z-10 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={cn("w-6 h-6 transition-transform group-hover:scale-110", isActive ? "stroke-[2px] text-turquoise" : "stroke-[1.5px]")} />
                <span className="text-[7px] font-bold uppercase tracking-[0.3em] opacity-60 group-hover:opacity-100 transition-opacity">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
