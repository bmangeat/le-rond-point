import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";
import { del } from "@vercel/blob";
import { fmtEventWhen } from "@/lib/events";

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
    select: { id: true, name: true, birthday: true, groupId: true, notifPush: true, notifPushBirthday: true },
  });

  const celebrants = members.filter(
    m => m.groupId && m.birthday && m.birthday.getUTCMonth() === month && m.birthday.getUTCDate() === day
  );

  let sent = 0;
  for (const celebrant of celebrants) {
    const name = firstName(celebrant.name);
    // Cloisonnement : on ne prévient que les membres du MÊME groupe.
    for (const m of members) {
      if (m.groupId !== celebrant.groupId) continue;
      if (!m.notifPush || !m.notifPushBirthday) continue;
      await sendPushToUser(m.id, {
        title: m.id === celebrant.id ? "Joyeux anniversaire ! 🎂🎉" : "Anniversaire 🎂",
        body: m.id === celebrant.id
          ? "Toute la bande te souhaite une belle journée !"
          : `Aujourd'hui, c'est l'anniversaire de ${name} !`,
        url: `/${celebrant.groupId}/membres/${celebrant.id}`,
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
      user: { select: { id: true, name: true, groupId: true, notifPush: true, notifPushOverlap: true } },
    },
  });

  type P = { id: string; name: string; groupId: string | null; notifPush: boolean; notifPushOverlap: boolean; arrivedToday: boolean };
  const present = new Map<string, P>();
  for (const p of presences) {
    const arrived = new Date(p.startDate) >= todayStart && new Date(p.startDate) <= todayEnd;
    const existing = present.get(p.user.id);
    if (existing) existing.arrivedToday = existing.arrivedToday || arrived;
    else present.set(p.user.id, { ...p.user, arrivedToday: arrived });
  }

  // Regroupe par groupe : on ne compare jamais des présences de groupes différents.
  const byGroup = new Map<string, P[]>();
  for (const u of present.values()) {
    if (!u.groupId) continue;
    (byGroup.get(u.groupId) ?? byGroup.set(u.groupId, []).get(u.groupId)!).push(u);
  }

  const joinNames = (names: string[]) =>
    names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;

  let sent = 0;
  let totalPresent = 0;
  for (const [groupId, people] of byGroup) {
    if (people.length < 2) continue;
    totalPresent += people.length;
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
        url: `/${groupId}`,
        tag: `reminder-${todayStart.toISOString().split("T")[0]}`,
      });
      sent++;
    }
  }
  return { present: totalPresent, sent };
}

const PHOTO_TTL_DAYS = 7;

// Auto-destruction des photos 7 jours APRÈS la date de la sortie (Blob + DB).
export async function runEventPhotoCleanup() {
  const cutoff = new Date(Date.now() - PHOTO_TTL_DAYS * 24 * 60 * 60 * 1000);
  const old = await db.eventPhoto.findMany({
    where: { event: { whenAt: { lt: cutoff } } },
    select: { id: true, url: true },
  });
  if (old.length === 0) return { deleted: 0 };

  try {
    await del(old.map(p => p.url));
  } catch (err) {
    console.error("Erreur suppression Blob photos:", err);
  }
  await db.eventPhoto.deleteMany({ where: { id: { in: old.map(p => p.id) } } });
  return { deleted: old.length };
}

// Prévient les participants 1 jour avant la suppression des photos d'une sortie.
export async function runPhotoExpiryWarnings() {
  // Sortie dont la date est dans [now-7j, now-6j) : photos supprimées au prochain run (~demain).
  const lower = new Date(Date.now() - PHOTO_TTL_DAYS * 24 * 60 * 60 * 1000);
  const upper = new Date(Date.now() - (PHOTO_TTL_DAYS - 1) * 24 * 60 * 60 * 1000);

  const events = await db.event.findMany({
    where: { whenAt: { gte: lower, lt: upper }, photos: { some: {} } },
    select: {
      id: true, name: true, groupId: true,
      rsvps: { where: { status: "YES" }, select: { userId: true } },
      photos: { select: { id: true } },
    },
  });
  if (events.length === 0) return { events: 0, sent: 0 };

  // Préférences des participants concernés
  const ids = Array.from(new Set(events.flatMap(e => e.rsvps.map(r => r.userId))));
  const users = await db.user.findMany({
    where: { id: { in: ids }, isActive: true, notifPush: true, notifPushPhotos: true },
    select: { id: true },
  });
  const optedIn = new Set(users.map(u => u.id));

  let sent = 0;
  for (const ev of events) {
    const n = ev.photos.length;
    for (const r of ev.rsvps) {
      if (!optedIn.has(r.userId)) continue;
      await sendPushToUser(r.userId, {
        title: "📸 Sauve les souvenirs !",
        body: `Les ${n} photo${n > 1 ? "s" : ""} de « ${ev.name} » s'autodétruisent demain. Télécharge-les avant qu'elles partent en fumée 💨`,
        url: `/${ev.groupId}/sorties/${ev.id}`,
        tag: `photo-expiry-${ev.id}`,
      });
      sent++;
    }
  }
  return { events: events.length, sent };
}

// Rappel le matin même aux participants ("Je viens") d'une sortie du jour.
export async function runEventDayReminders() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  const events = await db.event.findMany({
    where: { whenAt: { gte: start, lte: end } },
    select: {
      id: true, name: true, whenAt: true, placeName: true, groupId: true,
      rsvps: { where: { status: "YES" }, select: { userId: true } },
    },
  });
  if (events.length === 0) return { events: 0, sent: 0 };

  const ids = Array.from(new Set(events.flatMap(e => e.rsvps.map(r => r.userId))));
  const users = await db.user.findMany({
    where: { id: { in: ids }, isActive: true, notifPush: true, notifPushEvents: true },
    select: { id: true },
  });
  const optedIn = new Set(users.map(u => u.id));

  let sent = 0;
  for (const ev of events) {
    const time = fmtEventWhen(new Date(ev.whenAt)).time;
    for (const r of ev.rsvps) {
      if (!optedIn.has(r.userId)) continue;
      await sendPushToUser(r.userId, {
        title: "🎉 C'est aujourd'hui !",
        body: `« ${ev.name} » à ${time} — ${ev.placeName}. À tout à l'heure !`,
        url: `/${ev.groupId}/sorties/${ev.id}`,
        tag: `event-day-${ev.id}`,
      });
      sent++;
    }
  }
  return { events: events.length, sent };
}
