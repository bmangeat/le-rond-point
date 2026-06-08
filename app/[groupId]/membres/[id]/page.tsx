import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireGroupAccess } from "@/lib/group";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { BackButton } from "@/components/shared/BackButton";
import { AvailabilityBadge } from "@/components/shared/AvailabilityBadge";
import { formatDateRange } from "@/lib/utils";
import {
  instagramUrl, snapchatUrl, tiktokUrl, linkedinUrl, telHref, whatsappUrl,
  ageFromBirthday, formatBirthday,
} from "@/lib/social";
import { Phone, MessageCircle, Instagram, Linkedin, Cake, MapPin, Music2, Ghost } from "lucide-react";

export default async function MemberPage({ params }: { params: { groupId: string; id: string } }) {
  const session = await auth();
  if (!session) redirect("/login");
  await requireGroupAccess(params.groupId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // La requête présences dépend de params.id (pas du résultat user) → parallèle.
  const [user, upcoming] = await Promise.all([
    db.user.findUnique({
      where: { id: params.id },
      select: {
        id: true, name: true, image: true, city: true, memberColor: true, role: true,
        isActive: true, groupId: true, birthday: true, phone: true, instagram: true, snapchat: true,
        tiktok: true, linkedin: true,
      },
    }),
    db.presence.findMany({
      where: { userId: params.id, endDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
  ]);

  // Le membre doit exister, être actif ET appartenir au groupe de l'URL
  if (!user || !user.isActive || user.groupId !== params.groupId) notFound();

  const isMe = user.id === session.user.id;

  const contacts: { href: string; label: string; value: string; Icon: typeof Phone; external?: boolean }[] = [];
  if (user.phone) {
    contacts.push({ href: telHref(user.phone), label: "Appeler", value: user.phone, Icon: Phone });
    contacts.push({ href: whatsappUrl(user.phone), label: "WhatsApp", value: user.phone, Icon: MessageCircle, external: true });
  }
  if (user.instagram) contacts.push({ href: instagramUrl(user.instagram), label: "Instagram", value: `@${user.instagram.replace(/^@/, "")}`, Icon: Instagram, external: true });
  if (user.snapchat) contacts.push({ href: snapchatUrl(user.snapchat), label: "Snapchat", value: user.snapchat.replace(/^@/, ""), Icon: Ghost, external: true });
  if (user.tiktok) contacts.push({ href: tiktokUrl(user.tiktok), label: "TikTok", value: `@${user.tiktok.replace(/^@/, "")}`, Icon: Music2, external: true });
  if (user.linkedin) contacts.push({ href: linkedinUrl(user.linkedin), label: "LinkedIn", value: "Profil", Icon: Linkedin, external: true });

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-heading-1">Profil</h1>
        </div>

        {/* Identité */}
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <Avatar name={user.name} image={user.image} memberColor={user.memberColor} size="xl" />
          <div>
            <p className="text-heading-2">{user.name}</p>
            <div className="flex items-center justify-center gap-3 mt-1 text-caption">
              {user.city && (
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{user.city}</span>
              )}
              {user.birthday && (
                <span className="flex items-center gap-1">
                  <Cake className="w-3.5 h-3.5" />
                  {formatBirthday(user.birthday)} · {ageFromBirthday(user.birthday)} ans
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contacts */}
        {contacts.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-label">Contact</h2>
            {contacts.map((c, i) => (
              <a
                key={i}
                href={c.href}
                target={c.external ? "_blank" : undefined}
                rel={c.external ? "noopener noreferrer" : undefined}
                className="card flex items-center gap-3 hover:bg-muted transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <c.Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-body-strong font-medium">{c.label}</p>
                  <p className="text-caption truncate">{c.value}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {contacts.length === 0 && !user.birthday && (
          <p className="text-caption text-center">
            {isMe ? "Complète ton profil pour partager tes infos." : "Ce membre n'a pas encore renseigné d'infos."}
          </p>
        )}

        {/* Prochaines présences */}
        {upcoming.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-label">Prochaines présences</h2>
            {upcoming.map(p => (
              <div key={p.id} className="card flex items-center justify-between gap-3">
                <p className="text-body-strong font-medium">
                  {formatDateRange(new Date(p.startDate), new Date(p.endDate))}
                </p>
                <AvailabilityBadge availability={p.availability} />
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
