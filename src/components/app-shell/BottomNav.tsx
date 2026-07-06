import React from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Calendar, Car, Home, MessageSquare } from "lucide-react";
import { motion } from "motion/react";

import { cn } from "../../lib/utils";

type NavItem = {
  label: string;
  href: string;
  icon?: React.ElementType;
  primary?: boolean;
};

const LOGO_SRC = "/images/usvi-logo.jpeg";

const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Ride", href: "/mobility", icon: Car },
  { label: "AI", href: "/concierge", primary: true },
  { label: "Feed", href: "/community", icon: MessageSquare },
  { label: "Events", href: "/events", icon: Calendar },
];

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function withIslandQuery(href: string, island: string | null) {
  if (!island) return href;
  const joiner = href.includes("?") ? "&" : "?";
  return `${href}${joiner}island=${encodeURIComponent(island)}`;
}

export function BottomNav() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const island = searchParams.get("island");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom)+1.35rem)] sm:px-6">
      <div className="pointer-events-auto mx-auto max-w-md">
        <nav className="relative flex h-[5.4rem] items-center justify-between rounded-[3rem] border border-white/60 bg-white/70 px-3 py-2 shadow-2xl shadow-ink/15 backdrop-blur-3xl">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[3rem]">
            <div className="absolute inset-x-10 bottom-0 h-14 rounded-full bg-turquoise/15 blur-3xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/45 via-white/20 to-transparent" />
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = isActiveRoute(location.pathname, item.href);
            const hrefWithIsland = withIslandQuery(item.href, island);

            if (item.primary) {
              return (
                <Link
                  key={item.href}
                  to={hrefWithIsland}
                  aria-label="Open AI Concierge"
                  className="group relative -mt-10 flex w-[5.25rem] shrink-0 flex-col items-center justify-center"
                >
                  <motion.div
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "relative grid h-[4.6rem] w-[4.6rem] place-items-center rounded-full border shadow-2xl transition duration-300",
                      isActive
                        ? "scale-105 border-turquoise/70 bg-white ring-4 ring-turquoise/20"
                        : "border-white/80 bg-white ring-4 ring-white/45 group-hover:-translate-y-1 group-hover:scale-105"
                    )}
                  >
                    <img
                      src={LOGO_SRC}
                      alt="U.S. Virgin Islands"
                      className="h-[4.15rem] w-[4.15rem] rounded-full object-cover"
                    />
                  </motion.div>
                </Link>
              );
            }

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                to={hrefWithIsland}
                aria-label={item.label}
                className={cn(
                  "group relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 transition active:scale-95",
                  isActive ? "text-ink" : "text-stone-400 hover:text-stone-700"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-bottom-nav"
                    className="absolute inset-0 -z-10 rounded-2xl bg-white/85 shadow-sm ring-1 ring-white/70"
                    transition={{
                      type: "spring",
                      bounce: 0.22,
                      duration: 0.55,
                    }}
                  />
                )}

                {Icon && (
                  <Icon
                    className={cn(
                      "h-6 w-6 transition duration-300 group-hover:scale-110",
                      isActive
                        ? "text-turquoise"
                        : "text-stone-400 group-hover:text-emerald-700"
                    )}
                    strokeWidth={isActive ? 2.35 : 1.7}
                  />
                )}

                <span
                  className={cn(
                    "text-[7px] font-black uppercase tracking-[0.28em] transition",
                    isActive ? "opacity-90" : "opacity-55 group-hover:opacity-90"
                  )}
                >
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
