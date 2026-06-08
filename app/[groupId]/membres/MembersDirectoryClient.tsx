"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { BackButton } from "@/components/shared/BackButton";
import { useGroupId } from "@/lib/use-group";
import { Search, MapPin, ChevronRight, Home } from "lucide-react";

interface DirectoryMember {
  id: string;
  name: string;
  image?: string | null;
  city?: string | null;
  memberColor: number;
  aroundSoon: boolean; // a une présence à venir
  hereNow: boolean;    // présent au quartier aujourd'hui
  isResident: boolean; // local (habite au quartier)
}

export function MembersDirectoryClient({
  members,
  initialResidentsOnly = false,
}: {
  members: DirectoryMember[];
  initialResidentsOnly?: boolean;
}) {
  const g = useGroupId();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"name" | "city">("name");
  const [hereOnly, setHereOnly] = useState(false);
  const [residentsOnly, setResidentsOnly] = useState(initialResidentsOnly);

  const hereCount = useMemo(() => members.filter(m => m.hereNow).length, [members]);
  const residentCount = useMemo(() => members.filter(m => m.isResident).length, [members]);

  const filtered = useMemo(() => {
    const q = query
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();

    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

    const list = members.filter(m => {
      if (residentsOnly && !m.isResident) return false;
      if (hereOnly && !m.hereNow) return false;
      if (!q) return true;
      return norm(m.name).includes(q) || (m.city ? norm(m.city).includes(q) : false);
    });

    return [...list].sort((a, b) => {
      if (sort === "city") {
        const ca = a.city ?? "￿"; // les sans-ville à la fin
        const cb = b.city ?? "￿";
        if (ca !== cb) return ca.localeCompare(cb, "fr");
      }
      return a.name.localeCompare(b.name, "fr");
    });
  }, [members, query, sort, hereOnly, residentsOnly]);

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="flex-1">
            <h1 className="text-heading-1">Le quartier</h1>
            <p className="text-caption">{members.length} membre{members.length > 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Rechercher un nom, une ville…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>

        {/* Filtre + tri */}
        <div className="flex flex-wrap gap-2">
          {residentCount > 0 && (
            <button
              onClick={() => setResidentsOnly(v => !v)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                residentsOnly ? "bg-available text-white" : "bg-available-light text-available"
              }`}
            >
              <Home className="w-3.5 h-3.5" /> Locaux ({residentCount})
            </button>
          )}
          {hereCount > 0 && (
            <button
              onClick={() => setHereOnly(v => !v)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors flex items-center gap-1.5 ${
                hereOnly ? "bg-available text-white" : "bg-available-light text-available"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" /> Au quartier ({hereCount})
            </button>
          )}
          {([
            { key: "name", label: "A → Z" },
            { key: "city", label: "Par ville" },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSort(key)}
              className={`px-3 py-1.5 rounded-full text-[13px] font-semibold transition-colors ${
                sort === key ? "bg-primary text-white" : "bg-surface border border-border text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Liste */}
        {filtered.length === 0 ? (
          <p className="text-caption text-center py-8">Aucun membre trouvé.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(m => (
              <Link
                key={m.id}
                href={`/${g}/membres/${m.id}`}
                className="bg-surface rounded-2xl border border-border flex items-center gap-3 p-3 hover:bg-muted transition-colors"
              >
                <Avatar name={m.name} image={m.image} memberColor={m.memberColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-strong font-semibold truncate">{m.name}</p>
                    {m.isResident && (
                      <Home className="w-3.5 h-3.5 text-available flex-shrink-0" aria-label="Local" />
                    )}
                    {m.hereNow ? (
                      <span className="text-2xs font-semibold text-white bg-available px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" /> ici
                      </span>
                    ) : m.aroundSoon ? (
                      <span className="text-2xs font-semibold text-available bg-available-light px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                        bientôt là
                      </span>
                    ) : null}
                  </div>
                  {m.city && (
                    <p className="text-caption flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" /> {m.city}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
