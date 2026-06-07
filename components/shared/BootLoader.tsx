"use client";

import { useState, useEffect } from "react";
import { FullPageLoader } from "./FullPageLoader";

// Affiche le loader animé UNIQUEMENT au lancement de l'app (chargement initial
// du document, avant hydratation). Rendu dans le HTML SSR → visible pendant le
// téléchargement/parse du bundle JS, puis masqué dès l'hydratation.
// En navigation client (entre pages), le layout ne se remonte pas → ce loader
// ne réapparaît jamais : les pages affichent alors leurs skeletons.
export function BootLoader() {
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const id = requestAnimationFrame(() => setBooting(false));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!booting) return null;
  return <FullPageLoader />;
}
