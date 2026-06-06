import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sendInvitationEmail } from "@/lib/email";
import { getAdminSession } from "@/lib/admin";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/admin/invite — envoyer une invitation
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  if (!rateLimit(`${session.user.id}:invite`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop d'invitations, réessaie dans une minute." }, { status: 429 });
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

  // Token cryptographiquement aléatoire (cuid() par défaut était devinable).
  const invitation = await db.invitation.create({
    data: { email, expiresAt, token: randomBytes(32).toString("hex") },
  });

  // Envoyer l'email
  await sendInvitationEmail({
    to: email,
    token: invitation.token,
    inviterName: session.user.name ?? "Le Rond Point",
  });

  return NextResponse.json({ success: true, token: invitation.token }, { status: 201 });
}
