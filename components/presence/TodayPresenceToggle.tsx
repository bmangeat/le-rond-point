"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Check, Loader2 } from "lucide-react";

interface TodayPresenceToggleProps {
  // L'utilisateur est-il déjà noté présent aujourd'hui ?
  isPresentToday: boolean;
  // Sa présence du jour est-elle une présence ponctuelle (1 seule journée) donc retirable ici ?
  isSingleDayToday: boolean;
}

export function TodayPresenceToggle({ isPresentToday, isSingleDayToday }: TodayPresenceToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    await fetch("/api/presences/today", {
      method: isSingleDayToday ? "DELETE" : "POST",
    });
    setLoading(false);
    router.refresh();
  }

  // Présent via un séjour planifié multi-jours → simple info, non modifiable ici
  if (isPresentToday && !isSingleDayToday) {
    return (
      <div className="card flex items-center gap-3 bg-available-light border-available/20">
        <div className="w-9 h-9 rounded-full bg-available/15 flex items-center justify-center flex-shrink-0">
          <Check className="w-5 h-5 text-available" />
        </div>
        <div>
          <p className="text-body-strong font-semibold text-available">Tu es au quartier aujourd&apos;hui</p>
          <p className="text-caption">Dans le cadre d&apos;un séjour planifié</p>
        </div>
      </div>
    );
  }

  const active = isSingleDayToday;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full card flex items-center gap-3 text-left transition-colors active:scale-[0.99] disabled:opacity-70 ${
        active ? "bg-available-light border-available/30" : "hover:bg-muted"
      }`}
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          active ? "bg-available/15" : "bg-primary/10"
        }`}
      >
        {loading ? (
          <Loader2 className={`w-5 h-5 animate-spin ${active ? "text-available" : "text-primary"}`} />
        ) : active ? (
          <Check className="w-5 h-5 text-available" />
        ) : (
          <MapPin className="w-5 h-5 text-primary" />
        )}
      </div>
      <div className="flex-1">
        {active ? (
          <>
            <p className="text-body-strong font-semibold text-available">Présent aujourd&apos;hui ✓</p>
            <p className="text-caption">Touche pour retirer</p>
          </>
        ) : (
          <>
            <p className="text-body-strong font-semibold">Je suis au quartier aujourd&apos;hui</p>
            <p className="text-caption">Note ta présence du jour en un geste</p>
          </>
        )}
      </div>
    </button>
  );
}
