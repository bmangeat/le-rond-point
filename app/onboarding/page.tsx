import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { OnboardingClient } from "@/components/onboarding/OnboardingClient";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, memberColor: true, onboardedAt: true },
  });

  // Onboarding déjà fait → retour à l'accueil
  if (!user || user.onboardedAt) redirect("/");

  return (
    <OnboardingClient
      name={user.name}
      image={user.image}
      memberColor={user.memberColor}
    />
  );
}
