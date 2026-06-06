"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { DayDetailSheet } from "@/components/calendar/DayDetailSheet";
import { PresenceForm } from "@/components/presence/PresenceForm";
import { TodayPresenceToggle } from "@/components/presence/TodayPresenceToggle";
import { PushPrompt } from "@/components/shared/PushPrompt";
import { Avatar } from "@/components/shared/Avatar";
import { AvailabilityBadge } from "@/components/shared/AvailabilityBadge";
import { getMemberColor, formatDateRange, hexA } from "@/lib/utils";
import { eventType, fmtEventWhen } from "@/lib/events";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import type { Session } from "next-auth";

interface PUser { id: string; name: string; image?: string | null; city?: string | null; memberColor: number }
interface Presence { id: string; startDate: string; endDate: string; note?: string | null; availability: "OPEN" | "BUSY"; userId: string; user: PUser }
interface EventLite { id: string; type: string; name: string; whenAt: string; placeName: string; rsvps: { userId: string; status: string }[] }

interface HomeClientProps {
  session: Session;
  presences: Presence[];
  myPresencesWithOverlaps: Array<Presence & { overlaps: Presence[] }>;
  events: EventLite[];
  isPresentToday: boolean;
  isSingleDayToday: boolean;
}

const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS = ["L", "M", "M", "J", "V", "S", "D"];

