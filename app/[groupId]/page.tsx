import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess } from "@/lib/group";
import { HomeClient } from "./HomeClient";

export default async function HomePage({ params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  await requireGroupAccess(params.groupId);
  const groupId = params.groupId;

  // Bornes de dates (calcul local, pas de coût DB)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));

  // Les 3 requêtes sont indépendantes → en parallèle pour réduire la latence
  // cumulée (Neon serverless ajoute un aller-retour par requête séquentielle).
  const [me, presences, events, residents] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { onboardedAt: true },
    }),
    db.presence.findMany({
      where: {
        endDate: { gte: today },
        user: { isActive: true, groupId },
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, city: true, memberColor: true, isResident: true },
        },
      },
      orderBy: { startDate: "asc" },
    }),
    db.event.findMany({
      where: { whenAt: { gte: todayStart }, groupId },
      orderBy: { whenAt: "asc" },
      select: {
        id: true, type: true, name: true, whenAt: true, placeName: true, cancelledAt: true,
        rsvps: { select: { userId: true, status: true } },
      },
    }),
    // Les "locaux" pour le ResidentStrip (résidents actifs)
    db.user.findMany({
      where: { isResident: true, isActive: true, groupId },
      select: { id: true, name: true, image: true, city: true, memberColor: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Première connexion → onboarding (onboardedAt null)
  if (me && !me.onboardedAt) redirect(`/${groupId}/onboarding`);

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
      presences={JSON.parse(JSON.stringify(presences))}
      myPresencesWithOverlaps={JSON.parse(JSON.stringify(myPresencesWithOverlaps))}
      events={JSON.parse(JSON.stringify(events))}
      residents={JSON.parse(JSON.stringify(residents))}
      isPresentToday={isPresentToday}
      isSingleDayToday={isSingleDayToday}
    />
  );
}
