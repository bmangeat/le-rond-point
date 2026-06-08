import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser, canAdminGroup } from "@/lib/group";

// DELETE /api/admin/invite/[id] — supprimer une invitation en attente (non utilisée)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const invitation = await db.invitation.findUnique({ where: { id: params.id } });
  if (!invitation) {
    return NextResponse.json({ error: "Invitation introuvable" }, { status: 404 });
  }
  if (!invitation.groupId || !canAdminGroup(me, invitation.groupId)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  if (invitation.usedAt) {
    return NextResponse.json({ error: "Invitation déjà utilisée" }, { status: 409 });
  }

  await db.invitation.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
