import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser, canAdminGroup } from "@/lib/group";

// GET /api/admin/reports — nb de commentaires signalés DANS le groupe de l'admin.
// Utilisé pour la pastille de notification (nav + bouton admin).
export async function GET() {
  const me = await getCurrentUser();
  if (!me?.groupId || (me.role !== "ADMIN" && me.role !== "SUPER_ADMIN")) {
    return NextResponse.json({ count: 0 });
  }
  const count = await db.eventComment.count({
    where: { event: { groupId: me.groupId }, reports: { some: {} } },
  });
  return NextResponse.json({ count });
}

// POST /api/admin/reports — traiter un commentaire signalé (de son groupe)
//   { commentId, op: "delete" }  → supprime le commentaire (et ses signalements en cascade)
//   { commentId, op: "dismiss" } → ignore : supprime les signalements, garde le commentaire
export async function POST(req: Request) {
  const me = await getCurrentUser();
  if (!me) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { commentId, op } = await req.json();
  if (!commentId || !["delete", "dismiss"].includes(op)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // Le commentaire doit appartenir à un groupe que l'utilisateur peut administrer.
  const comment = await db.eventComment.findUnique({
    where: { id: commentId },
    select: { event: { select: { groupId: true } } },
  });
  const gid = comment?.event.groupId;
  if (!gid || !canAdminGroup(me, gid)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  if (op === "delete") {
    await db.eventComment.delete({ where: { id: commentId } }).catch(() => {});
  } else {
    await db.commentReport.deleteMany({ where: { commentId } });
  }

  return NextResponse.json({ ok: true });
}
