import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { sendInvitationEmail } from "@/lib/email";

// POST /api/admin/invite — envoyer une invitation
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  // Vérifier que l'email n'est pas déjà membre
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "Cet email est déjà membre du groupe" }, { status: 409 });
  }

  // Révoquer les invitations précédentes non utilisées pour cet email
  await db.invitation.updateMany({
    where: { email, usedAt: null },
    data: { expiresAt: new Date() }, // expire immédiatement
  });

  // Créer la nouvelle invitation (expire dans 7 jours)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await db.invitation.create({
    data: { email, expiresAt },
  });

  // Envoyer l'email
  await sendInvitationEmail({
    to: email,
    token: invitation.token,
    inviterName: session.user.name ?? "Le Rond Point",
  });

  return NextResponse.json({ success: true, token: invitation.token }, { status: 201 });
}
