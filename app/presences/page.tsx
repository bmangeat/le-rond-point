import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { PresencesClient } from "./PresencesClient";

export default async function PresencesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Requêtes indépendantes → en parallèle (latence Neon cumulée réduite)
  const [presences, pastPresences] = await Promise.all([
    db.presence.findMany({
      where: {
        endDate: { gte: today },
        user: { isActive: true },
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
        user: { isActive: true },
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
