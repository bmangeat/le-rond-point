import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function PresencesLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 space-y-4">
        <Skeleton className="h-7 w-36" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
