import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/events/:id/actions — mutations du hub événement
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const eventId = params.id;
  const event = await db.event.findUnique({ where: { id: eventId }, select: { id: true, hostId: true } });
  if (!event) return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });

  const me = session.user.id;
  const body = await req.json();
  const action = body.action as string;

  switch (action) {
    case "rsvp": {
      const status = body.status as string;
      if (!["YES", "NO", "PENDING"].includes(status)) {
        return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
      }
      await db.eventRsvp.upsert({
        where: { eventId_userId: { eventId, userId: me } },
        create: { eventId, userId: me, status },
        update: { status },
      });
      return NextResponse.json({ ok: true });
    }

    case "addNeed": {
      const label = (body.label as string)?.trim();
      if (!label) return NextResponse.json({ error: "Libellé vide" }, { status: 400 });
      const need = await db.eventNeed.create({ data: { eventId, label } });
      return NextResponse.json({ ok: true, need });
    }

    case "claimNeed": {
      const need = await db.eventNeed.findFirst({ where: { id: body.needId, eventId } });
      if (!need) return NextResponse.json({ error: "Besoin introuvable" }, { status: 404 });
      // Libre → je prends ; déjà à moi → je me retire ; pris par un autre → interdit
      let claimedById: string | null;
      if (!need.claimedById) claimedById = me;
      else if (need.claimedById === me) claimedById = null;
      else return NextResponse.json({ error: "Déjà pris" }, { status: 409 });
      await db.eventNeed.update({ where: { id: need.id }, data: { claimedById } });
      return NextResponse.json({ ok: true });
    }

    case "addExpense": {
      const label = (body.label as string)?.trim();
      const amount = Number(body.amount);
      const forUserIds = Array.isArray(body.forUserIds) ? body.forUserIds : [];
      if (!label || !(amount > 0) || forUserIds.length === 0) {
        return NextResponse.json({ error: "Dépense invalide" }, { status: 400 });
      }
      const expense = await db.eventExpense.create({
        data: { eventId, payerId: me, label, amount: Math.round(amount * 100) / 100, forUserIds },
      });
      return NextResponse.json({ ok: true, expense });
    }

    case "setPlaylist": {
      if (event.hostId !== me) return NextResponse.json({ error: "Réservé à l'organisateur" }, { status: 403 });
      const url = (body.url as string)?.trim() || null;
      await db.event.update({ where: { id: eventId }, data: { playlistUrl: url, hasPlaylist: !!url } });
      return NextResponse.json({ ok: true, playlistUrl: url });
    }

    case "addComment": {
      const text = (body.text as string)?.trim();
      if (!text) return NextResponse.json({ error: "Message vide" }, { status: 400 });
      const comment = await db.eventComment.create({ data: { eventId, authorId: me, text } });
      return NextResponse.json({ ok: true, comment });
    }

    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
}
