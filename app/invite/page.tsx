import { db } from "@/lib/db";
import { Logo } from "@/components/shared/Logo";
import { getMemberColor, getInitials } from "@/lib/utils";
import Link from "next/link";

export default async function InvitePage() {
  const members = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, memberColor: true },
    take: 7,
  });

  const memberCount = await db.user.count({ where: { isActive: true } });

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-7 py-10 text-center">
      {/* Zone centrale */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <Logo size={76} />

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

        {members.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-2">
            <div className="flex justify-center">
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
      <div className="w-full max-w-sm flex flex-col items-center gap-3">
        <div
          className="w-full px-5 py-4 rounded-2xl bg-primary/5 border border-primary/15 text-foreground"
          style={{ fontSize: 14, lineHeight: 1.5 }}
        >
          Pour rejoindre, ouvre le <strong>lien d'invitation</strong> qui t'a été envoyé par message.
        </div>
        <Link
          href="/login"
          className="text-muted-foreground"
          style={{ fontSize: 13 }}
        >
          ← Retour à la connexion
        </Link>
      </div>
    </div>
  );
}
