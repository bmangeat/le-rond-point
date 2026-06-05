import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendOverlapNotification } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { formatDateRange } from "@/lib/utils";

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

  // Notifications : chevauchement pour ceux qui sont là en même temps, sinon
  // "nouvelle présence" pour les autres — selon les préférences de chacun.
  try {
    const newPresencerName = session.user.name ?? "Quelqu'un";
    const dateLabel = formatDateRange(start, end);

    // Qui chevauche cette présence ? (la condition SQL = chevauchement de plages)
    const overlapping = await db.presence.findMany({
      where: {
        userId: { not: session.user.id },
        startDate: { lte: end },
        endDate: { gte: start },
        user: { isActive: true },
      },
      select: { userId: true },
    });
    const overlappingIds = new Set(overlapping.map(p => p.userId));

    // Tous les autres membres actifs à notifier
    const others = await db.user.findMany({
      where: { id: { not: session.user.id }, isActive: true },
      select: {
        id: true, name: true, email: true,
        notifEmail: true, notifPush: true, notifPushOverlap: true, notifPushPresence: true,
      },
    });

    for (const u of others) {
      const overlaps = overlappingIds.has(u.id);

      if (overlaps) {
        if (u.notifEmail) {
          await sendOverlapNotification({
            to: u.email,
            recipientName: u.name.split(" ")[0],
            newPresencerName,
            startDate: start,
            endDate: end,
          });
        }
        if (u.notifPush && u.notifPushOverlap) {
          await sendPushToUser(u.id, {
            title: `${newPresencerName} sera au quartier 🎉`,
            body: `En même temps que toi : ${dateLabel}.`,
            url: "/",
            tag: `overlap-${session.user.id}`,
          });
        }
      } else if (u.notifPush && u.notifPushPresence) {
        await sendPushToUser(u.id, {
          title: `Nouvelle présence`,
          body: `${newPresencerName} sera au quartier : ${dateLabel}.`,
          url: "/",
          tag: `presence-${session.user.id}`,
        });
      }
    }
  } catch (err) {
    console.error("Erreur envoi notifications:", err);
    // Ne pas bloquer la réponse si les notifications échouent
  }

  return NextResponse.json(presence, { status: 201 });
}
