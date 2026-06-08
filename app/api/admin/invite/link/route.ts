import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getAdminSession } from "@/lib/admin";
import { getCurrentUser } from "@/lib/group";
import { rateLimit } from "@/lib/rate-limit";

// POST /api/admin/invite/link — générer un lien d'invitation à usage unique (sans email)
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  const me = await getCurrentUser();
  if (!me?.groupId) return NextResponse.json({ error: "Aucun groupe" }, { status: 403 });

  if (!rateLimit(`${session.user.id}:invite`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop de liens générés, réessaie dans une minute." }, { status: 429 });
  }

  // Expire dans 7 jours
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Token cryptographiquement aléatoire (cuid() par défaut était devinable).
  const invitation = await db.invitation.create({
    data: { email: null, expiresAt, token: randomBytes(32).toString("hex"), groupId: me.groupId },
  });

  const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const url = `${base}/invite/${invitation.token}`;

  return NextResponse.json({ url, invitation }, { status: 201 });
}
