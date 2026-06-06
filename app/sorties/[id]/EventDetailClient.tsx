"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { Avatar } from "@/components/shared/Avatar";
import { EventGlyph } from "@/components/events/EventGlyph";
import { eventType, fmtEventWhen, rsvpCounts, tricountBalances, fmtMoney, mapsUrl, RsvpStatus } from "@/lib/events";
import { ChevronLeft, Clock, MapPin, Navigation, Plus, Send, Check, X, Music2, Camera, Loader2 } from "lucide-react";

interface Member { id: string; name: string; image?: string | null; memberColor: number; city?: string | null }
interface EventData {
  id: string; type: string; name: string; description?: string | null; whenAt: string;
  placeName: string; placeAddr?: string | null; hostId: string;
  logisticsKind: string; tricountEnabled: boolean; hasPlaylist: boolean; playlistUrl?: string | null;
  rsvps: { userId: string; status: string }[];
  needs: { id: string; label: string; claimedById: string | null }[];
  expenses: { id: string; payerId: string; label: string; amount: number; forUserIds: string[] }[];
  comments: { id: string; authorId: string; text: string; createdAt: string }[];
  photos: { id: string; uploaderId: string; url: string; createdAt: string }[];
}

type Tab = "people" | "logistics" | "life";

export function EventDetailClient({ event, members, currentUserId }: { event: EventData; members: Member[]; currentUserId: string }) {
  const router = useRouter();
  const ty = eventType(event.type);
  const accent = ty.color;
  const me = currentUserId;
  const when = fmtEventWhen(new Date(event.whenAt));
  const memberMap = useMemo(() => new Map(members.map(m => [m.id, m])), [members]);
  const host = memberMap.get(event.hostId);

  const [tab, setTab] = useState<Tab>("people");
  const [busy, setBusy] = useState(false);
  // Copie locale mutable : mise à jour optimiste (évite router.refresh qui
  // réinitialiserait l'onglet actif à chaque action).
  const [ev, setEv] = useState<EventData>(event);

  const post = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch(`/api/events/${event.id}/actions`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  }, [event.id]);

  const action = useCallback(async (payload: Record<string, unknown>) => {
    const a = payload.action as string;
    setBusy(true);
    try {
      if (a === "rsvp") {
        const status = payload.status as string;
        setEv(e => ({ ...e, rsvps: [...e.rsvps.filter(r => r.userId !== me), { userId: me, status }] }));
        await post(payload);
      } else if (a === "claimNeed") {
        const needId = payload.needId as string;
        setEv(e => ({
          ...e,
          needs: e.needs.map(n => {
            if (n.id !== needId) return n;
            if (!n.claimedById) return { ...n, claimedById: me };
            if (n.claimedById === me) return { ...n, claimedById: null };
            return n;
          }),
        }));
        await post(payload);
      } else if (a === "addNeed") {
        const { need } = await post(payload);
        setEv(e => ({ ...e, needs: [...e.needs, { id: need.id, label: need.label, claimedById: null }] }));
      } else if (a === "addExpense") {
        const { expense } = await post(payload);
        setEv(e => ({ ...e, expenses: [...e.expenses, { id: expense.id, payerId: expense.payerId, label: expense.label, amount: expense.amount, forUserIds: expense.forUserIds }] }));
      } else if (a === "addComment") {
        const { comment } = await post(payload);
        setEv(e => ({ ...e, comments: [...e.comments, { id: comment.id, authorId: comment.authorId, text: comment.text, createdAt: comment.createdAt }] }));
      } else if (a === "setPlaylist") {
        const url = ((payload.url as string) || "").trim() || null;
        setEv(e => ({ ...e, playlistUrl: url, hasPlaylist: !!url }));
        await post(payload);
      } else if (a === "addPhoto") {
        const { photo } = await post(payload);
        setEv(e => ({ ...e, photos: [{ id: photo.id, uploaderId: photo.uploaderId, url: photo.url, createdAt: photo.createdAt }, ...e.photos] }));
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erreur");
      router.refresh(); // resync en cas d'échec
    } finally {
      setBusy(false);
    }
  }, [me, post, router]);

  const statusOf = (userId: string): RsvpStatus =>
    (ev.rsvps.find(r => r.userId === userId)?.status as RsvpStatus) ?? "PENDING";
  const myStatus = statusOf(me);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Topbar */}
      <div className="flex-shrink-0 flex items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <button onClick={() => router.push("/sorties")} aria-label="Retour" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div className="flex-1 text-center text-[13px] text-muted-foreground font-medium mr-9 truncate">
          Organisé par {event.hostId === me ? "toi" : host?.name ?? "?"}
        </div>
      </div>

      {/* En-tête */}
      <div className="flex-shrink-0 px-4 pt-2.5 pb-3">
        <div className="flex items-center gap-3.5 mb-3">
          <EventGlyph type={event.type} size={62} radius={18} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[21px] font-extrabold tracking-tight leading-tight">{event.name}</h1>
            <div className="flex items-center gap-1.5 text-[13.5px] text-muted-foreground font-semibold mt-1">
              <Clock className="w-[15px] h-[15px]" style={{ color: accent }} /> {when.day} · {when.time}
            </div>
          </div>
        </div>
        {event.description && (
          <div className="text-[13.5px] bg-surface-raised rounded-xl px-3 py-2.5 mb-3 leading-relaxed">{event.description}</div>
        )}
        <a href={mapsUrl({ name: event.placeName, addr: event.placeAddr })} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3.5 py-3">
          <div className="w-[38px] h-[38px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}1f` }}>
            <MapPin className="w-[18px] h-[18px]" style={{ color: accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14.5px] font-semibold truncate">{event.placeName}</p>
            {event.placeAddr && <p className="text-caption truncate">{event.placeAddr}</p>}
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold flex-shrink-0" style={{ color: accent }}>
            <Navigation className="w-3.5 h-3.5" /> Y aller
          </span>
        </a>
      </div>

      {/* Onglets */}
      <div className="flex-shrink-0 px-4 pb-2.5">
        <div className="flex gap-1 p-1 bg-surface-raised rounded-2xl">
          {([
            { key: "people", label: "Qui vient" },
            { key: "logistics", label: ty.logistics === "tricount" ? "Dépenses" : "Besoins" },
            { key: "life", label: "Le fil" },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-[13.5px] font-semibold transition-colors ${tab === t.key ? "bg-surface shadow-sm" : "text-muted-foreground"}`}
              style={tab === t.key ? { color: accent } : undefined}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div className="flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        {tab === "people" && (
          <ParticipantsTab event={ev} accent={accent} me={me} myStatus={myStatus} statusOf={statusOf}
            members={members} memberMap={memberMap} busy={busy} action={action} goLogistics={() => setTab("logistics")} />
        )}
        {tab === "logistics" && (
          ty.logistics === "tricount"
            ? <TricountPanel event={ev} accent={accent} me={me} memberMap={memberMap} statusOf={statusOf} busy={busy} action={action} />
            : <NeedsPanel event={ev} accent={accent} me={me} memberMap={memberMap} busy={busy} action={action} />
        )}
        {tab === "life" && <LifeTab event={ev} accent={accent} me={me} memberMap={memberMap} busy={busy} action={action} />}
      </div>
    </div>
  );
}

// ── Onglet 1 : participants ──
function ParticipantsTab({ event, accent, me, myStatus, statusOf, members, memberMap, busy, action, goLogistics }: {
  event: EventData; accent: string; me: string; myStatus: RsvpStatus; statusOf: (id: string) => RsvpStatus;
  members: Member[]; memberMap: Map<string, Member>; busy: boolean; action: (p: Record<string, unknown>) => Promise<void>; goLogistics: () => void;
}) {
  const [alsace, setAlsace] = useState(false);
  const counts = rsvpCounts(members.map(m => ({ status: statusOf(m.id) })));

  async function setStatus(s: RsvpStatus) { await action({ action: "rsvp", status: s }); }
  async function sayYes() { await setStatus("YES"); setTimeout(goLogistics, 250); }

  const groups: { key: RsvpStatus; label: string; color: string }[] = [
    { key: "YES", label: "Présents", color: "#10B981" },
    { key: "PENDING", label: "En attente", color: "#F59E0B" },
    { key: "NO", label: "Absents", color: "#EF4444" },
  ];

  return (
    <div>
      {/* Compteur */}
      <div className="flex items-center bg-surface rounded-2xl border border-border py-3 px-1.5 mt-1">
        {[
          { n: counts.yes, l: "présents", c: "#10B981" },
          { n: counts.no, l: "absents", c: "#EF4444" },
          { n: counts.pending, l: "en attente", c: "#F59E0B" },
        ].map((cell, i) => (
          <div key={cell.l} className="flex-1 flex items-center">
            {i > 0 && <div className="w-px h-7 bg-border" />}
            <div className="flex-1 text-center">
              <div className="text-[20px] font-bold tabular-nums" style={{ color: cell.c }}>{cell.n}</div>
              <div className="text-[11.5px] text-muted-foreground mt-0.5">{cell.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Zone action perso */}
      {myStatus === "PENDING" ? (
        <div className="flex gap-2.5 my-4">
          <button onClick={sayYes} disabled={busy} className="flex-1 py-3.5 rounded-2xl text-white font-bold text-[15.5px] flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "#10B981", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>👍 Je viens</button>
          <button onClick={() => setAlsace(true)} disabled={busy} className="flex-1 py-3.5 rounded-2xl font-bold text-[15.5px] text-muted-foreground bg-surface border-[1.5px] border-border flex items-center justify-center gap-2">👎 Sans moi</button>
        </div>
      ) : (
        <div className="flex items-center gap-3 my-4 px-3.5 py-3 rounded-2xl border"
          style={{ background: myStatus === "YES" ? "#ECFDF5" : "#FEF2F2", borderColor: myStatus === "YES" ? "#10B98140" : "#EF444433" }}>
          <span className="text-[22px]">{myStatus === "YES" ? "🎉" : "😶"}</span>
          <div className="flex-1">
            <div className="text-[14.5px] font-bold" style={{ color: myStatus === "YES" ? "#10B981" : "#EF4444" }}>
              {myStatus === "YES" ? "Tu es de la partie !" : "Tu as décliné"}
            </div>
            <div className="text-[12.5px] text-muted-foreground">{myStatus === "YES" ? "Le groupe a été prévenu." : "Tu peux toujours changer d'avis."}</div>
          </div>
          <button onClick={() => setStatus("PENDING")} className="text-primary text-[13px] font-semibold">Changer</button>
        </div>
      )}

      {/* Listes par statut */}
      <div className="flex flex-col gap-4">
        {groups.map(g => {
          const ids = members.filter(m => statusOf(m.id) === g.key).map(m => m.id);
          if (ids.length === 0) return null;
          return (
            <div key={g.key}>
              <div className="flex items-center gap-1.5 mb-2 px-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: g.color }} />
                <span className="text-[12.5px] font-bold text-muted-foreground">{g.label}</span>
                <span className="text-[12.5px] text-muted-foreground/70">· {ids.length}</span>
              </div>
              <div className="bg-surface rounded-2xl border border-border overflow-hidden">
                {ids.map((u, i) => {
                  const m = memberMap.get(u)!;
                  return (
                    <div key={u} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i ? "border-t border-border" : ""}`}>
                      <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="sm" />
                      <span className="flex-1 text-[14.5px] font-medium">{u === me ? "Toi" : m.name}</span>
                      {u === event.hostId && <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{ color: accent, background: `${accent}1f` }}>HÔTE</span>}
                      {m.city && <span className="text-[12.5px] text-muted-foreground">{m.city}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {alsace && (
        <AlsacePopup
          onYes={() => { setAlsace(false); sayYes(); }}
          onNo={() => { setAlsace(false); setStatus("NO"); }}
          onClose={() => setAlsace(false)}
        />
      )}
    </div>
  );
}

function AlsacePopup({ onYes, onNo, onClose }: { onYes: () => void; onNo: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-[320px] bg-surface rounded-3xl px-6 pt-6 pb-5 text-center shadow-xl">
        <div className="text-5xl mb-3">🥨</div>
        <div className="text-[19px] font-extrabold tracking-tight leading-snug">Tu veux pas venir faire un tour en Alsace…</div>
        <div className="text-[14px] text-muted-foreground mt-2 leading-relaxed">Allez, une tarte flambée et un Riesling et t&apos;as déjà oublié pourquoi tu voulais pas venir.</div>
        <div className="flex flex-col gap-2.5 mt-5">
          <button onClick={onYes} className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px]" style={{ background: "#10B981", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>Bon ok, je viens 🙌</button>
          <button onClick={onNo} className="w-full py-3 rounded-2xl font-semibold text-[14px] text-muted-foreground">Non vraiment, sans moi</button>
        </div>
      </div>
    </div>
  );
}

