/**
 * Loader plein écran affiché pendant le chargement initial de l'app.
 * Calé exactement sur les splash screens iOS (même logo SVG, même fond,
 * logo centré couvrant ~55% de la largeur) pour une transition sans rupture.
 */
export function FullPageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-animated.svg"
        alt="Chargement…"
        aria-hidden="true"
        className="w-[55vw] max-w-[320px] aspect-square"
        // Remonte le logo de la moitié des zones sûres (status bar + home
        // indicator) pour s'aligner sur la splash, en s'adaptant à chaque modèle.
        style={{
          transform:
            "translateY(calc((env(safe-area-inset-top, 0px) + env(safe-area-inset-bottom, 0px)) / -2))",
        }}
      />
    </div>
  );
}
