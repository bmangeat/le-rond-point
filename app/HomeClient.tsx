"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { DayDetailSheet } from "@/components/calendar/DayDetailSheet";
import { PresenceForm } from "@/components/presence/PresenceForm";
import { PresenceCard } from "@/components/presence/PresenceCard";
import { TodayPresenceToggle } from "@/components/presence/TodayPresenceToggle";
import { Avatar } from "@/components/shared/Avatar";
import { formatDateRange } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { Session } from "next-auth";

interface HomeClientProps {
  session: Session;
  presenceDays: Array<{
    date: string;
    count: number;
    isMine: boolean;
    users: Array<{ id: string; name: string; memberColor: number }>;
  }>;
  presences: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    note?: string | null;
    availability: "OPEN" | "BUSY";
    userId: string;
    user: { id: string; name: string; image?: string | null; city?: string | null; memberColor: number };
  }>;
  myPresencesWithOverlaps: Array<{
    id: string;
    startDate: Date;
    endDate: Date;
    note?: string | null;
    availability: "OPEN" | "BUSY";
    overlaps: Array<{
      user: { id: string; name: string; image?: string | null; memberColor: number };
    }>;
  }>;
  isPresentToday: boolean;
  isSingleDayToday: boolean;
}

export function HomeClient({ session, presenceDays, presences, myPresencesWithOverlaps, isPresentToday, isSingleDayToday }: HomeClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formDefaultDate, setFormDefaultDate] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  const dayPresences = selectedDate
    ? presences.filter(p => {
        const start = new Date(p.startDate).toISOString().split("T")[0];
        const end = new Date(p.endDate).toISOString().split("T")[0];
        return selectedDate >= start && selectedDate <= end;
      })
    : [];

  const editingPresence = editingId
    ? presences.find(p => p.id === editingId)
    : null;

  function openAddForm(date?: string) {
    setFormDefaultDate(date);
    setEditingId(null);
    setSelectedDate(null);
    setShowForm(true);
  }

  function openEditForm(id: string) {
    setEditingId(id);
    setSelectedDate(null);
    setShowForm(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette présence ?")) return;
    await fetch(`/api/presences/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="Le Rond Point" className="w-9 h-9 rounded-xl shadow-sm" />
            <h1 className="text-heading-1">Le Rond Point</h1>
          </div>
          <Avatar
            name={session.user.name ?? ""}
            image={session.user.image}
            memberColor={session.user.memberColor}
            size="md"
          />
        </div>

        {/* Présence du jour */}
        <TodayPresenceToggle
          isPresentToday={isPresentToday}
          isSingleDayToday={isSingleDayToday}
        />

        {/* Calendrier */}
        <MonthCalendar
          presenceDays={presenceDays}
          onDayClick={setSelectedDate}
          currentUserId={session.user.id}
        />

        {/* Mes prochaines présences + chevauchements */}
        {myPresencesWithOverlaps.length > 0 && (
          <section>
            <h2 className="text-label mb-3">Mes prochaines présences</h2>
            <div className="space-y-3">
              {myPresencesWithOverlaps.map(mp => (
                <div key={mp.id} className="card space-y-2">
                  <p className="text-body-strong font-semibold">
                    {formatDateRange(new Date(mp.startDate), new Date(mp.endDate))}
                  </p>
                  {mp.overlaps.length > 0 ? (
                    <div>
                      <p className="text-caption mb-1.5">En même temps que toi :</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {mp.overlaps.map(o => (
                          <div key={o.user.id} className="flex items-center gap-1.5 bg-primary/5 rounded-full px-2 py-1">
                            <Avatar name={o.user.name} image={o.user.image} memberColor={o.user.memberColor} size="sm" />
                            <span className="text-xs font-medium text-foreground">{o.user.name.split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-caption">Personne d&apos;autre pour l&apos;instant — ça peut changer !</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Toutes les présences */}
        <section>
          <h2 className="text-label mb-3">Présences à venir</h2>
          {presences.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-2xl mb-2">🏘️</p>
              <p className="text-muted-foreground text-sm">Personne n&apos;a encore ajouté de présence.</p>
              <button
                onClick={() => openAddForm()}
                className="mt-3 text-sm text-primary font-semibold"
              >
                Ajoute la tienne →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {presences.map(p => (
                <PresenceCard
                  key={p.id}
                  presence={p}
                  currentUserId={session.user.id}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => openAddForm()}>
        <Plus className="w-7 h-7" />
      </button>

      {/* Day detail sheet */}
      {selectedDate && (
        <DayDetailSheet
          date={selectedDate}
          presences={dayPresences}
          currentUserId={session.user.id}
          onClose={() => setSelectedDate(null)}
          onAddPresence={(date) => { setSelectedDate(null); openAddForm(date); }}
          onEditPresence={openEditForm}
        />
      )}

      {/* Presence form sheet */}
      {showForm && (
        <PresenceForm
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSuccess={refresh}
          defaultDate={formDefaultDate}
          initialData={editingPresence ? {
            id: editingPresence.id,
            startDate: editingPresence.startDate.toISOString(),
            endDate: editingPresence.endDate.toISOString(),
            note: editingPresence.note,
            availability: editingPresence.availability,
          } : undefined}
        />
      )}
    </AppShell>
  );
}
