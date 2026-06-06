import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { EVENT_TYPES, EventTypeKey, eventType, fmtEventWhen } from "@/lib/events";
import { sendPushToUser } from "@/lib/push";

// POST /api/events — créer une sortie et prévenir le groupe
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { type, name, description, when, placeName, placeAddr, needs, tricountEnabled, hasPlaylist, playlistUrl } = body;

  if (!EVENT_TYPES[type as EventTypeKey]) return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  if (!name?.trim()) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
  if (!when) return NextResponse.json({ error: "Date obligatoire" }, { status: 400 });
  if (!placeName?.trim()) return NextResponse.json({ error: "Lieu obligatoire" }, { status: 400 });

  const meta = eventType(type);
  const whenAt = new Date(when);

  const event = await db.event.create({
    data: {
      type,
      name: name.trim(),
      hostId: session.user.id,
      description: description?.trim() || null,
      whenAt,
      placeName: placeName.trim(),
      placeAddr: placeAddr?.trim() || null,
      logisticsKind: meta.logistics,
      tricountEnabled: meta.logistics === "tricount" ? tricountEnabled !== false : false,
      hasPlaylist: !!hasPlaylist,
      playlistUrl: playlistUrl?.trim() || null,
      // L'hôte est présent d'office
      rsvps: { create: { userId: session.user.id, status: "YES" } },
      needs:
        meta.logistics === "list" && Array.isArray(needs)
          ? { create: needs.filter((l: string) => l?.trim()).map((label: string) => ({ label: label.trim() })) }
          : undefined,
    },
  });

  // Notifier le groupe (push)
  try {
    const others = await db.user.findMany({
      where: { id: { not: session.user.id }, isActive: true, notifPush: true },
      select: { id: true },
    });
    const hostName = (session.user.name ?? "Quelqu'un").split(" ")[0];
    const when2 = fmtEventWhen(whenAt);
    for (const u of others) {
      await sendPushToUser(u.id, {
        title: `${meta.emoji} ${hostName} balance une sortie !`,
        body: `${event.name} · ${when2.short}. Tu viens ?`,
        url: `/sorties/${event.id}`,
        tag: `event-${event.id}`,
      });
    }
  } catch (err) {
    console.error("Erreur push création événement:", err);
  }

  return NextResponse.json({ id: event.id }, { status: 201 });
}
