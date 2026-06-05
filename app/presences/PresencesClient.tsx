"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PresenceCard } from "@/components/presence/PresenceCard";
import { PresenceForm } from "@/components/presence/PresenceForm";
import { Avatar } from "@/components/shared/Avatar";
import { Plus, ChevronDown } from "lucide-react";
import type { Session } from "next-auth";

interface Presence {
  id: string;
  startDate: Date;
  endDate: Date;
  note?: string | null;
  availability: "OPEN" | "BUSY";
  userId: string;
  user: { id: string; name: string; image?: string | null; city?: string | null; memberColor: number };
}

interface PresencesClientProps {
  session: Session;
  presences: Presence[];
  pastPresences: Presence[];
}

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

// Bornes du jour en UTC (présences stockées à minuit UTC)
function todayBoundsUTC() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999));
  return { start, end };
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}
function monthLabel(d: Date): string {
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function PresencesClient({ session, presences, pastPresences }: PresencesClientProps) {
  const router = useRouter();
  const [showPast, setShowPast] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);
  // Filtre par membre : ensemble vide = tout le monde
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());

  const refresh = useCallback(() => router.refresh(), [router]);

  // Membres apparaissant dans les présences (à venir + passées), pour le filtre
  const filterMembers = useMemo(() => {
    const map = new Map<string, Presence["user"]>();
    for (const p of [...presences, ...pastPresences]) {
      if (!map.has(p.userId)) map.set(p.userId, p.user);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [presences, pastPresences]);

  function toggleUser(id: string) {
    setSelectedUserIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const matchesFilter = useCallback(
    (p: Presence) => selectedUserIds.size === 0 || selectedUserIds.has(p.userId),
    [selectedUserIds]
  );

  // Présences à venir filtrées, séparées : aujourd'hui vs groupées par mois
  const { todayPresences, monthGroups } = useMemo(() => {
    const { start, end } = todayBoundsUTC();
    const filtered = presences.filter(matchesFilter);

    const today: Presence[] = [];
    const rest: Presence[] = [];
    for (const p of filtered) {
      const s = new Date(p.startDate);
      const e = new Date(p.endDate);
      if (s <= end && e >= start) today.push(p);
      else rest.push(p);
    }

    const groups: { key: string; label: string; items: Presence[] }[] = [];
    for (const p of rest) {
      const key = monthKey(new Date(p.startDate));
      let g = groups.find(x => x.key === key);
      if (!g) {
        g = { key, label: monthLabel(new Date(p.startDate)), items: [] };
        groups.push(g);
      }
      g.items.push(p);
    }
    return { todayPresences: today, monthGroups: groups };
  }, [presences, matchesFilter]);

  const filteredPast = pastPresences.filter(matchesFilter);
  const hasUpcoming = todayPresences.length > 0 || monthGroups.length > 0;

  function handleDelete(id: string) {
    if (!confirm("Supprimer cette présence ?")) return;
    fetch(`/api/presences/${id}`, { method: "DELETE" }).then(refresh);
  }

  function handleEdit(id: string) {
    const p = [...presences, ...pastPresences].find(x => x.id === id);
    if (p) { setEditingPresence(p); setShowForm(true); }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-heading-1 mb-4">Présences</h1>

        {/* Filtre par membre */}
        {filterMembers.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 mb-4 no-scrollbar">
            <button
              onClick={() => setSelectedUserIds(new Set())}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedUserIds.size === 0 ? "bg-primary text-white" : "bg-muted text-muted-foreground"
              }`}
            >
              Tout le monde
            </button>
            {filterMembers.map(m => {
              const active = selectedUserIds.has(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleUser(m.id)}
                  className={`flex-shrink-0 flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    active ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="sm" />
                  {m.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        )}

        {!hasUpcoming ? (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-muted-foreground text-sm">
              {selectedUserIds.size > 0 ? "Aucune présence pour cette sélection." : "Aucune présence à venir."}
            </p>
            {selectedUserIds.size === 0 && (
              <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary font-semibold">
                Ajoute la tienne →
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Aujourd'hui */}
            {todayPresences.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-available animate-pulse" />
                  <h2 className="text-xs font-bold uppercase tracking-wide text-available">Aujourd&apos;hui</h2>
                </div>
                <div className="space-y-3">
                  {todayPresences.map(p => (
                    <PresenceCard
                      key={p.id}
                      presence={p}
                      currentUserId={session.user.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Groupes par mois */}
            {monthGroups.map(g => (
              <section key={g.key}>
                <h2 className="text-label mb-3">{g.label}</h2>
                <div className="space-y-3">
                  {g.items.map(p => (
                    <PresenceCard
                      key={p.id}
                      presence={p}
                      currentUserId={session.user.id}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Anciennes présences */}
        {filteredPast.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowPast(v => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
              Voir les anciennes ({filteredPast.length})
            </button>
            {showPast && (
              <div className="mt-3 space-y-3">
                {filteredPast.map(p => (
                  <PresenceCard
                    key={p.id}
                    presence={p}
                    currentUserId={session.user.id}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => { setEditingPresence(null); setShowForm(true); }}>
        <Plus className="w-7 h-7" />
      </button>

      {showForm && (
        <PresenceForm
          onClose={() => { setShowForm(false); setEditingPresence(null); }}
          onSuccess={refresh}
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
