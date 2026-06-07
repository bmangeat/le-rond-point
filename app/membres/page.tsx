import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MembersDirectoryClient } from "./MembersDirectoryClient";

export default async function MembersDirectoryPage({
  searchParams,
}: {
  searchParams: { filter?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Bornes du jour en UTC (présences stockées à minuit UTC)
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

  // Membres + présences en cours/à venir (pour les badges) — en parallèle
  const [members, presences] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, image: true, city: true, memberColor: true, isResident: true },
      orderBy: { name: "asc" },
    }),
    db.presence.findMany({
      where: { endDate: { gte: today }, user: { isActive: true } },
      select: { userId: true, startDate: true, endDate: true },
    }),
  ]);

  const aroundSoonIds = new Set(presences.map(p => p.userId));
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
