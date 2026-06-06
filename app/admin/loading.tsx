import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function AdminLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Header avec bouton retour */}
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          <Skeleton className="h-7 w-40" />
        </div>

        {/* Card inviter un membre */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="flex-1 h-11 rounded-xl" />
            <Skeleton className="h-11 w-20 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        {/* Invitations en attente */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Membres */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="w-5 h-5 rounded flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
