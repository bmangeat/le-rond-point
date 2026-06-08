import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser, canAccessGroup } from "@/lib/group";

function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

// GET /api/events/:id/ics — fichier .ics pour ajouter la sortie à son agenda
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const event = await db.event.findUnique({
    where: { id: params.id },
    select: { name: true, description: true, whenAt: true, placeName: true, placeAddr: true, groupId: true },
  });
  if (!event) return NextResponse.json({ error: "Sortie introuvable" }, { status: 404 });

  const me = await getCurrentUser();
  if (!me || !event.groupId || !canAccessGroup(me, event.groupId)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const start = new Date(event.whenAt);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000); // durée par défaut : 3 h
  const url = `${process.env.NEXTAUTH_URL ?? new URL(req.url).origin}/${event.groupId}/sorties/${params.id}`;
  const location = [event.placeName, event.placeAddr].filter(Boolean).join(", ");

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Le Rond Point//Sorties//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${params.id}@lerondpoint`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${esc(event.name)}`,
    event.description ? `DESCRIPTION:${esc(event.description)}` : "",
    location ? `LOCATION:${esc(location)}` : "",
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const slug = event.name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "sortie";

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
    },
  });
}
