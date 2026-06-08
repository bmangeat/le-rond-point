"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupId } from "@/lib/use-group";
import { EVENT_TYPES, EVENT_TYPE_ORDER, EventTypeKey, fmtEventWhen } from "@/lib/events";
import { X, Search, MapPin, Clock, Plus, Rocket } from "lucide-react";

const PLACE_SUGGESTIONS = [
  { name: "Le Hopper", addr: "8 rue Oberkampf, 75011 Paris" },
  { name: "Le Comptoir Général", addr: "80 quai de Jemmapes, 75010 Paris" },
  { name: "Chez Max", addr: "12 rue des Lilas, 75011 Paris" },
  { name: "Parc des Buttes-Chaumont", addr: "1 rue Botzaris, 75019 Paris" },
  { name: "La Bellevilloise", addr: "19 rue Boyer, 75020 Paris" },
];
const NEEDS_SUGGESTIONS = ["Bière", "Chips", "Glace", "Pain", "Dessert", "Boissons soft", "Charbon"];

interface Place { name: string; addr: string | null }

function pad(n: number) { return String(n).padStart(2, "0"); }
function localDt(d: Date, h: number, m = 0): string {
  d = new Date(d);
  d.setHours(h, m, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateEventClient() {
  const router = useRouter();
  const g = useGroupId();
  const [type, setType] = useState<EventTypeKey | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [when, setWhen] = useState("");
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState<Place | null>(null);
  const [needs, setNeeds] = useState<string[]>([]);
  const [needInput, setNeedInput] = useState("");
  const [needsEnabled, setNeedsEnabled] = useState(false);
  const [tricount, setTricount] = useState(true);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = type ? EVENT_TYPES[type] : null;
  const accent = meta?.color ?? "#3B7BF8";
  const canNeeds = type === "SOIREE" || type === "SORTIE";

  // Sélection d'un type → défauts de logistique cohérents (modifiables ensuite)
  function selectType(k: EventTypeKey) {
    setType(k);
    const soiree = k === "SOIREE" || k === "SORTIE";
    setNeedsEnabled(soiree);   // soirée/sortie : liste activée par défaut
    setTricount(!soiree);      // bar/resto : tricount activé par défaut
  }

  const today = new Date();
  const sat = (() => { const d = new Date(today); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d; })();
  const quickDates = [
    { label: "Ce soir", val: localDt(today, 20) },
    { label: "Demain soir", val: localDt(new Date(today.getTime() + 86400000), 20) },
    { label: "Ce week-end", val: localDt(sat, 14) },
  ];

  const placeResults = query.trim().length > 1
    ? PLACE_SUGGESTIONS.filter(p => (p.name + " " + p.addr).toLowerCase().includes(query.toLowerCase())).slice(0, 4)
    : [];

  function addNeed(label: string) {
    const t = label.trim();
    if (!t) return;
    setNeeds(n => [...n, t]);
    setNeedInput("");
  }

  const canSubmit = !!type && !!name.trim() && !!when && !!place && !submitting;
  const fmtWhen = when ? fmtEventWhen(new Date(when)) : null;

  async function submit() {
    if (!canSubmit || !place) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          name,
          description: desc,
          when: new Date(when).toISOString(),
          placeName: place.name,
          placeAddr: place.addr,
          needs: canNeeds && needsEnabled ? needs : [],
          needsEnabled: canNeeds && needsEnabled,
          tricountEnabled: tricount,
          hasPlaylist: (type === "SOIREE" || type === "SORTIE") && !!playlistUrl.trim(),
          playlistUrl: playlistUrl.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/${g}/sorties/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
      setSubmitting(false);
    }
  }

  const inputCls = "w-full box-border px-3.5 py-3 rounded-2xl border-[1.5px] border-border bg-surface text-[15.5px] text-foreground outline-none transition focus:border-primary placeholder:text-muted-foreground/70";

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-3 border-b border-border">
        <button onClick={() => router.push(`/${g}/sorties`)} aria-label="Fermer" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
        <h1 className="text-[19px] font-bold tracking-tight">Nouvelle sortie</h1>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-32 pt-2">
        {/* Type */}
        <h2 className="text-[17px] font-bold mt-5 mb-1">C&apos;est quoi le plan ?</h2>
        <p className="text-caption mb-3">On adapte la suite selon ce que tu choisis</p>
        <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pt-2 pb-2 no-scrollbar">
          {EVENT_TYPE_ORDER.map(k => {
            const t = EVENT_TYPES[k];
            const on = type === k;
            return (
              <button
                key={k}
                onClick={() => selectType(k)}
                className="flex-shrink-0 w-[92px] py-3.5 px-2 rounded-[18px] border-2 flex flex-col items-center gap-1.5 transition-all"
                style={{
                  borderColor: on ? t.color : "#E2E8F0",
                  background: on ? t.tint : "#FFFFFF",
                  transform: on ? "translateY(-2px)" : "none",
                }}
              >
                <span className="text-[30px] leading-none">{t.emoji}</span>
                <span className="text-[12.5px] font-semibold text-center leading-tight" style={{ color: on ? t.color : "#64748B" }}>{t.short}</span>
              </button>
            );
          })}
        </div>

        {/* Nom + note */}
        <h2 className="text-[17px] font-bold mt-6 mb-3">Nom de la sortie</h2>
        <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Barbecue chez Max, Anniv de Julie…" />
        <textarea className={`${inputCls} mt-2.5 resize-none leading-relaxed`} value={desc} onChange={e => setDesc(e.target.value)} rows={2} maxLength={500} placeholder="Une note pour le groupe ? (optionnel)" />

        {/* Quand */}
        <h2 className="text-[17px] font-bold mt-6 mb-3">Quand ?</h2>
        <div className="flex gap-2 flex-wrap mb-2.5">
          {quickDates.map(q => {
            const on = when === q.val;
            return (
              <button
                key={q.label}
                onClick={() => setWhen(q.val)}
                className="px-3.5 py-2 rounded-full text-[13.5px] font-semibold border-[1.5px] transition-colors"
                style={{
                  borderColor: on ? accent : "#E2E8F0",
                  background: on ? `${accent}1a` : "#FFFFFF",
                  color: on ? accent : "#64748B",
                }}
              >{q.label}</button>
            );
          })}
        </div>
        <input className={inputCls} type="datetime-local" value={when} onChange={e => setWhen(e.target.value)} />
        {fmtWhen && (
          <div className="flex items-center gap-1.5 text-[13px] font-semibold mt-2" style={{ color: accent }}>
            <Clock className="w-4 h-4" /> {fmtWhen.day} à {fmtWhen.time}
          </div>
        )}

        {/* Où */}
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
              <input
                className="flex-1 min-w-0 bg-transparent outline-none py-3 text-[15.5px]"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Rechercher un lieu, une adresse…"
              />
            </div>
            {(placeResults.length > 0 || query.trim().length > 1) && (
              <div className="mt-2 rounded-2xl border border-border bg-surface overflow-hidden">
                {placeResults.map((p, i) => (
                  <button key={p.name} onClick={() => { setPlace(p); setQuery(""); }} className={`flex items-center gap-2.5 w-full text-left px-3.5 py-3 ${i ? "border-t border-border" : ""}`}>
                    <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="min-w-0">
                      <span className="block text-[14px] font-semibold">{p.name}</span>
                      <span className="block text-caption truncate">{p.addr}</span>
                    </span>
                  </button>
                ))}
                {query.trim().length > 1 && (
                  <button onClick={() => { setPlace({ name: query.trim(), addr: null }); setQuery(""); }} className={`flex items-center gap-2.5 w-full text-left px-3.5 py-3 ${placeResults.length ? "border-t border-border" : ""}`}>
                    <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-[14px] font-medium text-primary truncate">Utiliser « {query.trim()} »</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Logistique : liste à apporter et/ou tricount (combinables pour soirée/sortie) */}
        {type && (
          <div>
            <h2 className="text-[17px] font-bold mt-6 mb-3">Logistique</h2>

            {/* Liste de choses à apporter (soirée / sortie uniquement) */}
            {canNeeds && (
              <>
                <button onClick={() => setNeedsEnabled(v => !v)} className="flex items-center gap-3 w-full text-left rounded-2xl border-[1.5px] px-3.5 py-3.5 bg-surface" style={{ borderColor: needsEnabled ? accent : "#E2E8F0" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: `${accent}1f` }}>🎒</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-semibold">Liste de choses à apporter</p>
                    <p className="text-caption">Qui ramène quoi — chacun se positionne</p>
                  </div>
                  <span className="relative w-[50px] h-[30px] rounded-full flex-shrink-0 transition-colors" style={{ background: needsEnabled ? accent : "#E2E8F0" }}>
                    <span className={`absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all ${needsEnabled ? "left-[23px]" : "left-[3px]"}`} />
                  </span>
                </button>

                {needsEnabled && (
                  <div className="mt-3">
                    <div className="flex flex-col gap-2">
                      {needs.map((n, i) => (
                        <div key={i} className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-3 py-2.5">
                          <span className="w-[7px] h-[7px] rounded-full flex-shrink-0" style={{ background: accent }} />
                          <span className="flex-1 text-[14.5px] font-medium">{n}</span>
                          <button onClick={() => setNeeds(arr => arr.filter((_, j) => j !== i))} className="text-muted-foreground flex-shrink-0"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                    <div className={`flex gap-2 ${needs.length ? "mt-2.5" : ""}`}>
                      <input className={`${inputCls} flex-1`} value={needInput} onChange={e => setNeedInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addNeed(needInput)} placeholder="Ajouter un élément…" />
                      <button onClick={() => addNeed(needInput)} className="w-[50px] rounded-2xl text-white flex items-center justify-center flex-shrink-0" style={{ background: accent }}><Plus className="w-5 h-5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {NEEDS_SUGGESTIONS.filter(s => !needs.some(n => n.toLowerCase() === s.toLowerCase())).map(s => (
                        <button key={s} onClick={() => addNeed(s)} className="px-3 py-1.5 rounded-full border border-dashed border-border bg-surface text-[12.5px] font-medium text-muted-foreground">+ {s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Tricount (tous les types) */}
            <button onClick={() => setTricount(v => !v)} className={`flex items-center gap-3 w-full text-left rounded-2xl border-[1.5px] px-3.5 py-3.5 bg-surface ${canNeeds ? "mt-2.5" : ""}`} style={{ borderColor: tricount ? accent : "#E2E8F0" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-xl" style={{ background: `${accent}1f` }}>💸</div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold">Suivi des dépenses</p>
                <p className="text-caption">Façon Tricount — qui doit combien à qui</p>
              </div>
              <span className="relative w-[50px] h-[30px] rounded-full flex-shrink-0 transition-colors" style={{ background: tricount ? accent : "#E2E8F0" }}>
                <span className={`absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all ${tricount ? "left-[23px]" : "left-[3px]"}`} />
              </span>
            </button>
          </div>
        )}

        {(type === "SOIREE" || type === "SORTIE") && (
          <div>
            <h2 className="text-[17px] font-bold mt-6 mb-1">Playlist</h2>
            <p className="text-caption mb-3">Un lien vers une playlist collaborative (Spotify, Deezer…). Optionnel.</p>
            <input className={inputCls} type="url" inputMode="url" value={playlistUrl} onChange={e => setPlaylistUrl(e.target.value)} placeholder="https://open.spotify.com/playlist/…" />
          </div>
        )}

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-4">{error}</p>}
      </div>

      {/* CTA fixe */}
      <div className="flex-shrink-0 px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-border bg-surface">
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full py-4 rounded-2xl text-white font-bold text-[16px] flex items-center justify-center gap-2 transition disabled:opacity-60"
          style={{ background: canSubmit ? accent : "#E2E8F0", boxShadow: canSubmit ? `0 6px 18px ${accent}52` : "none" }}
        >
          <Rocket className="w-5 h-5" /> {submitting ? "Envoi…" : "Balancer l'invitation"}
        </button>
        {!canSubmit && !submitting && (
          <p className="text-center text-[11.5px] text-muted-foreground mt-2">Choisis un type, un nom, une date et un lieu</p>
        )}
      </div>
    </div>
  );
}
