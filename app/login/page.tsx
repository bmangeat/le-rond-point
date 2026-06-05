import { signIn, auth } from "@/lib/auth";
import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: { error?: string; callbackUrl?: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  NotInvited: "Ce compte Google n'est pas encore invité. Demande un lien à Brice.",
  AccountDisabled: "Ce compte a été désactivé. Contacte un admin.",
  OAuthSignin: "Erreur lors de la connexion Google. Réessaie.",
  InvalidToken: "Ce lien d'invitation est invalide.",
  TokenUsed: "Ce lien d'invitation a déjà été utilisé.",
  TokenExpired: "Ce lien d'invitation a expiré. Demande-en un nouveau.",
  Default: "Une erreur est survenue. Réessaie.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  if (session) redirect("/");

  const errorKey = searchParams.error ?? "";
  const errorMsg = ERROR_MESSAGES[errorKey] ?? (errorKey ? ERROR_MESSAGES.Default : null);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      {/* Logo / titre */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
          <span className="text-4xl">🏘️</span>
        </div>
        <h1 className="text-display text-foreground">Le Rond Point</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed max-w-xs">
          L'app du groupe pour savoir qui sera au quartier et quand.
        </p>
      </div>

      {/* Erreur */}
      {errorMsg && (
        <div className="w-full max-w-sm mb-6 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
          {errorMsg}
        </div>
      )}

      {/* Bouton connexion */}
      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: searchParams.callbackUrl ?? "/" });
        }}
        className="w-full max-w-sm"
      >
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl
                     bg-surface border border-border shadow-sm
                     text-foreground font-semibold text-sm
                     hover:bg-muted transition-colors active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Se connecter avec Google
        </button>
      </form>

      <p className="text-caption text-center mt-6 max-w-xs">
        Accès sur invitation uniquement.
      </p>

      {process.env.NODE_ENV === "development" && (
        <form
          action={async (formData: FormData) => {
            "use server";
            const email = formData.get("email") as string;
            await signIn("dev-login", { email, redirectTo: searchParams.callbackUrl ?? "/" });
          }}
          className="w-full max-w-sm mt-8 border-t border-border pt-6"
        >
          <p className="text-xs text-muted-foreground text-center mb-3">
            🛠 Dev bypass — entrer un email existant en base
          </p>
          <input
            name="email"
            type="email"
            placeholder="brice.mangeat@gmail.com"
            defaultValue="brice.mangeat@gmail.com"
            className="w-full px-4 py-2.5 rounded-xl border border-border bg-surface text-sm mb-3 outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Connexion dev
          </button>
        </form>
      )}
    </div>
  );
}
