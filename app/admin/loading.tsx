import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function AdminLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
