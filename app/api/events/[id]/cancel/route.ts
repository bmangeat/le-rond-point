import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { eventType, fmtEventWhen } from "@/lib/events";
import { sendPushToUser } from "@/lib/push";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser, canAccessGroup } from "@/lib/group";

// POST /api/events/:id/cancel — annuler (ou réactiver) une sortie. Hôte ou admin.
//   { cancelled: true, reason?: string } → annule + notifie les participants "YES"
//   { cancelled: false }                 → réactive (pas de notification)
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const event = await db.event.findUnique({
    where: { id: params.id },
    select: { id: true, name: true, type: true, whenAt: true, hostId: true, cancelledAt: true, groupId: true },
  });
  if (!event) return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });

  const me = session.user.id;
  const meUser = await getCurrentUser();
  if (!meUser || !event.groupId || !canAccessGroup(meUser, event.groupId)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const allowed = event.hostId === me || (await isAdmin(me));
  if (!allowed) return NextResponse.json({ error: "Réservé à l'organisateur ou à un admin" }, { status: 403 });

  const body = await req.json();
  const cancelled = body.cancelled !== false; // défaut : annuler

  if (!cancelled) {
    // Réactivation
    await db.event.update({ where: { id: event.id }, data: { cancelledAt: null, cancelReason: null } });
    return NextResponse.json({ ok: true, cancelled: false });
  }

  const reason = (body.reason as string)?.trim()?.slice(0, 500) || null;

  await db.event.update({
    where: { id: event.id },
    data: { cancelledAt: new Date(), cancelReason: reason },
  });

  // Notifier les participants qui avaient dit "Je viens" (sauf l'auteur de l'annulation)
  try {
    const going = await db.eventRsvp.findMany({
      where: { eventId: event.id, status: "YES", userId: { not: me } },
      select: { user: { select: { id: true, notifPush: true, notifPushEvents: true } } },
    });
    const meta = eventType(event.type);
    const when = fmtEventWhen(new Date(event.whenAt));
    const reasonSuffix = reason ? ` Motif : ${reason}` : "";
    for (const { user } of going) {
      if (!user.notifPush || !user.notifPushEvents) continue;
      await sendPushToUser(user.id, {
        title: `${meta.emoji} Sortie annulée : ${event.name}`,
        body: `La sortie du ${when.short} est annulée.${reasonSuffix}`,
        url: `/${event.groupId}/sorties/${event.id}`,
        tag: `event-cancel-${event.id}`,
      });
    }
  } catch (err) {
    console.error("Erreur push annulation:", err);
  }

  return NextResponse.json({ ok: true, cancelled: true });
}
