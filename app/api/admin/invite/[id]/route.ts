import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

// DELETE /api/admin/invite/[id] — supprimer une invitation en attente (non utilisée)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  const invitation = await db.invitation.findUnique({ where: { id: params.id } });
  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (invitation.usedAt) {
    return NextResponse.json({ error: "Invitation déjà utilisée" }, { status: 409 });
  }

  await db.invitation.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
