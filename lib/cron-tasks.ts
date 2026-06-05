import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

const firstName = (n: string) => n.split(" ")[0];

function todayBoundsUTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { now, start, end };
}

// Notifs d'anniversaire : le jour J, prévient le groupe.
export async function runBirthdayNotifications() {
  const { now } = todayBoundsUTC();
  const month = now.getUTCMonth();
  const day = now.getUTCDate();

  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, birthday: true, notifPush: true, notifPushBirthday: true },
  });

  const celebrants = members.filter(
    m => m.birthday && m.birthday.getUTCMonth() === month && m.birthday.getUTCDate() === day
  );

  let sent = 0;
  for (const celebrant of celebrants) {
    const name = firstName(celebrant.name);
    for (const m of members) {
      if (!m.notifPush || !m.notifPushBirthday) continue;
      await sendPushToUser(m.id, {
        title: m.id === celebrant.id ? "Joyeux anniversaire ! 🎂🎉" : "Anniversaire 🎂",
        body: m.id === celebrant.id
          ? "Toute la bande te souhaite une belle journée !"
          : `Aujourd'hui, c'est l'anniversaire de ${name} !`,
        url: `/membres/${celebrant.id}`,
        tag: `birthday-${celebrant.id}`,
      });
      sent++;
    }
  }
  return { birthdays: celebrants.length, sent };
}

// Rappel le jour J : co-présence qui commence aujourd'hui → prévient les concernés.
export async function runPresenceReminders() {
  const { start: todayStart, end: todayEnd } = todayBoundsUTC();

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

  const present = new Map<string, { id: string; name: string; notifPush: boolean; notifPushOverlap: boolean; arrivedToday: boolean }>();
  for (const p of presences) {
    const arrived = new Date(p.startDate) >= todayStart && new Date(p.startDate) <= todayEnd;
    const existing = present.get(p.user.id);
    if (existing) existing.arrivedToday = existing.arrivedToday || arrived;
    else present.set(p.user.id, { ...p.user, arrivedToday: arrived });
  }

  const people = Array.from(present.values());
  if (people.length < 2) return { present: people.length, sent: 0 };

  const joinNames = (names: string[]) =>
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;

  let sent = 0;
  for (const u of people) {
    if (!u.notifPush || !u.notifPushOverlap) continue;
    const others = people.filter(o => o.id !== u.id);
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
  return { present: people.length, sent };
}
