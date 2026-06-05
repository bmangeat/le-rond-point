"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, X } from "lucide-react";
import { isPushSupported, isSubscribed, subscribeToPush } from "@/lib/push-client";

const DISMISS_KEY = "push-prompt-dismissed";

// Bannière d'incitation à activer les notifications push, affichée tant que :
// le push est supporté, pas encore activé, et l'utilisateur ne l'a pas écartée.
export function PushPrompt() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isPushSupported()) return;
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
      const subscribed = await isSubscribed();
      if (!cancelled && !subscribed) setShow(true);
    })();
    return () => { cancelled = true; };
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  }

  async function enable() {
    setBusy(true);
    try {
      const res = await subscribeToPush();
      if (res === "subscribed") {
        setShow(false);
        router.refresh();
      } else if (res === "denied") {
        dismiss();
        alert("Notifications bloquées. Tu peux les réactiver dans les réglages de ton téléphone.");
      } else {
        dismiss();
        alert("Sur iPhone, installe d'abord l'app sur l'écran d'accueil pour activer les notifications.");
      }
    } catch {
      // on laisse la bannière
    } finally {
      setBusy(false);
    }
  }

  if (!show) return null;

  return (
    <div className="card flex items-center gap-3 border-primary/30 bg-primary/5">
      <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
        <Bell className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-body-strong font-semibold">Active les notifications</p>
        <p className="text-caption">Sois prévenu des retrouvailles et des anniversaires.</p>
      </div>
      <button
        onClick={enable}
        disabled={busy}
        className="px-3 py-2 rounded-xl bg-primary text-white font-semibold text-sm shadow-primary disabled:opacity-60 flex-shrink-0"
      >
        {busy ? "…" : "Activer"}
      </button>
      <button onClick={dismiss} aria-label="Plus tard" className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted flex-shrink-0">
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
