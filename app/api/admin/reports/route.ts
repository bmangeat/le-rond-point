import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

// GET /api/admin/reports — nombre de commentaires signalés (0 si non-admin).
// Utilisé pour la pastille de notification (nav + bouton admin).
export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ count: 0 });
  const count = await db.eventComment.count({ where: { reports: { some: {} } } });
  return NextResponse.json({ count });
}

// POST /api/admin/reports — traiter un commentaire signalé
//   { commentId, op: "delete" }  → supprime le commentaire (et ses signalements en cascade)
//   { commentId, op: "dismiss" } → ignore : supprime les signalements, garde le commentaire
export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });

  const { commentId, op } = await req.json();
  if (!commentId || !["delete", "dismiss"].includes(op)) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (op === "delete") {
    await db.eventComment.delete({ where: { id: commentId } }).catch(() => {});
  } else {
    await db.commentReport.deleteMany({ where: { commentId } });
  }

  return NextResponse.json({ ok: true });
}
