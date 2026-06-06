// Filtre de mots basique (liste noire). Volontairement simple : bloque le pire
// automatiquement. Contournable (leetspeak, fautes volontaires) — il complète la
// modération humaine (suppression + signalement), il ne la remplace pas.

// Liste minimale d'insultes/termes haineux (fr + en). À étoffer au besoin.
const BLOCKLIST = [
  // --- TA LISTE D'ORIGINE (SANS ACCENTS) ---
  "connard", "connasse", "salope", "salaud", "encule", "pute", "putain",
  "ntm", "fdp", "pd", "tapette", "bougnoule", "negro", "negre", "youpin", "pede",
  "fuck", "nigger", "faggot", "cunt", "bitch", "retard",

  // --- VULGARITES & INSULTES (FR) ---
  "abruti", "abrutie", "andouille", "asocial", "baise", "baisable", "baiser", 
  "bander", "batard", "branleur", "branleuse", "chieur", "chieuse", "clochard", 
  "con", "conard", "conne", "connardes", "couille", "couilles", "crevard",
  "ducon", "emmerdeur", "emmerdeuse", "enfoire", 
  "foireux", "grogniasse", "groslard", "imbecile", "merde", "merdeux", 
  "merdeuse", "nique", "niquer", "petasse", "poufiasse", "ptn", "put1", 
  "sacamerde", "salopard", "salopperie", "tocard", "trouduc", "trouducul",

  // --- DISCRIMINATION & HAINE (FR) ---
  "bicot", "bougnoul", "cacouac", "chinetoc", "chinetoque", "feuj", "gogol", 
  "gogole", "goudou", "mongol", "negresse", "niackoue", "niakoue", "pedale",
  "tarouse",

  // --- ANATOMIE & SEXUALITE (FR) ---
  "anus", "bite", "chatte", "clito", "clitoris", "coit", "cul", "ejaculation", 
  "fellation", "fesse", "fesses", "gode", "godemichet", "orgasme", "penetration", 
  "penis", "sperme", "testicule", "turlutte", "vagin", "verge", "vulve",

  // --- INSULTES & VULGARITES (EN) ---
  "anal", "arse", "arsehole", "ass", "asshole", "bastard", "blowjob", "boob", 
  "boobs", "bugger", "clit", "cock", "coon", "crap", "cum", "dick", 
  "dickhead", "dildo", "dyke", "feck", "felatio", "flange", "fuckface", 
  "fudgepacker", "goddamn", "gook", "goy", "hell", "homo", "jerk", "jizz", 
  "knob", "labia", "motherfucker", "muff", "paki", "piss", "poof", "prick", 
  "pussy", "scrotum", "shag", "shagging", "shit", "skank", "slut", 
  "smegma", "spastic", "twat", "vagina", "wank", "wanker", "whore"
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
