"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useGroupId } from "@/lib/use-group";
import { Bell, Check, Home } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { cn } from "@/lib/utils";
import { subscribeToPush } from "@/lib/push-client";
import { InstallOnboarding } from "@/components/shared/InstallOnboarding";

interface OnboardingClientProps {
  name: string;
  image?: string | null;
  memberColor: number;
}

type Step = 0 | 1 | 2;

export function OnboardingClient({ name, image, memberColor }: OnboardingClientProps) {
  const router = useRouter();
  const g = useGroupId();
  const today = new Date().toISOString().split("T")[0];
  const firstName = name.split(" ")[0];

  const [step, setStep] = useState<Step>(0);

  // Étape 1 — profil
  const [city, setCity] = useState("");
  const [birthday, setBirthday] = useState("");
  const [isResident, setIsResident] = useState(false);

  // Étape 2 — notifications
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifMsg, setNotifMsg] = useState<string | null>(null);

  // Étape 3 — présence
  const [hasNoDate, setHasNoDate] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [availability, setAvailability] = useState<"OPEN" | "BUSY">("OPEN");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enableNotifications() {
    setNotifBusy(true);
    setNotifMsg(null);
    try {
      const res = await subscribeToPush();
      if (res === "subscribed") {
        setNotifEnabled(true);
        setTimeout(() => setStep(2), 500);
      } else if (res === "denied") {
        setNotifMsg("Notifications bloquées. Tu pourras les réactiver dans les réglages de ton téléphone.");
      } else {
        setNotifMsg("Sur iPhone, installe d'abord l'app sur ton écran d'accueil (on te montre comment juste après) pour activer les notifications.");
      }
    } catch {
      setNotifMsg("Une erreur est survenue. Tu pourras réessayer depuis ton profil.");
    } finally {
      setNotifBusy(false);
    }
  }

  async function finish() {
    setError(null);

    if (!hasNoDate && endDate < startDate) {
      setError("La date de départ doit être après l'arrivée.");
      return;
    }

    setLoading(true);
    try {
      // 1) Profil + onboardedAt
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ city, birthday: birthday || null, isResident }),
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement du profil");

      // 2) Première présence (optionnelle)
      if (!hasNoDate) {
        const presRes = await fetch("/api/presences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ startDate, endDate, availability, note: null }),
        });
        if (!presRes.ok) throw new Error("Erreur lors de la création de la présence");
      }

      router.replace(`/${g}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col px-7 pt-16 pb-9">
      {/* Incitation à installer la PWA AVANT l'onboarding (indispensable sur iOS
          pour que les notifications push fonctionnent). Overlay plein écran qui
          se masque tout seul si l'app est déjà installée (standalone). */}
      <InstallOnboarding />

      {/* Progression */}
      <div className="flex gap-1.5 mb-9">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-1 h-1.5 rounded-full transition-colors"
            style={{ background: i <= step ? "#3B7BF8" : "#E2E8F0" }}
          />
        ))}
      </div>

      {step === 0 ? (
        /* ─── ÉTAPE 1 — PROFIL ─── */
        <div className="flex-1 flex flex-col">
          <p className="text-primary font-semibold mb-2" style={{ fontSize: 13 }}>
            ÉTAPE 1 / 3
          </p>
          <h1
            className="text-foreground"
            style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            Bienvenue, {firstName} !
          </h1>
          <p className="text-muted-foreground mt-2.5 leading-relaxed" style={{ fontSize: 15 }}>
            D'où nous rejoins-tu aujourd'hui ? Ta ville et ton anniversaire s'afficheront sur ton profil.
          </p>

          <div className="mt-8 flex justify-center mb-6">
            <Avatar name={name} image={image} memberColor={memberColor} size="xl" />
          </div>

          <label className="text-label block mb-1.5">Ville de résidence actuelle</label>
          <input
            autoFocus
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex. Lyon, Berlin, Montréal…"
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-surface text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          <label className="text-label block mb-1.5 mt-4">
            Date d'anniversaire <span className="normal-case font-normal text-muted-foreground">(optionnel)</span>
          </label>
          <input
            type="date"
            value={birthday}
            max={today}
            onChange={(e) => setBirthday(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-surface text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />

          {/* Statut résident */}
          <button
            type="button"
            onClick={() => setIsResident((v) => !v)}
            className={cn(
              "mt-4 w-full px-4 py-3.5 rounded-xl border-2 transition-all flex items-start gap-3 text-left",
              isResident ? "border-available bg-available-light" : "border-border hover:border-border/80"
            )}
          >
            <span className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
              isResident ? "bg-available text-white" : "bg-muted text-muted-foreground"
            )}>
              <Home className="w-[18px] h-[18px]" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-foreground">Je suis un local 🏠</span>
              <span className="block text-xs text-muted-foreground mt-0.5 leading-snug">
                Tu habites au quartier ou à moins de 15 min&nbsp;? Sois prévenu des passages et invité d&apos;office aux sorties.
              </span>
            </span>
            <span className={cn(
              "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
              isResident ? "border-available bg-available" : "border-border"
            )}>
              {isResident && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
          </button>
        </div>
      ) : step === 1 ? (
        /* ─── ÉTAPE 2 — NOTIFICATIONS ─── */
        <div className="flex-1 flex flex-col">
          <p className="text-primary font-semibold mb-2" style={{ fontSize: 13 }}>
            ÉTAPE 2 / 3
          </p>
          <h1
            className="text-foreground"
            style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            Reste dans la boucle
          </h1>
          <p className="text-muted-foreground mt-2.5 leading-relaxed" style={{ fontSize: 15 }}>
            Active les notifications pour ne rien rater de la vie du quartier.
          </p>

          <div className="mt-8 flex justify-center mb-7">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-11 h-11 text-primary" />
            </div>
          </div>

          <ul className="space-y-3 mb-2">
            {[
              "Quand un ami sera au quartier en même temps que toi",
              "Les anniversaires de la bande",
              "Les nouvelles sorties et leurs rappels",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-available-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-available" strokeWidth={3} />
                </span>
                <span className="text-sm text-foreground">{t}</span>
              </li>
            ))}
          </ul>

          {notifMsg && (
            <p className="text-sm text-muted-foreground bg-muted/60 rounded-xl px-3.5 py-3 mt-4">
              {notifMsg}
            </p>
          )}
        </div>
      ) : (
        /* ─── ÉTAPE 3 — PRÉSENCE ─── */
        <div className="flex-1 flex flex-col">
          <p className="text-primary font-semibold mb-2" style={{ fontSize: 13 }}>
            ÉTAPE 3 / 3
          </p>
          <h1
            className="text-foreground"
            style={{ fontSize: 27, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.15 }}
          >
            Ta première présence
          </h1>
          <p className="text-muted-foreground mt-2.5 leading-relaxed" style={{ fontSize: 15 }}>
            Quand penses-tu repasser au quartier ? Tu pourras la modifier à tout moment.
          </p>

          <div className={cn("mt-6 transition-opacity", hasNoDate && "opacity-40 pointer-events-none")}>
            <div className="flex gap-2.5 mb-4">
              <div className="flex-1">
                <label className="text-label block mb-1.5">Arrivée</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-surface text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-label block mb-1.5">Départ</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-border bg-surface text-base outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

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

          {/* Pas de date prévue */}
          <button
            type="button"
            onClick={() => setHasNoDate((v) => !v)}
            className={cn(
              "mt-4 w-full px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-center gap-3 text-left",
              hasNoDate
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-border/80"
            )}
          >
            <span
              className={cn(
                "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0",
                hasNoDate ? "border-primary bg-primary" : "border-border"
              )}
            >
              {hasNoDate && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            Je n'ai pas encore de date prévue
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {/* Boutons bas */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2.5 items-center">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as Step)}
              className="px-5 py-3.5 rounded-full text-muted-foreground font-semibold text-sm"
            >
              Retour
            </button>
          )}

          {step === 0 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex-1 py-3.5 rounded-full bg-primary text-white font-semibold text-sm shadow-primary active:scale-[0.98] transition-transform"
            >
              Continuer
            </button>
          )}

          {step === 1 && (
            <button
              type="button"
              onClick={enableNotifications}
              disabled={notifBusy || notifEnabled}
              className="flex-1 py-3.5 rounded-full bg-primary text-white font-semibold text-sm shadow-primary active:scale-[0.98] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {notifEnabled ? (
                <><Check className="w-4 h-4" strokeWidth={3} /> Activées !</>
              ) : notifBusy ? (
                "Un instant…"
              ) : (
                "Activer les notifications"
              )}
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={finish}
              disabled={loading}
              className="flex-1 py-3.5 rounded-full bg-primary text-white font-semibold text-sm shadow-primary active:scale-[0.98] transition-transform disabled:opacity-60"
            >
              {loading ? "Un instant…" : "C'est parti !"}
            </button>
          )}
        </div>

        {/* Lien "plus tard" sur l'étape notifications */}
        {step === 1 && !notifEnabled && (
          <button
            type="button"
            onClick={() => setStep(2)}
            className="py-2 text-sm text-muted-foreground font-medium"
          >
            Plus tard
          </button>
        )}
      </div>
    </div>
  );
}
