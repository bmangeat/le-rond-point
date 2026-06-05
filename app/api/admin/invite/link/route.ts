import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// POST /api/admin/invite/link — générer un lien d'invitation à usage unique (sans email)
export async function POST(req: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  // Expire dans 7 jours
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const invitation = await db.invitation.create({
    data: { email: null, expiresAt },
  });

  const base = process.env.NEXTAUTH_URL ?? new URL(req.url).origin;
  const url = `${base}/invite/${invitation.token}`;

  return NextResponse.json({ url, expiresAt }, { status: 201 });
}
