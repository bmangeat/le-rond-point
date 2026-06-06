import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { isAdmin } from "@/lib/admin";
import { containsProfanity } from "@/lib/profanity";

// POST /api/events/:id/actions — mutations du hub événement
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Anti-spam (commentaires, photos, etc.) : 40 actions / minute / utilisateur.
  if (!rateLimit(`${session.user.id}:event-action`, 40, 60_000)) {
    return NextResponse.json({ error: "Trop d'actions, réessaie dans un instant." }, { status: 429 });
  }

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
      if (containsProfanity(text)) {
        return NextResponse.json({ error: "Ton message contient des propos non autorisés." }, { status: 400 });
      }
      const comment = await db.eventComment.create({ data: { eventId, authorId: me, text } });
      return NextResponse.json({ ok: true, comment });
    }

    case "deleteComment": {
      const comment = await db.eventComment.findFirst({ where: { id: body.commentId, eventId } });
      if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
      // Autorisé : l'auteur, l'hôte de la sortie, ou un admin (rôle vérifié en base)
      const allowed = comment.authorId === me || event.hostId === me || (await isAdmin(me));
      if (!allowed) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      await db.eventComment.delete({ where: { id: comment.id } });
      return NextResponse.json({ ok: true });
    }

    case "reportComment": {
      const comment = await db.eventComment.findFirst({ where: { id: body.commentId, eventId } });
      if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });
      const reason = (body.reason as string)?.trim()?.slice(0, 280) || null;
      // upsert : un seul signalement par personne et commentaire (pas d'erreur si re-signalé)
      await db.commentReport.upsert({
        where: { commentId_reporterId: { commentId: comment.id, reporterId: me } },
        create: { commentId: comment.id, reporterId: me, reason },
        update: { reason },
      });
      return NextResponse.json({ ok: true });
    }

    case "addPhoto": {
      const url = (body.url as string)?.trim();
      if (!url) return NextResponse.json({ error: "URL manquante" }, { status: 400 });
      const count = await db.eventPhoto.count({ where: { eventId } });
      if (count >= 5) return NextResponse.json({ error: "Limite de 5 photos atteinte" }, { status: 409 });
      const photo = await db.eventPhoto.create({ data: { eventId, uploaderId: me, url } });
      return NextResponse.json({ ok: true, photo });
    }

    case "deletePhoto": {
      const photo = await db.eventPhoto.findFirst({ where: { id: body.photoId, eventId } });
      if (!photo) return NextResponse.json({ error: "Photo introuvable" }, { status: 404 });
      // Autorisé : le posteur, l'hôte de la sortie, ou un admin
      const myUser = await db.user.findUnique({ where: { id: me }, select: { role: true } });
      const allowed = photo.uploaderId === me || event.hostId === me || myUser?.role === "ADMIN";
      if (!allowed) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
      try { await del(photo.url); } catch (e) { console.error("Blob del:", e); }
      await db.eventPhoto.delete({ where: { id: photo.id } });
      return NextResponse.json({ ok: true });
    }

    default:
      return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }
}