const pad = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export function HomeClient({ session, presences, myPresencesWithOverlaps, events, isPresentToday, isSingleDayToday }: HomeClientProps) {
  const router = useRouter();
  const me = session.user.id;
  const today = new Date();

  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const dayPresences = selectedDate
    ? presences.filter(p => selectedDate >= dayKey(new Date(p.startDate)) && selectedDate <= dayKey(new Date(p.endDate)))
    : [];
  const dayEvents = selectedDate
    ? events.filter(ev => dayKey(new Date(ev.whenAt)) === selectedDate)
    : [];
  const editingPresence = editingId ? presences.find(p => p.id === editingId) : null;

  function openAddForm(date?: string) { setFormDefaultDate(date); setEditingId(null); setSelectedDate(null); setShowForm(true); }
  function openEditForm(id: string) { setEditingId(id); setSelectedDate(null); setShowForm(true); }

  function shiftMonth(d: number) {
    setCursor(c => {
      let m = c.m + d, y = c.y;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }
      return { y, m };
    });
  }

  return (
    <AppShell>
      <div className="px-[18px] pt-6 pb-2">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="Le Rond Point" className="w-11 h-11 rounded-2xl shadow-sm" />
            <h1 className="text-[23px] font-extrabold tracking-tight leading-none">Le Rond Point</h1>
          </div>
          <Link href="/profile" aria-label="Mon profil">
            <Avatar name={session.user.name ?? ""} image={session.user.image} memberColor={session.user.memberColor} size="md" />
          </Link>
        </div>

        <PushPrompt />

        {/* 1. Je suis au quartier aujourd'hui */}
        <div className="mb-6">
          <TodayPresenceToggle isPresentToday={isPresentToday} isSingleDayToday={isSingleDayToday} />
        </div>

        {/* 2. Calendrier */}
        <div className="card p-4 mb-6">
          <div className="flex items-center justify-between mb-3.5">
            <button onClick={() => shiftMonth(-1)} className="w-[34px] h-[34px] rounded-full bg-surface-raised flex items-center justify-center"><ChevronLeft className="w-[18px] h-[18px] text-muted-foreground" /></button>
            <div className="text-[17px] font-bold tracking-tight">{MONTHS[cursor.m]} {cursor.y}</div>
            <button onClick={() => shiftMonth(1)} className="w-[34px] h-[34px] rounded-full bg-surface-raised flex items-center justify-center"><ChevronRight className="w-[18px] h-[18px] text-muted-foreground" /></button>
          </div>
          <MonthGrid year={cursor.y} month={cursor.m} presences={presences} events={events} me={me} onDayTap={setSelectedDate} />
        </div>

        {/* 3. Qui est là en... */}
        <section className="mb-6">
          <h2 className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted-foreground mb-3">Qui est là en {MONTHS[cursor.m].toLowerCase()}</h2>
          <div className="card p-3.5">
            <Timeline year={cursor.y} month={cursor.m} presences={presences} me={me} onPresenceTap={(p) => p.userId === me ? openEditForm(p.id) : setSelectedDate(dayKey(new Date(p.startDate)))} />
          </div>
        </section>

        {/* 4. Events */}
        {events.length > 0 && (
          <section className="mb-6">
            <h2 className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted-foreground mb-2.5">Prochaines sorties</h2>
            <div className="flex gap-2.5 overflow-x-auto -mx-[18px] px-[18px] no-scrollbar pb-1">
              {events.map(ev => {
                const ty = eventType(ev.type);
                const when = fmtEventWhen(new Date(ev.whenAt));
                const status = ev.rsvps.find(r => r.userId === me)?.status ?? "PENDING";
                const chip = status === "YES" ? { t: "✓ Tu viens", c: "text-available bg-available-light" }
                  : status === "NO" ? { t: "Sans toi", c: "text-destructive bg-destructive/10" }
                  : { t: "À répondre", c: "text-busy bg-busy-light" };
                return (
                  <Link key={ev.id} href={`/sorties/${ev.id}`} className="flex-shrink-0 w-[150px] bg-surface border border-border rounded-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[18px] flex-shrink-0" style={{ background: ty.tint }}>{ty.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate">{ev.name}</div>
                        <div className="text-[11px] text-muted-foreground font-medium mt-0.5">{when.short}</div>
                      </div>
                    </div>
                    <span className={`self-start text-[11px] font-bold px-2.5 py-1 rounded-full ${chip.c}`}>{chip.t}</span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 5. Tes prochaines présences */}
        {myPresencesWithOverlaps.length > 0 && (
          <section className="mb-6">
            <h2 className="text-[11px] font-semibold tracking-[0.07em] uppercase text-muted-foreground mb-2.5">Tes prochaines présences</h2>
            <div className="flex flex-col gap-2.5">
              {myPresencesWithOverlaps.map(mp => {
                const others = Array.from(new Map(mp.overlaps.map(o => [o.userId, o.user])).values());
                return (
                  <div key={mp.id} className="card p-4">
                    <div className="flex items-center justify-between gap-2.5 mb-2.5">
                      <button onClick={() => openEditForm(mp.id)} className="text-left flex-1 min-w-0">
                        <div className="text-[15px] font-bold tracking-tight truncate">{formatDateRange(new Date(mp.startDate), new Date(mp.endDate))}</div>
                        <div className="text-[12px] text-muted-foreground mt-0.5">Ta présence</div>
                      </button>
                      <AvailabilityBadge availability={mp.availability} />
                    </div>
                    {others.length > 0 ? (
                      <div className="flex items-center gap-2.5 bg-surface-raised rounded-xl px-2.5 py-2.5">
                        <div className="flex -space-x-2">
                          {others.slice(0, 4).map(u => (
                            <div key={u.id} className="ring-2 ring-surface rounded-full"><Avatar name={u.name} image={u.image} memberColor={u.memberColor} size="sm" /></div>
                          ))}
                        </div>
                        <span className="text-[13px] text-foreground font-medium flex-1">
                          {others.length === 1 ? `${others[0].name.split(" ")[0]} sera là aussi` : `${others.length} amis seront là en même temps`}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[13px] text-muted-foreground bg-surface-raised rounded-xl px-3 py-2.5">Personne d&apos;autre pour l&apos;instant — ça peut changer !</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          presences={dayPresences}
          events={dayEvents}
          currentUserId={me}
          onClose={() => setSelectedDate(null)}
          onAddPresence={(date) => { setSelectedDate(null); openAddForm(date); }}
          onEditPresence={openEditForm}
        />
      )}

      {showForm && (
        <PresenceForm
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSuccess={refresh}
          defaultDate={formDefaultDate}
          initialData={editingPresence ? {
            id: editingPresence.id,
            startDate: new Date(editingPresence.startDate).toISOString(),
            endDate: new Date(editingPresence.endDate).toISOString(),
            note: editingPresence.note,
            availability: editingPresence.availability,
          } : undefined}
        />
      )}
    </AppShell>
  );
}

// ── Grille mensuelle ──
function MonthGrid({ year, month, presences, events, me, onDayTap }: {
  year: number; month: number; presences: Presence[]; events: EventLite[]; me: string; onDayTap: (key: string) => void;
}) {
  const todayKey = dayKey(new Date());

  // Présences par jour (local)
  const byDay = new Map<string, { count: number; mine: boolean }>();
  for (const p of presences) {
    const cur = new Date(new Date(p.startDate).getFullYear(), new Date(p.startDate).getMonth(), new Date(p.startDate).getDate());
    const end = new Date(p.endDate);
    const endD = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cur <= endD) {
      const k = dayKey(cur);
      const e = byDay.get(k) ?? { count: 0, mine: false };
      e.count++;
      if (p.userId === me) e.mine = true;
      byDay.set(k, e);
      cur.setDate(cur.getDate() + 1);
    }
  }
  // Événements par jour
  const evByDay = new Map<string, string[]>();
  for (const ev of events) {
    const k = dayKey(new Date(ev.whenAt));
    const arr = evByDay.get(k) ?? [];
    arr.push(eventType(ev.type).color);
    evByDay.set(k, arr);
  }

  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7; // lundi = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(startDow).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayMs = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();

  return (
    <div>
      <div className="grid grid-cols-7 text-center mb-1">
        {JOURS.map((j, i) => <div key={i} className="text-[11px] font-semibold text-muted-foreground pb-2">{j}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;
          const k = `${year}-${pad(month + 1)}-${pad(day)}`;
          const info = byDay.get(k);
          const dots = evByDay.get(k);
          const isToday = k === todayKey;
          const isPast = new Date(year, month, day).getTime() < todayMs && !isToday;
          const mine = info?.mine;
          return (
            <button key={idx} onClick={() => onDayTap(k)}
              className={`relative aspect-square rounded-[11px] text-[14.5px] flex items-center justify-center transition-colors ${
                mine ? "bg-primary-light text-primary font-bold border-[1.5px] border-primary"
                : info ? "bg-surface-raised font-medium" : "font-medium"
              } ${isPast ? "opacity-50" : ""} ${isToday && !mine ? "outline outline-2 -outline-offset-2 outline-primary text-primary" : ""}`}>
              {day}
              {info && info.count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center tabular-nums">{info.count}</span>
              )}
              {dots && (
                <span className="absolute bottom-[3px] left-1/2 -translate-x-1/2 flex gap-[2px]">
                  {dots.slice(0, 3).map((c, i) => <span key={i} className="w-1 h-1 rounded-full" style={{ background: c }} />)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Timeline (barres horizontales) ──
function Timeline({ year, month, presences, me, onPresenceTap }: {
  year: number; month: number; presences: Presence[]; me: string; onPresenceTap: (p: Presence) => void;
}) {
  const monthStart = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthEnd = new Date(year, month, daysInMonth);

  const visible = presences.filter(p => new Date(p.startDate) <= monthEnd && new Date(p.endDate) >= monthStart);

  // Regroupe par membre → une seule ligne par user, segments triés
  const byUser = new Map<string, { user: PUser; segments: Presence[] }>();
  for (const p of visible) {
    const entry = byUser.get(p.userId) ?? { user: p.user, segments: [] };
    entry.segments.push(p);
    byUser.set(p.userId, entry);
  }
  const rows = Array.from(byUser.values())
    .map(r => ({ ...r, segments: r.segments.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) }))
    .sort((a, b) => {
      // Moi d'abord, puis par début de la première présence
      if (a.user.id === me) return -1;
      if (b.user.id === me) return 1;
      return new Date(a.segments[0].startDate).getTime() - new Date(b.segments[0].startDate).getTime();
    });

  if (rows.length === 0) {
    return <div className="text-center py-7 text-[13px] text-muted-foreground">Personne au quartier ce mois-ci.</div>;
  }

  return (
    <div className="flex flex-col gap-3.5 pt-1">
      {rows.map(({ user, segments }) => {
        const mine = user.id === me;
        const color = getMemberColor(user.memberColor);
        return (
          <div key={user.id} className="flex items-center gap-2">
            <div className="w-[92px] flex-shrink-0 flex items-center gap-1.5">
              <Avatar name={user.name} image={user.image} memberColor={user.memberColor} size="sm" />
              <span className={`text-[12.5px] truncate ${mine ? "font-bold text-primary" : "font-semibold"}`}>{mine ? "Toi" : user.name.split(" ")[0]}</span>
            </div>
            <div className="relative flex-1 h-[22px] bg-surface-raised rounded-full">
              {segments.map(p => {
                const s = new Date(p.startDate), e = new Date(p.endDate);
                const startDay = s < monthStart ? 1 : s.getDate();
                const endDay = e > monthEnd ? daysInMonth : e.getDate();
                const left = ((startDay - 1) / daysInMonth) * 100;
                const width = ((endDay - startDay + 1) / daysInMonth) * 100;
                const open = p.availability === "OPEN";
                const bg = open ? color : `repeating-linear-gradient(45deg, ${color}, ${color} 4px, ${hexA(color, 0.55)} 4px, ${hexA(color, 0.55)} 9px)`;
                const label = startDay === endDay ? `${startDay}` : `${startDay}–${endDay}`;
                const wide = width > 22;
                return (
                  <button key={p.id} onClick={() => onPresenceTap(p)}
                    className="absolute top-0 bottom-0 rounded-full flex items-center justify-center text-[11px] font-semibold"
                    style={{ left: `${left}%`, width: `${width}%`, minWidth: 22, background: bg }}>
                    {/* Date toujours visible : dans la barre si assez large, sinon en pastille au-dessus */}
                    {wide ? (
                      <span className="truncate px-1 text-white">{label}</span>
                    ) : (
                      <span className="absolute -top-[15px] left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap" style={{ color }}>{label}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
