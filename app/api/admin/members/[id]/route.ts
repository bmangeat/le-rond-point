import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

// DELETE /api/admin/members/:id — retirer un membre (soft delete)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });

  // Ne pas pouvoir se supprimer soi-même ni un autre admin
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas vous retirer vous-même" }, { status: 400 });
  }
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Impossible de retirer un admin" }, { status: 400 });
  }

  // Soft delete : désactiver + anonymiser le nom
  await db.user.update({
    where: { id: params.id },
    data: {
      isActive: false,
      name: "Ancien membre",
      email: `deleted_${params.id}@removed.local`,
    },
  });

  return NextResponse.json({ success: true });
}
