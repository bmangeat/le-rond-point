"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PresenceFormProps {
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    startDate: string;
    endDate: string;
    note?: string | null;
    availability: "OPEN" | "BUSY";
  };
  defaultDate?: string; // YYYY-MM-DD
}

export function PresenceForm({ onClose, onSuccess, initialData, defaultDate }: PresenceFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(
    initialData?.startDate.split("T")[0] ?? defaultDate ?? today
  );
  const [endDate, setEndDate] = useState(
    initialData?.endDate.split("T")[0] ?? defaultDate ?? today
  );
  const [note, setNote] = useState(initialData?.note ?? "");
  const [availability, setAvailability] = useState<"OPEN" | "BUSY">(
    initialData?.availability ?? "OPEN"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!initialData;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (endDate < startDate) {
      setError("La date de fin doit être après la date de début.");
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/api/presences/${initialData.id}` : "/api/presences";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, note: note || null, availability }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erreur lors de la sauvegarde");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="sheet-backdrop animate-fade-in" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-4">
          <h2 className="text-heading-2">
            {isEdit ? "Modifier la présence" : "Ajouter une présence"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 space-y-4">
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-label block mb-1.5">Arrivée</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-label block mb-1.5">Départ</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Disponibilité */}
          <div>
            <label className="text-label block mb-2">Disponibilité</label>
            <div className="grid grid-cols-2 gap-2">
              {(["OPEN", "BUSY"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAvailability(val)}
                  className={cn(
                    "px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all text-left",
                    availability === val
                      ? val === "OPEN"
                        ? "border-available bg-available-light text-available"
                        : "border-busy bg-busy-light text-busy"
                      : "border-border text-muted-foreground hover:border-border/80"
                  )}
                >
                  {val === "OPEN" ? (
                    <><span className="block font-semibold">Ouvert</span><span className="text-xs opacity-80">Dispo pour se voir</span></>
                  ) : (
                    <><span className="block font-semibold">Passage rapide</span><span className="text-xs opacity-80">Peu disponible</span></>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-label block mb-1.5">
              Note <span className="normal-case font-normal text-muted-foreground">(optionnel)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={2}
              placeholder="Ex : retour pour les fêtes, dispo le soir…"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-surface text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
            <p className="text-caption text-right mt-1">{note.length}/200</p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-primary active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {loading ? "Sauvegarde…" : isEdit ? "Enregistrer les modifications" : "Ajouter ma présence"}
          </button>
        </form>
      </div>
    </>
  );
}
