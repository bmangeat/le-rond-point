import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/group";

// Redirecteur racine : envoie vers le groupe de l'utilisateur, ou l'écran orphelin.
export default async function RootPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.groupId) redirect(`/${user.groupId}`);
  redirect("/orphelin"); // compte non rattaché à un Rond Point
}
