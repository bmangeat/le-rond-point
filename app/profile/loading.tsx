import { AppShell } from "@/components/layout/AppShell";
import { Skeleton } from "@/components/shared/Skeleton";

export default function ProfileLoading() {
  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Header : avatar + nom + ville */}
        <div className="flex items-center gap-4">
          <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        {/* Accordéon Infos personnelles */}
        <div className="space-y-2">
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="space-y-3 px-1">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        </div>

        {/* Accordéon Réseaux */}
        <Skeleton className="h-14 w-full rounded-2xl" />

        {/* Accordéon Notifications */}
        <Skeleton className="h-14 w-full rounded-2xl" />

        {/* Lien admin + déconnexion */}
        <div className="space-y-3 pt-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </AppShell>
  );
}
