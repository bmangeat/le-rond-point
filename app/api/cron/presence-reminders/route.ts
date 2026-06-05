import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { NextResponse } from "next/server";

// GET /api/cron/presence-reminders — chaque matin (Vercel Cron).
// Rappel le jour J : quand une co-présence commence aujourd'hui (quelqu'un arrive
// alors qu'un autre est déjà/aussi là), on prévient les concernés. On ne notifie
// que les "nouveaux" arrivants du jour pour ne pas répéter chaque jour d'un séjour.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization");
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  // Présences actives aujourd'hui
  const presences = await db.presence.findMany({
    where: {
      startDate: { lte: todayEnd },
      endDate: { gte: todayStart },
      user: { isActive: true },
    },
    select: {
      startDate: true,
      user: { select: { id: true, name: true, notifPush: true, notifPushOverlap: true } },
    },
  });

  // Regrouper par membre présent aujourd'hui
  const present = new Map<string, { id: string; name: string; notifPush: boolean; notifPushOverlap: boolean; arrivedToday: boolean }>();
  for (const p of presences) {
    const arrived = new Date(p.startDate) >= todayStart && new Date(p.startDate) <= todayEnd;
    const existing = present.get(p.user.id);
    if (existing) {
      existing.arrivedToday = existing.arrivedToday || arrived;
    } else {
      present.set(p.user.id, { ...p.user, arrivedToday: arrived });
    }
  }

  const people = Array.from(present.values());
  if (people.length < 2) {
    return NextResponse.json({ ok: true, present: people.length, sent: 0 });
  }

  const firstName = (n: string) => n.split(" ")[0];
  const joinNames = (names: string[]) =>
    names.length === 1
      ? names[0]
      : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;

  let sent = 0;
  for (const u of people) {
    if (!u.notifPush || !u.notifPushOverlap) continue;

    const others = people.filter(o => o.id !== u.id);
    // Si u arrive aujourd'hui → on lui présente tout le monde présent ;
    // sinon → seulement ceux qui arrivent aujourd'hui (nouveauté du jour).
    const mention = u.arrivedToday ? others : others.filter(o => o.arrivedToday);
    if (mention.length === 0) continue;

    const names = joinNames(mention.map(o => firstName(o.name)));
    const multiple = mention.length > 1;

    await sendPushToUser(u.id, {
      title: "Le quartier s'anime ! 🍻",
      body: multiple
        ? `${names} sont au quartier en même temps que toi aujourd'hui. Faites-vous signe avant de vous louper bêtement ! 📲`
        : `${names} est au quartier aujourd'hui, comme toi. Un petit « t'es oùùù ? » s'impose 👀`,
      url: "/",
      tag: `reminder-${todayStart.toISOString().split("T")[0]}`,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, present: people.length, sent });
}
