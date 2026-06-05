import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// Bornes de la journée courante en UTC (les présences sont stockées à minuit UTC,
// cohérent avec le <input type="date"> du formulaire et le mapping du calendrier).
function todayBounds() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
  return { start, end };
}

// POST /api/presences/today — marquer "je suis là aujourd'hui"
// Idempotent : si une présence couvre déjà aujourd'hui, on ne crée rien.
export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { start, end } = todayBounds();

  const existing = await db.presence.findFirst({
    where: {
      userId: session.user.id,
      startDate: { lte: end },
      endDate: { gte: start },
    },
  });

  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  // Journée unique : start = end à minuit UTC, comme le formulaire pour une présence d'un jour
  // (évite que la fin à 23:59 bascule au lendemain dans les fuseaux à l'est d'UTC).
  const presence = await db.presence.create({
    data: {
      userId: session.user.id,
      startDate: start,
      endDate: start,
      availability: "OPEN",
    },
  });

  return NextResponse.json(presence, { status: 201 });
}

// DELETE /api/presences/today — retirer la présence du jour à usage unique
// Ne supprime qu'une présence d'une seule journée (aujourd'hui), pas un séjour planifié.
export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { start, end } = todayBounds();

  const todayPresence = await db.presence.findFirst({
    where: {
      userId: session.user.id,
      startDate: { gte: start },
      endDate: { lte: end },
    },
  });

  if (todayPresence) {
    await db.presence.delete({ where: { id: todayPresence.id } });
  }

  return NextResponse.json({ success: true });
}
