import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/admin";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) redirect("/");

  const [members, pendingInvitations, reportedComments] = await Promise.all([
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
    db.eventComment.findMany({
      where: { reports: { some: {} } },
      select: {
        id: true,
        text: true,
        author: { select: { name: true } },
        event: { select: { id: true, name: true } },
        _count: { select: { reports: true } },
        reports: { select: { reason: true, reporter: { select: { name: true } } }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <AdminClient
      session={session}
      members={members}
      pendingInvitations={pendingInvitations}
      reportedComments={JSON.parse(JSON.stringify(reportedComments))}
    />
  );
}
