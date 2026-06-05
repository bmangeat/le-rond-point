"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PresenceCard } from "@/components/presence/PresenceCard";
import { PresenceForm } from "@/components/presence/PresenceForm";
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

export function PresencesClient({ session, presences, pastPresences }: PresencesClientProps) {
  const router = useRouter();
  const [showPast, setShowPast] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingPresence, setEditingPresence] = useState<Presence | null>(null);

  const refresh = useCallback(() => router.refresh(), [router]);

  async function handleDelete(id: string) {
    if (!confirm("Supprimer cette présence ?")) return;
    await fetch(`/api/presences/${id}`, { method: "DELETE" });
    refresh();
  }

  function handleEdit(id: string) {
    const p = [...presences, ...pastPresences].find(x => x.id === id);
    if (p) { setEditingPresence(p); setShowForm(true); }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-heading-1 mb-5">Présences</h1>

        {presences.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-muted-foreground text-sm">Aucune présence à venir.</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-sm text-primary font-semibold">
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
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Anciennes présences */}
        {pastPresences.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowPast(v => !v)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
              Voir les anciennes ({pastPresences.length})
            </button>
            {showPast && (
              <div className="mt-3 space-y-3">
                {pastPresences.map(p => (
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
