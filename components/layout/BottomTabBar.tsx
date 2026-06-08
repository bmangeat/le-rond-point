"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, List, PartyPopper, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroupId } from "@/lib/use-group";

// Sous-chemins relatifs au groupe ("" = accueil du groupe)
const tabs = [
  { sub: "",           label: "Calendrier",  Icon: CalendarDays },
  { sub: "/presences", label: "Présences",   Icon: List },
  { sub: "/sorties",   label: "Sorties",     Icon: PartyPopper },
  { sub: "/profile",   label: "Profil",      Icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const g = useGroupId();
  // Nombre de commentaires signalés (0 si non-admin). Rafraîchi à chaque
  // navigation pour que la pastille disparaisse après traitement dans /admin.
  const [reports, setReports] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/reports")
      .then(r => r.ok ? r.json() : { count: 0 })
      .then(d => { if (!cancelled) setReports(d.count ?? 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pathname]);

  return (
    <nav className="bottom-nav">
      {tabs.map(({ sub, label, Icon }) => {
        const href = `/${g}${sub}`;
        const active = sub === "" ? pathname === `/${g}` : pathname.startsWith(href);
        const showBadge = sub === "/profile" && reports > 0;
        return (
          <Link
            key={sub}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <div className="relative">
              <Icon className={cn("w-6 h-6", active && "stroke-[2.5]")} />
              {showBadge && (
                <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {reports > 9 ? "9+" : reports}
                </span>
              )}
            </div>
            <span className={cn("text-2xs font-medium", active && "font-semibold")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
