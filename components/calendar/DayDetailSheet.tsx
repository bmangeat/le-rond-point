"use client";

import Link from "next/link";
import { X, Clock } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { AvailabilityBadge } from "@/components/shared/AvailabilityBadge";
import { formatDateRange } from "@/lib/utils";
import { eventType, fmtEventWhen } from "@/lib/events";
import { useLockBodyScroll } from "@/lib/use-lock-body-scroll";

interface DayPresence {
  id: string;
  startDate: string | Date;
  endDate: string | Date;
  note?: string | null;
  availability: "OPEN" | "BUSY";
  user: {
    id: string;
    name: string;
    image?: string | null;
    city?: string | null;
    memberColor: number;
  };
}

interface DayEvent {
  id: string;
  type: string;
  name: string;
  whenAt: string | Date;
  placeName: string;
  rsvps: { userId: string; status: string }[];
}

interface DayDetailSheetProps {
  date: string; // YYYY-MM-DD
  presences: DayPresence[];
  events?: DayEvent[];
  currentUserId?: string;
  onClose: () => void;
  onAddPresence: (date: string) => void;
  onEditPresence: (id: string) => void;
}

const MONTHS_SHORT = [
  "jan", "fév", "mar", "avr", "mai", "juin",
  "juil", "août", "sep", "oct", "nov", "déc",
];

function formatDisplayDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

export function DayDetailSheet({
  date,
  presences,
  events = [],
  currentUserId,
  onClose,
  onAddPresence,
  onEditPresence,
}: DayDetailSheetProps) {
  useLockBodyScroll(true);
  return (
    <>
      <div className="sheet-backdrop animate-fade-in" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 flex-shrink-0">
          <div>
            <h2 className="text-heading-2">{formatDisplayDate(date)}</h2>
            <p className="text-caption">
              {presences.length === 0 && events.length === 0
                ? "Personne au quartier"
                : [
                    presences.length > 0 && `${presences.length} présence${presences.length > 1 ? "s" : ""}`,
                    events.length > 0 && `${events.length} sortie${events.length > 1 ? "s" : ""}`,
                  ].filter(Boolean).join(" · ")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-5 pb-4 space-y-3">
          {/* Sorties du jour */}
          {events.length > 0 && (
            <div className="space-y-2 pb-1">
              {events.map((ev) => {
                const ty = eventType(ev.type);
                const when = fmtEventWhen(new Date(ev.whenAt));
                const yesCount = ev.rsvps.filter((r) => r.status === "YES").length;
                const myStatus = ev.rsvps.find((r) => r.userId === currentUserId)?.status ?? "PENDING";
                const chip =
                  myStatus === "YES"
                    ? { t: "✓ Tu viens", cls: "text-available bg-available-light" }
                    : myStatus === "NO"
                    ? { t: "Sans toi", cls: "text-destructive bg-destructive/10" }
                    : { t: "À répondre", cls: "text-busy bg-busy-light" };
                return (
                  <Link
                    key={ev.id}
                    href={`/sorties/${ev.id}`}
                    onClick={onClose}
                    className="block rounded-2xl border border-border bg-surface p-3 active:scale-[0.99] transition-transform"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-[42px] h-[42px] rounded-xl flex items-center justify-center text-[20px] flex-shrink-0"
                        style={{ background: ty.tint }}
                      >
                        {ty.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-bold tracking-tight truncate flex-1">{ev.name}</span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${chip.cls}`}>{chip.t}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[12.5px] text-muted-foreground font-medium mt-0.5">
                          <Clock className="w-3.5 h-3.5" style={{ color: ty.color }} /> {when.time}
                          {ev.placeName && <span className="truncate">· {ev.placeName}</span>}
                        </div>
                      </div>
                    </div>
                    {yesCount > 0 && (
                      <p className="text-[12.5px] font-semibold text-available mt-2">
                        {yesCount} présent{yesCount > 1 ? "s" : ""}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {presences.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground text-sm">
                {events.length > 0 ? "Aucune présence prévue ce jour." : "Personne n'est encore prévu ce jour."}
              </p>
              <button
                onClick={() => onAddPresence(date)}
                className="mt-3 text-sm text-primary font-semibold"
              >
                Ajouter ma présence →
              </button>
            </div>
          ) : (
            presences.map((p) => {
              const isOwn = p.user.id === currentUserId;
              return (
                <div key={p.id} className="flex gap-3 py-2 border-b border-border last:border-0">
                  <Link href={`/membres/${p.user.id}`} className="flex-shrink-0">
                    <Avatar
                      name={p.user.name}
                      image={p.user.image}
                      memberColor={p.user.memberColor}
                      size="md"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/membres/${p.user.id}`} className="text-body-strong font-semibold hover:underline">
                        {p.user.name}
                      </Link>
                      {isOwn && (
                        <button
                          onClick={() => onEditPresence(p.id)}
                          className="text-xs text-primary font-medium"
                        >
                          Modifier
                        </button>
                      )}
                    </div>
                    <p className="text-caption">
                      {formatDateRange(new Date(p.startDate), new Date(p.endDate))}
                    </p>
                    {p.note && <p className="text-caption mt-0.5 text-foreground">{p.note}</p>}
                    <div className="mt-1.5">
                      <AvailabilityBadge availability={p.availability} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-5 pb-8 pt-2 flex-shrink-0 border-t border-border">
          <button
            onClick={() => onAddPresence(date)}
            className="w-full py-3 rounded-xl border-2 border-primary text-primary font-semibold text-sm hover:bg-primary-light transition-colors"
          >
            + Ajouter ma présence ce jour
          </button>
        </div>
      </div>
    </>
  );
}
