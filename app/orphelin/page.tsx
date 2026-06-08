import { signOut } from "@/lib/auth";

// Écran « compte orphelin » : utilisateur connecté mais rattaché à aucun groupe.
export default function OrphelinPage() {
  async function logout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-7 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" className="w-20 h-20 mb-6" />
      <h1 className="text-[22px] font-bold tracking-tight mb-2">Aucun Rond Point</h1>
      <p className="text-muted-foreground text-[15px] leading-relaxed max-w-[360px]">
        Ton compte n'est rattaché à aucun groupe pour le moment. Demande un lien
        d'invitation à l'administrateur de ton Rond Point pour le rejoindre.
      </p>
      <form action={logout} className="mt-8">
        <button className="px-5 py-3 rounded-full bg-surface border border-border text-foreground font-semibold text-sm">
          Se déconnecter
        </button>
      </form>
    </div>
  );
}
