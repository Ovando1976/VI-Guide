import React from "react";
import { Calendar, Car, Home, MapPin, MessageSquare } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

type BottomTabId = "home" | "ride" | "map" | "feed" | "events";

interface BottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: BottomTabId) => void;
}

const tabs: {
  id: BottomTabId;
  label: string;
  path: string;
  icon: React.ElementType;
  center?: boolean;
}[] = [
  { id: "home", label: "Home", path: "/", icon: Home },
  { id: "ride", label: "Ride", path: "/mobility", icon: Car },
  { id: "map", label: "Map", path: "/map", icon: MapPin, center: true },
  { id: "feed", label: "Feed", path: "/community", icon: MessageSquare },
  { id: "events", label: "Events", path: "/events", icon: Calendar },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const navigate = useNavigate();
  const location = useLocation();

  function handleTab(tab: (typeof tabs)[number]) {
    onTabChange?.(tab.id);
    navigate(tab.path);
  }

  return (
    <nav className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-[2rem] border border-white/60 bg-white/80 px-4 py-3 shadow-2xl backdrop-blur-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.id || location.pathname === tab.path;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab)}
              aria-label={tab.label}
              className={cn(
                "grid place-items-center transition active:scale-95",
                tab.center
                  ? "relative -mt-10 h-20 w-20 rounded-full bg-ink text-turquoise shadow-2xl"
                  : "h-14 w-14 rounded-2xl",
                isActive && !tab.center
                  ? "bg-white text-turquoise shadow"
                  : "text-stone-400"
              )}
            >
              <Icon className={tab.center ? "h-8 w-8" : "h-5 w-5"} />

              {!tab.center && (
                <span className="mt-1 text-[9px] font-black uppercase tracking-[0.2em]">
                  {tab.label}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}