import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function MembersLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-7 w-36" />
            <Skeleton className="h-3.5 w-24" />
          </div>
        </div>

        {/* Recherche */}
        <Skeleton className="h-11 w-full rounded-xl" />

        {/* Filtres */}
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>

        {/* Liste membres */}
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-3 flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="w-4 h-4 rounded flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
