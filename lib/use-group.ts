"use client";

import { usePathname } from "next/navigation";

// Récupère le groupId depuis l'URL (premier segment) côté client, pour préfixer
// les liens sans threader la prop partout. Toutes les pages applicatives vivent
// sous /[groupId]/... donc pathname = "/<groupId>/...".
export function useGroupId(): string {
  const pathname = usePathname();
  return pathname.split("/")[1] ?? "";
}
