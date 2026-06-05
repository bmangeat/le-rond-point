import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
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
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const existing = presenceDaysMap.get(dateStr) ?? { count: 0, isMine: false, users: [] };
      existing.count++;
      if (p.userId === session.user.id) existing.isMine = true;
      if (!existing.users.find(u => u.id === p.user.id)) {
        existing.users.push({ id: p.user.id, name: p.user.name, memberColor: p.user.memberColor });
      }
      presenceDaysMap.set(dateStr, existing);
      current.setDate(current.getDate() + 1);
    }
  }

  const presenceDays = Array.from(presenceDaysMap.entries()).map(([date, data]) => ({
    date,
    ...data,
  }));

  // Mes prochaines présences avec les chevauchements
  const myPresences = presences.filter(p => p.userId === session.user.id);
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
    />
  );
}
