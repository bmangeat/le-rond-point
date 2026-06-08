import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function PresencesLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Filtre membres */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full flex-shrink-0" />
          ))}
        </div>

        {/* Section Aujourd'hui */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex gap-3 items-center">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </div>
        </div>

        {/* Séparateur mois */}
        <Skeleton className="h-4 w-28" />

        {/* Cards présences */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex gap-3 items-start">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-44" />
                  <Skeleton className="h-6 w-20 rounded-full mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
