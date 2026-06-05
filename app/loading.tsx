import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function HomeLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* Calendrier */}
        <Skeleton className="h-[340px] w-full rounded-2xl" />

        {/* Présences à venir */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
