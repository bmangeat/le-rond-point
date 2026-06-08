import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess } from "@/lib/group";
import { PresencesClient } from "./PresencesClient";

export default async function PresencesPage({ params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  await requireGroupAccess(params.groupId);
  const groupId = params.groupId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Requêtes indépendantes → en parallèle (latence Neon cumulée réduite)
  const [presences, pastPresences] = await Promise.all([
    db.presence.findMany({
      where: {
        endDate: { gte: today },
        user: { isActive: true, groupId },
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, city: true, memberColor: true },
        },
      },
      orderBy: { startDate: "asc" },
    }),
    db.presence.findMany({
      where: {
        endDate: { lt: today },
        user: { isActive: true, groupId },
      },
      include: {
        user: {
          select: { id: true, name: true, image: true, city: true, memberColor: true },
        },
      },
      orderBy: { startDate: "desc" },
      take: 20,
    }),
  ]);

  return (
    <PresencesClient
      session={session}
      presences={presences}
      pastPresences={pastPresences}
    />
  );
}
