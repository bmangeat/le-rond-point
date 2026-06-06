import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function HomeLoading() {
  return (
    <AppShell>
      <div className="px-[18px] pt-6 pb-2 space-y-4">
        {/* Header : logo + titre + avatar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-11 h-11 rounded-2xl" />
            <Skeleton className="h-6 w-36" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>

        {/* PushPrompt placeholder (hauteur réelle de la bannière) */}
        {/* (masqué si pas pertinent, on laisse un espace neutre) */}

        {/* TodayPresenceToggle card */}
        <Skeleton className="h-[72px] w-full rounded-2xl" />

        {/* Calendrier mensuel */}
        <div className="space-y-3">
          {/* Nav mois */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-8 rounded-md" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-8 rounded-md" />
          </div>
          {/* Jours de la semaine */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 rounded-sm" />
            ))}
          </div>
          {/* Grille jours */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Timeline "qui est là" */}
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-7 flex-1 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Strip prochaines sorties */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-52 rounded-2xl flex-shrink-0" />
            ))}
          </div>
        </div>

        {/* Tes prochaines présences */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    </AppShell>
  );
}
