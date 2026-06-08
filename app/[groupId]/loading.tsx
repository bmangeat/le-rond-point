import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

// Fallback de navigation pour l'accueil (et toute route sans loading dédié).
// Le loader animé plein écran n'apparaît qu'au lancement (cf. BootLoader).
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

        {/* Carte présent aujourd'hui */}
        <Skeleton className="h-[72px] w-full rounded-2xl" />

        {/* Calendrier mensuel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-8 rounded-md" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-5 w-8 rounded-md" />
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 rounded-sm" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-11 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2 pt-1">
          <Skeleton className="h-4 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              <Skeleton className="h-7 flex-1 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
