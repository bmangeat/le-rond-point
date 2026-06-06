"use client";

import { useEffect } from "react";

// Enregistre le service worker au démarrage de l'app (cache des assets statiques
// + base pour les push). Sans ça, le cache ne bénéficiait qu'aux utilisateurs
// ayant activé les notifications.
export function SWRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Échec silencieux : l'app fonctionne sans le SW (juste sans cache offline).
    });
  }, []);
  return null;
}
