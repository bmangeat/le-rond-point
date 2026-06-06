import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { HomeClient } from "./HomeClient";

export default async function HomePage() {
  const session = await auth();
  if (!session) redirect("/login");

  // Première connexion → onboarding (onboardedAt null)
  const me = await db.user.findUnique({
    where: { id: session.user.id },
    select: { onboardedAt: true },
  });
  if (me && !me.onboardedAt) redirect("/onboarding");

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

  // Sorties à venir (strip + pastilles calendrier)
  const events = await db.event.findMany({
    where: { whenAt: { gte: todayStart } },
    orderBy: { whenAt: "asc" },
    select: {
      id: true, type: true, name: true, whenAt: true, placeName: true,
      rsvps: { select: { userId: true, status: true } },
    },
  });

  return (
    <HomeClient
      session={session}
      presences={JSON.parse(JSON.stringify(presences))}
      myPresencesWithOverlaps={JSON.parse(JSON.stringify(myPresencesWithOverlaps))}
      events={JSON.parse(JSON.stringify(events))}
      isPresentToday={isPresentToday}
      isSingleDayToday={isSingleDayToday}
    />
  );
}
