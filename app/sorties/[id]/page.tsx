import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { EventDetailClient } from "./EventDetailClient";

export default async function EventPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const [event, members] = await Promise.all([
    db.event.findUnique({
      where: { id: params.id },
      include: {
        rsvps: { select: { userId: true, status: true } },
        needs: { select: { id: true, label: true, claimedById: true }, orderBy: { createdAt: "asc" } },
        expenses: { select: { id: true, payerId: true, label: true, amount: true, forUserIds: true }, orderBy: { createdAt: "asc" } },
        comments: { select: { id: true, authorId: true, text: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    db.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, image: true, memberColor: true, city: true },
    }),
  ]);

  if (!event) notFound();

  return (
    <EventDetailClient
      event={JSON.parse(JSON.stringify(event))}
      members={members}
      currentUserId={session.user.id}
    />
  );
}
