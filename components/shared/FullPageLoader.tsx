/**
 * Loader plein écran affiché pendant le chargement initial de l'app.
 * Utilise le logo animé SVG centré sur le fond de l'app.
 */
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background gap-4">
      <img
        src="/logo-animated.svg"
        alt="Chargement…"
        className="w-24 h-24"
        aria-hidden="true"
      />
      <p className="text-sm text-muted-foreground font-medium tracking-wide">
        Le Rond Point
      </p>
    </div>
  );
}
