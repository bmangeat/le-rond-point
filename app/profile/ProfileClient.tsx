"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { getMemberColor } from "@/lib/utils";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { LogOut, BellRing, Bell, MapPin, User, ChevronRight, ChevronDown, Shield, Camera, Loader2, Cake, Phone, Instagram, Linkedin, Music2, Ghost, Share2, Check } from "lucide-react";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  city?: string | null;
  notifEmail: boolean;
  notifPush: boolean;
  notifPushOverlap: boolean;
  notifPushBirthday: boolean;
  notifPushPresence: boolean;
  notifPushPhotos: boolean;
  notifPushEvents: boolean;
  memberColor: number;
  role: "ADMIN" | "MEMBER";
  birthday?: string | Date | null;
  phone?: string | null;
  instagram?: string | null;
  snapchat?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
}

interface Draft {
  name: string;
  city: string;
  birthday: string;
  phone: string;
  instagram: string;
  snapchat: string;
  tiktok: string;
  linkedin: string;
  notifPushOverlap: boolean;
  notifPushBirthday: boolean;
  notifPushPresence: boolean;
  notifPushPhotos: boolean;
  notifPushEvents: boolean;
}

function toDateInput(d?: string | Date | null): string {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function formatFR(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function makeDraft(u: ProfileUser): Draft {
  return {
    name: u.name,
    city: u.city ?? "",
    birthday: toDateInput(u.birthday),
    phone: u.phone ?? "",
    instagram: u.instagram ?? "",
    snapchat: u.snapchat ?? "",
    tiktok: u.tiktok ?? "",
    linkedin: u.linkedin ?? "",
    notifPushOverlap: u.notifPushOverlap,
    notifPushBirthday: u.notifPushBirthday,
    notifPushPresence: u.notifPushPresence,
    notifPushPhotos: u.notifPushPhotos,
    notifPushEvents: u.notifPushEvents,
  };
}

// ── Toggle (vert quand actif) ──
function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={on}
      className={`relative w-[50px] h-[30px] rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${on ? "bg-available" : "bg-border"}`}
    >
      <span className={`absolute top-[3px] w-6 h-6 rounded-full bg-white shadow transition-all ${on ? "left-[23px]" : "left-[3px]"}`} />
    </button>
  );
}

// ── Section repliable (carte accordéon) ──
function Section({
  icon, title, summary, defaultOpen = false, children,
}: { icon: React.ReactNode; title: string; summary?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface rounded-2xl shadow-sm border border-border overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-[38px] h-[38px] rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 text-primary">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold leading-tight">{title}</p>
          {!open && summary && <p className="text-[13.5px] text-muted-foreground truncate mt-0.5">{summary}</p>}
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="px-4 pb-4 -mt-1">{children}</div>}
    </div>
  );
}

// ── Libellé de champ ──
function FieldLabel({ icon, children, optional }: { icon: React.ReactNode; children: React.ReactNode; optional?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mb-2 text-muted-foreground">
      <span className="flex-shrink-0">{icon}</span>
      <span className="text-[11.5px] font-bold tracking-wider uppercase">{children}</span>
      {optional && <span className="text-[11px] font-medium normal-case tracking-normal text-muted-foreground/80">(optionnel)</span>}
    </div>
  );
}

const inputClass =
  "w-full box-border px-3.5 py-3 rounded-2xl border-[1.5px] border-border bg-surface text-[15px] text-foreground outline-none transition focus:border-primary focus:ring-[3px] focus:ring-primary/15 placeholder:text-muted-foreground/70";

const SOCIALS = [
  { key: "instagram", label: "Instagram", Icon: Instagram, color: "#E1306C", ph: "pseudo", prefix: "@" },
  { key: "snapchat", label: "Snapchat", Icon: Ghost, color: "#d4a300", ph: "pseudo", prefix: "@" },
  { key: "tiktok", label: "TikTok", Icon: Music2, color: "#111827", ph: "pseudo", prefix: "@" },
  { key: "linkedin", label: "LinkedIn", Icon: Linkedin, color: "#0A66C2", ph: "pseudo ou lien", prefix: null },
] as const;

