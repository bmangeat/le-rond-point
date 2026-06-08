import Link from "next/link";

// Accès refusé : l'utilisateur tente d'accéder à un groupe qui n'est pas le sien.
export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-7 text-center">
      <div className="text-5xl mb-4">🚫</div>
      <h1 className="text-[22px] font-bold tracking-tight mb-2">Accès refusé</h1>
      <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[360px]">
        Tu n'as pas accès à ce Rond Point. Tu ne peux consulter que celui dont tu es membre.
      </p>
      <Link href="/" className="mt-8 px-5 py-3 rounded-full bg-primary text-white font-semibold text-sm shadow-primary">
        Retour à mon Rond Point
      </Link>
    </div>
  );
}
