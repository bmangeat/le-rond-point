import { redirect } from "next/navigation";
import { db } from "@/lib/db";

interface InvitePageProps {
  params: { token: string };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;

  // Vérifier que le token est valide
  const invitation = await db.invitation.findUnique({
    where: { token },
  });

  if (!invitation) {
    redirect("/login?error=InvalidToken");
  }

  if (invitation.usedAt) {
    redirect("/login?error=TokenUsed");
  }

  if (invitation.expiresAt < new Date()) {
    redirect("/login?error=TokenExpired");
  }

  // Token valide → rediriger vers /login
  // L'email de l'invitation sera vérifié lors du signIn
  redirect("/login");
}