const NOTIF_TYPES = [
  { key: "notifPushOverlap", title: "Chevauchements de présences", desc: "Quelqu'un sera là en même temps que toi" },
  { key: "notifPushBirthday", title: "Anniversaires", desc: "Le jour de l'anniv d'un membre" },
  { key: "notifPushPresence", title: "Nouvelles présences", desc: "Quand quelqu'un ajoute une présence" },
  { key: "notifPushPhotos", title: "Photos de sortie qui expirent", desc: "1 jour avant la suppression auto des photos" },
  { key: "notifPushEvents", title: "Sorties", desc: "Nouvelles sorties et rappel le jour J" },
] as const;

export function ProfileClient({ user, memberCount, invitationCount }: { user: ProfileUser; memberCount: number; invitationCount: number }) {
  const router = useRouter();
  const color = getMemberColor(user.memberColor);

  const initial = useMemo(() => makeDraft(user), [user]);
  const [baseline, setBaseline] = useState<Draft>(initial);
  const [draft, setDraft] = useState<Draft>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const setField = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft(d => ({ ...d, [key]: value }));

  const [saving, setSaving] = useState(false);

  const [image, setImage] = useState(user.image ?? null);
  const [photoBusy, setPhotoBusy] = useState(false);

  const [notifPush, setNotifPush] = useState(user.notifPush);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  useEffect(() => setPushSupported(isPushSupported()), []);

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const blob = await upload(`avatars/${user.id}-${Date.now()}.${ext}`, file, {
        access: "public",
        handleUploadUrl: "/api/profile/photo",
      });
      setImage(blob.url);
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: blob.url }),
      });
      router.refresh();
    } catch {
      alert("Échec de l'envoi de la photo. Réessaie.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handlePushToggle() {
    setPushMsg(null);
    setPushBusy(true);
    try {
      if (!notifPush) {
        const res = await subscribeToPush();
        if (res === "subscribed") setNotifPush(true);
        else if (res === "denied") setPushMsg("Notifications bloquées. Autorise-les dans les réglages de ton navigateur.");
        else setPushMsg("Non supporté ici. Sur iPhone, installe d'abord l'app sur l'écran d'accueil.");
      } else {
        await unsubscribeFromPush();
        setNotifPush(false);
      }
    } catch {
      setPushMsg("Une erreur est survenue. Réessaie.");
    } finally {
      setPushBusy(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, birthday: draft.birthday || null }),
    });
    setBaseline(draft);
    setSaving(false);
    router.refresh();
  }

  // Résumés (état replié)
  const infoSummary = [draft.city, formatFR(draft.birthday)].filter(Boolean).join(" · ") || "À compléter";
  const connectedSocials = SOCIALS.filter(s => draft[s.key].trim());
  const socialSummary = connectedSocials.length ? connectedSocials.map(s => s.label).join(", ") : "Aucun pour le moment";
  const enabledTypes = NOTIF_TYPES.filter(n => draft[n.key]).length;
  const notifSummary = notifPush ? `Push activées · ${enabledTypes} type${enabledTypes > 1 ? "s" : ""}` : "Désactivées";

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-4">
        {/* En-tête centré */}
        <div className="flex flex-col items-center text-center pt-1 pb-2">
          <label className="relative cursor-pointer mb-3.5">
            <Avatar name={user.name} image={image} memberColor={user.memberColor} size="xl" />
            <span className="absolute -right-0.5 -bottom-0.5 w-[30px] h-[30px] rounded-full border-[3px] border-background bg-primary text-white flex items-center justify-center shadow-sm">
              {photoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={photoBusy} />
          </label>
          <p className="text-[22px] font-bold tracking-tight">{user.name}</p>
          <p className="text-[13.5px] text-muted-foreground mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-primary bg-primary-light px-2.5 py-1 rounded-full">
              <Shield className="w-3.5 h-3.5" /> {user.role === "ADMIN" ? "Admin" : "Membre"}
            </span>
            <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-muted-foreground bg-surface border border-border pl-2 pr-2.5 py-1 rounded-full">
              <span className="w-3 h-3 rounded-full ring-1 ring-white/60" style={{ backgroundColor: color }} /> Ta couleur
            </span>
          </div>
        </div>

        {/* Mes informations */}
        <Section icon={<User className="w-5 h-5" />} title="Mes informations" summary={infoSummary} defaultOpen>
          <div className="space-y-4">
            <div>
              <FieldLabel icon={<User className="w-[15px] h-[15px]" />}>Prénom</FieldLabel>
              <input className={inputClass} value={draft.name} onChange={e => setField("name", e.target.value)} placeholder="Ton prénom" />
            </div>
            <div>
              <FieldLabel icon={<MapPin className="w-[15px] h-[15px]" />} optional>Ville de résidence</FieldLabel>
              <input className={inputClass} value={draft.city} onChange={e => setField("city", e.target.value)} placeholder="Où tu vis aujourd'hui" />
            </div>
            <div>
              <FieldLabel icon={<Cake className="w-[15px] h-[15px]" />} optional>Anniversaire</FieldLabel>
              <input className={inputClass} type="date" value={draft.birthday} onChange={e => setField("birthday", e.target.value)} />
            </div>
            <div>
              <FieldLabel icon={<Phone className="w-[15px] h-[15px]" />} optional>Téléphone</FieldLabel>
              <input className={inputClass} type="tel" value={draft.phone} onChange={e => setField("phone", e.target.value)} placeholder="06 12 34 56 78" />
            </div>
          </div>
        </Section>

        {/* Réseaux sociaux */}
        <Section icon={<Share2 className="w-5 h-5" />} title="Réseaux sociaux" summary={socialSummary}>
          <div className="space-y-3.5">
            {SOCIALS.map(s => (
              <div key={s.key}>
                <FieldLabel icon={<s.Icon className="w-[15px] h-[15px]" style={{ color: s.color }} />} optional>{s.label}</FieldLabel>
                <div className="flex items-center gap-2 px-3.5 rounded-2xl border-[1.5px] border-border bg-surface transition focus-within:border-primary focus-within:ring-[3px] focus-within:ring-primary/15">
                  {s.prefix && <span className="text-muted-foreground text-[15px] font-medium">{s.prefix}</span>}
                  <input
                    className="flex-1 min-w-0 bg-transparent border-none outline-none py-3 text-[15px] text-foreground placeholder:text-muted-foreground/70"
                    value={draft[s.key]}
                    onChange={e => setField(s.key, e.target.value)}
                    placeholder={s.ph}
                  />
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={<Bell className="w-5 h-5" />} title="Notifications" summary={notifSummary}>
          <div className="flex items-center gap-3 px-0.5 py-1">
            <div className="w-[38px] h-[38px] rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold">Notifications push</p>
              <p className="text-[12.5px] text-muted-foreground">Directement sur ton téléphone</p>
            </div>
            <Toggle on={notifPush} onChange={handlePushToggle} disabled={pushBusy || !pushSupported} />
          </div>

          {pushMsg && <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2 mt-2">{pushMsg}</p>}
          {!pushSupported && (
            <p className="text-caption mt-2">Les notifications push nécessitent d&apos;installer l&apos;app sur ton écran d&apos;accueil.</p>
          )}

          <div className="h-px bg-border my-3" />

          <div className={notifPush ? "" : "opacity-50"}>
            <p className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground mb-2 px-0.5">Me prévenir pour</p>
            {NOTIF_TYPES.map((n, i) => (
              <div key={n.key} className={`flex items-center gap-3 py-2.5 px-0.5 ${i ? "border-t border-border" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-[14.5px] font-medium">{n.title}</p>
                  <p className="text-[12.5px] text-muted-foreground">{n.desc}</p>
                </div>
                <Toggle on={notifPush && draft[n.key]} disabled={!notifPush} onChange={() => setField(n.key, !draft[n.key])} />
              </div>
            ))}
          </div>
        </Section>

        {/* Administration */}
        {user.role === "ADMIN" && (
          <a href="/admin" className="bg-surface rounded-2xl shadow-sm border border-border flex items-center gap-3 p-4">
            <div className="w-[38px] h-[38px] rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0 text-primary">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-bold leading-tight">Administration</p>
              <p className="text-[13.5px] text-muted-foreground mt-0.5">
                {memberCount} membre{memberCount > 1 ? "s" : ""} · {invitationCount} invitation{invitationCount > 1 ? "s" : ""}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          </a>
        )}

        {/* Déconnexion */}
        <form action="/api/auth/signout" method="POST" className="pt-2">
          <button type="submit" className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-destructive text-[15px] font-semibold hover:bg-destructive/5 transition-colors">
            <LogOut className="w-[18px] h-[18px]" />
            Se déconnecter
          </button>
        </form>

        <p className="text-center text-[12px] text-muted-foreground">Le Rond Point · v1.0</p>

        {/* Barre Enregistrer (si modifié) */}
        {dirty && (
          <div className="sticky z-30 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] animate-slide-up">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl bg-primary text-white font-bold text-[15.5px] shadow-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              <Check className="w-[18px] h-[18px]" />
              {saving ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
