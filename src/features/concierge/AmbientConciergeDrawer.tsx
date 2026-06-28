import { X } from "lucide-react";
import type { User } from "firebase/auth";

import Concierge from "../../components/Concierge";
import type { IslandCode, UserProfile } from "../../types";

type Props = {
  open: boolean;
  onClose: () => void;
  user: User | null;
  profile?: UserProfile | null;
  selectedIsland?: IslandCode;
  userLocation?: { lat: number; lng: number } | null;
};

export default function AmbientConciergeDrawer({
  open,
  onClose,
  user,
  profile,
  selectedIsland = "st_thomas",
  userLocation,
}: Props) {
  return (
    <>
      <div
        className={`fixed inset-0 z-[80] bg-black/55 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />

      <aside
        className={`fixed inset-y-0 right-0 z-[90] w-full max-w-[34rem] border-l border-white/10 bg-[#061016]/92 text-white shadow-[0_0_80px_rgba(0,0,0,0.55)] backdrop-blur-3xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close concierge"
          className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="h-full overflow-y-auto">
          <Concierge
            user={user}
            profile={profile}
            selectedIsland={selectedIsland}
            userLocation={userLocation}
          />
        </div>
      </aside>
    </>
  );
}