// ── Onglet 2a : besoins ──
function NeedsPanel({ event, accent, me, memberMap, busy, action }: {
  event: EventData; accent: string; me: string; memberMap: Map<string, Member>; busy: boolean; action: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [input, setInput] = useState("");
  const items = event.needs;
  const done = items.filter(i => i.claimedById).length;

  return (
    <div className="mt-1">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="flex-1 h-2 rounded-full bg-surface-raised overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%`, background: accent }} />
        </div>
        <span className="text-[12.5px] font-semibold text-muted-foreground tabular-nums">{done}/{items.length}</span>
      </div>

      <div className="flex flex-col gap-2">
        {items.map(it => {
          const mine = it.claimedById === me;
          const taken = it.claimedById && !mine;
          const m = it.claimedById ? memberMap.get(it.claimedById) : null;
          return (
            <div key={it.id} className={`flex items-center gap-3 bg-surface rounded-2xl border border-border px-3.5 py-3 ${taken ? "opacity-70" : ""}`}>
              <button onClick={() => !taken && !busy && action({ action: "claimNeed", needId: it.id })}
                className="w-[26px] h-[26px] rounded-full flex-shrink-0 flex items-center justify-center"
                style={{ border: it.claimedById ? "none" : "2px solid #E2E8F0", background: it.claimedById ? (mine ? accent : "#94A3B8") : "transparent" }}>
                {it.claimedById && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-[14.5px] font-medium">{it.label}</div>
                <div className="text-[12px] mt-0.5" style={{ color: mine ? accent : "#94A3B8", fontWeight: mine ? 600 : 400 }}>
                  {mine ? "Tu t'en occupes" : taken ? `Pris par ${m?.name}` : "Personne pour l'instant"}
                </div>
              </div>
              {!it.claimedById && (
                <button onClick={() => !busy && action({ action: "claimNeed", needId: it.id })} className="flex-shrink-0 px-3 py-1.5 rounded-full text-[12.5px] font-semibold" style={{ background: `${accent}1f`, color: accent }}>Je gère</button>
              )}
              {m && <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="sm" />}
            </div>
          );
        })}
        {items.length === 0 && <p className="text-caption text-center py-4">Aucun besoin listé. Ajoute le premier !</p>}
      </div>

      <div className="flex gap-2 mt-3">
        <input className="flex-1 box-border px-3.5 py-3 rounded-2xl border-[1.5px] border-border bg-surface text-[15px] outline-none focus:border-primary"
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && input.trim()) { action({ action: "addNeed", label: input.trim() }); setInput(""); } }}
          placeholder="Ajouter un besoin…" />
        <button onClick={() => { if (input.trim()) { action({ action: "addNeed", label: input.trim() }); setInput(""); } }}
          className="w-[50px] rounded-2xl text-white flex items-center justify-center flex-shrink-0" style={{ background: accent }}><Plus className="w-5 h-5" /></button>
      </div>
    </div>
  );
}

