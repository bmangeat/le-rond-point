import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendOverlapNotification } from "@/lib/email";
import { sendPushToUser } from "@/lib/push";
import { formatDateRange } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/group";

// GET /api/presences — liste des présences (du groupe de l'utilisateur)
export async function GET() {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!me.groupId) return NextResponse.json([]);

  const presences = await db.presence.findMany({
    where: { user: { isActive: true, groupId: me.groupId } },
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

  if (!rateLimit(`${session.user.id}:presence`, 30, 60_000)) {
    return NextResponse.json({ error: "Trop de présences créées, réessaie dans un instant." }, { status: 429 });
  }

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

    // L'alerte "résident" ne se déclenche que si l'auteur est un expatrié.
    const author = await db.user.findUnique({
      where: { id: session.user.id },
      select: { isResident: true, groupId: true },
    });
    const authorIsResident = author?.isResident ?? false;
    const groupId = author?.groupId ?? "__none__"; // notifs cloisonnées au groupe

    // Qui chevauche cette présence ? (chevauchement de plages, MÊME groupe)
    const overlapping = await db.presence.findMany({
      where: {
        userId: { not: session.user.id },
        startDate: { lte: end },
        endDate: { gte: start },
        user: { isActive: true, groupId },
      },
      select: { userId: true },
    });
    const overlappingIds = new Set(overlapping.map(p => p.userId));

    // Tous les autres membres actifs du groupe à notifier
    const others = await db.user.findMany({
      where: { id: { not: session.user.id }, isActive: true, groupId },
      select: {
        id: true, name: true, email: true,
        notifEmail: true, notifPush: true, notifPushOverlap: true, notifPushPresence: true,
        isResident: true, notifPushAsResident: true,
      },
    });

    for (const u of others) {
      const overlaps = overlappingIds.has(u.id);

      // Email de chevauchement (indépendant du push choisi ci-dessous)
      if (overlaps && u.notifEmail) {
        await sendOverlapNotification({
          to: u.email,
          recipientName: u.name.split(" ")[0],
          newPresencerName,
          startDate: start,
          endDate: end,
        });
      }

      // Un seul push par destinataire, par ordre de priorité :
      // 1) alerte résident (un expat débarque), 2) chevauchement, 3) nouvelle présence
      if (!authorIsResident && u.isResident && u.notifPush && u.notifPushAsResident) {
        await sendPushToUser(u.id, {
          title: `🏠 ${newPresencerName} débarque au quartier !`,
          body: `${dateLabel}. Pense à te rendre dispo pour le capter 🍻`,
          url: "/",
          tag: `resident-${session.user.id}`,
        });
      } else if (overlaps && u.notifPush && u.notifPushOverlap) {
        await sendPushToUser(u.id, {
          title: `${newPresencerName} sera au quartier 🎉`,
          body: `En même temps que toi : ${dateLabel}.`,
          url: "/",
          tag: `overlap-${session.user.id}`,
        });
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
