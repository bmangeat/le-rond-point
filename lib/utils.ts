import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Palette de 12 couleurs membres
export const MEMBER_COLORS: Record<number, string> = {
  1:  "#3B7BF8",
  2:  "#10B981",
  3:  "#8B5CF6",
  4:  "#F43F5E",
  5:  "#F59E0B",
  6:  "#06B6D4",
  7:  "#F97316",
  8:  "#14B8A6",
  9:  "#EC4899",
  10: "#6366F1",
  11: "#84CC16",
  12: "#0EA5E9",
};

export function getMemberColor(colorIndex: number): string {
  return MEMBER_COLORS[colorIndex] ?? MEMBER_COLORS[1];
}

// Initiales depuis un nom
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Formater une plage de dates en français
export function formatDateRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const fmtYear = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

  const sameYear = start.getFullYear() === end.getFullYear();
  const today = new Date();
  const currentYear = today.getFullYear();

  if (start.getTime() === end.getTime()) {
    return sameYear && start.getFullYear() === currentYear ? fmt(start) : fmtYear(start);
  }

  if (sameYear && start.getFullYear() === currentYear) {
    return `${fmt(start)} → ${fmt(end)}`;
  }
  return `${fmtYear(start)} → ${fmtYear(end)}`;
}

// Vérifier si deux plages de dates se chevauchent
export function datesOverlap(
  start1: Date, end1: Date,
  start2: Date, end2: Date
): boolean {
  return start1 <= end2 && end1 >= start2;
}
