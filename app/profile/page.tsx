import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { ProfileClient } from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, city: true, notifEmail: true, notifPush: true, memberColor: true, role: true },
  });

  if (!user) redirect("/login");

  return <ProfileClient user={user} />;
}
