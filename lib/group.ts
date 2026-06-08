import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@prisma/client";

export interface CurrentUser {
  id: string;
  name: string;
  image: string | null;
  memberColor: number;
  role: Role;
  groupId: string | null;
}

// Utilisateur courant lu EN BASE (source de vérité — jamais le token, qui peut être
// périmé pour le rôle/groupe). Retourne null si non connecté ou compte désactivé.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, image: true, memberColor: true, role: true, groupId: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  const { isActive, ...rest } = user;
  return rest;
}

// Un super-admin accède à tous les groupes ; un membre/admin uniquement au sien.
export function canAccessGroup(user: Pick<CurrentUser, "role" | "groupId">, groupId: string): boolean {
  return user.role === "SUPER_ADMIN" || user.groupId === groupId;
}

// Admin du groupe = super-admin, OU admin local rattaché à ce groupe précis.
export function canAdminGroup(user: Pick<CurrentUser, "role" | "groupId">, groupId: string): boolean {
  return user.role === "SUPER_ADMIN" || (user.role === "ADMIN" && user.groupId === groupId);
}

// Garde de page : exige un accès légitime au groupe de l'URL.
// → non connecté : /login · orphelin : /orphelin · pas membre : /403.
// Retourne l'utilisateur courant si l'accès est autorisé.
export async function requireGroupAccess(groupId: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.groupId && user.role !== "SUPER_ADMIN") redirect("/orphelin");
  if (!canAccessGroup(user, groupId)) redirect("/403");
  return user;
}
