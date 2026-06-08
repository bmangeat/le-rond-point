import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess, canAdminGroup } from "@/lib/group";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage({ params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  const me = await requireGroupAccess(params.groupId);
  const groupId = params.groupId;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, image: true, city: true,
      notifEmail: true, notifPush: true, memberColor: true, role: true,
      notifPushOverlap: true, notifPushBirthday: true, notifPushPresence: true, notifPushPhotos: true, notifPushEvents: true,
      isResident: true, notifPushAsResident: true,
      birthday: true, phone: true, instagram: true, snapchat: true, tiktok: true, linkedin: true,
    },
  });

  if (!user) redirect("/login");

  // Compteurs pour la carte Administration (admins) — scopés au groupe courant
  let memberCount = 0;
  let invitationCount = 0;
  let reportsCount = 0;
  if (canAdminGroup(me, groupId)) {
    [memberCount, invitationCount, reportsCount] = await Promise.all([
      db.user.count({ where: { isActive: true, groupId } }),
      db.invitation.count({ where: { usedAt: null, expiresAt: { gt: new Date() }, groupId } }),
      db.eventComment.count({ where: { event: { groupId }, reports: { some: {} } } }),
    ]);
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <ProfileClient
      user={user}
      memberCount={memberCount}
      invitationCount={invitationCount}
      reportsCount={reportsCount}
      signOutAction={signOutAction}
    />
  );
}
