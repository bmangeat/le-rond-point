import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true, name: true, email: true, image: true, city: true,
      notifEmail: true, notifPush: true, memberColor: true, role: true,
      notifPushOverlap: true, notifPushBirthday: true, notifPushPresence: true, notifPushPhotos: true,
      birthday: true, phone: true, instagram: true, snapchat: true, tiktok: true, linkedin: true,
    },
  });

  if (!user) redirect("/login");

  // Compteurs pour la carte Administration (admins)
  let memberCount = 0;
  let invitationCount = 0;
  if (user.role === "ADMIN") {
    [memberCount, invitationCount] = await Promise.all([
      db.user.count({ where: { isActive: true } }),
      db.invitation.count({ where: { usedAt: null, expiresAt: { gt: new Date() } } }),
    ]);
  }

  return <ProfileClient user={user} memberCount={memberCount} invitationCount={invitationCount} />;
}
