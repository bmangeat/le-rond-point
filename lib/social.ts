// Construit les URLs à partir des pseudos/handles saisis par l'utilisateur.

const stripAt = (h: string) => h.trim().replace(/^@/, "");

export function instagramUrl(handle: string): string {
  if (/^https?:\/\//.test(handle)) return handle;
  return `https://instagram.com/${stripAt(handle)}`;
}

export function snapchatUrl(handle: string): string {
  if (/^https?:\/\//.test(handle)) return handle;
  return `https://snapchat.com/add/${stripAt(handle)}`;
}

export function tiktokUrl(handle: string): string {
  if (/^https?:\/\//.test(handle)) return handle;
  return `https://tiktok.com/@${stripAt(handle)}`;
}

export function linkedinUrl(handle: string): string {
  if (/^https?:\/\//.test(handle)) return handle;
  return `https://linkedin.com/in/${stripAt(handle)}`;
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, "")}`;
}

// Âge à partir d'une date d'anniversaire
export function ageFromBirthday(birthday: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthday.getUTCFullYear();
  const m = today.getMonth() - birthday.getUTCMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthday.getUTCDate())) age--;
  return age;
}

// "12 mars" (sans année)
export function formatBirthday(birthday: Date): string {
  return new Date(Date.UTC(2000, birthday.getUTCMonth(), birthday.getUTCDate())).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}
