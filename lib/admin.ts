import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Session } from "next-auth";

// Vérifie le rôle admin DEPUIS LA BASE (et non depuis le token JWT, qui peut être
// périmé tant que l'utilisateur ne s'est pas reconnecté après un changement de rôle).
// À utiliser uniquement côté Node (route handlers, server components) — pas en Edge.
export async function getAdminSession(): Promise<Session | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isActive: true },
  });

  if (!user || !user.isActive || user.role !== "ADMIN") return null;
  return session;
}

// Vérifie qu'un utilisateur est admin DEPUIS LA BASE (rôle du token JWT pouvant
// être périmé). À utiliser quand on a déjà l'id et qu'on veut juste le booléen.
export async function isAdmin(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true },
  });
  return !!user && user.isActive && user.role === "ADMIN";
}
