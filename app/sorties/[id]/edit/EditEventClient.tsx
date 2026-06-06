"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EVENT_TYPES, EVENT_TYPE_ORDER, EventTypeKey, fmtEventWhen } from "@/lib/events";
import { X, Search, MapPin, Clock, Check } from "lucide-react";

const PLACE_SUGGESTIONS = [
  { name: "Le Hopper", addr: "8 rue Oberkampf, 75011 Paris" },
  { name: "Le Comptoir Général", addr: "80 quai de Jemmapes, 75010 Paris" },
  { name: "Chez Max", addr: "12 rue des Lilas, 75011 Paris" },
  { name: "Parc des Buttes-Chaumont", addr: "1 rue Botzaris, 75019 Paris" },
  { name: "La Bellevilloise", addr: "19 rue Boyer, 75020 Paris" },
];

interface Place { name: string; addr: string | null }
interface EventData {
  id: string; type: string; name: string; description?: string | null; whenAt: string;
  placeName: string; placeAddr?: string | null; tricountEnabled: boolean; playlistUrl?: string | null;
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EditEventClient({ event }: { event: EventData }) {
  const router = useRouter();
  const [type, setType] = useState<EventTypeKey>(event.type as EventTypeKey);
  const [name, setName] = useState(event.name);
  const [desc, setDesc] = useState(event.description ?? "");
  const [when, setWhen] = useState(toLocalInput(event.whenAt));
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>({ name: event.placeName, addr: event.placeAddr ?? null });
  const [tricount, setTricount] = useState(event.tricountEnabled);
  const [playlistUrl, setPlaylistUrl] = useState(event.playlistUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = EVENT_TYPES[type];
  const accent = meta.color;
  const logKind = meta.logistics;

  const placeResults = query.trim().length > 1
    ? PLACE_SUGGESTIONS.filter(p => (p.name + " " + p.addr).toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  const canSave = !!name.trim() && !!when && !!place && !saving;
  const fmtWhen = when ? fmtEventWhen(new Date(when)) : null;
  const inputCls = "w-full box-border px-3.5 py-3 rounded-2xl border-[1.5px] border-border bg-surface text-[15.5px] text-foreground outline-none transition focus:border-primary placeholder:text-muted-foreground/70";

  async function save() {
    if (!canSave || !place) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, name, description: desc, when: new Date(when).toISOString(),
          placeName: place.name, placeAddr: place.addr, tricountEnabled: tricount,
          hasPlaylist: (type === "SOIREE" || type === "SORTIE") && !!playlistUrl.trim(),
          playlistUrl: playlistUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/sorties/${event.id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 border-b border-border">
        <button onClick={() => router.push(`/sorties/${event.id}`)} aria-label="Fermer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight">Modifier la sortie</h1>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-32 pt-2">
        <h2 className="text-[17px] font-bold mt-5 mb-3">Type</h2>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pt-2 pb-2 no-scrollbar">
          {EVENT_TYPE_ORDER.map(k => {
            const t = EVENT_TYPES[k]; const on = type === k;
            return (
              <button key={k} onClick={() => setType(k)} className="flex-shrink-0 w-[92px] py-3.5 px-2 rounded-[18px] border-2 flex flex-col items-center gap-1.5 transition-all"
                style={{ borderColor: on ? t.color : "#E2E8F0", background: on ? t.tint : "#FFFFFF", transform: on ? "translateY(-2px)" : "none" }}>
                <span className="text-[30px] leading-none">{t.emoji}</span>
                <span className="text-[12.5px] font-semibold text-center leading-tight" style={{ color: on ? t.color : "#64748B" }}>{t.short}</span>
              </button>
            );
          })}
        </div>

        <h2 className="text-[17px] font-bold mt-6 mb-3">Nom de la sortie</h2>
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Barbecue chez Max…" />
        <textarea className={`${inputCls} mt-2.5 resize-none leading-relaxed`} value={desc} onChange={e => setDesc(e.target.value)} rows={2} maxLength={500} placeholder="Une note pour le groupe ? (optionnel)" />

        <h2 className="text-[17px] font-bold mt-6 mb-3">Quand ?</h2>
        <input className={inputCls} type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
        {fmtWhen && <div className="flex items-center gap-1.5 text-[13px] font-semibold mt-2" style={{ color: accent }}><Clock className="w-4 h-4" /> {fmtWhen.day} à {fmtWhen.time}</div>}

        <h2 className="text-[17px] font-bold mt-6 mb-3">Où ?</h2>
        {place ? (
          <div className="flex items-center gap-3 rounded-2xl border-[1.5px] px-3.5 py-3 bg-surface" style={{ borderColor: accent }}>
            <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: accent }} />
            <div className="flex-1 min-w-0">
              <p className="text-[14.5px] font-semibold truncate">{place.name}</p>
              {place.addr && <p className="text-caption truncate">{place.addr}</p>}
            </div>
            <button onClick={() => { setPlace(null); setQuery(""); }} className="text-primary text-[13px] font-semibold flex-shrink-0">Changer</button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2.5 rounded-2xl border-[1.5px] border-border bg-surface px-3.5">
              <Search className="w-[18px] h-[18px] text-muted-foreground flex-shrink-0" />
              <input className="flex-1 min-w-0 bg-transparent outline-none py-3 text-[15.5px]" value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher un lieu, une adresse…" />
            </div>
            {query.trim().length > 1 && (
              <div className="mt-2 rounded-2xl border border-border bg-surface overflow-hidden">
                {placeResults.map((p, i) => (
                  <button key={p.name} onClick={() => { setPlace(p); setQuery(""); }} className={`flex items-center gap-2.5 w-full text-left px-3.5 py-3 ${i ? "border-t border-border" : ""}`}>
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="min-w-0"><span className="block text-[14px] font-semibold">{p.name}</span><span className="block text-caption truncate">{p.addr}</span></span>
                  </button>
                ))}
                <button onClick={() => { setPlace({ name: query.trim(), addr: null }); setQuery(""); }} className={`flex items-center gap-2.5 w-full text-left px-3.5 py-3 ${placeResults.length ? "border-t border-border" : ""}`}>
                  <span className="text-[14px] font-medium text-primary truncate">Utiliser « {query.trim()} »</span>
                </button>
              </div>
            )}
          </div>
        )}

        {logKind === "tricount" && (
          <div>
            <h2 className="text-[17px] font-bold mt-6 mb-3">Dépenses</h2>
            <button onClick={() => setTricount(v => !v)} className="flex items-center gap-3 w-full text-left rounded-2xl border-[1.5px] px-3.5 py-3.5 bg-surface" style={{ borderColor: tricount ? accent : "#E2E8F0" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: `${accent}1f` }}>💸</div>
              <div className="flex-1 min-w-0"><p className="text-[15px] font-semibold">Suivi des dépenses</p><p className="text-caption">Façon Tricount</p></div>
              <span className="relative w-[50px] h-[30px] rounded-full flex-shrink-0 transition-colors" style={{ background: tricount ? accent : "#E2E8F0" }}>
                <span className={`absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all ${tricount ? "left-[23px]" : "left-[3px]"}`} />
              </span>
            </button>
          </div>
        )}

        {(type === "SOIREE" || type === "SORTIE") && (
          <div>
            <h2 className="text-[17px] font-bold mt-6 mb-1">Playlist</h2>
            <p className="text-caption mb-3">Lien d&apos;une playlist collaborative. Optionnel.</p>
            <input className={inputCls} type="url" inputMode="url" value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/…" />
          </div>
        )}

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-4">{error}</p>}
      </div>

      <div className="flex-shrink-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border bg-surface">
        <button onClick={save} disabled={!canSave} className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 transition disabled:opacity-60"
          style={{ background: canSave ? accent : "#E2E8F0", boxShadow: canSave ? `0 6px 18px ${accent}52` : "none" }}>
          <Check className="w-5 h-5" /> {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
