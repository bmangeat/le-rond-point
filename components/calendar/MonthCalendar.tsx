"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, getMemberColor } from "@/lib/utils";

interface PresenceDay {
  date: string; // YYYY-MM-DD
  count: number;
  isMine: boolean;
  users: Array<{ id: string; name: string; memberColor: number }>;
}

interface MonthCalendarProps {
  presenceDays: PresenceDay[];
  onDayClick: (date: string) => void;
  currentUserId?: string;
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

export function MonthCalendar({ presenceDays, onDayClick }: MonthCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-indexed

  const presenceMap = new Map(presenceDays.map((p) => [p.date, p]));

  // Premier jour du mois (0=dimanche → ajuster pour lundi=0)
  const firstDay = new Date(year, month, 1);
  const startDow = (firstDay.getDay() + 6) % 7; // 0=lundi
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const cells: (number | null)[] = [
    ...Array(startDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <button
          onClick={prevMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-heading-3 font-bold">
          {MONTHS[month]} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-label py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-1 px-2 pb-3">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const presence = presenceMap.get(dateStr);
          const isToday = dateStr === todayStr;
          const isPast = dateStr < todayStr;
          const isMine = presence?.isMine ?? false;

          return (
            <button
              key={idx}
              onClick={() => presence && onDayClick(dateStr)}
              className={cn(
                "relative flex flex-col items-center justify-center h-11 rounded-xl transition-colors",
                isMine && "calendar-day-mine",
                isToday && !isMine && "border-2 border-primary/40 font-semibold text-primary",
                isPast && "opacity-50",
                presence && !isMine && "hover:bg-muted cursor-pointer",
                !presence && "cursor-default",
              )}
            >
              <span className={cn("text-sm leading-none", isToday && "font-bold")}>
                {day}
              </span>
              {presence && presence.count > 0 && (
                <div className="mt-0.5 flex gap-0.5 justify-center">
                  {presence.users.slice(0, 3).map((u) => (
                    <span
                      key={u.id}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getMemberColor(u.memberColor) }}
                    />
                  ))}
                  {presence.count > 3 && (
                    <span className="text-2xs text-muted-foreground leading-none">+{presence.count - 3}</span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
