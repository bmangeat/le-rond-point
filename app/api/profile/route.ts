import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// PATCH /api/profile — mettre à jour le profil
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const {
    name, city, notifEmail, notifPush, image, birthday, phone, instagram, snapchat, tiktok, linkedin,
    notifPushOverlap, notifPushBirthday, notifPushPresence,
  } = body;

  // Nettoie un champ texte optionnel : "" → null, sinon trim
  const clean = (v: unknown) =>
    typeof v === "string" ? (v.trim() === "" ? null : v.trim()) : undefined;

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name && { name }),
      ...(city !== undefined && { city: clean(city) }),
      ...(typeof notifEmail === "boolean" && { notifEmail }),
      ...(typeof notifPush === "boolean" && { notifPush }),
      ...(typeof notifPushOverlap === "boolean" && { notifPushOverlap }),
      ...(typeof notifPushBirthday === "boolean" && { notifPushBirthday }),
      ...(typeof notifPushPresence === "boolean" && { notifPushPresence }),
      ...(image !== undefined && { image: clean(image) }),
      ...(birthday !== undefined && { birthday: birthday ? new Date(birthday) : null }),
      ...(phone !== undefined && { phone: clean(phone) }),
      ...(instagram !== undefined && { instagram: clean(instagram) }),
      ...(snapchat !== undefined && { snapchat: clean(snapchat) }),
      ...(tiktok !== undefined && { tiktok: clean(tiktok) }),
      ...(linkedin !== undefined && { linkedin: clean(linkedin) }),
    },
    select: { id: true },
  });

  return NextResponse.json(updated);
}
