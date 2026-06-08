import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess } from "@/lib/group";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage({ params }: { params: { groupId: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  await requireGroupAccess(params.groupId);

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, memberColor: true, onboardedAt: true },
  });

  // Onboarding déjà fait → retour à l'accueil du groupe
  if (!user || user.onboardedAt) redirect(`/${params.groupId}`);

  return (
    <OnboardingClient
      name={user.name}
      image={user.image}
      memberColor={user.memberColor}
    />
  );
}
