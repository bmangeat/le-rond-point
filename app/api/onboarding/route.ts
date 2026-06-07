import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/onboarding — complète l'onboarding (ville + anniversaire) et marque
// onboardedAt. La présence éventuelle est créée séparément via /api/presences
// (qui gère les notifications).
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { city, birthday, isResident } = await req.json();

  const clean = (v: unknown) =>
    typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : null;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      city: clean(city),
      birthday: birthday ? new Date(birthday) : null,
      isResident: typeof isResident === "boolean" ? isResident : false,
      onboardedAt: new Date(),
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
