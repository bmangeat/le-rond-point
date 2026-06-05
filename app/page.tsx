import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { dateKeyUTC } from "@/lib/utils";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Charger toutes les présences futures + en cours
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const presences = await db.presence.findMany({
    where: {
      endDate: { gte: today },
      user: { isActive: true },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          city: true,
          memberColor: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  // Calculer les jours avec présences pour le calendrier
  const presenceDaysMap = new Map<string, {
    count: number;
    isMine: boolean;
    users: Array<{ id: string; name: string; memberColor: number }>;
  }>();

  for (const p of presences) {
    const end = new Date(p.endDate);
    const current = new Date(p.startDate);

    while (current <= end) {
      const dateStr = dateKeyUTC(current);
      const existing = presenceDaysMap.get(dateStr) ?? { count: 0, isMine: false, users: [] };
      existing.count++;
      if (p.userId === session.user.id) existing.isMine = true;
      if (!existing.users.find(u => u.id === p.user.id)) {
        existing.users.push({ id: p.user.id, name: p.user.name, memberColor: p.user.memberColor });
      }
      presenceDaysMap.set(dateStr, existing);
      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  const presenceDays = Array.from(presenceDaysMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Statut "présent aujourd'hui" — bornes en UTC (présences stockées à minuit UTC)
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

  const myPresences = presences.filter(p => p.userId === session.user.id);

  const isPresentToday = myPresences.some(
    p => new Date(p.startDate) <= todayEnd && new Date(p.endDate) >= todayStart
  );
  const isSingleDayToday = myPresences.some(
    p => new Date(p.startDate) >= todayStart && new Date(p.endDate) <= todayEnd
  );

  // Mes prochaines présences avec les chevauchements
  const myPresencesWithOverlaps = myPresences.map(mp => ({
    ...mp,
    overlaps: presences.filter(
      p => p.userId !== session.user.id &&
           new Date(p.startDate) <= new Date(mp.endDate) &&
           new Date(p.endDate) >= new Date(mp.startDate)
    ),
  }));

  return (
    <HomeClient
      session={session}
      presenceDays={presenceDays}
      presences={presences}
      myPresencesWithOverlaps={myPresencesWithOverlaps}
      isPresentToday={isPresentToday}
      isSingleDayToday={isSingleDayToday}
    />
  );
}
