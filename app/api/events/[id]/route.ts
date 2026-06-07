import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { EVENT_TYPES, EventTypeKey, eventType } from "@/lib/events";
import { getAdminSession } from "@/lib/admin";

// PATCH /api/events/:id — éditer une sortie (hôte ou admin)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const event = await db.event.findUnique({ where: { id: params.id }, select: { hostId: true } });
  if (!event) return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });

  const myUser = await db.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  const allowed = event.hostId === session.user.id || myUser?.role === "ADMIN";
  if (!allowed) return NextResponse.json({ error: "Réservé à l'organisateur ou à un admin" }, { status: 403 });

  const body = await req.json();
  const { type, name, description, when, placeName, placeAddr, tricountEnabled, hasPlaylist, playlistUrl } = body;

  if (type && !EVENT_TYPES[type as EventTypeKey]) return NextResponse.json({ error: "Type invalide" }, { status: 400 });
  if (name !== undefined && !name?.trim()) return NextResponse.json({ error: "Nom obligatoire" }, { status: 400 });
  if (placeName !== undefined && !placeName?.trim()) return NextResponse.json({ error: "Lieu obligatoire" }, { status: 400 });

  await db.event.update({
    where: { id: params.id },
    data: {
      ...(type && { type, logisticsKind: eventType(type).logistics }),
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(when && { whenAt: new Date(when) }),
      ...(placeName !== undefined && { placeName: placeName.trim() }),
      ...(placeAddr !== undefined && { placeAddr: placeAddr?.trim() || null }),
      ...(typeof tricountEnabled === "boolean" && { tricountEnabled }),
      ...(hasPlaylist !== undefined && { hasPlaylist: !!hasPlaylist }),
      ...(playlistUrl !== undefined && { playlistUrl: playlistUrl?.trim() || null }),
    },
  });

  return NextResponse.json({ ok: true });
}

// DELETE /api/events/:id — supprimer définitivement une sortie (admin uniquement).
// Les RSVP/besoins/dépenses/commentaires sont supprimés en cascade (schéma) ;
// on nettoie en plus les photos stockées sur Vercel Blob.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });

  const event = await db.event.findUnique({
    where: { id: params.id },
    select: { id: true, photos: { select: { url: true } } },
  });
  if (!event) return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });

  // Supprimer les blobs des photos (best-effort)
  for (const p of event.photos) {
    try { await del(p.url); } catch (e) { console.error("Blob del:", e); }
  }

  await db.event.delete({ where: { id: event.id } });

  return NextResponse.json({ ok: true });
}
