import { useEffect, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  ClipboardList,
  CreditCard,
  UsersRound,
} from "lucide-react";

const items = [
  { label: "Reports", href: "#business-reports", id: "business-reports", icon: BarChart3 },
  { label: "Money", href: "#business-money", id: "business-money", icon: CreditCard },
  { label: "Operations", href: "#business-operations", id: "business-operations", icon: ClipboardList },
  { label: "Customers", href: "#business-customers", id: "business-customers", icon: UsersRound },
  { label: "Listings", href: "#business-listings", id: "business-listings", icon: BriefcaseBusiness },
];

export default function BusinessOSNav() {
  const [activeId, setActiveId] = useState(items[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        rootMargin: "-25% 0px -60% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-0 z-30 border-b border-white/10 bg-[#061016]/90 px-5 py-3 backdrop-blur-xl sm:px-8">
      <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeId === item.id;

          return (
            <a
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-xs font-black uppercase tracking-[0.14em] transition ${
                active
                  ? "border-cyan-300 bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-950/40"
                  : "border-white/10 bg-white/10 text-white/75 hover:bg-cyan-300 hover:text-slate-950"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}