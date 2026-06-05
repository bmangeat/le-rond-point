"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Avatar } from "@/components/shared/Avatar";
import { getMemberColor } from "@/lib/utils";
import { isPushSupported, subscribeToPush, unsubscribeFromPush } from "@/lib/push-client";
import { LogOut, Bell, BellRing, MapPin, User, ChevronRight, Shield } from "lucide-react";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  city?: string | null;
  notifEmail: boolean;
  notifPush: boolean;
  memberColor: number;
  role: "ADMIN" | "MEMBER";
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${on ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${on ? "translate-x-6" : "translate-x-0"}`}
      />
    </button>
  );
}

export function ProfileClient({ user }: { user: ProfileUser }) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [city, setCity] = useState(user.city ?? "");
  const [notifEmail, setNotifEmail] = useState(user.notifEmail);
  const [notifPush, setNotifPush] = useState(user.notifPush);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pushSupported, setPushSupported] = useState(true);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushMsg, setPushMsg] = useState<string | null>(null);

  useEffect(() => {
    setPushSupported(isPushSupported());
  }, []);

  async function handlePushToggle() {
    setPushMsg(null);
    setPushBusy(true);
    try {
      if (!notifPush) {
        const res = await subscribeToPush();
        if (res === "subscribed") {
          setNotifPush(true);
        } else if (res === "denied") {
          setPushMsg("Notifications bloquées. Autorise-les dans les réglages de ton navigateur.");
        } else {
          setPushMsg("Non supporté ici. Sur iPhone, installe d'abord l'app sur l'écran d'accueil.");
        }
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
      body: JSON.stringify({ name, city: city || null, notifEmail, notifPush }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const color = getMemberColor(user.memberColor);

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-8 space-y-6">
        {/* Header profil */}
        <div className="flex items-center gap-4">
          <Avatar name={user.name} image={user.image} memberColor={user.memberColor} size="lg" />
          <div>
            <p className="text-heading-2">{user.name}</p>
            <p className="text-caption">{user.email}</p>
            {user.role === "ADMIN" && (
              <span className="inline-flex items-center gap-1 mt-1 text-2xs font-medium text-primary">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
        </div>

        {/* Couleur membre */}
        <div className="card flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex-shrink-0"
            style={{ backgroundColor: `${color}20` }}
          >
            <div className="w-full h-full rounded-xl" style={{ backgroundColor: color, opacity: 0.8 }} />
          </div>
          <div>
            <p className="text-body-strong font-medium">Ta couleur</p>
            <p className="text-caption">Attribuée automatiquement — identifie-toi dans le calendrier</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <h2 className="text-label">Informations</h2>

          <div>
            <label className="text-label block mb-1.5">
              <User className="w-3 h-3 inline mr-1" />Prénom
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>

          <div>
            <label className="text-label block mb-1.5">
              <MapPin className="w-3 h-3 inline mr-1" />Ville de résidence
              <span className="normal-case font-normal text-muted-foreground ml-1">(optionnel)</span>
            </label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex : Paris, Londres, Barcelone…"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="space-y-3">
          <h2 className="text-label">Comment veux-tu être prévenu ?</h2>
          <p className="text-caption -mt-1">
            Quand quelqu&apos;un sera au quartier en même temps que toi.
          </p>

          {/* Email */}
          <div className="card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-body-strong font-medium">Par email</p>
                <p className="text-caption">Un email à chaque chevauchement</p>
              </div>
            </div>
            <Toggle on={notifEmail} onChange={() => setNotifEmail(v => !v)} />
          </div>

          {/* Push */}
          <div className="card flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-body-strong font-medium">Notifications push</p>
                <p className="text-caption">Directement sur ton téléphone (app installée)</p>
              </div>
            </div>
            <Toggle on={notifPush} onChange={handlePushToggle} disabled={pushBusy || !pushSupported} />
          </div>
          {pushMsg && (
            <p className="text-caption text-destructive bg-destructive/10 rounded-lg px-3 py-2">{pushMsg}</p>
          )}
          {!pushSupported && (
            <p className="text-caption">
              Les notifications push nécessitent d&apos;installer l&apos;app sur ton écran d&apos;accueil.
            </p>
          )}
        </div>

        {/* Admin link */}
        {user.role === "ADMIN" && (
          <a
            href="/admin"
            className="card flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-primary" />
              </div>
              <p className="text-body-strong font-medium">Administration</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </a>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-primary text-white font-semibold text-sm shadow-primary active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {saved ? "✓ Sauvegardé !" : saving ? "Sauvegarde…" : "Enregistrer"}
        </button>

        {/* Sign out */}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-muted-foreground text-sm font-medium hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </form>
      </div>
    </AppShell>
  );
}
