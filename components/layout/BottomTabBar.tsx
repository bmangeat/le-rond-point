"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, List, User } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/",           label: "Calendrier",  Icon: CalendarDays },
  { href: "/presences",  label: "Présences",   Icon: List },
  { href: "/profile",    label: "Profil",      Icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {tabs.map(({ href, label, Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-colors",
              active
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className={cn("w-6 h-6", active && "stroke-[2.5]")} />
            <span className={cn("text-2xs font-medium", active && "font-semibold")}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
