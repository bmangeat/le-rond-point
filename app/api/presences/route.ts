import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendOverlapNotification } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { datesOverlap, formatDateRange } from "@/lib/utils";

// GET /api/presences — liste des présences
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const presences = await db.presence.findMany({
    where: { user: { isActive: true } },
    include: {
      user: { select: { id: true, name: true, image: true, city: true, memberColor: true } },
    },
    orderBy: { startDate: "asc" },
  });

  return NextResponse.json(presences);
}

// POST /api/presences — créer une présence
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { startDate, endDate, note, availability } = await req.json();

  if (!startDate || !endDate) {
    return NextResponse.json({ error: "Dates obligatoires" }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
  }

  const presence = await db.presence.create({
    data: {
      userId: session.user.id,
      startDate: start,
      endDate: end,
      note: note ?? null,
      availability: availability ?? "OPEN",
    },
  });

  // Envoyer les notifications de chevauchement (email + push selon les préférences)
  try {
    const overlappingPresences = await db.presence.findMany({
      where: {
        userId: { not: session.user.id },
        startDate: { lte: end },
        endDate: { gte: start },
        user: { isActive: true, OR: [{ notifEmail: true }, { notifPush: true }] },
      },
      include: {
        user: { select: { id: true, name: true, email: true, notifEmail: true, notifPush: true } },
      },
    });

    const newPresencerName = session.user.name ?? "Quelqu'un";

    // Dédupliquer par userId pour ne notifier qu'une fois par personne
    const notified = new Set<string>();
    for (const p of overlappingPresences) {
      if (notified.has(p.userId)) continue;
      if (!datesOverlap(start, end, new Date(p.startDate), new Date(p.endDate))) continue;
      notified.add(p.userId);

      if (p.user.notifEmail) {
        await sendOverlapNotification({
          to: p.user.email,
          recipientName: p.user.name.split(" ")[0],
          newPresencerName,
          startDate: start,
          endDate: end,
        });
      }

      if (p.user.notifPush) {
        await sendPushToUser(p.userId, {
          title: `${newPresencerName} sera au quartier 🎉`,
          body: `En même temps que toi : ${formatDateRange(start, end)}.`,
          url: "/",
          tag: `overlap-${session.user.id}`,
        });
      }
    }
  } catch (err) {
    console.error("Erreur envoi notifications:", err);
    // Ne pas bloquer la réponse si les notifications échouent
  }

  return NextResponse.json(presence, { status: 201 });
}
