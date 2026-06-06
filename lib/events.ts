// Socle partagé de la feature Sorties (types, couleurs, helpers de calcul/format).

export type EventTypeKey = "BAR" | "RESTO" | "SOIREE" | "SORTIE";
export type RsvpStatus = "YES" | "NO" | "PENDING";

export interface EventTypeMeta {
  key: EventTypeKey;
  emoji: string;
  label: string;
  short: string;
  color: string;
  tint: string;
  logistics: "list" | "tricount";
}

export const EVENT_TYPES: Record<EventTypeKey, EventTypeMeta> = {
  BAR: { key: "BAR", emoji: "🍻", label: "Bar", short: "Bar", color: "#F59E0B", tint: "#FEF6E7", logistics: "tricount" },
  RESTO: { key: "RESTO", emoji: "🍕", label: "Resto", short: "Resto", color: "#EF4444", tint: "#FDECEC", logistics: "tricount" },
  SOIREE: { key: "SOIREE", emoji: "🏡", label: "Soirée Chill", short: "Soirée", color: "#8B5CF6", tint: "#F3EDFE", logistics: "list" },
  SORTIE: { key: "SORTIE", emoji: "🏕️", label: "Sortie / Week-end", short: "Sortie", color: "#10B981", tint: "#E7F8F1", logistics: "list" },
};

export const EVENT_TYPE_ORDER: EventTypeKey[] = ["BAR", "RESTO", "SOIREE", "SORTIE"];

export function eventType(t: string): EventTypeMeta {
  return EVENT_TYPES[(t as EventTypeKey)] ?? EVENT_TYPES.SOIREE;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

// Formate une date d'événement en heure de Paris (groupe francophone).
export function fmtEventWhen(d: Date): { day: string; time: string; short: string } {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "";
  const weekday = get("weekday");
  const day = get("day");
  const month = get("month");
  const hour = get("hour");
  const minute = get("minute");
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
  const monthShortIdx = MOIS.indexOf(month);
  const monthShort = monthShortIdx >= 0 ? MOIS_COURT[monthShortIdx] : month;
  return {
    day: `${cap(weekday)} ${day} ${month}`,
    time: `${hour}h${minute}`,
    short: `${day} ${monthShort} · ${hour}h${minute}`,
  };
}

export function fmtMoney(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return rounded.toLocaleString("fr-FR", {
    minimumFractionDigits: rounded % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }) + " €";
}

export interface RsvpLike { status: string }
export function rsvpCounts(rsvps: RsvpLike[]): { yes: number; no: number; pending: number } {
  return {
    yes: rsvps.filter(r => r.status === "YES").length,
    no: rsvps.filter(r => r.status === "NO").length,
    pending: rsvps.filter(r => r.status === "PENDING").length,
  };
}

export interface ExpenseLike { payerId: string; amount: number; forUserIds: string[] }
// Solde net par user : +montant au payeur, -montant/part à chaque participant.
// Positif = on lui doit ; négatif = il doit.
export function tricountBalances(expenses: ExpenseLike[]): Record<string, number> {
  const bal: Record<string, number> = {};
  for (const x of expenses) {
    if (x.forUserIds.length === 0) continue;
    const share = x.amount / x.forUserIds.length;
    bal[x.payerId] = (bal[x.payerId] || 0) + x.amount;
    for (const u of x.forUserIds) bal[u] = (bal[u] || 0) - share;
  }
  return bal;
}

// Lien d'itinéraire : ouvre directement la navigation (Google Maps app/web,
// qui propose Plans sur iOS). On vise la destination, le départ = position actuelle.
export function mapsUrl(place: { name: string; addr?: string | null }): string {
  const q = encodeURIComponent([place.name, place.addr].filter(Boolean).join(", "));
  return `https://www.google.com/maps/dir/?api=1&destination=${q}`;
}
