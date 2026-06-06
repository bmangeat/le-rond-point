import { NextResponse } from "next/server";
import { runBirthdayNotifications, runPresenceReminders, runEventPhotoCleanup } from "@/lib/cron-tasks";

// GET /api/cron/daily — tâche matinale unique appelée par Vercel Cron.
// Regroupe les notifs d'anniversaire et les rappels de co-présence du jour.
// Sécurisé par CRON_SECRET.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authz = req.headers.get("authorization");
    if (authz !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const birthdays = await runBirthdayNotifications();
  const reminders = await runPresenceReminders();
  const photos = await runEventPhotoCleanup();

  return NextResponse.json({ ok: true, birthdays, reminders, photos });
}
