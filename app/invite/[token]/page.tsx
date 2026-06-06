import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { INVITE_COOKIE } from "@/lib/auth";
import { Logo } from "@/components/shared/Logo";
import { getMemberColor, getInitials } from "@/lib/utils";

interface InvitePageProps {
  params: { token: string };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;

  const invitation = await db.invitation.findUnique({ where: { token } });

  if (!invitation) redirect("/login?error=InvalidToken");
  if (invitation.usedAt) redirect("/login?error=TokenUsed");
  if (invitation.expiresAt < new Date()) redirect("/login?error=TokenExpired");

  // Membres actifs pour le preview
  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, image: true, memberColor: true },
    take: 7,
  });

  const memberCount = await db.user.count({ where: { isActive: true } });

  const daysLeft = Math.ceil(
    (invitation.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  async function acceptInvite() {
    "use server";
    cookies().set(INVITE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 30,
    });
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-7 py-10 text-center">
      {/* Zone centrale */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Logo size={76} />

        {/* Badge inviteur */}
        <div
          className="flex items-center gap-2 bg-surface border border-border rounded-full shadow-sm mt-6"
          style={{ padding: "8px 14px 8px 8px" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
            style={{ background: "#3B7BF820", color: "#3B7BF8" }}
          >
            RP
          </div>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            Le Rond Point t'invite
          </span>
        </div>

        <h1
          className="text-foreground mt-5"
          style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.25 }}
        >
          Rejoins le groupe du<br />Rond Point
        </h1>
        <p className="text-muted-foreground mt-3 leading-relaxed max-w-[290px]" style={{ fontSize: 15 }}>
          Retrouve la bande du quartier et vois qui sera là quand tu rentres.
        </p>

        {/* Avatar stack membres */}
        {members.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex justify-center" style={{ gap: -8 }}>
              {members.slice(0, 6).map((m, i) => {
                const color = getMemberColor(m.memberColor ?? 1);
                const initials = getInitials(m.name ?? "?");
                return (
                  <div
                    key={m.id}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 border-background flex-shrink-0"
                    style={{
                      background: `${color}30`,
                      color,
                      marginLeft: i > 0 ? -8 : 0,
                      zIndex: members.length - i,
                    }}
                  >
                    {initials}
                  </div>
                );
              })}
            </div>
            <p className="text-subtle" style={{ fontSize: 12.5 }}>
              {memberCount} membre{memberCount > 1 ? "s" : ""} déjà présent{memberCount > 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Zone bas */}
      <div className="w-full max-w-sm flex flex-col items-center">
        <form action={acceptInvite} className="w-full">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-surface border border-border rounded-full shadow-sm text-foreground font-semibold transition-colors active:scale-[0.98]"
            style={{ padding: "14px", fontSize: 15.5 }}
          >
            <GoogleIcon />
            Rejoindre avec Google
          </button>
        </form>
        <p className="text-subtle mt-3.5" style={{ fontSize: 12 }}>
          Lien d'invitation valable encore {daysLeft} jour{daysLeft > 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