// ── Onglet 2b : tricount ──
function TricountPanel({ event, accent, me, memberMap, statusOf, busy, action }: {
  event: EventData; accent: string; me: string; memberMap: Map<string, Member>; statusOf: (id: string) => RsvpStatus; busy: boolean; action: (p: Record<string, unknown>) => Promise<void>;
}) {
  const expenses = event.expenses;
  const total = expenses.reduce((s, x) => s + x.amount, 0);
  const balances = tricountBalances(expenses);
  const yesIds = event.rsvps.filter(r => r.status === "YES").map(r => r.userId);

  const [showAdd, setShowAdd] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [forIds, setForIds] = useState<string[]>(yesIds);

  const num = parseFloat(amount.replace(",", "."));
  const valid = label.trim() && num > 0 && forIds.length > 0;

  function openAdd() { setLabel(""); setAmount(""); setForIds(yesIds); setShowAdd(true); }
  async function submit() {
    if (!valid) return;
    await action({ action: "addExpense", label: label.trim(), amount: num, forUserIds: forIds });
    setShowAdd(false);
  }

  return (
    <div className="mt-1">
      <div className="text-center bg-surface rounded-2xl border border-border py-5 px-4 mb-3.5">
        <div className="text-[12.5px] text-muted-foreground font-semibold uppercase tracking-wide">Total dépensé</div>
        <div className="text-[34px] font-extrabold tracking-tight mt-1">{fmtMoney(total)}</div>
        <div className="text-[12.5px] text-muted-foreground mt-0.5">{expenses.length} dépense{expenses.length > 1 ? "s" : ""} · {yesIds.length} participants</div>
      </div>

      {expenses.length > 0 && (
        <div className="mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-0.5">Qui doit quoi</div>
          <div className="bg-surface rounded-2xl border border-border overflow-hidden">
            {yesIds.map((u, i) => {
              const m = memberMap.get(u)!; const net = balances[u] || 0;
              const owes = net < -0.005, owed = net > 0.005;
              return (
                <div key={u} className={`flex items-center gap-2.5 px-3.5 py-2.5 ${i ? "border-t border-border" : ""}`}>
                  <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="sm" />
                  <span className="flex-1 text-[14px] font-medium">{u === me ? "Toi" : m.name}</span>
                  <span className="text-[13.5px] font-bold" style={{ color: owes ? "#EF4444" : owed ? "#10B981" : "#94A3B8" }}>
                    {owes ? `doit ${fmtMoney(-net)}` : owed ? `récupère ${fmtMoney(net)}` : "à jour"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {expenses.length > 0 ? (
        <div className="mb-3.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 px-0.5">Dépenses</div>
          <div className="flex flex-col gap-2">
            {expenses.map(x => {
              const m = memberMap.get(x.payerId)!;
              return (
                <div key={x.id} className="flex items-center gap-2.5 bg-surface rounded-2xl border border-border px-3.5 py-2.5">
                  <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold">{x.label}</div>
                    <div className="text-[12px] text-muted-foreground">Payé par {x.payerId === me ? "toi" : m.name} · partagé ×{x.forUserIds.length}</div>
                  </div>
                  <span className="text-[14.5px] font-bold tabular-nums">{fmtMoney(x.amount)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-3 text-muted-foreground"><div className="text-3xl">🧾</div><div className="text-[13.5px] mt-1.5">Aucune dépense pour l&apos;instant.</div></div>
      )}

      {!showAdd ? (
        <button onClick={openAdd} className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2" style={{ background: accent }}>
          <Plus className="w-5 h-5" /> Ajouter une dépense
        </button>
      ) : (
        <div className="bg-surface rounded-2xl border border-border p-3.5">
          <input className="w-full box-border px-3.5 py-3 rounded-xl border-[1.5px] border-border bg-surface text-[15px] outline-none focus:border-primary" value={label} onChange={e => setLabel(e.target.value)} placeholder="Addition, courses, taxi…" />
          <div className="flex items-center gap-1.5 mt-2.5 px-3.5 rounded-xl border-[1.5px] border-border">
            <input type="number" inputMode="decimal" className="flex-1 bg-transparent outline-none py-3 text-[18px] font-bold" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            <span className="text-[18px] font-bold text-muted-foreground">€</span>
          </div>
          <div className="text-[13px] font-semibold mt-3 mb-2">Partagé entre <span className="text-muted-foreground font-normal">({forIds.length})</span></div>
          <div className="flex flex-wrap gap-2">
            {yesIds.map(u => {
              const m = memberMap.get(u)!; const on = forIds.includes(u);
              return (
                <button key={u} onClick={() => setForIds(f => f.includes(u) ? f.filter(x => x !== u) : [...f, u])}
                  className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full text-[13px] font-semibold border-[1.5px]"
                  style={{ borderColor: on ? accent : "#E2E8F0", background: on ? `${accent}1a` : "#FFFFFF", color: on ? accent : "#64748B" }}>
                  <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="sm" /> {u === me ? "Toi" : m.name}
                </button>
              );
            })}
          </div>
          {valid && <div className="text-[12.5px] text-muted-foreground mt-3 text-center">Soit {fmtMoney(num / forIds.length)} par personne</div>}
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl font-semibold text-[14px] text-muted-foreground bg-muted">Annuler</button>
            <button onClick={submit} disabled={!valid || busy} className="flex-1 py-3 rounded-xl text-white font-bold text-[14px] disabled:opacity-50" style={{ background: accent }}>Ajouter</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Onglet 3 : le fil ──
function LifeTab({ event, accent, me, memberMap, busy, action }: {
  event: EventData; accent: string; me: string; memberMap: Map<string, Member>; busy: boolean; action: (p: Record<string, unknown>) => Promise<void>;
}) {
  const [msg, setMsg] = useState("");
  const [plInput, setPlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const isHost = event.hostId === me;
  const canPlaylist = eventType(event.type).logistics === "list"; // soirée / sortie

  function send() {
    const t = msg.trim();
    if (!t) return;
    action({ action: "addComment", text: t });
    setMsg("");
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const blob = await upload(`events/${event.id}/${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: `/api/events/${event.id}/photo`,
      });
      await action({ action: "addPhoto", url: blob.url });
    } catch {
      alert("Échec de l'envoi de la photo. Réessaie.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="mt-1">
      {/* Playlist : affichée seulement si un lien a été ajouté ; sinon l'hôte peut en ajouter un */}
      {event.playlistUrl ? (
        <a href={event.playlistUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-3 bg-surface rounded-2xl border border-border px-3.5 py-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#1DB954] flex items-center justify-center flex-shrink-0"><Music2 className="w-5 h-5 text-white" /></div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold">Playlist de la soirée</div>
            <div className="text-caption truncate">Ajoutez vos sons à la playlist commune</div>
          </div>
          <span className="flex-shrink-0 px-3.5 py-2 rounded-full text-white text-[13px] font-bold bg-[#1DB954]">Ouvrir</span>
        </a>
      ) : canPlaylist && isHost ? (
        <div className="bg-surface rounded-2xl border border-border px-3.5 py-3 mb-4">
          <div className="flex items-center gap-2 mb-2.5">
            <Music2 className="w-4 h-4 text-[#1DB954]" />
            <span className="text-[14px] font-semibold">Ajouter une playlist collaborative</span>
          </div>
          <div className="flex gap-2">
            <input className="flex-1 min-w-0 box-border px-3 py-2.5 rounded-xl border-[1.5px] border-border bg-surface text-[14px] outline-none focus:border-primary"
              type="url" inputMode="url" value={plInput} onChange={e => setPlInput(e.target.value)} placeholder="https://open.spotify.com/playlist/…" />
            <button onClick={() => plInput.trim() && action({ action: "setPlaylist", url: plInput.trim() })} disabled={busy || !plInput.trim()}
              className="px-3.5 rounded-xl text-white font-semibold text-[14px] flex-shrink-0 disabled:opacity-50" style={{ background: accent }}>OK</button>
          </div>
        </div>
      ) : null}

      {/* Photos */}
      <div className="flex items-baseline justify-between mb-2 px-0.5">
        <div className="text-[15px] font-bold">Photos</div>
        <div className="text-[11.5px] text-busy font-semibold whitespace-nowrap">⏳ Suppr. dans 7 jours</div>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        <label className="aspect-square rounded-xl border-[1.5px] border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer"
          style={{ borderColor: `${accent}80`, background: `${accent}0f`, color: accent }}>
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
          <span className="text-[11px] font-semibold">{uploading ? "Envoi…" : "Ajouter"}</span>
          <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
        </label>
        {event.photos.map(p => {
          const m = memberMap.get(p.uploaderId);
          return (
            <div key={p.id} className="relative aspect-square rounded-xl overflow-hidden bg-surface-raised">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute left-1 bottom-1 ring-2 ring-white/80 rounded-full">
                <Avatar name={m?.name ?? "?"} image={m?.image} memberColor={m?.memberColor ?? 1} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Discussion */}
      <div className="text-[15px] font-bold mb-2.5 px-0.5">Discussion</div>
      {event.comments.length === 0 ? (
        <div className="text-center py-2 text-muted-foreground"><div className="text-2xl">💬</div><div className="text-[13px] mt-1">Lance la discussion !</div></div>
      ) : (
        <div className="flex flex-col gap-3.5 mb-3.5">
          {event.comments.map(c => {
            const m = memberMap.get(c.authorId); const mine = c.authorId === me;
            const d = new Date(c.createdAt);
            const time = `${String(d.getHours()).padStart(2, "0")}h${String(d.getMinutes()).padStart(2, "0")}`;
            return (
              <div key={c.id} className="flex gap-2.5 items-start">
                <Avatar name={m?.name ?? "?"} image={m?.image} memberColor={m?.memberColor ?? 1} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-[13.5px] font-semibold">{mine ? "Toi" : m?.name}</span>
                    <span className="text-[11px] text-muted-foreground">{time}</span>
                  </div>
                  <div className="text-[14px] bg-surface-raised rounded-[4px_14px_14px_14px] px-3 py-2 mt-1 leading-relaxed">{c.text}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-2 items-center mt-1">
        <input className="flex-1 box-border px-3.5 py-3 rounded-2xl border-[1.5px] border-border bg-surface text-[15px] outline-none focus:border-primary"
          value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Un mot pour le groupe…" maxLength={500} />
        <button onClick={send} disabled={busy} aria-label="Envoyer" className="w-[50px] h-[50px] rounded-2xl text-white flex items-center justify-center flex-shrink-0" style={{ background: accent }}><Send className="w-[18px] h-[18px]" /></button>
      </div>
    </div>
  );
}
