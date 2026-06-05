"use client";

import { useState, useEffect } from "react";
import { Share, Plus, MoreVertical, Download, X, Home } from "lucide-react";

const SEEN_KEY = "install-onboarding-seen";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
}

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

// Étape illustrée
function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-left">
      <span className="w-7 h-7 rounded-full bg-primary text-white text-sm font-bold flex items-center justify-center flex-shrink-0">{n}</span>
      <p className="text-sm text-foreground flex-1 flex items-center gap-1.5 flex-wrap">{children}</p>
      <span className="flex-shrink-0 text-primary">{icon}</span>
    </div>
  );
}

export function InstallOnboarding() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(SEEN_KEY) === "1") return;

    setPlatform(detectPlatform());
    setShow(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    localStorage.setItem(SEEN_KEY, "1");
    setShow(false);
  }

  async function androidInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Skip */}
      <div className="flex justify-end p-4 safe-top">
        <button onClick={dismiss} className="text-sm text-muted-foreground font-medium flex items-center gap-1">
          Plus tard <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-10 text-center overflow-y-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="Le Rond Point" className="w-20 h-20 rounded-3xl shadow-md mb-5" />
        <h1 className="text-display text-foreground mb-2">Installe l&apos;app</h1>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mb-8">
          Ajoute Le Rond Point à ton écran d&apos;accueil pour un accès rapide et recevoir les notifications.
        </p>

        <div className="w-full max-w-sm space-y-4">
          {platform === "ios" && (
            <div className="card space-y-4">
              <Step n={1} icon={<Share className="w-5 h-5" />}>
                Touche l&apos;icône <strong>Partager</strong> dans la barre de Safari
              </Step>
              <Step n={2} icon={<Plus className="w-5 h-5" />}>
                Choisis <strong>« Sur l&apos;écran d&apos;accueil »</strong>
              </Step>
              <Step n={3} icon={<Home className="w-5 h-5" />}>
                Ouvre l&apos;app depuis ton écran d&apos;accueil
              </Step>
            </div>
          )}

          {platform === "android" && deferredPrompt && (
            <button
              onClick={androidInstall}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary text-white font-semibold shadow-primary"
            >
              <Download className="w-5 h-5" />
              Installer l&apos;application
            </button>
          )}

          {platform === "android" && !deferredPrompt && (
            <div className="card space-y-4">
              <Step n={1} icon={<MoreVertical className="w-5 h-5" />}>
                Ouvre le <strong>menu</strong> de Chrome (⋮ en haut à droite)
              </Step>
              <Step n={2} icon={<Download className="w-5 h-5" />}>
                Choisis <strong>« Installer l&apos;application »</strong>
              </Step>
            </div>
          )}

          {platform === "desktop" && (
            <div className="card text-sm text-muted-foreground space-y-2">
              <p>📱 Pour la meilleure expérience, ouvre <strong>le-rond-point.vercel.app</strong> sur ton téléphone.</p>
              <p>Sur ordinateur, tu peux aussi installer l&apos;app via l&apos;icône d&apos;installation dans la barre d&apos;adresse de Chrome.</p>
            </div>
          )}

          <button onClick={dismiss} className="w-full py-3 text-sm text-muted-foreground font-medium">
            Continuer sur le web
          </button>
        </div>
      </div>
    </div>
  );
}
