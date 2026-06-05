import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function ProfileLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Header profil */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        <Skeleton className="h-16 w-full rounded-xl" />

        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="space-y-3">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
