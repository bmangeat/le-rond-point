import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH /api/presences/:id — modifier une présence
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const presence = await db.presence.findUnique({ where: { id: params.id } });
  if (!presence) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  // Seul le propriétaire ou un admin peut modifier
  if (presence.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  const { startDate, endDate, note, availability } = await req.json();

  const start = startDate ? new Date(startDate) : presence.startDate;
  const end = endDate ? new Date(endDate) : presence.endDate;

  if (end < start) {
    return NextResponse.json({ error: "La date de fin doit être après la date de début" }, { status: 400 });
  }

  const updated = await db.presence.update({
    where: { id: params.id },
    data: {
      startDate: start,
      endDate: end,
      note: note !== undefined ? note : presence.note,
      availability: availability ?? presence.availability,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/presences/:id — supprimer une présence
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const presence = await db.presence.findUnique({ where: { id: params.id } });
  if (!presence) return NextResponse.json({ error: "Non trouvé" }, { status: 404 });

  if (presence.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  await db.presence.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
