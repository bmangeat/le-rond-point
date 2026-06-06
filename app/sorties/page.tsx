import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { EventGlyph } from "@/components/events/EventGlyph";
import { eventType, fmtEventWhen, rsvpCounts } from "@/lib/events";
import { Clock, MapPin, Plus } from "lucide-react";

const STATUS_CHIP: Record<string, { t: string; cls: string }> = {
  YES: { t: "Tu viens", cls: "text-available bg-available-light" },
  NO: { t: "Sans toi", cls: "text-destructive bg-destructive/10" },
  PENDING: { t: "À répondre", cls: "text-busy bg-busy-light" },
};

export default async function SortiesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const since = new Date();
  since.setHours(0, 0, 0, 0);

  const events = await db.event.findMany({
    where: { whenAt: { gte: since } },
    orderBy: { whenAt: "asc" },
    include: {
      rsvps: { include: { user: { select: { id: true, name: true, image: true, memberColor: true } } } },
    },
  });

  const pendingCount = events.filter(
    e => (e.rsvps.find(r => r.userId === session.user.id)?.status ?? "PENDING") === "PENDING"
  ).length;

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-heading-1">Sorties</h1>
        <p className="text-caption mt-0.5">
          {events.length} sortie{events.length > 1 ? "s" : ""} à venir
          {pendingCount > 0 ? ` · ${pendingCount} en attente de ta réponse` : ""}
        </p>

        {events.length === 0 ? (
          <div className="card text-center py-12 mt-6">
            <p className="text-4xl mb-2">🎉</p>
            <p className="text-body-strong font-semibold">Aucune sortie prévue</p>
            <p className="text-caption mt-1">Lance la première avec le bouton +</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-5">
            {events.map(ev => {
              const ty = eventType(ev.type);
              const when = fmtEventWhen(new Date(ev.whenAt));
              const c = rsvpCounts(ev.rsvps);
              const yes = ev.rsvps.filter(r => r.status === "YES").map(r => r.user);
              const myStatus = ev.rsvps.find(r => r.userId === session.user.id)?.status ?? "PENDING";
              const chip = STATUS_CHIP[myStatus];
              return (
                <Link key={ev.id} href={`/sorties/${ev.id}`} className="card block">
                  <div className="flex items-center gap-3">
                    <EventGlyph type={ev.type} size={50} radius={15} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold tracking-tight truncate flex-1">{ev.name}</span>
                        <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${chip.cls}`}>{chip.t}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground font-medium mt-1">
                        <Clock className="w-3.5 h-3.5" style={{ color: ty.color }} /> {when.short}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1 text-[13px] text-muted-foreground truncate">{ev.placeName}</span>
                    <div className="flex -space-x-2">
                      {yes.slice(0, 4).map(u => (
                        <div key={u.id} className="ring-2 ring-surface rounded-full">
                          <Avatar name={u.name} image={u.image} memberColor={u.memberColor} size="sm" />
                        </div>
                      ))}
                    </div>
                    <span className="text-[12.5px] font-semibold text-available whitespace-nowrap">{c.yes} présent{c.yes > 1 ? "s" : ""}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link href="/sorties/nouveau" className="fab" aria-label="Créer une sortie">
        <Plus className="w-7 h-7" />
      </Link>
    </AppShell>
  );
}
