import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { MembersDirectoryClient } from "./MembersDirectoryClient";

export default async function MembersDirectoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Membres + l'ensemble des userIds ayant une présence à venir (1 requête chacun, en //)
  const [members, upcoming] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, image: true, city: true, memberColor: true },
      orderBy: { name: "asc" },
    }),
    db.presence.findMany({
      where: { endDate: { gte: today }, user: { isActive: true } },
      select: { userId: true },
      distinct: ["userId"],
    }),
  ]);

  const aroundSoonIds = new Set(upcoming.map(p => p.userId));
  const directory = members.map(m => ({ ...m, aroundSoon: aroundSoonIds.has(m.id) }));

  return <MembersDirectoryClient members={directory} />;
}
