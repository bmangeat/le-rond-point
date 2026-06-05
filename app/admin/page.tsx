import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const [members, pendingInvitations] = await Promise.all([
    db.user.findMany({
      where: { isActive: true },
      select: {
        id: true, name: true, email: true, image: true,
        city: true, memberColor: true, role: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return <AdminClient session={session} members={members} pendingInvitations={pendingInvitations} />;
}
