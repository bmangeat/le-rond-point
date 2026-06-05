import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { NextResponse } from "next/server";

// GET /api/cron/birthdays — appelé chaque matin par Vercel Cron (7h UTC ≈ 8-9h Paris).
// Notifie le groupe des anniversaires du jour. Sécurisé par CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization");
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  // Date du jour (UTC ; à 7h UTC, on est déjà le bon jour à Paris)
  const now = new Date();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, birthday: true, notifPush: true, notifPushBirthday: true },
  });

  const birthdayPeople = members.filter(
    m => m.birthday && m.birthday.getUTCMonth() === month && m.birthday.getUTCDate() === day
  );

  if (birthdayPeople.length === 0) {
    return NextResponse.json({ ok: true, birthdays: 0 });
  }

  let sent = 0;
  for (const celebrant of birthdayPeople) {
    const firstName = celebrant.name.split(" ")[0];

    for (const m of members) {
      if (!m.notifPush || !m.notifPushBirthday) continue;

      if (m.id === celebrant.id) {
        await sendPushToUser(m.id, {
          title: "Joyeux anniversaire ! 🎂🎉",
          body: "Toute la bande te souhaite une belle journée !",
          url: `/membres/${celebrant.id}`,
          tag: `birthday-${celebrant.id}`,
        });
      } else {
        await sendPushToUser(m.id, {
          title: `Anniversaire 🎂`,
          body: `Aujourd'hui, c'est l'anniversaire de ${firstName} !`,
          url: `/membres/${celebrant.id}`,
          tag: `birthday-${celebrant.id}`,
        });
      }
      sent++;
    }
  }

  return NextResponse.json({ ok: true, birthdays: birthdayPeople.length, sent });
}
