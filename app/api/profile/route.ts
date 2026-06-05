import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH /api/profile — mettre à jour le profil
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { name, city, notifEmail } = await req.json();

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name && { name }),
      city: city ?? null,
      ...(typeof notifEmail === "boolean" && { notifEmail }),
    },
    select: { id: true, name: true, city: true, notifEmail: true },
  });

  return NextResponse.json(updated);
}
