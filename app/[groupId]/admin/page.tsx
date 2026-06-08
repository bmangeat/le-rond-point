import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurrentUser, canAdminGroup } from "@/lib/group";
import { AdminClient } from "./AdminClient";

export default async function AdminPage({ params }: { params: { groupId: string } }) {
  const session = await auth();
  const me = await getCurrentUser();
  if (!session || !me) redirect("/login");
  if (!canAdminGroup(me, params.groupId)) redirect("/403");
  const groupId = params.groupId;

  const [members, pendingInvitations, reportedComments] = await Promise.all([
    db.user.findMany({
      where: { isActive: true, groupId },
      select: {
        id: true, name: true, email: true, image: true,
        city: true, memberColor: true, role: true, createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    db.invitation.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() }, groupId },
      orderBy: { createdAt: "desc" },
    }),
    db.eventComment.findMany({
      where: { event: { groupId }, reports: { some: {} } },
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
