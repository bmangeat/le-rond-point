// Filtre de mots basique (liste noire). Volontairement simple : bloque le pire
// automatiquement. Contournable (leetspeak, fautes volontaires) — il complète la
// modération humaine (suppression + signalement), il ne la remplace pas.

// Liste minimale d'insultes/termes haineux (fr + en). À étoffer au besoin.
const BLOCKLIST = [
  "connard", "connasse", "salope", "salaud", "enculé", "encule", "pute", "putain",
  "ntm", "fdp", "pd", "tapette", "bougnoule", "negro", "nègre", "youpin", "pédé",
  "pede", "fuck", "nigger", "faggot", "cunt", "bitch", "retard",
];

// Normalise pour comparer (minuscules + accents retirés + caractères spéciaux).
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/[^a-z0-9\s]/g, " ");   // ponctuation → espace
}

// Retourne true si le texte contient un mot interdit (match sur mot entier).
export function containsProfanity(text: string): boolean {
  const words = new Set(normalize(text).split(/\s+/).filter(Boolean));
  return BLOCKLIST.some((bad) => words.has(bad));
}
