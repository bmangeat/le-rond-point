import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function SortiesLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Cards sorties */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
              {/* Ligne type + nom */}
              <div className="flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3.5 w-1/2" />
                </div>
                <Skeleton className="h-7 w-20 rounded-full flex-shrink-0" />
              </div>
              {/* Avatars participants */}
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="w-7 h-7 rounded-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
