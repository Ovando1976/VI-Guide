"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BellRing,
  CalendarDays,
  Crown,
  Handshake,
  LogOut,
  Map,
  Route,
  ShieldCheck,
  ShipWheel,
  Sparkles,
  UserRound,
} from "lucide-react";
import { signOut } from "firebase/auth";

import { useAuth } from "@/components/auth-provider";
import { auth } from "@/lib/firebase";

type Role = "rider" | "driver" | "merchant" | "dispatcher" | "admin";

const ACCOUNT_ROUTES = ["/profile", "/notifications", "/plus"] as const;

export function AccountMenu({ embedded = false }: { embedded?: boolean }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("rider");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!user) {
      setRole("rider");
      return;
    }
    user
      .getIdTokenResult()
      .then((result) => {
        const claim = result.claims.role;
        setRole(
          claim === "admin" ||
            claim === "dispatcher" ||
            claim === "driver" ||
            claim === "merchant"
            ? claim
            : "rider",
        );
      })
      .catch(() => setRole("rider"));
  }, [user]);

  useEffect(() => {
    function close(event: PointerEvent) {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  if (loading || pathname === "/login") return null;

  async function logout() {
    setWorking(true);
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      if (auth) await signOut(auth);
      setOpen(false);
      router.replace("/login");
      router.refresh();
    } finally {
      setWorking(false);
    }
  }

  if (!user) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className={
          embedded
            ? "app-nav__item shrink-0"
            : "fixed right-4 top-4 z-[1900] rounded-full border border-white/20 bg-[#043331] px-4 py-3 text-[10px] font-black uppercase tracking-[.18em] text-white shadow-xl"
        }
      >
        <UserRound size={18} />
        <span>Sign in</span>
      </Link>
    );
  }

  const operationsHref =
    role === "driver"
      ? "/driver"
      : role === "merchant"
        ? "/merchant"
        : role === "admin" || role === "dispatcher"
          ? "/admin/dispatch"
          : null;
  const canManageCruiseRequests = role === "admin" || role === "dispatcher";
  const accountActive = ACCOUNT_ROUTES.some(
    (base) => pathname === base || pathname.startsWith(`${base}/`),
  );
  const initial = (user.displayName || user.email || "V")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <div
      ref={root}
      className={
        embedded ? "relative shrink-0" : "fixed right-4 top-4 z-[1900]"
      }
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label="Open account menu"
        aria-current={accountActive ? "page" : undefined}
        onClick={() => setOpen((value) => !value)}
        className={
          embedded
            ? `grid h-[42px] w-[42px] place-items-center rounded-2xl border text-xs font-black transition ${
                accountActive
                  ? "border-[#f5c451]/55 bg-[#f5c451]/16 text-[#f8d77c] shadow-[0_0_0_3px_rgba(245,196,81,.08)]"
                  : "border-white/15 bg-white/10 text-white hover:bg-white/15"
              }`
            : "grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-[#043331] text-sm font-black text-white shadow-xl"
        }
      >
        {initial}
      </button>
      {open ? (
        <section
          className={
            embedded
              ? "absolute bottom-full right-0 z-[2100] mb-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-[#d5e2df] bg-[#fffdf8] shadow-[0_24px_70px_rgba(4,51,49,.2)]"
              : "absolute right-0 mt-3 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-[#d5e2df] bg-[#fffdf8] shadow-[0_24px_70px_rgba(4,51,49,.2)]"
          }
        >
          <div className="bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.2),transparent_40%),linear-gradient(145deg,#043331,#075e58)] p-5 text-white">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10">
                <UserRound size={20} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black">
                  {user.displayName || "USVI Compass member"}
                </div>
                <div className="truncate text-xs text-teal-100/75">
                  {user.email}
                </div>
              </div>
            </div>
            <div className="mt-4 inline-flex rounded-full bg-[#f5c451] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.16em] text-[#043331]">
              {roleLabel(role)}
            </div>
          </div>

          <nav className="p-3">
            <div className="px-3 pb-2 pt-1 text-[8px] font-black uppercase tracking-[.18em] text-[#8b9c98]">
              Your USVI Compass
            </div>
            <div className="space-y-1">
              <MenuLink
                href="/today"
                label="My AI trip brief"
                icon={Sparkles}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/trips"
                label="My Trip"
                icon={Route}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/profile"
                label="Traveler profile"
                icon={UserRound}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/notifications"
                label="Notifications"
                icon={BellRing}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/map"
                label="Living Map"
                icon={Map}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/planner"
                label="Itinerary builder"
                icon={CalendarDays}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/cruises"
                label="Plan a cruise"
                icon={ShipWheel}
                onSelect={() => setOpen(false)}
              />
              <MenuLink
                href="/plus"
                label="Traveler Plus"
                icon={Crown}
                onSelect={() => setOpen(false)}
                accent="gold"
              />
              <MenuLink
                href="/partners/apply"
                label="Partner with USVI Compass"
                icon={Handshake}
                onSelect={() => setOpen(false)}
              />
            </div>

            {canManageCruiseRequests || operationsHref ? (
              <div className="mt-3 border-t border-[#e1e9e7] pt-3">
                <div className="px-3 pb-2 text-[8px] font-black uppercase tracking-[.18em] text-[#8b9c98]">
                  Operations
                </div>
                <div className="space-y-1">
                  {canManageCruiseRequests ? (
                    <MenuLink
                      href="/admin/cruise-requests"
                      label="Cruise advisor desk"
                      icon={ShipWheel}
                      onSelect={() => setOpen(false)}
                    />
                  ) : null}
                  {operationsHref ? (
                    <MenuLink
                      href={operationsHref}
                      label={
                        role === "driver"
                          ? "Driver workspace"
                          : role === "merchant"
                            ? "Business console"
                            : "Operations dashboard"
                      }
                      icon={ShieldCheck}
                      onSelect={() => setOpen(false)}
                    />
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="mt-3 border-t border-[#e1e9e7] pt-3">
              <button
                type="button"
                disabled={working}
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
              >
                <LogOut size={18} />
                {working ? "Signing out…" : "Sign out"}
              </button>
            </div>
          </nav>
        </section>
      ) : null}
    </div>
  );
}

function MenuLink({
  href,
  label,
  icon: Icon,
  onSelect,
  accent = "default",
}: {
  href: string;
  label: string;
  icon: typeof Map;
  onSelect: () => void;
  accent?: "default" | "gold";
}) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
        accent === "gold"
          ? "bg-[#fff7df] text-[#7f5712] hover:bg-[#ffefb7]"
          : "text-[#043331] hover:bg-[#f3f8f6]"
      }`}
    >
      <Icon size={18} className={accent === "gold" ? "text-[#b67814]" : "text-[#0f766e]"} />
      {label}
    </Link>
  );
}

function roleLabel(role: Role) {
  if (role === "rider") return "Traveler";
  if (role === "driver") return "Driver";
  if (role === "merchant") return "Business partner";
  if (role === "dispatcher") return "Dispatcher";
  return "Administrator";
}
