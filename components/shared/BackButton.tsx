"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Retour"
      className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
  );
}
