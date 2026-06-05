import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin";

// PATCH /api/admin/members/:id — changer le rôle d'un membre
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Réservé aux admins" }, { status: 403 });
  }

  const { role } = await req.json();
  if (role !== "ADMIN" && role !== "MEMBER") {
    return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.id } });
  if (!target || !target.isActive) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
  }

  // On ne peut pas changer son propre rôle (évite de se verrouiller hors admin)
  if (target.id === session.user.id) {
    return NextResponse.json({ error: "Vous ne pouvez pas changer votre propre rôle" }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: params.id },
    data: { role: role as Role },
    select: { id: true, role: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/admin/members/:id — retirer un membre (soft delete)
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getAdminSession();
  if (!session) {
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
