import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess } from "@/lib/group";
import { MembersDirectoryClient } from "./MembersDirectoryClient";

export default async function MembersDirectoryPage({
  params,
  searchParams,
}: {
  params: { groupId: string };
  searchParams: { filter?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");
  await requireGroupAccess(params.groupId);
  const groupId = params.groupId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Bornes du jour en UTC (présences stockées à minuit UTC)
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
  // Horizon "bientôt là" : présence commençant dans les 14 prochains jours
  const soonHorizon = new Date(todayEnd.getTime() + 14 * 24 * 60 * 60 * 1000);

  // Membres + présences en cours/à venir (pour les badges) — en parallèle
  const [members, presences] = await Promise.all([
    db.user.findMany({
      where: { isActive: true, groupId },
      select: { id: true, name: true, image: true, city: true, memberColor: true, isResident: true },
      orderBy: { name: "asc" },
    }),
    db.presence.findMany({
      where: { endDate: { gte: today }, user: { isActive: true, groupId } },
      select: { userId: true, startDate: true, endDate: true },
    }),
  ]);

  // "bientôt là" = une présence qui démarre dans les 2 semaines (et pas encore en cours)
  const aroundSoonIds = new Set(
    presences.filter(p => p.startDate <= soonHorizon).map(p => p.userId)
  );
  const hereNowIds = new Set(
    presences.filter(p => p.startDate <= todayEnd && p.endDate >= todayStart).map(p => p.userId)
  );
  const directory = members.map(m => ({
    ...m,
    aroundSoon: aroundSoonIds.has(m.id),
    hereNow: hereNowIds.has(m.id),
  }));

  return (
    <MembersDirectoryClient
      members={directory}
      initialResidentsOnly={searchParams.filter === "residents"}
    />
  );
}
